"""Tests for the verse vectorization pipeline.

Pure functions and a real (in-memory) Chroma collection — no network, no API
key, no writes to the real corpus. Run from backend/python/:

    pytest tests
"""

import json

import chromadb
import pytest

from ai import vectorize as pipeline

# --------------------------------------------------------------------------- #
# Fixtures
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
    texts = tmp_path / "data" / "texts"
    mullai = texts / "mullaippattu" / "normalized"
    mullai.mkdir(parents=True)
    for n in range(1, 4):
        write_verse(mullai, f"mullaippattu_{n:02d}", n)

    from ai import translate_with_gemini as translate_pipeline

    monkeypatch.setattr(translate_pipeline, "DATA_BASE", texts)
    monkeypatch.setattr(pipeline, "EXPORT_DIR", tmp_path / "data" / "knowledge" / "vectors")
    monkeypatch.setattr(pipeline, "STATE_FILE", tmp_path / "data" / "pipeline" / "vectorize-state.json")
    return texts


@pytest.fixture
def collection(tmp_path):
    client = chromadb.PersistentClient(path=str(tmp_path / "chroma"))
    return client.get_or_create_collection("test_verses")


def upsert_fake(collection, verse_id, poem="mullaippattu", number=1, dims=4):
    collection.upsert(
        ids=[verse_id],
        embeddings=[[0.1] * dims],
        documents=[f"Tamil: fake {verse_id}"],
        metadatas=[{"poem": poem, "number": number, "tinai": "mullai"}],
    )


# --------------------------------------------------------------------------- #
# Text / metadata building
# --------------------------------------------------------------------------- #


def test_build_embed_text_labels_and_joins_present_fields():
    verse = {"sangamTamil": "தமிழ்", "urai": "உரை", "english": "English"}
    text = pipeline.build_embed_text(verse)
    assert text == "Tamil: தமிழ்\nUrai: உரை\nEnglish: English"


def test_build_embed_text_omits_empty_fields():
    verse = {"sangamTamil": "தமிழ்", "urai": None, "english": ""}
    assert pipeline.build_embed_text(verse) == "Tamil: தமிழ்"


def test_build_metadata_defaults_tinai_to_unknown():
    verse = {"poem": "p", "number": 3}
    assert pipeline.build_metadata(verse) == {"poem": "p", "number": 3, "tinai": "unknown"}


# --------------------------------------------------------------------------- #
# indexed_ids / select_batch
# --------------------------------------------------------------------------- #


def test_indexed_ids_is_empty_for_a_fresh_collection(collection):
    assert pipeline.indexed_ids(collection) == set()


def test_indexed_ids_filters_by_poem(collection):
    upsert_fake(collection, "mullaippattu_01", poem="mullaippattu")
    upsert_fake(collection, "paripadal_01", poem="paripadal")
    assert pipeline.indexed_ids(collection, "mullaippattu") == {"mullaippattu_01"}
    assert pipeline.indexed_ids(collection) == {"mullaippattu_01", "paripadal_01"}


def test_select_batch_skips_already_indexed_verses(corpus, collection):
    upsert_fake(collection, "mullaippattu_02")
    ids = [verse_id for verse_id, _ in pipeline.select_batch(collection, limit=50)]
    assert ids == ["mullaippattu_01", "mullaippattu_03"]


def test_select_batch_force_reselects_everything(corpus, collection):
    upsert_fake(collection, "mullaippattu_02")
    batch = pipeline.select_batch(collection, limit=50, force=True)
    assert len(batch) == 3


def test_select_batch_honours_limit(corpus, collection):
    assert len(pipeline.select_batch(collection, limit=2)) == 2


def test_select_batch_skips_verses_with_no_embeddable_text(corpus, collection):
    path = corpus / "mullaippattu" / "normalized" / "mullaippattu_01.json"
    verse = json.loads(path.read_text(encoding="utf-8"))
    verse["sangamTamil"] = ""
    verse["urai"] = None
    verse["english"] = None
    path.write_text(json.dumps(verse, ensure_ascii=False), encoding="utf-8")
    ids = [verse_id for verse_id, _ in pipeline.select_batch(collection, limit=50)]
    assert "mullaippattu_01" not in ids


# --------------------------------------------------------------------------- #
# export_poem — the downloadable artifact
# --------------------------------------------------------------------------- #


def test_export_poem_writes_one_json_line_per_verse(corpus, collection):
    upsert_fake(collection, "mullaippattu_01", number=1, dims=3)
    upsert_fake(collection, "mullaippattu_02", number=2, dims=3)

    count = pipeline.export_poem(collection, "mullaippattu")
    assert count == 2

    out = pipeline.EXPORT_DIR / "mullaippattu.jsonl"
    lines = out.read_text(encoding="utf-8").strip().splitlines()
    assert len(lines) == 2
    rows = [json.loads(line) for line in lines]
    assert [r["id"] for r in rows] == ["mullaippattu_01", "mullaippattu_02"]
    assert rows[0]["dims"] == 3
    assert rows[0]["model"] == pipeline.EMBED_MODEL


def test_export_poem_rewrites_rather_than_appends(corpus, collection):
    upsert_fake(collection, "mullaippattu_01")
    pipeline.export_poem(collection, "mullaippattu")
    upsert_fake(collection, "mullaippattu_02")
    pipeline.export_poem(collection, "mullaippattu")

    out = pipeline.EXPORT_DIR / "mullaippattu.jsonl"
    rows = [json.loads(line) for line in out.read_text(encoding="utf-8").strip().splitlines()]
    assert len(rows) == 2  # not 3 — the second call rewrote, didn't append


def test_export_poem_is_a_noop_for_an_unindexed_poem(corpus, collection):
    assert pipeline.export_poem(collection, "mullaippattu") == 0
    assert not (pipeline.EXPORT_DIR / "mullaippattu.jsonl").exists()


# --------------------------------------------------------------------------- #
# Retry behaviour
# --------------------------------------------------------------------------- #


class FlakyBackend:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = 0

    def embed(self, text):
        self.calls += 1
        response = self.responses[self.calls - 1]
        if isinstance(response, Exception):
            raise response
        return response


def test_embed_once_retries_then_succeeds(monkeypatch):
    monkeypatch.setattr(pipeline.time, "sleep", lambda _: None)
    backend = FlakyBackend([pipeline.TranslationError("HTTP 429"), [0.1, 0.2]])
    assert pipeline.embed_once(backend, "x") == [0.1, 0.2]
    assert backend.calls == 2


def test_embed_once_gives_up_after_max_attempts(monkeypatch):
    monkeypatch.setattr(pipeline.time, "sleep", lambda _: None)
    backend = FlakyBackend([pipeline.TranslationError("HTTP 500")] * pipeline.MAX_ATTEMPTS)
    with pytest.raises(pipeline.TranslationError):
        pipeline.embed_once(backend, "x")
    assert backend.calls == pipeline.MAX_ATTEMPTS


# --------------------------------------------------------------------------- #
# State
# --------------------------------------------------------------------------- #


def test_write_state_appends_a_run_and_caps_history(corpus):
    for i in range(pipeline.MAX_RUN_HISTORY + 5):
        pipeline.write_state({"runId": str(i)})
    state = pipeline.load_state()
    assert len(state["runs"]) == pipeline.MAX_RUN_HISTORY
    assert state["runs"][-1]["runId"] == str(pipeline.MAX_RUN_HISTORY + 4)
