#!/usr/bin/env python3
"""
Orchestrator for question subagents.

Pipeline:
1) LLM Writer (bootstrap/enrich)
2) LLM Critic
3) Rule Critic
4) Fix pass
5) Gate eval
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from questions_critic_pro import run as critic_run
from questions_writer_subagent import run as writer_run
from subagents_llm_client import LLMClientError, SubagentLLMClient, load_pipeline_config


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def normalize_text(value: str) -> str:
    return " ".join(str(value).split()).strip()


def resolve_category_set(mode: str, banks_dir: Path, config_dir: Path) -> set[str]:
    all_files = sorted(p.name for p in banks_dir.glob("category-*.json"))
    if mode == "full":
        return set(all_files)
    _, pipeline = load_pipeline_config(config_dir)
    pilot_files = pipeline.get("pilot_categories", [])
    if not isinstance(pilot_files, list) or len(pilot_files) == 0:
        return set(all_files[:2])
    return {normalize_text(x) for x in pilot_files if normalize_text(x) in all_files}


def merge_critic_reports(rule_report: dict[str, Any], llm_report: dict[str, Any], output_path: Path) -> dict[str, Any]:
    merged = dict(rule_report)
    merged["llm_review"] = llm_report.get("llm_review", {"enabled": False, "action_summary": {}, "items": [], "errors": []})
    output_path.write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8")
    return merged


def difficulty_bucket(value: int) -> str:
    if value <= 2:
        return "easy_1_2"
    if value == 3:
        return "medium_3"
    return "hard_4_5"


def compute_distribution(questions: list[dict[str, Any]]) -> dict[str, Any]:
    total = len(questions)
    counts = {"easy_1_2": 0, "medium_3": 0, "hard_4_5": 0}
    for q in questions:
        d = q.get("difficulty_1to5")
        if not isinstance(d, int):
            points = q.get("points")
            if isinstance(points, int):
                d = 2 if points == 200 else 3 if points == 400 else 4
            else:
                d = 3
        d = max(1, min(5, int(d)))
        counts[difficulty_bucket(d)] += 1

    if total == 0:
        ratios = {k: 0.0 for k in counts}
    else:
        ratios = {k: round(v / total, 4) for k, v in counts.items()}

    return {
        "total": total,
        "counts": counts,
        "ratios": ratios,
    }


def compute_dedupe_metrics(questions: list[dict[str, Any]]) -> dict[str, Any]:
    by_text = Counter(normalize_text(q.get("question_ar", "")) for q in questions if normalize_text(q.get("question_ar", "")))
    exact_dups = sum(v - 1 for v in by_text.values() if v > 1)
    return {
        "total_questions": len(questions),
        "exact_duplicate_count": exact_dups,
    }


def summarize_categories(pack: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for cat in pack.get("categories", []):
        questions = cat.get("questions", [])
        rows.append(
            {
                "name_ar": cat.get("name_ar", ""),
                "name_en": cat.get("name_en", ""),
                "count": len(questions) if isinstance(questions, list) else 0,
            }
        )
    return rows


def build_human_summary_markdown(
    *,
    mode: str,
    llm_enabled: bool,
    iterations: int,
    gate_passed: bool,
    shipped_count: int,
    verification_count: int,
    issues_fixed: int,
    unresolved_findings: int,
    distribution: dict[str, Any],
    dedupe: dict[str, Any],
    final_pack_path: Path,
    needs_verification_path: Path,
    qa_path: Path,
    categories_shipped: list[dict[str, Any]],
    categories_backlog: list[dict[str, Any]],
) -> str:
    target = distribution.get("target", {})
    actual = distribution.get("actual", {}).get("ratios", {})
    compliance = distribution.get("compliance", {})

    lines = [
        "# Subagents Run Summary",
        "",
        "## Quick Status",
        f"- Mode: `{mode}`",
        f"- LLM enabled: `{llm_enabled}`",
        f"- Iterations executed: `{iterations}`",
        f"- Quality gates passed: `{gate_passed}`",
        f"- Questions shipped: `{shipped_count}`",
        f"- Needs verification: `{verification_count}`",
        f"- Issues fixed (writer changes): `{issues_fixed}`",
        f"- Unresolved rule findings: `{unresolved_findings}`",
        "",
        "## Difficulty Distribution (Shipped Set)",
        "| Bucket | Target | Actual | Delta |",
        "|---|---:|---:|---:|",
    ]
    for key in ("easy_1_2", "medium_3", "hard_4_5"):
        row = compliance.get(key, {})
        t = row.get("target", target.get(key, 0))
        a = row.get("actual", actual.get(key, 0))
        d = row.get("delta", 0)
        lines.append(f"| `{key}` | {float(t):.2f} | {float(a):.2f} | {float(d):+.2f} |")

    lines.extend(
        [
            "",
            "## Dedupe",
            f"- Total shipped questions: `{dedupe.get('total_questions', 0)}`",
            f"- Exact duplicates: `{dedupe.get('exact_duplicate_count', 0)}`",
            "",
            "## Category Counts (Shipped)",
            "| Category | Count |",
            "|---|---:|",
        ]
    )
    for row in categories_shipped:
        name = row.get("name_ar") or row.get("name_en") or "Unknown"
        lines.append(f"| {name} | {row.get('count', 0)} |")

    lines.extend(
        [
            "",
            "## Category Counts (Needs Verification)",
            "| Category | Count |",
            "|---|---:|",
        ]
    )
    for row in categories_backlog:
        if int(row.get("count", 0)) <= 0:
            continue
        name = row.get("name_ar") or row.get("name_en") or "Unknown"
        lines.append(f"| {name} | {row.get('count', 0)} |")
    if all(int(row.get("count", 0)) <= 0 for row in categories_backlog):
        lines.append("| (None) | 0 |")

    lines.extend(
        [
            "",
            "## Artifact Paths",
            f"- Final pack: `{final_pack_path}`",
            f"- Needs verification: `{needs_verification_path}`",
            f"- QA report: `{qa_path}`",
            "",
        ]
    )

    return "\n".join(lines)


def build_final_artifacts(
    *,
    banks_dir: Path,
    category_files: set[str],
    final_pack_path: Path,
    needs_verification_path: Path,
) -> tuple[dict[str, Any], dict[str, Any]]:
    final_categories = []
    verify_categories = []

    for file_path in sorted(banks_dir.glob("category-*.json")):
        if file_path.name not in category_files:
            continue
        payload = load_json(file_path)
        categories = payload.get("categories", [])
        if not isinstance(categories, list) or not categories:
            continue
        cat = categories[0]
        questions = cat.get("questions", [])
        if not isinstance(questions, list):
            continue

        shipped = []
        backlog = []
        for q in questions:
            verification = q.get("verification", {})
            if not isinstance(verification, dict):
                verification = {"status": "verified", "risk_level": "low", "notes": ""}
            status = verification.get("status", "verified")
            if status == "needs_verification":
                backlog.append(q)
            else:
                shipped.append(q)

        base = {
            "name_ar": cat.get("name_ar", ""),
            "name_en": cat.get("name_en", ""),
        }
        final_categories.append({**base, "questions": shipped})
        verify_categories.append({**base, "questions": backlog})

    final_pack = {
        "language": "ar",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "categories": final_categories,
    }
    needs_verification = {
        "language": "ar",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "categories": verify_categories,
    }

    final_pack_path.write_text(json.dumps(final_pack, ensure_ascii=False, indent=2), encoding="utf-8")
    needs_verification_path.write_text(json.dumps(needs_verification, ensure_ascii=False, indent=2), encoding="utf-8")
    return final_pack, needs_verification


def summarize_with_orchestrator_prompt(
    *,
    config_dir: Path,
    prompt_path: Path,
    payload: dict[str, Any],
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    try:
        client = SubagentLLMClient(config_dir)
        prompt = prompt_path.read_text(encoding="utf-8")
        response = client.orchestrator_json(prompt, payload)
        return response, None
    except LLMClientError as exc:
        return None, {"error_code": exc.code, "message": str(exc), "metadata": exc.metadata}


def run(
    banks_dir: Path,
    config_dir: Path,
    output: Path,
    *,
    apply_changes: bool = True,
    mode: str = "full",
    llm_enabled: bool = False,
) -> dict[str, Any]:
    _, pipeline = load_pipeline_config(config_dir)
    require_llm = bool(pipeline.get("require_llm", False))
    if require_llm and not llm_enabled:
        raise RuntimeError(
            "LLM is required by policy (subagents/config/pipeline.json -> require_llm=true). "
            "Run with --llm."
        )

    max_iterations = int(pipeline.get("max_iterations", 4))
    batch_size = int(pipeline.get("batch_size", 25))
    category_files = resolve_category_set(mode, banks_dir, config_dir)

    rounds = []
    total_writer_changes = 0
    total_writer_fix_changes = 0
    total_writer_bootstrap_changes = 0
    final_gate_report: dict[str, Any] | None = None

    category_arg = ",".join(sorted(category_files))

    for iteration in range(1, max_iterations + 1):
        round_item: dict[str, Any] = {"iteration": iteration}

        # 1) LLM Writer bootstrap enrich
        writer_bootstrap_path = banks_dir / f"question-writer-bootstrap.iter{iteration}.json"
        writer_bootstrap = writer_run(
            banks_dir=banks_dir,
            critic_report_path=None,
            config_dir=config_dir,
            output=writer_bootstrap_path,
            apply_changes=apply_changes,
            llm_writer=llm_enabled,
            bootstrap_enrich=True,
            category_files_filter=category_files,
            writer_prompt_path=(config_dir / ".." / "prompts" / "writer.system.md").resolve(),
            llm_batch_size=batch_size,
        )
        total_writer_changes += int(writer_bootstrap.get("changes_count", 0))
        total_writer_bootstrap_changes += int(writer_bootstrap.get("changes_count", 0))
        round_item["writer_bootstrap_report"] = str(writer_bootstrap_path)
        round_item["writer_bootstrap_changes"] = int(writer_bootstrap.get("changes_count", 0))

        # 2) LLM Critic (optional)
        llm_critic_path = banks_dir / f"question-critic-llm.iter{iteration}.json"
        if llm_enabled:
            llm_critic = critic_run(
                banks_dir=banks_dir,
                config_dir=config_dir,
                output=llm_critic_path,
                category_files_filter=category_files,
                include_deterministic=False,
                include_llm=True,
                llm_prompt_path=(config_dir / ".." / "prompts" / "critic.system.md").resolve(),
                llm_batch_size=batch_size,
            )
        else:
            llm_critic = {
                "llm_review": {
                    "enabled": False,
                    "action_summary": {"APPROVE": 0, "REWRITE": 0, "ADD_HINT": 0, "ADD_ACCEPTED_VARIANTS": 0, "DROP": 0, "NEEDS_VERIFICATION": 0},
                    "items": [],
                    "errors": [],
                }
            }
            llm_critic_path.write_text(json.dumps(llm_critic, ensure_ascii=False, indent=2), encoding="utf-8")
        round_item["llm_critic_report"] = str(llm_critic_path)

        # 3) Rule Critic
        rule_critic_path = banks_dir / f"question-critic-rule.iter{iteration}.json"
        rule_critic = critic_run(
            banks_dir=banks_dir,
            config_dir=config_dir,
            output=rule_critic_path,
            category_files_filter=category_files,
            include_deterministic=True,
            include_llm=False,
        )
        round_item["rule_critic_report"] = str(rule_critic_path)

        # Merge critic outputs for fix pass.
        merged_critic_path = banks_dir / f"question-critic-merged.iter{iteration}.json"
        merge_critic_reports(rule_critic, llm_critic, merged_critic_path)
        round_item["merged_critic_report"] = str(merged_critic_path)

        # 4) Fix pass
        writer_fix_path = banks_dir / f"question-writer-fix.iter{iteration}.json"
        writer_fix = writer_run(
            banks_dir=banks_dir,
            critic_report_path=merged_critic_path,
            config_dir=config_dir,
            output=writer_fix_path,
            apply_changes=apply_changes,
            llm_writer=llm_enabled,
            bootstrap_enrich=False,
            category_files_filter=category_files,
            writer_prompt_path=(config_dir / ".." / "prompts" / "writer.system.md").resolve(),
            llm_batch_size=batch_size,
        )
        total_writer_changes += int(writer_fix.get("changes_count", 0))
        total_writer_fix_changes += int(writer_fix.get("changes_count", 0))
        round_item["writer_fix_report"] = str(writer_fix_path)
        round_item["writer_fix_changes"] = int(writer_fix.get("changes_count", 0))

        # 5) Gate evaluation on deterministic critic after fixes.
        gate_path = banks_dir / f"question-critic-gate.iter{iteration}.json"
        gate_report = critic_run(
            banks_dir=banks_dir,
            config_dir=config_dir,
            output=gate_path,
            category_files_filter=category_files,
            include_deterministic=True,
            include_llm=False,
        )
        final_gate_report = gate_report
        round_item["gate_report"] = str(gate_path)
        round_item["gate_passed"] = bool(gate_report.get("quality_gates", {}).get("passed", False))

        rounds.append(round_item)

        if round_item["gate_passed"]:
            break
        if int(writer_fix.get("changes_count", 0)) == 0:
            break

    final_pack_path = banks_dir / "final-pack.json"
    needs_verification_path = banks_dir / "needs-verification.json"
    final_pack, needs_verification = build_final_artifacts(
        banks_dir=banks_dir,
        category_files=category_files,
        final_pack_path=final_pack_path,
        needs_verification_path=needs_verification_path,
    )

    shipped_questions = [q for cat in final_pack.get("categories", []) for q in cat.get("questions", [])]
    backlog_questions = [q for cat in needs_verification.get("categories", []) for q in cat.get("questions", [])]
    dist = compute_distribution(shipped_questions)
    dedupe = compute_dedupe_metrics(shipped_questions)

    target_dist = pipeline.get("difficulty_distribution", {"easy_1_2": 0.3, "medium_3": 0.5, "hard_4_5": 0.2})
    compliance = {}
    for key, target in target_dist.items():
        actual = dist["ratios"].get(key, 0.0)
        compliance[key] = {
            "target": target,
            "actual": actual,
            "delta": round(actual - float(target), 4),
        }

    orchestrator_llm_summary = None
    orchestrator_llm_error = None
    if llm_enabled:
        orchestrator_payload = {
            "task": "orchestrator_summary",
            "mode": mode,
            "iterations_executed": len(rounds),
            "writer_changes": total_writer_changes,
            "writer_fix_changes": total_writer_fix_changes,
            "writer_bootstrap_changes": total_writer_bootstrap_changes,
            "shipped_count": len(shipped_questions),
            "needs_verification_count": len(backlog_questions),
            "distribution": dist,
            "dedupe": dedupe,
        }
        orchestrator_llm_summary, orchestrator_llm_error = summarize_with_orchestrator_prompt(
            config_dir=config_dir,
            prompt_path=(config_dir / ".." / "prompts" / "orchestrator.system.md").resolve(),
            payload=orchestrator_payload,
        )

    qa_report = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "mode": mode,
        "llm_enabled": llm_enabled,
        "category_files": sorted(category_files),
        "iterations_executed": len(rounds),
        "rounds": rounds,
        "issues_fixed": total_writer_changes,
        "issues_fixed_fix_pass_only": total_writer_fix_changes,
        "schema_enrichment_changes": total_writer_bootstrap_changes,
        "unresolved_rule_findings": (final_gate_report or {}).get("summary", {}).get("total_findings", 0),
        "verification_backlog": len(backlog_questions),
        "distribution": {
            "target": target_dist,
            "actual": dist,
            "compliance": compliance,
        },
        "dedupe": dedupe,
        "quality_gates": (final_gate_report or {}).get("quality_gates", {}),
        "orchestrator_llm_summary": orchestrator_llm_summary,
        "orchestrator_llm_error": orchestrator_llm_error,
    }

    qa_path = banks_dir / "final-pack.qa-report.json"
    qa_path.write_text(json.dumps(qa_report, ensure_ascii=False, indent=2), encoding="utf-8")

    shipped_categories = summarize_categories(final_pack)
    backlog_categories = summarize_categories(needs_verification)
    summary_md = build_human_summary_markdown(
        mode=mode,
        llm_enabled=llm_enabled,
        iterations=len(rounds),
        gate_passed=bool((final_gate_report or {}).get("quality_gates", {}).get("passed", False)),
        shipped_count=len(shipped_questions),
        verification_count=len(backlog_questions),
        issues_fixed=total_writer_fix_changes,
        unresolved_findings=(final_gate_report or {}).get("summary", {}).get("total_findings", 0),
        distribution={
            "target": target_dist,
            "actual": dist,
            "compliance": compliance,
        },
        dedupe=dedupe,
        final_pack_path=final_pack_path,
        needs_verification_path=needs_verification_path,
        qa_path=qa_path,
        categories_shipped=shipped_categories,
        categories_backlog=backlog_categories,
    )
    summary_md_path = banks_dir / "final-pack.summary.md"
    summary_md_path.write_text(summary_md, encoding="utf-8")
    summary_json_path = banks_dir / "final-pack.summary.json"
    summary_json_path.write_text(
        json.dumps(
            {
                "mode": mode,
                "llm_enabled": llm_enabled,
                "iterations_executed": len(rounds),
                "quality_gates_passed": bool((final_gate_report or {}).get("quality_gates", {}).get("passed", False)),
                "shipped_count": len(shipped_questions),
                "needs_verification_count": len(backlog_questions),
                "issues_fixed": total_writer_changes,
                "issues_fixed_fix_pass_only": total_writer_fix_changes,
                "schema_enrichment_changes": total_writer_bootstrap_changes,
                "unresolved_rule_findings": (final_gate_report or {}).get("summary", {}).get("total_findings", 0),
                "distribution": {
                    "target": target_dist,
                    "actual": dist,
                    "compliance": compliance,
                },
                "dedupe": dedupe,
                "categories_shipped": shipped_categories,
                "categories_needs_verification": backlog_categories,
                "artifacts": {
                    "final_pack": str(final_pack_path),
                    "needs_verification": str(needs_verification_path),
                    "qa_report": str(qa_path),
                    "summary_md": str(summary_md_path),
                },
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    latest_critic_path = banks_dir / "question-critic-pro-report.json"
    if final_gate_report:
        latest_critic_path.write_text(json.dumps(final_gate_report, ensure_ascii=False, indent=2), encoding="utf-8")

    orchestrator_report = {
        "orchestrator": "questions_orchestrator_v2",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "banks_dir": str(banks_dir),
        "config_dir": str(config_dir),
        "apply_changes": apply_changes,
        "mode": mode,
        "llm_enabled": llm_enabled,
        "max_iterations": max_iterations,
        "iterations_executed": len(rounds),
        "final_quality_gates_passed": bool((final_gate_report or {}).get("quality_gates", {}).get("passed", False)),
        "final_summary": (final_gate_report or {}).get("summary", {}),
        "latest_critic_report": str(latest_critic_path),
        "final_pack": str(final_pack_path),
        "needs_verification": str(needs_verification_path),
        "qa_report": str(qa_path),
        "summary_md": str(summary_md_path),
        "summary_json": str(summary_json_path),
    }

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(orchestrator_report, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"[orchestrator] Mode: {mode}")
    print(f"[orchestrator] LLM enabled: {llm_enabled}")
    print(f"[orchestrator] Iterations executed: {len(rounds)}")
    print(f"[orchestrator] Final gates passed: {orchestrator_report['final_quality_gates_passed']}")
    print(f"[orchestrator] Shipped: {len(shipped_questions)} | Needs verification: {len(backlog_questions)}")
    print(f"[orchestrator] Summary: {summary_md_path}")
    print(f"[orchestrator] Report: {output}")
    return orchestrator_report


def main() -> int:
    parser = argparse.ArgumentParser(description="Run critic/writer iterative orchestration.")
    parser.add_argument("--banks-dir", default="Banks", help="Directory containing category-*.json files.")
    parser.add_argument("--config-dir", default="subagents/config", help="Config directory.")
    parser.add_argument("--output", default="Banks/question-orchestrator-report.json", help="Orchestrator report path.")
    parser.add_argument("--dry-run", action="store_true", help="Do not apply writer changes.")
    parser.add_argument("--mode", choices=["pilot", "full"], default="full", help="Pilot runs configured subset; full runs all categories.")
    args = parser.parse_args()

    report = run(
        banks_dir=Path(args.banks_dir),
        config_dir=Path(args.config_dir),
        output=Path(args.output),
        apply_changes=not args.dry_run,
        mode=args.mode,
        llm_enabled=True,
    )
    return 0 if report.get("final_quality_gates_passed", False) else 1


if __name__ == "__main__":
    raise SystemExit(main())
