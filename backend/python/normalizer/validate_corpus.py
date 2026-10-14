"""
validate_corpus.py
------------------
Validates every normalized corpus record (data/texts/<poem>/normalized/*.json)
against data/schema/verse_schema.json and runs integrity checks the JSON
Schema cannot express:

  * the record id equals the file name and starts with the poem directory name
  * lines[].lineNumber runs 1..n inside each record
  * idyll sections are contiguous (next lineStart == previous lineEnd + 1)
  * line coverage: lineEnd - lineStart + 1 == len(lines), except for the
    known upstream source gaps listed in data/schema/known_line_gaps.json

Pure local check: no network, no writes. Used by
backend/python/tests/test_corpus_schema.py (CI) and runnable by hand:

    cd backend/python
    python -m normalizer.validate_corpus            # summary report
    python -m normalizer.validate_corpus --gaps     # also list every line gap
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from jsonschema import Draft7Validator

REPO_ROOT = Path(__file__).resolve().parents[3]
DATA_TEXTS = REPO_ROOT / "data" / "texts"
SCHEMA_PATH = REPO_ROOT / "data" / "schema" / "verse_schema.json"
KNOWN_GAPS_PATH = REPO_ROOT / "data" / "schema" / "known_line_gaps.json"


@dataclass
class Report:
    files: int = 0
    schema_errors: list[str] = field(default_factory=list)
    integrity_errors: list[str] = field(default_factory=list)
    # record id -> number of lines missing versus lineStart..lineEnd
    line_gaps: dict[str, int] = field(default_factory=dict)
    # record id -> "starts at N, expected M" for idyll sections whose range
    # overlaps or skips the previous section (upstream heading errors)
    range_issues: dict[str, str] = field(default_factory=dict)

    @property
    def ok(self) -> bool:
        return not self.schema_errors and not self.integrity_errors


def load_schema() -> dict[str, Any]:
    schema: dict[str, Any] = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    return schema


def _load_known() -> dict[str, Any]:
    if not KNOWN_GAPS_PATH.exists():
        return {}
    known: dict[str, Any] = json.loads(KNOWN_GAPS_PATH.read_text(encoding="utf-8"))
    return known


def load_known_gaps() -> dict[str, int]:
    return {k: int(v) for k, v in _load_known().get("gaps", {}).items()}


def load_known_range_issues() -> dict[str, str]:
    return {k: str(v) for k, v in _load_known().get("rangeIssues", {}).items()}


def record_files(texts_dir: Path = DATA_TEXTS) -> list[Path]:
    return sorted(texts_dir.glob("*/normalized/*.json"))


def check_record(
    path: Path, record: dict[str, Any], validator: Draft7Validator, report: Report
) -> None:
    rel = path.relative_to(REPO_ROOT) if path.is_relative_to(REPO_ROOT) else path
    for err in sorted(
        validator.iter_errors(record), key=lambda e: list(e.absolute_path)
    ):
        where = "/".join(str(p) for p in err.absolute_path) or "<record>"
        report.schema_errors.append(f"{rel}: {where}: {err.message[:200]}")

    rec_id = record.get("id")
    poem_dir = path.parent.parent.name
    if rec_id != path.stem:
        report.integrity_errors.append(
            f"{rel}: id {rec_id!r} does not match file name {path.stem!r}"
        )
    if record.get("poem") != poem_dir:
        report.integrity_errors.append(
            f"{rel}: poem {record.get('poem')!r} does not match directory {poem_dir!r}"
        )

    lines = record.get("lines") or []
    numbers = [ln.get("lineNumber") for ln in lines if isinstance(ln, dict)]
    if numbers != list(range(1, len(numbers) + 1)):
        report.integrity_errors.append(
            f"{rel}: lines[].lineNumber is not 1..{len(numbers)}"
        )

    if "lineStart" in record and "lineEnd" in record:
        start, end = record["lineStart"], record["lineEnd"]
        if start > end:
            report.integrity_errors.append(f"{rel}: lineStart {start} > lineEnd {end}")
        else:
            missing = (end - start + 1) - len(lines)
            if missing != 0:
                report.line_gaps[str(rec_id)] = missing


def check_section_continuity(
    sections: dict[str, list[dict[str, Any]]], report: Report
) -> None:
    for recs in sections.values():
        recs = sorted(recs, key=lambda r: r["sectionNumber"])
        prev_end = 0
        for rec in recs:
            if rec["lineStart"] != prev_end + 1:
                report.range_issues[str(rec.get("id"))] = (
                    f"starts at line {rec['lineStart']}, expected {prev_end + 1}"
                )
            prev_end = rec["lineEnd"]


def validate_corpus(texts_dir: Path = DATA_TEXTS) -> Report:
    validator = Draft7Validator(load_schema())
    report = Report()
    sections: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for path in record_files(texts_dir):
        report.files += 1
        try:
            record = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            report.schema_errors.append(f"{path}: invalid JSON: {exc}")
            continue
        check_record(path, record, validator, report)
        if (
            isinstance(record.get("sectionNumber"), int)
            and "lineStart" in record
            and "lineEnd" in record
        ):
            sections[record.get("poem", path.parent.parent.name)].append(record)
    check_section_continuity(sections, report)
    return report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Validate the Open Sangam corpus against verse_schema.json"
    )
    parser.add_argument(
        "--gaps", action="store_true", help="list every section with missing lines"
    )
    args = parser.parse_args(argv)

    report = validate_corpus()
    known = load_known_gaps()
    new_gaps = {k: v for k, v in report.line_gaps.items() if known.get(k) != v}
    fixed_gaps = sorted(set(known) - set(report.line_gaps))
    known_ranges = load_known_range_issues()
    new_ranges = {
        k: v for k, v in report.range_issues.items() if known_ranges.get(k) != v
    }
    fixed_ranges = sorted(set(known_ranges) - set(report.range_issues))

    by_poem: dict[str, list[int]] = defaultdict(list)
    for rec_id, missing in report.line_gaps.items():
        by_poem[rec_id.rsplit("_", 1)[0]].append(missing)

    print(f"Records checked: {report.files}")
    print(f"Schema errors:    {len(report.schema_errors)}")
    print(f"Integrity errors: {len(report.integrity_errors)}")
    print(
        f"Sections with missing lines: {len(report.line_gaps)} "
        f"({sum(report.line_gaps.values())} lines; known {len(known)}, new/changed {len(new_gaps)}, fixed {len(fixed_gaps)})"
    )
    print(
        f"Sections whose line range overlaps/skips the previous one: {len(report.range_issues)} "
        f"(known {len(known_ranges)}, new/changed {len(new_ranges)}, fixed {len(fixed_ranges)})"
    )
    for poem, gaps in sorted(by_poem.items()):
        print(f"  {poem}: {len(gaps)} sections, {sum(gaps)} lines missing")
    if args.gaps:
        for rec_id, missing in sorted(report.line_gaps.items()):
            print(f"    {rec_id}: {missing}")
    for line in (report.schema_errors + report.integrity_errors)[:50]:
        print("ERROR", line)
    for rec_id, missing in sorted(new_gaps.items()):
        print(
            f"ERROR new or changed line gap {rec_id}: {missing} (update data/schema/known_line_gaps.json if intended)"
        )
    for rec_id in fixed_gaps:
        print(
            f"ERROR gap fixed for {rec_id}: remove it from data/schema/known_line_gaps.json"
        )
    for rec_id, msg in sorted(new_ranges.items()):
        print(
            f"ERROR new or changed range issue {rec_id}: {msg} (update rangeIssues in known_line_gaps.json if intended)"
        )
    for rec_id in fixed_ranges:
        print(
            f"ERROR range issue fixed for {rec_id}: remove it from rangeIssues in known_line_gaps.json"
        )
    clean = not (new_gaps or fixed_gaps or new_ranges or fixed_ranges)
    return 0 if report.ok and clean else 1


if __name__ == "__main__":
    sys.exit(main())
