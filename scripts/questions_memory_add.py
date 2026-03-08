#!/usr/bin/env python3
"""
Append a feedback rule to subagent memory.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Add a feedback rule for question subagents.")
    parser.add_argument("rule", help="Rule text to store in feedback memory.")
    parser.add_argument("--source", default="manual_feedback", help="Rule source label.")
    parser.add_argument("--memory-file", default="subagents/memory/feedback_memory.jsonl", help="Memory file path.")
    args = parser.parse_args()

    path = Path(args.memory_file)
    path.parent.mkdir(parents=True, exist_ok=True)
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "rule": args.rule.strip(),
        "source": args.source.strip(),
    }
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    print(f"[memory] Added rule to {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
