"""Tests for normalize_all.py's AI-field preservation on re-normalize.

Pure functions only — no network, no writes to the real corpus.
Run from backend/python/:

    pytest tests
"""

import json

import pytest

from normalizer import normalize_all as pipeline

POEM = {
    "id": "mullaippattu",
    "title_ta": "முல்லைப்பாட்டு",
    "title_en": "Mullaippattu",
    "collection": "8thokai",
    "index_url": "http://example.com/mullaippattu.html",
    "num_digits": 2,
}


def raw_record(number=1, sangam="தமிழ் வரி"):
    return {"number": number, "sangamTamil": sangam, "source": "sangathamizh.com"}


# --------------------------------------------------------------------------- #
# merge_generated_fields
# --------------------------------------------------------------------------- #


def test_merge_is_a_noop_when_nothing_exists_yet():
    record = pipeline.normalize_record(raw_record(), POEM)
    merged = pipeline.merge_generated_fields(dict(record), None)
    assert merged == record


def test_merge_preserves_english_that_raw_never_carries():
    record = pipeline.normalize_record(raw_record(), POEM)
    existing = dict(record)
    existing["english"] = "A draft translation."
    existing["englishMeta"] = {"provider": "openrouter", "runId": "r1"}

    merged = pipeline.merge_generated_fields(dict(record), existing)
    assert merged["english"] == "A draft translation."
    assert merged["englishMeta"] == {"provider": "openrouter", "runId": "r1"}


def test_merge_preserves_yazhi_urai_that_raw_never_carries():
    record = pipeline.normalize_record(raw_record(), POEM)
    existing = dict(record)
    existing["yazhi_urai"] = "எளிய தமிழ்."
    existing["yazhi_uraiMeta"] = {"provider": "openrouter", "runId": "r1"}

    merged = pipeline.merge_generated_fields(dict(record), existing)
    assert merged["yazhi_urai"] == "எளிய தமிழ்."
    assert merged["yazhi_uraiMeta"] == {"provider": "openrouter", "runId": "r1"}


def test_merge_prefers_a_fresh_non_empty_urai_from_raw():
    raw = raw_record()
    raw["urai"] = "புதிய உரை"
    record = pipeline.normalize_record(raw, POEM)
    existing = dict(record)
    existing["urai"] = "old"

    merged = pipeline.merge_generated_fields(dict(record), existing)
    assert merged["urai"] == "புதிய உரை"


def test_merge_falls_back_to_existing_urai_when_raw_has_none():
    record = pipeline.normalize_record(raw_record(), POEM)
    assert record.get("urai") is None
    existing = dict(record)
    existing["urai"] = "AI-drafted urai raw/ never had"

    merged = pipeline.merge_generated_fields(dict(record), existing)
    assert merged["urai"] == "AI-drafted urai raw/ never had"


def test_merge_keeps_verified_true_once_a_scholar_has_reviewed():
    record = pipeline.normalize_record(raw_record(), POEM)
    existing = dict(record)
    existing["verified"] = True

    merged = pipeline.merge_generated_fields(dict(record), existing)
    assert merged["verified"] is True


def test_merge_carries_etymology_forward_by_word_position():
    raw = raw_record(sangam="தமிழ் சொல்")
    record = pipeline.normalize_record(raw, POEM)
    existing = json.loads(json.dumps(record))  # deep copy
    existing["etymologyMeta"] = {"provider": "openrouter", "runId": "r1", "wordsAnnotated": 2}
    existing["lines"][0]["words"][0]["root"] = "தமிழ்-root"
    existing["lines"][0]["words"][1]["gloss"] = "word"

    merged = pipeline.merge_generated_fields(dict(record), existing)
    words = merged["lines"][0]["words"]
    assert words[0]["root"] == "தமிழ்-root"
    assert words[1]["gloss"] == "word"
    assert merged["etymologyMeta"]["runId"] == "r1"


def test_merge_drops_etymology_when_word_count_no_longer_matches():
    raw = raw_record(sangam="தமிழ் சொல்")
    record = pipeline.normalize_record(raw, POEM)
    existing = json.loads(json.dumps(record))
    existing["etymologyMeta"] = {"provider": "openrouter", "runId": "r1"}
    existing["lines"][0]["words"][0]["root"] = "தமிழ்-root"

    # raw/ now has an extra word — a source-text correction — so the old
    # per-word annotations no longer line up positionally.
    new_raw = raw_record(sangam="தமிழ் புதிய சொல்")
    new_record = pipeline.normalize_record(new_raw, POEM)

    merged = pipeline.merge_generated_fields(new_record, existing)
    assert "etymologyMeta" not in merged
    assert all(w["root"] is None for w in merged["lines"][0]["words"])


# --------------------------------------------------------------------------- #
# normalize_poem — end to end, on a throwaway corpus
# --------------------------------------------------------------------------- #


@pytest.fixture
def corpus(tmp_path, monkeypatch):
    texts = tmp_path / "data" / "texts"
    (texts / "mullaippattu" / "raw").mkdir(parents=True)
    monkeypatch.setattr(pipeline, "DATA_BASE", texts)
    return texts


def write_raw(texts, number, **fields):
    raw = raw_record(number)
    raw.update(fields)
    path = texts / "mullaippattu" / "raw" / f"{number:04d}.json"
    path.write_text(json.dumps(raw, ensure_ascii=False), encoding="utf-8")


def test_renormalize_preserves_english_and_etymology_on_disk(corpus):
    write_raw(corpus, 1)
    pipeline.normalize_poem(POEM)

    norm_path = corpus / "mullaippattu" / "normalized" / "mullaippattu_01.json"
    record = json.loads(norm_path.read_text(encoding="utf-8"))
    record["english"] = "A draft translation."
    record["englishMeta"] = {"provider": "openrouter", "runId": "r1"}
    record["etymologyMeta"] = {"provider": "openrouter", "runId": "r1"}
    record["lines"][0]["words"][0]["root"] = "root-form"
    norm_path.write_text(json.dumps(record, ensure_ascii=False), encoding="utf-8")

    # Re-run the normalizer against the same raw/ input.
    pipeline.normalize_poem(POEM)

    result = json.loads(norm_path.read_text(encoding="utf-8"))
    assert result["english"] == "A draft translation."
    assert result["englishMeta"]["runId"] == "r1"
    assert result["lines"][0]["words"][0]["root"] == "root-form"

    combined = json.loads((corpus / "mullaippattu" / "mullaippattu.json").read_text(encoding="utf-8"))
    assert combined[0]["english"] == "A draft translation."
