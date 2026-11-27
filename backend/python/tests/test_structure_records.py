"""Guards the structural-work records harvested from Tamil Wikisource.

Structural epics (Manimekalai, Perunkathai, Kamba Ramayanam) do not fit the
idyll model: their line numbering restarts inside each chapter, so they use the
schema's third `anyOf` branch (`sectionNumber` + `structure`) and carry their
chapter tree instead of `lineStart`/`lineEnd`.

These tests pin the invariants a re-harvest must not break. Pure local check:
no network, no writes.

    cd backend/python && pytest tests/test_structure_records.py
"""

import json
from pathlib import Path

import pytest
from jsonschema import Draft7Validator

from normalizer import validate_corpus as vc

STRUCTURAL_WORKS = ["manimekalai", "perunkathai", "ramavataram"]
LEVELS = {
    "canto",
    "chapter",
    "kadai",
    "padalam",
    "ilambakam",
    "game",
    "sutra",
    "pathigam",
    "pasuram",
}


@pytest.fixture(scope="module")
def works() -> dict[str, list[dict]]:
    texts = vc.REPO_ROOT / "data" / "texts"
    out = {}
    for work in STRUCTURAL_WORKS:
        path = texts / work / f"{work}.json"
        if path.exists():
            out[work] = json.loads(path.read_text(encoding="utf-8"))
    return out


def test_structural_works_are_present(works):
    assert set(works) == set(STRUCTURAL_WORKS), "harvest output is missing a work"


def test_every_record_is_section_numbered(works):
    for work, records in works.items():
        numbers = [r["sectionNumber"] for r in records]
        assert numbers == list(range(1, len(records) + 1)), f"{work}: sectionNumber must run 1..n"


def test_structure_block_is_complete_and_uses_a_known_level(works):
    for work, records in works.items():
        for record in records:
            structure = record.get("structure")
            assert structure, f"{record['id']}: missing structure"
            assert structure["level"] in LEVELS, f"{record['id']}: bad level {structure['level']!r}"
            assert "book" in structure and "chapter" in structure, f"{record['id']}: incomplete structure"
            assert isinstance(structure["chapter"], str) and structure["chapter"].strip()


def test_epic_records_do_not_pretend_to_have_line_ranges(works):
    # lineStart/lineEnd mean whole-work line numbering. Epics restart per chapter,
    # so a range here would make validate_corpus report false gaps.
    for work, records in works.items():
        for record in records:
            assert "lineStart" not in record, f"{record['id']}: unexpected lineStart"


def test_scenes_point_inside_their_own_lines(works):
    for work, records in works.items():
        for record in records:
            scenes = record.get("scenes") or []
            if not scenes:
                continue
            line_count = len(record["lines"])
            for scene in scenes:
                assert 1 <= scene["lineNumber"] <= line_count + 1, (
                    f"{record['id']}: scene at {scene['lineNumber']} outside 1..{line_count}"
                )
                assert scene["text"].strip()
            starts = [s["lineNumber"] for s in scenes]
            assert starts == sorted(starts), f"{record['id']}: scenes out of order"


def test_verse_counts_never_exceed_their_lines(works):
    for work, records in works.items():
        for record in records:
            count = (record.get("structure") or {}).get("verseCount")
            if count is None:
                continue
            # a Tamil verse is at least two lines, so the printed count must fit
            assert count <= len(record["lines"]), f"{record['id']}: {count} verses in {len(record['lines'])} lines"


def test_records_validate_against_the_schema(works):
    validator = Draft7Validator(vc.load_schema())
    for work, records in works.items():
        for record in records:
            errors = sorted(validator.iter_errors(record), key=lambda e: list(e.absolute_path))
            assert not errors, f"{record['id']}: {errors[0].message}"


def test_records_are_still_unverified(works):
    for work, records in works.items():
        assert all(r["verified"] is False for r in records), f"{work}: nothing is scholar-verified yet"
