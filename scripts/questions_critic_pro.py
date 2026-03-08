#!/usr/bin/env python3
"""
Professional question critic subagent.

- Deterministic rule-based audit (blocking authority for gates)
- Optional LLM critic review (OpenRouter) with actionable decisions
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

from subagents_llm_client import LLMClientError, SubagentLLMClient, load_pipeline_config


EXPECTED_POINTS = (200, 400, 600)
EXPECTED_PER_TIER = 50
DECISIONS = {"APPROVE", "REWRITE", "ADD_HINT", "ADD_ACCEPTED_VARIANTS", "DROP", "NEEDS_VERIFICATION"}


@dataclass
class Finding:
    severity: str
    code: str
    file: str
    question_id: str | None
    dimension: str
    reason: str
    rewrite_hint: str
    confidence: float
    blocking: bool

    def to_dict(self) -> dict[str, Any]:
        return {
            "severity": self.severity,
            "code": self.code,
            "file": self.file,
            "question_id": self.question_id,
            "dimension": self.dimension,
            "reason": self.reason,
            "rewrite_hint": self.rewrite_hint,
            "confidence": round(self.confidence, 2),
            "blocking": self.blocking,
        }


CODE_META: dict[str, dict[str, Any]] = {
    "LANGUAGE": {"severity": "high", "dimension": "format_compliance", "hint": "Set top-level language to 'ar'."},
    "MISSING_ID": {"severity": "critical", "dimension": "format_compliance", "hint": "Add a unique id like CAT01-200-001."},
    "DUP_ID": {"severity": "high", "dimension": "format_compliance", "hint": "Ensure each id is unique in file."},
    "ID_FORMAT": {"severity": "medium", "dimension": "format_compliance", "hint": "Use id format CATxx-ppp-nnn."},
    "POINTS": {"severity": "critical", "dimension": "difficulty_fit", "hint": "Use only 200, 400, or 600."},
    "ID_POINTS_MISMATCH": {"severity": "medium", "dimension": "format_compliance", "hint": "Make id point segment match points field."},
    "MISSING_QUESTION": {"severity": "critical", "dimension": "clarity", "hint": "Provide question_ar text."},
    "LONG_QUESTION": {"severity": "low", "dimension": "clarity", "hint": "Shorten question length while preserving clue."},
    "MISSING_ANSWER": {"severity": "critical", "dimension": "accuracy", "hint": "Provide concise answer_ar."},
    "LONG_ANSWER": {"severity": "low", "dimension": "clarity", "hint": "Keep answer short and add alternatives in acceptable_answers_ar."},
    "ACCEPTABLE_TYPE": {"severity": "medium", "dimension": "format_compliance", "hint": "Set acceptable_answers_ar as array."},
    "DIFFICULTY_NOTE": {"severity": "medium", "dimension": "difficulty_fit", "hint": "Add level-fit reason for this item."},
    "GENERIC_DIFFICULTY": {"severity": "low", "dimension": "difficulty_fit", "hint": "Use specific note tied to clue quality."},
    "MISSING_SOURCES": {"severity": "critical", "dimension": "source_quality", "hint": "Add at least one reliable source."},
    "FEW_SOURCES_600": {"severity": "medium", "dimension": "source_quality", "hint": "Use two sources for 600-point item when possible."},
    "SOURCE_TYPE": {"severity": "medium", "dimension": "source_quality", "hint": "Use allowed source type values."},
    "SOURCE_FIELDS": {"severity": "medium", "dimension": "source_quality", "hint": "Include non-empty source title and reference."},
    "POSSIBLE_MULTI_ANSWER": {"severity": "medium", "dimension": "ambiguity", "hint": "Narrow question or add acceptable answers."},
    "SOURCE_LANGUAGE_HEURISTIC": {"severity": "low", "dimension": "source_quality", "hint": "Prefer English source metadata for non-Arab categories."},
    "TIER_COUNT": {"severity": "high", "dimension": "difficulty_fit", "hint": "Keep exactly 50 questions per tier."},
    "EXACT_DUP_QUESTION": {"severity": "high", "dimension": "originality", "hint": "Rewrite one duplicate with different angle."},
    "NEAR_DUP_QUESTION": {"severity": "low", "dimension": "originality", "hint": "Rewrite one item to diversify wording/clue."},
    "CROSS_FILE_DUP": {"severity": "medium", "dimension": "originality", "hint": "Avoid repeating same question across categories."},
}


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def has_arabic(text: str) -> bool:
    return bool(re.search(r"[\u0600-\u06FF]", text))


def parse_category_id(question_id: str) -> int | None:
    match = re.match(r"^CAT(\d{2})-\d{3}-\d{3}$", question_id)
    if not match:
        return None
    return int(match.group(1))


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def load_prompt(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def iter_questions(payload: dict[str, Any]) -> tuple[str, str, list[dict[str, Any]]]:
    language = payload.get("language", "")
    categories = payload.get("categories", [])
    if not isinstance(categories, list) or not categories:
        return language, "", []
    category_name = str(categories[0].get("name_ar", ""))
    questions = categories[0].get("questions", [])
    if not isinstance(questions, list):
        questions = []
    return language, category_name, questions


def load_configs(config_dir: Path) -> dict[str, Any]:
    rubric = load_json(config_dir / "rubric.json")
    source_policy = load_json(config_dir / "source_policy.json")
    quality_gates = load_json(config_dir / "quality_gates.json")
    house_style = load_json(config_dir / "house_style.json")
    category_rules = load_json(config_dir / "category_rules.json")
    custom_checks_path = config_dir / "custom_checks.json"
    custom_checks = load_json(custom_checks_path) if custom_checks_path.exists() else {"checks": []}
    _, pipeline_raw = load_pipeline_config(config_dir)
    return {
        "rubric": rubric,
        "source_policy": source_policy,
        "quality_gates": quality_gates,
        "house_style": house_style,
        "category_rules": category_rules,
        "custom_checks": custom_checks,
        "pipeline": pipeline_raw,
    }


def list_category_files(banks_dir: Path, selected_files: set[str] | None) -> list[Path]:
    files = sorted(banks_dir.glob("category-*.json"))
    if selected_files is None:
        return files
    return [p for p in files if p.name in selected_files]


def make_finding(
    code: str,
    file_name: str,
    question_id: str | None,
    reason: str,
    blocking_codes: set[str],
    confidence: float = 0.9,
) -> Finding:
    meta = CODE_META.get(code, {})
    severity = str(meta.get("severity", "medium"))
    blocking = severity in {"critical", "high"} or code in blocking_codes
    return Finding(
        severity=severity,
        code=code,
        file=file_name,
        question_id=question_id,
        dimension=str(meta.get("dimension", "quality")),
        reason=reason,
        rewrite_hint=str(meta.get("hint", "Revise question to satisfy quality rules.")),
        confidence=confidence,
        blocking=blocking,
    )


def score_question(
    codes: list[str],
    penalty_by_code: dict[str, int],
    score_bands: dict[str, int],
) -> tuple[int, str]:
    score = 100
    for code in codes:
        score -= int(penalty_by_code.get(code, 5))
    score = max(0, min(100, score))
    if score >= int(score_bands.get("excellent_min", 90)):
        band = "excellent"
    elif score >= int(score_bands.get("good_min", 75)):
        band = "good"
    elif score >= int(score_bands.get("needs_work_min", 60)):
        band = "needs_work"
    else:
        band = "poor"
    return score, band


def _batch(items: list[dict[str, Any]], size: int) -> list[list[dict[str, Any]]]:
    return [items[i : i + size] for i in range(0, len(items), size)]


def _normalize_llm_critic_item(raw: dict[str, Any]) -> dict[str, Any] | None:
    qid = normalize_text(str(raw.get("id", "")))
    if not qid:
        return None
    decision = normalize_text(str(raw.get("decision", "APPROVE"))).upper()
    if decision not in DECISIONS:
        decision = "APPROVE"
    reason = normalize_text(str(raw.get("reason", "")))
    corrected_question = raw.get("corrected_question")
    if corrected_question is not None:
        corrected_question = normalize_text(str(corrected_question))
    corrected_fields = raw.get("corrected_fields", {})
    if not isinstance(corrected_fields, dict):
        corrected_fields = {}
    return {
        "id": qid,
        "decision": decision,
        "reason": reason,
        "corrected_question": corrected_question,
        "corrected_fields": corrected_fields,
    }


def run_llm_critic(
    *,
    banks_dir: Path,
    category_files: list[Path],
    config_dir: Path,
    prompt_path: Path,
    batch_size: int,
) -> tuple[list[dict[str, Any]], dict[str, int], list[dict[str, Any]]]:
    client = SubagentLLMClient(config_dir)
    prompt = load_prompt(prompt_path)

    review_items: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = []

    for file_path in category_files:
        payload = load_json(file_path)
        _, category_name, questions = iter_questions(payload)
        req_items = []
        for q in questions:
            req_items.append(
                {
                    "id": q.get("id"),
                    "points": q.get("points"),
                    "question_ar": q.get("question_ar"),
                    "answer_ar": q.get("answer_ar"),
                    "acceptable_answers_ar": q.get("acceptable_answers_ar", []),
                    "difficulty_note_ar": q.get("difficulty_note_ar"),
                    "source_notes": q.get("source_notes", []),
                    "hint_ar": q.get("hint_ar"),
                    "accepted_answers_ar": q.get("accepted_answers_ar", []),
                    "verification": q.get("verification", {}),
                }
            )

        for chunk in _batch(req_items, max(1, batch_size)):
            user_payload = {
                "task": "critic_review",
                "category_file": file_path.name,
                "category_name_ar": category_name,
                "items": chunk,
                "response_contract": {
                    "items": [
                        {
                            "id": "CATxx-ppp-nnn",
                            "decision": "APPROVE|REWRITE|ADD_HINT|ADD_ACCEPTED_VARIANTS|DROP|NEEDS_VERIFICATION",
                            "reason": "short reason",
                            "corrected_question": "optional",
                            "corrected_fields": {},
                        }
                    ]
                },
            }
            try:
                llm = client.critic_json(prompt, user_payload)
                raw_items = llm.get("items", []) if isinstance(llm, dict) else []
                if not isinstance(raw_items, list):
                    raw_items = []
                for row in raw_items:
                    if not isinstance(row, dict):
                        continue
                    normalized = _normalize_llm_critic_item(row)
                    if normalized:
                        normalized["file"] = file_path.name
                        review_items.append(normalized)
            except LLMClientError as exc:
                errors.append(
                    {
                        "file": file_path.name,
                        "error_code": exc.code,
                        "message": str(exc),
                        "metadata": exc.metadata,
                    }
                )

    summary = Counter(item["decision"] for item in review_items)
    action_summary = {
        "APPROVE": summary.get("APPROVE", 0),
        "REWRITE": summary.get("REWRITE", 0),
        "ADD_HINT": summary.get("ADD_HINT", 0),
        "ADD_ACCEPTED_VARIANTS": summary.get("ADD_ACCEPTED_VARIANTS", 0),
        "DROP": summary.get("DROP", 0),
        "NEEDS_VERIFICATION": summary.get("NEEDS_VERIFICATION", 0),
    }
    return review_items, action_summary, errors


def run(
    banks_dir: Path,
    config_dir: Path,
    output: Path,
    *,
    category_files_filter: set[str] | None = None,
    include_deterministic: bool = True,
    include_llm: bool = False,
    llm_prompt_path: Path | None = None,
    llm_batch_size: int | None = None,
) -> dict[str, Any]:
    cfg = load_configs(config_dir)
    rubric = cfg["rubric"]
    source_policy = cfg["source_policy"]
    quality_gates = cfg["quality_gates"]
    house_style = cfg["house_style"]
    custom_checks = cfg["custom_checks"].get("checks", [])
    pipeline = cfg["pipeline"]

    penalty_by_code = rubric.get("penalty_by_code", {})
    score_bands = rubric.get("score_bands", {})
    blocking_codes = set(quality_gates.get("blocking_codes", []))

    max_question_chars = int(house_style.get("max_question_chars", 160))
    max_answer_words = int(house_style.get("max_answer_words", 6))

    allowed_source_types = set(source_policy.get("allowed_source_types", []))
    require_two_sources_600 = bool(source_policy.get("require_two_sources_for_600", True))
    prefer_english_non_arab = bool(source_policy.get("prefer_english_source_metadata_for_non_arab_categories", True))
    non_arab_categories = set(int(x) for x in source_policy.get("non_arab_category_ids", []))

    category_files = list_category_files(banks_dir, category_files_filter)
    if not category_files:
        raise FileNotFoundError(f"No category files found in {banks_dir} after filter")

    findings: list[Finding] = []
    file_summaries = []
    question_scores = []
    per_question_codes: dict[tuple[str, str], list[str]] = defaultdict(list)
    cross_index: dict[str, list[tuple[str, str]]] = defaultdict(list)

    if include_deterministic:
        for file_path in category_files:
            payload = load_json(file_path)
            language, category_name, questions = iter_questions(payload)

            if language != "ar":
                findings.append(make_finding("LANGUAGE", file_path.name, None, "Top-level language should be 'ar'.", blocking_codes))

            by_points = Counter()
            seen_ids = set()
            qtext_by_points: dict[int, list[tuple[str, str]]] = defaultdict(list)
            local_findings_before = len(findings)

            for q in questions:
                qid = normalize_text(str(q.get("id", "")))
                points = q.get("points")
                question = normalize_text(str(q.get("question_ar", "")))
                answer = normalize_text(str(q.get("answer_ar", "")))
                acceptable = q.get("acceptable_answers_ar", [])
                diff_note = normalize_text(str(q.get("difficulty_note_ar", "")))
                sources = q.get("source_notes", [])

                if qid:
                    cross_index[question].append((file_path.name, qid))

                def add(code: str, reason: str, confidence: float = 0.9) -> None:
                    findings.append(make_finding(code, file_path.name, qid or None, reason, blocking_codes, confidence))
                    if qid:
                        per_question_codes[(file_path.name, qid)].append(code)

                for custom in custom_checks:
                    if not isinstance(custom, dict) or not custom.get("enabled", True):
                        continue
                    target_field = str(custom.get("target_field", "question_ar"))
                    target_text = normalize_text(str(q.get(target_field, "")))
                    pattern = str(custom.get("regex", ""))
                    if not pattern or not target_text:
                        continue
                    try:
                        matched = bool(re.search(pattern, target_text))
                    except re.error:
                        continue
                    if not matched:
                        continue

                    custom_code = normalize_text(str(custom.get("code", "CUSTOM_RULE"))) or "CUSTOM_RULE"
                    custom_severity = normalize_text(str(custom.get("severity", "medium"))) or "medium"
                    custom_dimension = normalize_text(str(custom.get("dimension", "quality"))) or "quality"
                    custom_reason = normalize_text(str(custom.get("reason", "Custom rule triggered."))) or "Custom rule triggered."
                    custom_hint = normalize_text(str(custom.get("rewrite_hint", "Revise question per custom rule."))) or "Revise question per custom rule."
                    custom_conf = float(custom.get("confidence", 0.8))
                    custom_blocking = custom_severity in {"critical", "high"} or custom_code in blocking_codes

                    findings.append(
                        Finding(
                            severity=custom_severity,
                            code=custom_code,
                            file=file_path.name,
                            question_id=qid or None,
                            dimension=custom_dimension,
                            reason=custom_reason,
                            rewrite_hint=custom_hint,
                            confidence=custom_conf,
                            blocking=custom_blocking,
                        )
                    )
                    if qid:
                        per_question_codes[(file_path.name, qid)].append(custom_code)

                if not qid:
                    add("MISSING_ID", "Question missing id.", 0.98)
                else:
                    if qid in seen_ids:
                        add("DUP_ID", "Duplicate question id in same file.", 0.98)
                    seen_ids.add(qid)
                    if not re.match(r"^CAT\d{2}-\d{3}-\d{3}$", qid):
                        add("ID_FORMAT", "Question id format must be CATxx-ppp-nnn.", 0.95)

                if points not in EXPECTED_POINTS:
                    add("POINTS", f"Invalid points value: {points}.", 0.99)
                else:
                    p = int(points)
                    by_points[p] += 1
                    qtext_by_points[p].append((qid, question))
                    if qid and f"-{p}-" not in qid:
                        add("ID_POINTS_MISMATCH", "ID point segment does not match points.", 0.9)

                if not question:
                    add("MISSING_QUESTION", "question_ar is empty.", 0.99)
                elif len(question) > max_question_chars:
                    add("LONG_QUESTION", f"Question has {len(question)} chars (>{max_question_chars}).", 0.95)

                if not answer:
                    add("MISSING_ANSWER", "answer_ar is empty.", 0.99)
                elif len(answer.split()) > max_answer_words:
                    add("LONG_ANSWER", f"Answer has {len(answer.split())} words (>{max_answer_words}).", 0.95)

                if not isinstance(acceptable, list):
                    add("ACCEPTABLE_TYPE", "acceptable_answers_ar should be array.", 0.95)

                if not diff_note:
                    add("DIFFICULTY_NOTE", "difficulty_note_ar is empty.", 0.92)
                elif diff_note in {"سهل.", "متوسط.", "صعب عادل."}:
                    add("GENERIC_DIFFICULTY", "difficulty_note_ar is too generic.", 0.85)

                if not isinstance(sources, list) or not sources:
                    add("MISSING_SOURCES", "source_notes must include at least one source.", 0.99)
                else:
                    if require_two_sources_600 and points == 600 and len(sources) < 2:
                        add("FEW_SOURCES_600", "600-point question should include 2+ sources when possible.", 0.85)

                    source_meta_text_parts = []
                    for source in sources:
                        stype = str(source.get("type", ""))
                        title = normalize_text(str(source.get("title", "")))
                        ref = normalize_text(str(source.get("reference", "")))
                        source_meta_text_parts.append(f"{title} {ref}".strip())

                        if stype not in allowed_source_types:
                            add("SOURCE_TYPE", f"Invalid source type: {stype}.", 0.96)
                        if not title or not ref:
                            add("SOURCE_FIELDS", "Source entry must include title and reference.", 0.95)

                    if (
                        re.search(r"(اذكر|سمّ|سمي|ما هما|عدد|اذكر اثنين)", question)
                        and isinstance(acceptable, list)
                        and len(acceptable) == 0
                        and "," in answer
                    ):
                        add("POSSIBLE_MULTI_ANSWER", "Question likely expects multiple valid answers.", 0.75)

                    if qid and prefer_english_non_arab:
                        cat_id = parse_category_id(qid)
                        if cat_id in non_arab_categories:
                            joined_meta = " ".join(source_meta_text_parts)
                            if has_arabic(joined_meta):
                                add("SOURCE_LANGUAGE_HEURISTIC", "Non-Arab category appears to use Arabic source metadata.", 0.7)

            for p in EXPECTED_POINTS:
                cnt = by_points.get(p, 0)
                if cnt != EXPECTED_PER_TIER:
                    findings.append(
                        make_finding(
                            "TIER_COUNT",
                            file_path.name,
                            None,
                            f"Expected {EXPECTED_PER_TIER} questions for {p}, found {cnt}.",
                            blocking_codes,
                            0.99,
                        )
                    )

            for p, items in qtext_by_points.items():
                exact_map: dict[str, list[str]] = defaultdict(list)
                for row_qid, text in items:
                    if text:
                        exact_map[text].append(row_qid)
                for _, ids in exact_map.items():
                    if len(ids) > 1:
                        findings.append(
                            make_finding(
                                "EXACT_DUP_QUESTION",
                                file_path.name,
                                ", ".join(ids[:3]),
                                f"Exact duplicate question text in tier {p}.",
                                blocking_codes,
                                0.98,
                            )
                        )
                        for one_id in ids:
                            per_question_codes[(file_path.name, one_id)].append("EXACT_DUP_QUESTION")

                for i in range(len(items)):
                    qid_a, text_a = items[i]
                    if not text_a:
                        continue
                    for j in range(i + 1, len(items)):
                        qid_b, text_b = items[j]
                        if not text_b:
                            continue
                        ratio = SequenceMatcher(None, text_a, text_b).ratio()
                        if ratio >= 0.93:
                            findings.append(
                                make_finding(
                                    "NEAR_DUP_QUESTION",
                                    file_path.name,
                                    f"{qid_a} ~ {qid_b}",
                                    f"Very similar text in tier {p} (similarity {ratio:.2f}).",
                                    blocking_codes,
                                    0.8,
                                )
                            )
                            per_question_codes[(file_path.name, qid_a)].append("NEAR_DUP_QUESTION")
                            per_question_codes[(file_path.name, qid_b)].append("NEAR_DUP_QUESTION")

            local_findings_after = len(findings)
            file_summaries.append(
                {
                    "file": file_path.name,
                    "category_name_ar": category_name,
                    "question_count": len(questions),
                    "by_points": {str(k): by_points.get(k, 0) for k in EXPECTED_POINTS},
                    "findings_count": local_findings_after - local_findings_before,
                }
            )

        for _, refs in cross_index.items():
            if len(refs) <= 1:
                continue
            files = sorted({file_name for file_name, _ in refs})
            ids = [qid for _, qid in refs]
            finding = make_finding(
                "CROSS_FILE_DUP",
                ", ".join(files[:3]),
                ", ".join(ids[:5]),
                f"Question appears in multiple files ({len(refs)} copies).",
                blocking_codes,
                0.85,
            )
            findings.append(finding)
            for file_name, qid in refs:
                per_question_codes[(file_name, qid)].append("CROSS_FILE_DUP")

    llm_review_items: list[dict[str, Any]] = []
    llm_action_summary = {
        "APPROVE": 0,
        "REWRITE": 0,
        "ADD_HINT": 0,
        "ADD_ACCEPTED_VARIANTS": 0,
        "DROP": 0,
        "NEEDS_VERIFICATION": 0,
    }
    llm_errors: list[dict[str, Any]] = []

    if include_llm:
        prompt_path = llm_prompt_path or (config_dir / ".." / "prompts" / "critic.system.md")
        prompt_path = prompt_path.resolve()
        try:
            llm_review_items, llm_action_summary, llm_errors = run_llm_critic(
                banks_dir=banks_dir,
                category_files=category_files,
                config_dir=config_dir,
                prompt_path=prompt_path,
                batch_size=llm_batch_size or int(pipeline.get("batch_size", 25)),
            )
        except LLMClientError as exc:
            llm_errors.append(
                {
                    "file": "*",
                    "error_code": exc.code,
                    "message": str(exc),
                    "metadata": exc.metadata,
                }
            )

    for file_path in category_files:
        payload = load_json(file_path)
        _, _, questions = iter_questions(payload)
        for q in questions:
            qid = normalize_text(str(q.get("id", "")))
            if not qid:
                continue
            codes = per_question_codes.get((file_path.name, qid), [])
            score, band = score_question(codes, penalty_by_code, score_bands)
            question_scores.append(
                {
                    "file": file_path.name,
                    "question_id": qid,
                    "score": score,
                    "band": band,
                    "issue_codes": sorted(set(codes)),
                }
            )

    severity_counts = Counter(f.severity for f in findings)
    score_values = [row["score"] for row in question_scores] or [100]
    avg_score = round(sum(score_values) / len(score_values), 2)

    thresholds = quality_gates.get("pass_thresholds", {})
    if include_deterministic:
        gate_eval = {
            "critical": severity_counts.get("critical", 0) <= int(thresholds.get("critical", 0)),
            "high": severity_counts.get("high", 0) <= int(thresholds.get("high", 0)),
            "medium": severity_counts.get("medium", 0) <= int(thresholds.get("medium", 0)),
            "low": severity_counts.get("low", 0) <= int(thresholds.get("low", 999999)),
        }
        passed = all(gate_eval.values())
    else:
        gate_eval = {"critical": True, "high": True, "medium": True, "low": True}
        passed = True

    report = {
        "critic_subagent": "questions_critic_pro_v2",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "banks_dir": str(banks_dir),
        "config_dir": str(config_dir),
        "files_checked": len(category_files),
        "category_files": [p.name for p in category_files],
        "modes": {
            "include_deterministic": include_deterministic,
            "include_llm": include_llm,
        },
        "summary": {
            "total_findings": len(findings),
            "by_severity": {
                "critical": severity_counts.get("critical", 0),
                "high": severity_counts.get("high", 0),
                "medium": severity_counts.get("medium", 0),
                "low": severity_counts.get("low", 0),
            },
            "average_question_score": avg_score,
        },
        "quality_gates": {
            "thresholds": thresholds,
            "evaluation": gate_eval,
            "passed": passed,
        },
        "llm_review": {
            "enabled": include_llm,
            "action_summary": llm_action_summary,
            "items": llm_review_items,
            "errors": llm_errors,
        },
        "files": file_summaries,
        "question_scores": question_scores,
        "findings": [f.to_dict() for f in findings],
    }

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"[critic-pro] Files checked: {len(category_files)}")
    print(f"[critic-pro] Findings: {len(findings)}")
    print(
        "[critic-pro] Severity: "
        f"critical={severity_counts.get('critical', 0)} "
        f"high={severity_counts.get('high', 0)} "
        f"medium={severity_counts.get('medium', 0)} "
        f"low={severity_counts.get('low', 0)}"
    )
    if include_llm:
        print(
            "[critic-pro] LLM actions: "
            f"approve={llm_action_summary['APPROVE']} "
            f"rewrite={llm_action_summary['REWRITE']} "
            f"add_hint={llm_action_summary['ADD_HINT']} "
            f"add_variants={llm_action_summary['ADD_ACCEPTED_VARIANTS']} "
            f"drop={llm_action_summary['DROP']} "
            f"needs_verification={llm_action_summary['NEEDS_VERIFICATION']}"
        )
        if llm_errors:
            print(f"[critic-pro] LLM errors: {len(llm_errors)}")
    print(f"[critic-pro] Average score: {avg_score}")
    print(f"[critic-pro] Gates passed: {passed}")
    print(f"[critic-pro] Report: {output}")
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description="Professional critic for question banks.")
    parser.add_argument("--banks-dir", default="Banks", help="Directory containing category-*.json files.")
    parser.add_argument("--config-dir", default="subagents/config", help="Config directory.")
    parser.add_argument("--output", default="Banks/question-critic-pro-report.json", help="Output report path.")
    parser.add_argument("--category-files", default="", help="Comma-separated category file names to process.")
    parser.add_argument("--critic-prompt", default="subagents/prompts/critic.system.md", help="LLM critic system prompt path.")
    parser.add_argument("--batch-size", type=int, default=0, help="Override LLM batch size.")
    args = parser.parse_args()

    selected = {normalize_text(x) for x in args.category_files.split(",") if normalize_text(x)}

    report = run(
        Path(args.banks_dir),
        Path(args.config_dir),
        Path(args.output),
        category_files_filter=(selected or None),
        include_deterministic=True,
        include_llm=True,
        llm_prompt_path=Path(args.critic_prompt),
        llm_batch_size=(args.batch_size if args.batch_size > 0 else None),
    )
    return 0 if report["quality_gates"]["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
