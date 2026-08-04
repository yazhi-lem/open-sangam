"""Tests for the phased English translation pipeline.

Pure functions only — no network, no API key, no writes to the real corpus.
Run from backend/python/:

    pytest tests
"""

import json

import pytest

from ai import translate_with_gemini as pipeline


# --------------------------------------------------------------------------- #
# Fixtures: a throwaway corpus laid out like data/texts/
# --------------------------------------------------------------------------- #


def write_verse(normalized_dir, verse_id, number, **overrides):
    verse = {
        "id": verse_id,
        "poem": normalized_dir.parent.name,
        "number": number,
        "tinai": "mullai",
        "sangamTamil": f"தமிழ் வரி {number}",
        "urai": f"உரை {number}",
        "english": None,
        "verified": False,
    }
    verse.update(overrides)
    (normalized_dir / f"{verse_id}.json").write_text(
        json.dumps(verse, ensure_ascii=False), encoding="utf-8"
    )
    return verse


@pytest.fixture
def corpus(tmp_path, monkeypatch):
    """A two-poem corpus spanning phase 1 and phase 2, plus the stray file trap."""
    texts = tmp_path / "data" / "texts"

    mullai = texts / "mullaippattu" / "normalized"
    mullai.mkdir(parents=True)
    for n in range(1, 4):
        write_verse(mullai, f"mullaippattu_{n:02d}", n)

    paripadal = texts / "paripadal" / "normalized"
    paripadal.mkdir(parents=True)
    for n in range(1, 3):
        write_verse(paripadal, f"paripadal_{n:02d}", n)
    # Real corpora have a non-verse datapackage.json sitting inside a
    # normalized/ dir (ainkurunooru does); it must never be treated as a verse.
    (paripadal / "datapackage.json").write_text(
        json.dumps({"name": "open-sangam-paripadal"}), encoding="utf-8"
    )

    monkeypatch.setattr(pipeline, "DATA_BASE", texts)
    monkeypatch.setattr(pipeline, "STATE_FILE", tmp_path / "data" / "pipeline" / "state.json")
    return texts


def fill_english(texts, poem, verse_id, text="draft"):
    path = texts / poem / "normalized" / f"{verse_id}.json"
    verse = json.loads(path.read_text(encoding="utf-8"))
    verse["english"] = text
    path.write_text(json.dumps(verse, ensure_ascii=False), encoding="utf-8")


# --------------------------------------------------------------------------- #
# Corpus access
# --------------------------------------------------------------------------- #


def test_stray_datapackage_is_not_counted_as_a_verse(corpus):
    coverage = {c["poem"]: c for c in pipeline.corpus_coverage()}
    assert coverage["paripadal"]["verses"] == 2  # not 3, despite 3 json files


def test_coverage_is_read_from_disk(corpus):
    fill_english(corpus, "mullaippattu", "mullaippattu_01")
    coverage = {c["poem"]: c for c in pipeline.corpus_coverage()}
    assert coverage["mullaippattu"]["translated"] == 1
    assert coverage["mullaippattu"]["remaining"] == 2


def test_poems_are_returned_in_phase_order(corpus):
    assert pipeline.discovered_poems() == ["mullaippattu", "paripadal"]


def test_every_phase_poem_maps_back_to_its_phase():
    for phase in pipeline.PHASES:
        for poem in phase["poems"]:
            assert pipeline.phase_for_poem(poem) == phase["phase"]
    assert pipeline.phase_for_poem("not-a-poem") is None


def test_phase_definitions_do_not_overlap():
    seen = [poem for phase in pipeline.PHASES for poem in phase["poems"]]
    assert len(seen) == len(set(seen))


# --------------------------------------------------------------------------- #
# Phase resolution
# --------------------------------------------------------------------------- #


def test_resolve_phase_starts_at_the_first_incomplete_phase(corpus):
    assert pipeline.resolve_phase(pipeline.corpus_coverage()) == 1


def test_resolve_phase_advances_when_a_phase_completes(corpus):
    for n in range(1, 4):
        fill_english(corpus, "mullaippattu", f"mullaippattu_{n:02d}")
    assert pipeline.resolve_phase(pipeline.corpus_coverage()) == 2


def test_resolve_phase_returns_none_when_everything_is_done(corpus):
    for n in range(1, 4):
        fill_english(corpus, "mullaippattu", f"mullaippattu_{n:02d}")
    for n in range(1, 3):
        fill_english(corpus, "paripadal", f"paripadal_{n:02d}")
    assert pipeline.resolve_phase(pipeline.corpus_coverage()) is None


def test_forced_phase_overrides_auto_advance(corpus):
    assert pipeline.resolve_phase(pipeline.corpus_coverage(), forced=3) == 3


# --------------------------------------------------------------------------- #
# Batch selection
# --------------------------------------------------------------------------- #


def test_batch_honours_limit(corpus):
    batch = pipeline.select_batch("english", phase=1, limit=2)
    assert len(batch) == 2


def test_batch_stays_within_the_current_phase(corpus):
    batch = pipeline.select_batch("english", phase=1, limit=50)
    assert {verse["poem"] for _, verse in batch} == {"mullaippattu"}


def test_batch_skips_verses_that_already_have_english(corpus):
    fill_english(corpus, "mullaippattu", "mullaippattu_02")
    ids = [verse["id"] for _, verse in pipeline.select_batch("english", phase=1, limit=50)]
    assert ids == ["mullaippattu_01", "mullaippattu_03"]


def test_force_reselects_already_translated_verses(corpus):
    fill_english(corpus, "mullaippattu", "mullaippattu_02")
    batch = pipeline.select_batch("english", phase=1, limit=50, force=True)
    assert len(batch) == 3


def test_poem_filter_ignores_phase_membership(corpus):
    batch = pipeline.select_batch("english", phase=1, limit=50, poem_filter="paripadal")
    assert {verse["poem"] for _, verse in batch} == {"paripadal"}
    assert len(batch) == 2  # the stray datapackage.json is excluded


def test_verses_without_source_text_are_skipped(corpus):
    path = corpus / "mullaippattu" / "normalized" / "mullaippattu_01.json"
    verse = json.loads(path.read_text(encoding="utf-8"))
    verse["sangamTamil"] = "   "
    path.write_text(json.dumps(verse, ensure_ascii=False), encoding="utf-8")
    ids = [v["id"] for _, v in pipeline.select_batch("english", phase=1, limit=50)]
    assert "mullaippattu_01" not in ids


# --------------------------------------------------------------------------- #
# Prompt building
# --------------------------------------------------------------------------- #


def test_english_prompt_includes_urai_context_when_present():
    verse = {"poem": "kurunthokai", "number": 3, "sangamTamil": "தமிழ்", "urai": "விளக்கம்"}
    prompt = pipeline.build_prompt(verse, "english")
    assert "விளக்கம்" in prompt
    assert "ISO 15919" in prompt


def test_english_prompt_omits_urai_block_when_absent():
    verse = {"poem": "kurunthokai", "number": 3, "sangamTamil": "தமிழ்", "urai": None}
    prompt = pipeline.build_prompt(verse, "english")
    assert "supporting context" not in prompt
    assert "தமிழ்" in prompt


def test_urai_prompt_does_not_feed_urai_back_to_itself():
    verse = {"poem": "kurunthokai", "number": 3, "sangamTamil": "தமிழ்", "urai": "விளக்கம்"}
    prompt = pipeline.build_prompt(verse, "urai")
    assert "விளக்கம்" not in prompt


# --------------------------------------------------------------------------- #
# Applying translations
# --------------------------------------------------------------------------- #


class FakeBackend:
    provider = "openrouter"
    model = "google/gemini-2.5-flash"


def test_applied_translation_stays_unverified_and_records_provenance():
    verse = {"id": "x_01", "verified": True}
    result = pipeline.apply_translation(verse, "english", "A draft.", FakeBackend(), "run123")
    assert result["english"] == "A draft."
    assert result["verified"] is False  # governance: AI drafts are never verified
    assert result["englishMeta"]["provider"] == "openrouter"
    assert result["englishMeta"]["model"] == "google/gemini-2.5-flash"
    assert result["englishMeta"]["promptVersion"] == pipeline.PROMPT_VERSION
    assert result["englishMeta"]["runId"] == "run123"


def test_urai_translation_does_not_write_english_provenance():
    verse = {"id": "x_01"}
    result = pipeline.apply_translation(verse, "urai", "உரை", FakeBackend(), "run123")
    assert "englishMeta" not in result


# --------------------------------------------------------------------------- #
# State document
# --------------------------------------------------------------------------- #


def test_state_counters_are_derived_from_disk_not_from_the_previous_file(corpus):
    fill_english(corpus, "mullaippattu", "mullaippattu_01")
    coverage = pipeline.corpus_coverage()
    stale = {"poems": {"mullaippattu": {"translated": 999, "lastRunAt": "2020-01-01T00:00:00+00:00"}}}
    state = pipeline.build_state(coverage, 1, "m", "openrouter", previous=stale)
    assert state["poems"]["mullaippattu"]["translated"] == 1
    assert state["totals"]["translated"] == 1
    # non-derived fields are still inherited
    assert state["poems"]["mullaippattu"]["lastRunAt"] == "2020-01-01T00:00:00+00:00"


def test_state_marks_poem_status(corpus):
    for n in range(1, 4):
        fill_english(corpus, "mullaippattu", f"mullaippattu_{n:02d}")
    fill_english(corpus, "paripadal", "paripadal_01")
    state = pipeline.build_state(pipeline.corpus_coverage(), 2, "m", "openrouter")
    assert state["poems"]["mullaippattu"]["status"] == "complete"
    assert state["poems"]["paripadal"]["status"] == "in-progress"


def test_state_is_idempotent_when_the_corpus_is_unchanged(corpus):
    coverage = pipeline.corpus_coverage()
    first = pipeline.build_state(coverage, 1, "m", "openrouter")
    second = pipeline.build_state(coverage, 1, "m", "openrouter", previous=first)
    for key in ("totals", "poems", "currentPhase", "runs"):
        assert first[key] == second[key]


def test_run_history_is_capped(corpus):
    previous = {"runs": [{"runId": str(i)} for i in range(pipeline.MAX_RUN_HISTORY + 10)]}
    state = pipeline.build_state(
        pipeline.corpus_coverage(),
        1,
        "m",
        "openrouter",
        previous=previous,
        run_record={"runId": "newest", "finishedAt": "now", "poems": ["mullaippattu"]},
    )
    assert len(state["runs"]) == pipeline.MAX_RUN_HISTORY
    assert state["runs"][-1]["runId"] == "newest"


def test_run_record_stamps_last_run_on_touched_poems(corpus):
    state = pipeline.build_state(
        pipeline.corpus_coverage(),
        1,
        "m",
        "openrouter",
        run_record={"runId": "r", "finishedAt": "2026-08-04T02:00:00+00:00", "poems": ["mullaippattu"]},
    )
    assert state["poems"]["mullaippattu"]["lastRunAt"] == "2026-08-04T02:00:00+00:00"
    assert state["poems"]["paripadal"]["lastRunAt"] is None


# --------------------------------------------------------------------------- #
# Retry behaviour
# --------------------------------------------------------------------------- #


class FlakyBackend(FakeBackend):
    def __init__(self, failures):
        self.failures = failures
        self.calls = 0

    def complete(self, prompt):
        self.calls += 1
        if self.calls <= self.failures:
            raise pipeline.TranslationError("HTTP 429")
        return "A draft translation."


def test_translate_retries_then_succeeds(monkeypatch):
    monkeypatch.setattr(pipeline.time, "sleep", lambda _: None)
    backend = FlakyBackend(failures=2)
    verse = {"poem": "p", "number": 1, "sangamTamil": "தமிழ்", "urai": None}
    assert pipeline.translate_once(backend, verse, "english") == "A draft translation."
    assert backend.calls == 3


def test_translate_gives_up_after_max_attempts(monkeypatch):
    monkeypatch.setattr(pipeline.time, "sleep", lambda _: None)
    backend = FlakyBackend(failures=99)
    verse = {"poem": "p", "number": 1, "sangamTamil": "தமிழ்", "urai": None}
    with pytest.raises(pipeline.TranslationError):
        pipeline.translate_once(backend, verse, "english")
    assert backend.calls == pipeline.MAX_ATTEMPTS


def test_an_echoed_source_verse_is_rejected(monkeypatch):
    monkeypatch.setattr(pipeline.time, "sleep", lambda _: None)

    class EchoBackend(FakeBackend):
        def complete(self, prompt):
            return "தமிழ்"

    verse = {"poem": "p", "number": 1, "sangamTamil": "தமிழ்", "urai": None}
    with pytest.raises(pipeline.TranslationError):
        pipeline.translate_once(EchoBackend(), verse, "english")


def test_an_empty_response_is_rejected(monkeypatch):
    monkeypatch.setattr(pipeline.time, "sleep", lambda _: None)

    class EmptyBackend(FakeBackend):
        def complete(self, prompt):
            return "   "

    verse = {"poem": "p", "number": 1, "sangamTamil": "தமிழ்", "urai": None}
    with pytest.raises(pipeline.TranslationError):
        pipeline.translate_once(EmptyBackend(), verse, "english")


# --------------------------------------------------------------------------- #
# Poem artifact refresh
# --------------------------------------------------------------------------- #


def test_refresh_updates_datapackage_stats(corpus):
    poem_dir = corpus / "mullaippattu"
    (poem_dir / "mullaippattu.json").write_text("[]", encoding="utf-8")
    (poem_dir / "datapackage.json").write_text(
        json.dumps({"name": "x", "stats": {"records": 0, "withUrai": 0, "withEnglish": 0}}),
        encoding="utf-8",
    )
    fill_english(corpus, "mullaippattu", "mullaippattu_01")

    pipeline.refresh_poem_artifacts("mullaippattu")

    stats = json.loads((poem_dir / "datapackage.json").read_text(encoding="utf-8"))["stats"]
    assert stats == {"records": 3, "withUrai": 3, "withEnglish": 1}
    combined = json.loads((poem_dir / "mullaippattu.json").read_text(encoding="utf-8"))
    assert [v["number"] for v in combined] == [1, 2, 3]


def test_refresh_does_not_create_artifacts_that_do_not_exist(corpus):
    pipeline.refresh_poem_artifacts("mullaippattu")
    assert not (corpus / "mullaippattu" / "mullaippattu.json").exists()
    assert not (corpus / "mullaippattu" / "datapackage.json").exists()
