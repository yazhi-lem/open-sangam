"""Tests for the word-level etymology extraction pipeline.

Pure functions only — no network, no API key, no writes to the real corpus.
Run from backend/python/:

    pytest tests
"""

import json

import pytest

from ai import extract_etymology as pipeline

# --------------------------------------------------------------------------- #
# Fixtures: a throwaway corpus laid out like data/texts/
# --------------------------------------------------------------------------- #


def write_verse(normalized_dir, verse_id, number, word_forms=("சொல்", "வரி"), **overrides):
    verse = {
        "id": verse_id,
        "poem": normalized_dir.parent.name,
        "number": number,
        "tinai": "mullai",
        "sangamTamil": " ".join(word_forms),
        "urai": f"உரை {number}",
        "verified": False,
        "lines": [
            {
                "lineNumber": 1,
                "text": " ".join(word_forms),
                "words": [
                    {"form": form, "root": None, "urichol": None, "etymology": None, "gloss": None}
                    for form in word_forms
                ],
            }
        ],
    }
    verse.update(overrides)
    (normalized_dir / f"{verse_id}.json").write_text(
        json.dumps(verse, ensure_ascii=False), encoding="utf-8"
    )
    return verse


@pytest.fixture
def corpus(tmp_path, monkeypatch):
    texts = tmp_path / "data" / "texts"

    mullai = texts / "mullaippattu" / "normalized"
    mullai.mkdir(parents=True)
    for n in range(1, 4):
        write_verse(mullai, f"mullaippattu_{n:02d}", n)

    paripadal = texts / "paripadal" / "normalized"
    paripadal.mkdir(parents=True)
    for n in range(1, 3):
        write_verse(paripadal, f"paripadal_{n:02d}", n)
    (paripadal / "datapackage.json").write_text(
        json.dumps({"name": "open-sangam-paripadal"}), encoding="utf-8"
    )

    monkeypatch.setattr(pipeline, "STATE_FILE", tmp_path / "data" / "pipeline" / "state.json")
    # extract_etymology imports verse_files()/load_verse()/discovered_poems()
    # by reference from translate_with_gemini, which read DATA_BASE as a
    # module global at call time — so the corpus root is patched there.
    from ai import translate_with_gemini as translate_pipeline

    monkeypatch.setattr(translate_pipeline, "DATA_BASE", texts)
    return texts


def mark_annotated(texts, poem, verse_id):
    path = texts / poem / "normalized" / f"{verse_id}.json"
    verse = json.loads(path.read_text(encoding="utf-8"))
    verse["etymologyMeta"] = {"provider": "openrouter", "model": "m", "runId": "r"}
    path.write_text(json.dumps(verse, ensure_ascii=False), encoding="utf-8")


# --------------------------------------------------------------------------- #
# Corpus access
# --------------------------------------------------------------------------- #


def test_stray_datapackage_is_not_counted_as_a_verse(corpus):
    coverage = {c["poem"]: c for c in pipeline.corpus_coverage()}
    assert coverage["paripadal"]["verses"] == 2


def test_coverage_is_read_from_disk(corpus):
    mark_annotated(corpus, "mullaippattu", "mullaippattu_01")
    coverage = {c["poem"]: c for c in pipeline.corpus_coverage()}
    assert coverage["mullaippattu"]["annotated"] == 1
    assert coverage["mullaippattu"]["remaining"] == 2


def test_flatten_words_reads_across_lines():
    verse = {
        "lines": [
            {"words": [{"form": "a"}, {"form": "b"}]},
            {"words": [{"form": "c"}]},
        ]
    }
    assert [w["form"] for w in pipeline.flatten_words(verse)] == ["a", "b", "c"]


def test_a_word_with_all_null_fields_is_not_mistaken_for_unannotated(corpus):
    # A verse can be genuinely annotated (etymologyMeta present) even though
    # every word's root/urichol/etymology/gloss stayed null — a bare particle
    # can legitimately have none of those. Only etymologyMeta marks "done".
    mark_annotated(corpus, "mullaippattu", "mullaippattu_01")
    assert pipeline.verse_is_annotated({"etymologyMeta": {"runId": "r"}}) is True
    assert pipeline.verse_is_annotated({"etymologyMeta": None}) is False
    assert pipeline.verse_is_annotated({}) is False


# --------------------------------------------------------------------------- #
# Batch selection
# --------------------------------------------------------------------------- #


def test_batch_honours_limit(corpus):
    assert len(pipeline.select_batch(limit=3)) == 3


def test_batch_skips_already_annotated_verses(corpus):
    mark_annotated(corpus, "mullaippattu", "mullaippattu_02")
    ids = [verse["id"] for _, verse in pipeline.select_batch(limit=50)]
    assert "mullaippattu_02" not in ids
    assert len(ids) == 4  # 3 + 2 - the one just marked


def test_force_reselects_already_annotated_verses(corpus):
    mark_annotated(corpus, "mullaippattu", "mullaippattu_02")
    batch = pipeline.select_batch(limit=50, force=True)
    assert len(batch) == 5


def test_poem_filter_restricts_to_one_poem(corpus):
    batch = pipeline.select_batch(limit=50, poem_filter="paripadal")
    assert {verse["poem"] for _, verse in batch} == {"paripadal"}
    assert len(batch) == 2


def test_verses_without_source_text_are_skipped(corpus):
    path = corpus / "mullaippattu" / "normalized" / "mullaippattu_01.json"
    verse = json.loads(path.read_text(encoding="utf-8"))
    verse["sangamTamil"] = "   "
    path.write_text(json.dumps(verse, ensure_ascii=False), encoding="utf-8")
    ids = [v["id"] for _, v in pipeline.select_batch(limit=50)]
    assert "mullaippattu_01" not in ids


# --------------------------------------------------------------------------- #
# Prompt building
# --------------------------------------------------------------------------- #


def test_prompt_lists_every_word_and_the_exact_count():
    verse = {
        "poem": "kurunthokai",
        "number": 3,
        "sangamTamil": "தமிழ் சொல்",
        "urai": "விளக்கம்",
        "lines": [{"words": [{"form": "தமிழ்"}, {"form": "சொல்"}]}],
    }
    prompt = pipeline.build_prompt(verse)
    assert "1. தமிழ்" in prompt
    assert "2. சொல்" in prompt
    assert "exactly 2 elements" in prompt
    assert "விளக்கம்" in prompt


# --------------------------------------------------------------------------- #
# Response parsing
# --------------------------------------------------------------------------- #


def test_parse_annotations_accepts_a_clean_array():
    raw = json.dumps(
        [
            {"form": "a", "root": "a-root", "urichol": None, "etymology": "note", "gloss": "g"},
            {"form": "b", "root": None, "urichol": None, "etymology": None, "gloss": "h"},
        ]
    )
    result = pipeline.parse_annotations(raw, expected=2)
    assert result[0] == {"root": "a-root", "urichol": None, "etymology": "note", "gloss": "g"}
    assert result[1]["root"] is None


def test_parse_annotations_strips_markdown_code_fence():
    raw = '```json\n[{"root": "r", "urichol": null, "etymology": null, "gloss": "g"}]\n```'
    result = pipeline.parse_annotations(raw, expected=1)
    assert result[0]["root"] == "r"


def test_parse_annotations_treats_literal_null_string_as_none():
    raw = json.dumps([{"root": "null", "urichol": "", "etymology": "  ", "gloss": "g"}])
    result = pipeline.parse_annotations(raw, expected=1)
    assert result[0] == {"root": None, "urichol": None, "etymology": None, "gloss": "g"}


def test_parse_annotations_rejects_wrong_length():
    raw = json.dumps([{"root": "r"}])
    with pytest.raises(pipeline.EtymologyError):
        pipeline.parse_annotations(raw, expected=2)


def test_parse_annotations_rejects_non_array():
    with pytest.raises(pipeline.EtymologyError):
        pipeline.parse_annotations(json.dumps({"root": "r"}), expected=1)


def test_parse_annotations_rejects_invalid_json():
    with pytest.raises(pipeline.EtymologyError):
        pipeline.parse_annotations("not json", expected=1)


# --------------------------------------------------------------------------- #
# Applying annotations
# --------------------------------------------------------------------------- #


class FakeBackend:
    provider = "openrouter"
    model = "google/gemini-2.5-flash"


def test_apply_annotations_fills_words_and_records_provenance():
    verse = {
        "id": "x_01",
        "verified": True,
        "lines": [
            {
                "words": [
                    {"form": "a", "root": None, "urichol": None, "etymology": None, "gloss": None},
                    {"form": "b", "root": None, "urichol": None, "etymology": None, "gloss": None},
                ]
            }
        ],
    }
    annotations = [
        {"root": "a-root", "urichol": "class", "etymology": "note", "gloss": "g1"},
        {"root": None, "urichol": None, "etymology": None, "gloss": "g2"},
    ]
    result = pipeline.apply_annotations(verse, annotations, FakeBackend(), "run123")

    words = pipeline.flatten_words(result)
    assert words[0]["root"] == "a-root"
    assert words[1]["gloss"] == "g2"
    assert result["verified"] is False  # governance: AI drafts are never verified
    assert result["etymologyMeta"]["provider"] == "openrouter"
    assert result["etymologyMeta"]["promptVersion"] == pipeline.PROMPT_VERSION
    assert result["etymologyMeta"]["runId"] == "run123"
    assert result["etymologyMeta"]["wordsAnnotated"] == 2


# --------------------------------------------------------------------------- #
# Retry behaviour
# --------------------------------------------------------------------------- #


class FlakyBackend(FakeBackend):
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = 0

    def complete(self, prompt, system=None):
        self.calls += 1
        response = self.responses[self.calls - 1]
        if isinstance(response, Exception):
            raise response
        return response


def test_annotate_retries_then_succeeds(monkeypatch):
    monkeypatch.setattr(pipeline.time, "sleep", lambda _: None)
    good = json.dumps([{"root": "r", "urichol": None, "etymology": None, "gloss": "g"}])
    backend = FlakyBackend([pipeline.TranslationError("HTTP 429"), "not json", good])
    verse = {"lines": [{"words": [{"form": "x"}]}]}
    result = pipeline.annotate_once(backend, verse)
    assert result == [{"root": "r", "urichol": None, "etymology": None, "gloss": "g"}]
    assert backend.calls == 3


def test_annotate_gives_up_after_max_attempts(monkeypatch):
    monkeypatch.setattr(pipeline.time, "sleep", lambda _: None)
    backend = FlakyBackend(["not json"] * pipeline.MAX_ATTEMPTS)
    verse = {"lines": [{"words": [{"form": "x"}]}]}
    with pytest.raises(pipeline.EtymologyError):
        pipeline.annotate_once(backend, verse)
    assert backend.calls == pipeline.MAX_ATTEMPTS


def test_annotate_rejects_a_verse_with_no_words():
    with pytest.raises(pipeline.EtymologyError):
        pipeline.annotate_once(FakeBackend(), {"lines": []})


# --------------------------------------------------------------------------- #
# State document
# --------------------------------------------------------------------------- #


def test_state_counters_are_derived_from_disk_not_from_the_previous_file(corpus):
    mark_annotated(corpus, "mullaippattu", "mullaippattu_01")
    coverage = pipeline.corpus_coverage()
    stale = {"poems": {"mullaippattu": {"annotated": 999, "lastRunAt": "2020-01-01T00:00:00+00:00"}}}
    state = pipeline.build_state(coverage, "m", "openrouter", previous=stale)
    assert state["poems"]["mullaippattu"]["annotated"] == 1
    assert state["totals"]["annotated"] == 1
    assert state["poems"]["mullaippattu"]["lastRunAt"] == "2020-01-01T00:00:00+00:00"


def test_state_marks_poem_status(corpus):
    for n in range(1, 4):
        mark_annotated(corpus, "mullaippattu", f"mullaippattu_{n:02d}")
    mark_annotated(corpus, "paripadal", "paripadal_01")
    state = pipeline.build_state(pipeline.corpus_coverage(), "m", "openrouter")
    assert state["poems"]["mullaippattu"]["status"] == "complete"
    assert state["poems"]["paripadal"]["status"] == "in-progress"


def test_run_history_is_capped(corpus):
    previous = {"runs": [{"runId": str(i)} for i in range(pipeline.MAX_RUN_HISTORY + 10)]}
    state = pipeline.build_state(
        pipeline.corpus_coverage(),
        "m",
        "openrouter",
        previous=previous,
        run_record={"runId": "newest", "finishedAt": "now", "poems": ["mullaippattu"]},
    )
    assert len(state["runs"]) == pipeline.MAX_RUN_HISTORY
    assert state["runs"][-1]["runId"] == "newest"
