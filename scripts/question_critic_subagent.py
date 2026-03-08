#!/usr/bin/env python3
"""
Question Critic Subagent

Audits Arabic Jeopardy-style bank JSON files for schema, quality, and consistency issues.
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any


VALID_SOURCE_TYPES = {
    "encyclopedia",
    "official",
    "museum",
    "university",
    "reputable_media",
}
EXPECTED_POINTS = (200, 400, 600)
EXPECTED_PER_TIER = 50
MAX_QUESTION_LENGTH = 160
GENERIC_DIFFICULTY_NOTES = {"سهل.", "متوسط.", "صعب عادل."}

# User asked to prefer English sources for non-Arab/non-Arabic categories.
# This is a heuristic check on source titles/references.
NON_ARAB_CATEGORY_IDS = {4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 17, 18, 20}


@dataclass
class Finding:
    severity: str  # high | medium | low
    file: str
    question_id: str | None
    code: str
    message: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "severity": self.severity,
            "file": self.file,
            "question_id": self.question_id,
            "code": self.code,
            "message": self.message,
        }


def normalize_text(value: str) -> str:
    value = re.sub(r"\s+", " ", value).strip()
    return value


def has_arabic(text: str) -> bool:
    return bool(re.search(r"[\u0600-\u06FF]", text))


def parse_category_id(question_id: str) -> int | None:
    match = re.match(r"^CAT(\d{2})-\d{3}-\d{3}$", question_id)
    if not match:
        return None
    return int(match.group(1))


def load_files(banks_dir: Path) -> list[Path]:
    files = sorted(banks_dir.glob("category-*.json"))
    if not files:
        raise FileNotFoundError(f"No category files found in {banks_dir}")
    return files


def iter_questions(payload: dict[str, Any]) -> tuple[str, str, list[dict[str, Any]]]:
    language = payload.get("language", "")
    categories = payload.get("categories", [])
    if not isinstance(categories, list) or not categories:
        return language, "", []
    category_name = categories[0].get("name_ar", "")
    questions = categories[0].get("questions", [])
    if not isinstance(questions, list):
        questions = []
    return language, category_name, questions


def audit_file(path: Path, findings: list[Finding]) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        payload = json.load(f)

    language, category_name, questions = iter_questions(payload)
    if language != "ar":
        findings.append(
            Finding("high", path.name, None, "LANGUAGE", "Top-level language should be 'ar'.")
        )

    by_points = Counter()
    seen_ids = set()
    qtext_by_points: dict[int, list[tuple[str, str]]] = defaultdict(list)
    source_types = Counter()

    for q in questions:
        qid = str(q.get("id", "")).strip()
        points = q.get("points")
        question = normalize_text(str(q.get("question_ar", "")))
        answer = normalize_text(str(q.get("answer_ar", "")))
        acceptable = q.get("acceptable_answers_ar", [])
        diff_note = normalize_text(str(q.get("difficulty_note_ar", "")))
        sources = q.get("source_notes", [])

        if not qid:
            findings.append(Finding("high", path.name, None, "MISSING_ID", "Question missing id."))
        else:
            if qid in seen_ids:
                findings.append(Finding("high", path.name, qid, "DUP_ID", "Duplicate question id in file."))
            seen_ids.add(qid)
            if not re.match(r"^CAT\d{2}-\d{3}-\d{3}$", qid):
                findings.append(
                    Finding("medium", path.name, qid, "ID_FORMAT", "Question id format should be CATxx-ppp-nnn.")
                )

        if points not in EXPECTED_POINTS:
            findings.append(
                Finding("high", path.name, qid or None, "POINTS", f"Invalid points value: {points}.")
            )
        else:
            by_points[int(points)] += 1
            qtext_by_points[int(points)].append((qid, question))
            if qid and f"-{points}-" not in qid:
                findings.append(
                    Finding("medium", path.name, qid, "ID_POINTS_MISMATCH", "Points do not match id middle segment.")
                )

        if not question:
            findings.append(Finding("high", path.name, qid or None, "MISSING_QUESTION", "question_ar is empty."))
        elif len(question) > MAX_QUESTION_LENGTH:
            findings.append(
                Finding(
                    "low",
                    path.name,
                    qid or None,
                    "LONG_QUESTION",
                    f"Question length is {len(question)} chars (> {MAX_QUESTION_LENGTH}).",
                )
            )

        if not answer:
            findings.append(Finding("high", path.name, qid or None, "MISSING_ANSWER", "answer_ar is empty."))
        elif len(answer.split()) > 6:
            findings.append(
                Finding("low", path.name, qid or None, "LONG_ANSWER", "Answer has more than 6 words.")
            )

        if not isinstance(acceptable, list):
            findings.append(
                Finding("medium", path.name, qid or None, "ACCEPTABLE_TYPE", "acceptable_answers_ar should be an array.")
            )

        if not diff_note:
            findings.append(
                Finding("medium", path.name, qid or None, "DIFFICULTY_NOTE", "difficulty_note_ar is empty.")
            )
        elif diff_note in GENERIC_DIFFICULTY_NOTES:
            findings.append(
                Finding("low", path.name, qid or None, "GENERIC_DIFFICULTY", "difficulty_note_ar is too generic.")
            )

        if not isinstance(sources, list) or not sources:
            findings.append(
                Finding("high", path.name, qid or None, "MISSING_SOURCES", "source_notes must contain at least 1 source.")
            )
        else:
            if points == 600 and len(sources) < 2:
                findings.append(
                    Finding(
                        "medium",
                        path.name,
                        qid or None,
                        "FEW_SOURCES_600",
                        "600-point question should include 2+ sources when possible.",
                    )
                )

            for source in sources:
                stype = source.get("type")
                source_types[str(stype)] += 1
                if stype not in VALID_SOURCE_TYPES:
                    findings.append(
                        Finding(
                            "medium",
                            path.name,
                            qid or None,
                            "SOURCE_TYPE",
                            f"Invalid source type: {stype}.",
                        )
                    )
                title = normalize_text(str(source.get("title", "")))
                reference = normalize_text(str(source.get("reference", "")))
                if not title or not reference:
                    findings.append(
                        Finding(
                            "medium",
                            path.name,
                            qid or None,
                            "SOURCE_FIELDS",
                            "Each source must include non-empty title and reference.",
                        )
                    )

            # Heuristic ambiguity signal.
            if (
                re.search(r"(اذكر|سمّ|سمي|ما هما|ما هما الاثنان|عدد)", question)
                and isinstance(acceptable, list)
                and len(acceptable) == 0
                and "," in answer
            ):
                findings.append(
                    Finding(
                        "low",
                        path.name,
                        qid or None,
                        "POSSIBLE_MULTI_ANSWER",
                        "Likely multi-answer question without acceptable alternatives listed.",
                    )
                )

            # Heuristic source language policy for non-Arab categories.
            if qid:
                cat_id = parse_category_id(qid)
                if cat_id in NON_ARAB_CATEGORY_IDS:
                    all_titles = " ".join(
                        normalize_text(str(s.get("title", ""))) + " " + normalize_text(str(s.get("reference", "")))
                        for s in sources
                    )
                    if has_arabic(all_titles):
                        findings.append(
                            Finding(
                                "low",
                                path.name,
                                qid,
                                "SOURCE_LANGUAGE_HEURISTIC",
                                "Non-Arab category appears to use Arabic source metadata.",
                            )
                        )

    # Per-tier count checks.
    for points in EXPECTED_POINTS:
        count = by_points.get(points, 0)
        if count != EXPECTED_PER_TIER:
            findings.append(
                Finding(
                    "high",
                    path.name,
                    None,
                    "TIER_COUNT",
                    f"Expected {EXPECTED_PER_TIER} questions for {points}, found {count}.",
                )
            )

    # Near-duplicate check per tier in same file.
    for points, items in qtext_by_points.items():
        normalized_map = defaultdict(list)
        for qid, text in items:
            normalized_map[text].append(qid)
        for text, ids in normalized_map.items():
            if text and len(ids) > 1:
                findings.append(
                    Finding(
                        "medium",
                        path.name,
                        ", ".join(ids[:3]),
                        "EXACT_DUP_QUESTION",
                        f"Exact duplicate question text in same tier ({points}).",
                    )
                )

        # pairwise near-duplicate
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
                        Finding(
                            "low",
                            path.name,
                            f"{qid_a} ~ {qid_b}",
                            "NEAR_DUP_QUESTION",
                            f"Very similar question text detected in tier {points} (similarity {ratio:.2f}).",
                        )
                    )

    return {
        "file": path.name,
        "category_name_ar": category_name,
        "question_count": len(questions),
        "by_points": {str(k): by_points.get(k, 0) for k in EXPECTED_POINTS},
        "source_types": dict(source_types),
    }


def cross_file_duplicate_check(index: dict[str, list[tuple[str, str]]], findings: list[Finding]) -> None:
    for norm_question, refs in index.items():
        if len(refs) <= 1:
            continue
        files = sorted({f for f, _ in refs})
        ids = [qid for _, qid in refs][:5]
        findings.append(
            Finding(
                "medium",
                ", ".join(files[:3]),
                ", ".join(ids),
                "CROSS_FILE_DUP",
                f"Question appears in multiple files ({len(refs)} copies).",
            )
        )


def run(banks_dir: Path, output: Path) -> int:
    files = load_files(banks_dir)
    findings: list[Finding] = []
    file_summaries = []
    cross_index: dict[str, list[tuple[str, str]]] = defaultdict(list)

    for file_path in files:
        summary = audit_file(file_path, findings)
        file_summaries.append(summary)

        with file_path.open("r", encoding="utf-8") as f:
            payload = json.load(f)
        _, _, questions = iter_questions(payload)
        for q in questions:
            qid = str(q.get("id", "")).strip()
            text = normalize_text(str(q.get("question_ar", "")))
            if text:
                cross_index[text].append((file_path.name, qid))

    cross_file_duplicate_check(cross_index, findings)

    severity_counts = Counter(f.severity for f in findings)
    report = {
        "critic_subagent": "question_critic_subagent_v1",
        "banks_dir": str(banks_dir),
        "files_checked": len(files),
        "summary": {
            "total_findings": len(findings),
            "by_severity": {
                "high": severity_counts.get("high", 0),
                "medium": severity_counts.get("medium", 0),
                "low": severity_counts.get("low", 0),
            },
        },
        "files": file_summaries,
        "findings": [f.to_dict() for f in findings],
    }

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"[critic-subagent] Files checked: {len(files)}")
    print(f"[critic-subagent] Findings: {len(findings)}")
    print(
        "[critic-subagent] Severity: "
        f"high={severity_counts.get('high', 0)} "
        f"medium={severity_counts.get('medium', 0)} "
        f"low={severity_counts.get('low', 0)}"
    )
    print(f"[critic-subagent] Report: {output}")
    return 1 if severity_counts.get("high", 0) > 0 else 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit question bank JSON files.")
    parser.add_argument(
        "--banks-dir",
        default="Banks",
        help="Path to directory containing category-*.json files.",
    )
    parser.add_argument(
        "--output",
        default="Banks/question-critic-report.json",
        help="Path to write JSON report.",
    )
    args = parser.parse_args()
    return run(Path(args.banks_dir), Path(args.output))


if __name__ == "__main__":
    raise SystemExit(main())
