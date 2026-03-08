#!/usr/bin/env python3
"""
Professional question writer subagent.

- Enriches schema for hybrid compatibility
- Applies deterministic fixes
- Optionally applies LLM writer patches based on critic actions
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from subagents_llm_client import LLMClientError, SubagentLLMClient, load_pipeline_config


VALID_PATCH_FIELDS = {
    "question_ar",
    "prompt_ar",
    "hint_ar",
    "accepted_answers_ar",
    "reject_answers_ar",
    "explanation_ar",
    "difficulty_1to5",
    "tags",
    "acceptance_rules",
    "verification",
    "answer_ar",
    "acceptable_answers_ar",
}

RISK_HINT_PATTERN = re.compile(r"(أول|اول|آخر|اخر|أكثر|اكثر|الأكبر|الاكبر|رقم قياسي|تاريخ|سنة|عام|first|most|record)", re.IGNORECASE)


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def parse_question_ids(raw: str | None) -> list[str]:
    if not raw:
        return []
    parts = re.split(r"~|,", raw)
    ids = []
    for part in parts:
        item = normalize_text(part)
        if re.match(r"^CAT\d{2}-\d{3}-\d{3}$", item):
            ids.append(item)
    return ids


def concise_answer(answer: str, max_words: int) -> tuple[str, list[str]]:
    answer = normalize_text(answer)
    if len(answer.split()) <= max_words:
        return answer, []
    lower = answer.lower()
    if "don’t put all your eggs in one basket" in lower or "don't put all your eggs in one basket" in lower or "لا تضع كل" in answer:
        return "تنويع المخاطر", [answer]
    words = answer.split()
    short = " ".join(words[:max_words])
    return short, [answer]


def rephrase_question(question: str) -> str:
    q = normalize_text(question)
    if q.startswith("في أي دولة يقع"):
        return q.replace("في أي دولة يقع", "ما الدولة التي يوجد فيها", 1)
    if q.startswith("ما عاصمة"):
        return q.replace("ما عاصمة", "اذكر عاصمة", 1)
    if q.startswith("من هو"):
        return q.replace("من هو", "أي شخصية تُعرف بأنه", 1)
    if q.startswith("ما اسم"):
        return q.replace("ما اسم", "اذكر اسم", 1)
    if q.endswith("؟"):
        return q[:-1] + " مع قرينة أوضح؟"
    return q + "؟"


def default_difficulty_from_points(points: Any) -> int:
    try:
        p = int(points)
    except Exception:
        return 3
    if p <= 200:
        return 2
    if p <= 400:
        return 3
    return 4


def default_verification(question_ar: str) -> dict[str, Any]:
    if RISK_HINT_PATTERN.search(question_ar or ""):
        return {
            "status": "needs_verification",
            "risk_level": "medium",
            "notes": "يتطلب تحققًا إضافيًا لمعلومة زمنية/قياسية.",
        }
    return {
        "status": "verified",
        "risk_level": "low",
        "notes": "",
    }


def ensure_enriched_fields(q: dict[str, Any]) -> int:
    changed = 0

    question_ar = normalize_text(str(q.get("question_ar", "")))
    answer_ar = normalize_text(str(q.get("answer_ar", "")))
    acceptable = q.get("acceptable_answers_ar", [])
    if not isinstance(acceptable, list):
        acceptable = []

    if "prompt_ar" not in q or not normalize_text(str(q.get("prompt_ar", ""))):
        q["prompt_ar"] = question_ar
        changed += 1

    if "hint_ar" not in q:
        q["hint_ar"] = None
        changed += 1

    acc = q.get("accepted_answers_ar")
    if not isinstance(acc, list) or len(acc) == 0:
        merged = []
        for item in [answer_ar] + acceptable:
            text = normalize_text(str(item))
            if text and text not in merged:
                merged.append(text)
        q["accepted_answers_ar"] = merged
        changed += 1

    rej = q.get("reject_answers_ar")
    if not isinstance(rej, list):
        q["reject_answers_ar"] = []
        changed += 1

    if not normalize_text(str(q.get("explanation_ar", ""))):
        q["explanation_ar"] = "معلومة مرتبطة بالسؤال للاستخدام في لحظة الكشف."
        changed += 1

    if not isinstance(q.get("difficulty_1to5"), int):
        q["difficulty_1to5"] = default_difficulty_from_points(q.get("points"))
        changed += 1
    else:
        q["difficulty_1to5"] = max(1, min(5, int(q["difficulty_1to5"])))

    tags = q.get("tags")
    if not isinstance(tags, list):
        tags = []
    if len(tags) == 0:
        tags = ["open_ended"]
        changed += 1
    q["tags"] = tags

    rules = q.get("acceptance_rules")
    if not isinstance(rules, dict):
        rules = {}
    desired_rules = {
        "allow_ar_en": True,
        "ignore_diacritics": True,
        "normalize_al_el": True,
        "allow_minor_typos": True,
    }
    for key, val in desired_rules.items():
        if key not in rules:
            rules[key] = val
            changed += 1
    q["acceptance_rules"] = rules

    verification = q.get("verification")
    if not isinstance(verification, dict):
        q["verification"] = default_verification(question_ar)
        changed += 1
    else:
        if "status" not in verification or verification.get("status") not in {"verified", "needs_verification"}:
            verification["status"] = default_verification(question_ar)["status"]
            changed += 1
        if "risk_level" not in verification or verification.get("risk_level") not in {"low", "medium", "high"}:
            verification["risk_level"] = default_verification(question_ar)["risk_level"]
            changed += 1
        if "notes" not in verification:
            verification["notes"] = ""
            changed += 1
        q["verification"] = verification

    if not isinstance(q.get("acceptable_answers_ar"), list):
        q["acceptable_answers_ar"] = []
        changed += 1

    return changed


def iter_file_questions(path: Path) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    payload = load_json(path)
    categories = payload.get("categories", [])
    if not isinstance(categories, list) or not categories:
        return payload, []
    questions = categories[0].get("questions", [])
    if not isinstance(questions, list):
        return payload, []
    return payload, questions


def build_question_index(
    banks_dir: Path,
    selected_files: set[str] | None,
) -> tuple[dict[str, tuple[Path, dict[str, Any]]], dict[Path, dict[str, Any]], list[Path]]:
    by_id: dict[str, tuple[Path, dict[str, Any]]] = {}
    payload_cache: dict[Path, dict[str, Any]] = {}
    category_files = sorted(banks_dir.glob("category-*.json"))
    if selected_files is not None:
        category_files = [p for p in category_files if p.name in selected_files]

    for file_path in category_files:
        payload, questions = iter_file_questions(file_path)
        payload_cache[file_path] = payload
        for q in questions:
            qid = normalize_text(str(q.get("id", "")))
            if qid:
                by_id[qid] = (file_path, q)
    return by_id, payload_cache, category_files


def _batch(items: list[dict[str, Any]], size: int) -> list[list[dict[str, Any]]]:
    return [items[i : i + size] for i in range(0, len(items), size)]


def _sanitize_patch(raw_patch: dict[str, Any]) -> dict[str, Any]:
    cleaned = {}
    for key, value in raw_patch.items():
        if key not in VALID_PATCH_FIELDS:
            continue
        if key in {"question_ar", "prompt_ar", "hint_ar", "explanation_ar", "answer_ar"}:
            if value is None and key == "hint_ar":
                cleaned[key] = None
            else:
                cleaned[key] = normalize_text(str(value))
        elif key in {"accepted_answers_ar", "reject_answers_ar", "tags", "acceptable_answers_ar"}:
            if isinstance(value, list):
                out = []
                for item in value:
                    text = normalize_text(str(item))
                    if text and text not in out:
                        out.append(text)
                cleaned[key] = out
        elif key == "difficulty_1to5":
            try:
                cleaned[key] = max(1, min(5, int(value)))
            except Exception:
                pass
        elif key in {"acceptance_rules", "verification"}:
            if isinstance(value, dict):
                cleaned[key] = value
    return cleaned


def apply_patch_to_question(q: dict[str, Any], patch: dict[str, Any]) -> int:
    changed = 0
    for key, val in patch.items():
        if q.get(key) != val:
            q[key] = val
            changed += 1

    # sync compatibility aliases
    if "accepted_answers_ar" in patch:
        merged = list(q.get("accepted_answers_ar", []))
        q["acceptable_answers_ar"] = merged
    if "prompt_ar" in patch and not q.get("question_ar"):
        q["question_ar"] = q["prompt_ar"]

    return changed


def run_llm_writer(
    *,
    config_dir: Path,
    prompt_path: Path,
    items: list[dict[str, Any]],
    batch_size: int,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    patches: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = []
    try:
        client = SubagentLLMClient(config_dir)
        prompt = prompt_path.read_text(encoding="utf-8")
    except LLMClientError as exc:
        errors.append({"error_code": exc.code, "message": str(exc), "metadata": exc.metadata})
        return patches, errors

    for chunk in _batch(items, max(1, batch_size)):
        payload = {
            "task": "writer_patch",
            "items": chunk,
            "response_contract": {
                "items": [
                    {
                        "id": "CATxx-ppp-nnn",
                        "decision_applied": "REWRITE|ADD_HINT|ADD_ACCEPTED_VARIANTS|ENRICH_ONLY",
                        "patch": {},
                    }
                ]
            },
        }
        try:
            response = client.writer_json(prompt, payload)
            raw_items = response.get("items", []) if isinstance(response, dict) else []
            if not isinstance(raw_items, list):
                raw_items = []
            for row in raw_items:
                if not isinstance(row, dict):
                    continue
                qid = normalize_text(str(row.get("id", "")))
                if not qid:
                    continue
                decision_applied = normalize_text(str(row.get("decision_applied", ""))).upper() or "ENRICH_ONLY"
                patch = row.get("patch", {})
                if not isinstance(patch, dict):
                    patch = {}
                patches.append(
                    {
                        "id": qid,
                        "decision_applied": decision_applied,
                        "patch": _sanitize_patch(patch),
                    }
                )
        except LLMClientError as exc:
            errors.append({"error_code": exc.code, "message": str(exc), "metadata": exc.metadata})

    return patches, errors


def run(
    banks_dir: Path,
    critic_report_path: Path | None,
    config_dir: Path,
    output: Path,
    *,
    apply_changes: bool = True,
    llm_writer: bool = False,
    bootstrap_enrich: bool = False,
    category_files_filter: set[str] | None = None,
    writer_prompt_path: Path | None = None,
    llm_batch_size: int | None = None,
) -> dict[str, Any]:
    house_style = load_json(config_dir / "house_style.json")
    overrides = load_json(config_dir / "writer_overrides.json")
    _, pipeline = load_pipeline_config(config_dir)

    max_answer_words = int(house_style.get("max_answer_words", 6))
    diff_note_map = house_style.get("difficulty_notes_by_points", {})

    by_id, payload_cache, category_files = build_question_index(banks_dir, category_files_filter)

    question_overrides = overrides.get("question_overrides", {})
    answer_overrides = overrides.get("answer_overrides", {})

    critic = None
    if critic_report_path and critic_report_path.exists():
        critic = load_json(critic_report_path)

    changes: list[dict[str, Any]] = []
    changed_files: set[Path] = set()

    # Stage 0: bootstrap enrich hybrid fields.
    if bootstrap_enrich:
        for qid, (file_path, q) in by_id.items():
            cnt = ensure_enriched_fields(q)
            if cnt > 0:
                changes.append({"question_id": qid, "file": file_path.name, "type": "bootstrap_enrich", "field_changes": cnt})
                changed_files.add(file_path)

    # Explicit user overrides.
    for qid, new_q in question_overrides.items():
        target = by_id.get(qid)
        if not target:
            continue
        file_path, q = target
        old = q.get("question_ar", "")
        if normalize_text(str(old)) != normalize_text(str(new_q)):
            q["question_ar"] = str(new_q)
            q["prompt_ar"] = str(new_q)
            changes.append({"question_id": qid, "file": file_path.name, "type": "override_question"})
            changed_files.add(file_path)

    for qid, new_a in answer_overrides.items():
        target = by_id.get(qid)
        if not target:
            continue
        file_path, q = target
        old = q.get("answer_ar", "")
        if normalize_text(str(old)) != normalize_text(str(new_a)):
            q["answer_ar"] = str(new_a)
            changes.append({"question_id": qid, "file": file_path.name, "type": "override_answer"})
            changed_files.add(file_path)

    ids_for_rephrase: set[str] = set()
    llm_action_items: dict[str, dict[str, Any]] = {}

    if critic:
        for item in critic.get("llm_review", {}).get("items", []):
            if not isinstance(item, dict):
                continue
            qid = normalize_text(str(item.get("id", "")))
            if not qid:
                continue
            llm_action_items[qid] = item

        for finding in critic.get("findings", []):
            code = finding.get("code")
            qid_raw = finding.get("question_id")
            ids = parse_question_ids(qid_raw if isinstance(qid_raw, str) else None)

            if code in {"NEAR_DUP_QUESTION", "EXACT_DUP_QUESTION", "CROSS_FILE_DUP"}:
                if len(ids) >= 2:
                    for dup_id in ids[1:]:
                        ids_for_rephrase.add(dup_id)
                elif len(ids) == 1:
                    ids_for_rephrase.add(ids[0])

            elif code in {"GENERIC_DIFFICULTY", "DIFFICULTY_NOTE"} and ids:
                target = by_id.get(ids[0])
                if target:
                    file_path, q = target
                    points = str(q.get("points", ""))
                    note = diff_note_map.get(points)
                    if note:
                        q["difficulty_note_ar"] = note
                        changes.append({"question_id": ids[0], "file": file_path.name, "type": "difficulty_note"})
                        changed_files.add(file_path)

            elif code == "LONG_ANSWER" and ids:
                target = by_id.get(ids[0])
                if target:
                    file_path, q = target
                    old_answer = normalize_text(str(q.get("answer_ar", "")))
                    if old_answer:
                        short, alternatives = concise_answer(old_answer, max_answer_words)
                        if short != old_answer:
                            q["answer_ar"] = short
                            aa = q.get("acceptable_answers_ar", [])
                            if not isinstance(aa, list):
                                aa = []
                            for alt in alternatives:
                                if alt and alt not in aa:
                                    aa.append(alt)
                            q["acceptable_answers_ar"] = aa
                            q["accepted_answers_ar"] = list(aa)
                            changes.append({"question_id": ids[0], "file": file_path.name, "type": "shorten_answer"})
                            changed_files.add(file_path)

            elif code == "ACCEPTABLE_TYPE" and ids:
                target = by_id.get(ids[0])
                if target:
                    file_path, q = target
                    q["acceptable_answers_ar"] = []
                    q["accepted_answers_ar"] = []
                    changes.append({"question_id": ids[0], "file": file_path.name, "type": "normalize_acceptable"})
                    changed_files.add(file_path)

    for qid in sorted(ids_for_rephrase):
        target = by_id.get(qid)
        if not target:
            continue
        file_path, q = target
        old_q = normalize_text(str(q.get("question_ar", "")))
        if not old_q:
            continue
        new_q = rephrase_question(old_q)
        if normalize_text(new_q) != old_q:
            q["question_ar"] = new_q
            q["prompt_ar"] = new_q
            changes.append({"question_id": qid, "file": file_path.name, "type": "rephrase_duplicate"})
            changed_files.add(file_path)

    # Apply LLM writer patches from critic decisions.
    llm_errors: list[dict[str, Any]] = []
    llm_patches_applied = 0
    if llm_writer:
        prompt_path = writer_prompt_path or (config_dir / ".." / "prompts" / "writer.system.md")
        prompt_path = prompt_path.resolve()

        llm_items = []
        for qid, action in llm_action_items.items():
            target = by_id.get(qid)
            if not target:
                continue
            file_path, q = target
            decision = normalize_text(str(action.get("decision", "APPROVE"))).upper()
            if decision in {"APPROVE", "DROP"}:
                if decision == "DROP":
                    verification = q.get("verification", {})
                    if not isinstance(verification, dict):
                        verification = {}
                    verification["status"] = "needs_verification"
                    verification["risk_level"] = "high"
                    verification["notes"] = normalize_text(str(action.get("reason", "Marked for drop by critic.")))
                    q["verification"] = verification
                    changes.append({"question_id": qid, "file": file_path.name, "type": "critic_drop_to_needs_verification"})
                    changed_files.add(file_path)
                continue

            llm_items.append(
                {
                    "id": qid,
                    "decision": decision,
                    "reason": action.get("reason", ""),
                    "question": q,
                }
            )

        if bootstrap_enrich and len(llm_items) == 0:
            for qid, (_, q) in by_id.items():
                llm_items.append(
                    {
                        "id": qid,
                        "decision": "ENRICH_ONLY",
                        "reason": "Bootstrap schema enrichment",
                        "question": q,
                    }
                )

        if llm_items:
            patches, llm_errors = run_llm_writer(
                config_dir=config_dir,
                prompt_path=prompt_path,
                items=llm_items,
                batch_size=llm_batch_size or int(pipeline.get("batch_size", 25)),
            )
            for row in patches:
                qid = row["id"]
                target = by_id.get(qid)
                if not target:
                    continue
                file_path, q = target
                patch = row.get("patch", {})
                if not isinstance(patch, dict):
                    continue
                changed = apply_patch_to_question(q, patch)
                if changed > 0:
                    llm_patches_applied += 1
                    changes.append({
                        "question_id": qid,
                        "file": file_path.name,
                        "type": "llm_patch",
                        "decision_applied": row.get("decision_applied", ""),
                        "field_changes": changed,
                    })
                    changed_files.add(file_path)

    # Final normalized enrich pass to guarantee schema completeness.
    for qid, (file_path, q) in by_id.items():
        cnt = ensure_enriched_fields(q)
        if cnt > 0:
            changes.append({"question_id": qid, "file": file_path.name, "type": "final_enrich", "field_changes": cnt})
            changed_files.add(file_path)

    if apply_changes:
        for file_path in sorted(changed_files):
            save_json(file_path, payload_cache[file_path])

    by_type = Counter(change.get("type", "unknown") for change in changes)

    report = {
        "writer_subagent": "questions_writer_subagent_v2",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "banks_dir": str(banks_dir),
        "critic_report": str(critic_report_path) if critic_report_path else None,
        "config_dir": str(config_dir),
        "category_files": [p.name for p in category_files],
        "apply_changes": apply_changes,
        "llm_writer_enabled": llm_writer,
        "llm_patches_applied": llm_patches_applied,
        "llm_errors": llm_errors,
        "changed_files": [p.name for p in sorted(changed_files)],
        "changes_count": len(changes),
        "changes_by_type": dict(by_type),
        "changes": changes,
    }

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"[writer] Changes: {len(changes)}")
    print(f"[writer] Files touched: {len(changed_files)}")
    if llm_writer:
        print(f"[writer] LLM patches applied: {llm_patches_applied}")
        if llm_errors:
            print(f"[writer] LLM errors: {len(llm_errors)}")
    print(f"[writer] Report: {output}")
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description="Writer subagent for question banks.")
    parser.add_argument("--banks-dir", default="Banks", help="Directory containing category-*.json files.")
    parser.add_argument("--critic-report", default="Banks/question-critic-pro-report.json", help="Critic report path.")
    parser.add_argument("--config-dir", default="subagents/config", help="Config directory.")
    parser.add_argument("--output", default="Banks/question-writer-report.json", help="Writer report path.")
    parser.add_argument("--dry-run", action="store_true", help="Compute changes without writing files.")
    parser.add_argument("--bootstrap-enrich", action="store_true", help="Enrich all questions with hybrid schema fields.")
    parser.add_argument("--category-files", default="", help="Comma-separated category file names to process.")
    parser.add_argument("--writer-prompt", default="subagents/prompts/writer.system.md", help="LLM writer system prompt path.")
    parser.add_argument("--batch-size", type=int, default=0, help="Override LLM batch size.")
    args = parser.parse_args()

    selected = {normalize_text(x) for x in args.category_files.split(",") if normalize_text(x)}
    critic_path = Path(args.critic_report)
    if not critic_path.exists():
        critic_path = None

    run(
        banks_dir=Path(args.banks_dir),
        critic_report_path=critic_path,
        config_dir=Path(args.config_dir),
        output=Path(args.output),
        apply_changes=not args.dry_run,
        llm_writer=True,
        bootstrap_enrich=args.bootstrap_enrich,
        category_files_filter=(selected or None),
        writer_prompt_path=Path(args.writer_prompt),
        llm_batch_size=(args.batch_size if args.batch_size > 0 else None),
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
