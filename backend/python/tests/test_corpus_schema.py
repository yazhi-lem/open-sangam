"""Validates the committed corpus against data/schema/verse_schema.json.

Runs in CI (.github/workflows/ci.yml, job `corpus-and-python`). Pure local
check: reads data/texts/*/normalized/*.json, no network, no writes.

    cd backend/python && pytest tests/test_corpus_schema.py
"""

import copy
import json

import pytest
from jsonschema import Draft7Validator
from normalizer import validate_corpus as vc


@pytest.fixture(scope="module")
def report():
    return vc.validate_corpus()


@pytest.fixture(scope="module")
def validator():
    return Draft7Validator(vc.load_schema())


def test_schema_is_valid_draft7():
    Draft7Validator.check_schema(vc.load_schema())


def test_corpus_is_not_empty(report):
    assert report.files > 2000


def test_every_record_matches_schema(report):
    assert report.schema_errors == [], "\n".join(report.schema_errors[:20])


def test_record_integrity(report):
    assert report.integrity_errors == [], "\n".join(report.integrity_errors[:20])


def test_line_gaps_match_known_list(report):
    """New, changed or fixed gaps must be recorded in known_line_gaps.json."""
    assert report.line_gaps == vc.load_known_gaps()


def test_range_issues_match_known_list(report):
    assert report.range_issues == vc.load_known_range_issues()


# --------------------------------------------------------------------------- #
# The schema must reject the mistakes it exists to catch.

ANTHOLOGY = {
    "id": "kurunthokai_001",
    "poem": "kurunthokai",
    "number": 1,
    "tinai": "kurinji",
    "sangamTamil": "செங்களம் படக் கொன்ற",
    "urai": None,
    "english": None,
    "lines": [
        {
            "lineNumber": 1,
            "text": "செங்களம் படக் கொன்ற",
            "words": [
                {
                    "form": "செங்களம்",
                    "root": None,
                    "urichol": None,
                    "etymology": None,
                    "gloss": None,
                }
            ],
        }
    ],
    "culturalNotes": [],
    "audioUrl": None,
    "source": "http://www.sangathamizh.com/",
    "verified": False,
}

SECTION = {
    **{k: v for k, v in ANTHOLOGY.items() if k != "number"},
    "id": "maduraikanchi_001",
    "poem": "maduraikanchi",
    "sectionNumber": 1,
    "lineStart": 1,
    "lineEnd": 1,
}


def errors(validator, record):
    return list(validator.iter_errors(record))


def test_valid_examples_pass(validator):
    assert errors(validator, ANTHOLOGY) == []
    assert errors(validator, SECTION) == []


@pytest.mark.parametrize(
    "field", ["id", "poem", "sangamTamil", "lines", "source", "verified"]
)
def test_required_fields(validator, field):
    record = copy.deepcopy(ANTHOLOGY)
    del record[field]
    assert errors(validator, record)


def test_needs_number_or_section_range(validator):
    record = copy.deepcopy(ANTHOLOGY)
    del record["number"]
    assert errors(validator, record)


def test_unknown_top_level_field_rejected(validator):
    record = copy.deepcopy(ANTHOLOGY)
    record["englsh"] = "typo"
    assert errors(validator, record)


def test_unknown_word_field_rejected(validator):
    record = copy.deepcopy(ANTHOLOGY)
    record["lines"][0]["words"][0]["meaning"] = "x"
    assert errors(validator, record)


def test_empty_word_form_rejected(validator):
    record = copy.deepcopy(ANTHOLOGY)
    record["lines"][0]["words"][0]["form"] = ""
    assert errors(validator, record)


def test_bad_tinai_rejected(validator):
    record = copy.deepcopy(ANTHOLOGY)
    record["tinai"] = "desert"
    assert errors(validator, record)


def test_integrity_checks_catch_id_and_numbering(tmp_path, validator):
    poem_dir = tmp_path / "kurunthokai" / "normalized"
    poem_dir.mkdir(parents=True)
    record = copy.deepcopy(ANTHOLOGY)
    record["lines"][0]["lineNumber"] = 2
    path = poem_dir / "kurunthokai_002.json"
    path.write_text(json.dumps(record, ensure_ascii=False), encoding="utf-8")

    report = vc.Report()
    vc.check_record(path, record, validator, report)
    assert any("does not match file name" in e for e in report.integrity_errors)
    assert any("lineNumber" in e for e in report.integrity_errors)


def test_line_gap_detected(tmp_path, validator):
    poem_dir = tmp_path / "maduraikanchi" / "normalized"
    poem_dir.mkdir(parents=True)
    record = copy.deepcopy(SECTION)
    record["lineEnd"] = 3  # claims 3 lines, has 1
    path = poem_dir / "maduraikanchi_001.json"
    report = vc.Report()
    vc.check_record(path, record, validator, report)
    assert report.line_gaps == {"maduraikanchi_001": 2}
