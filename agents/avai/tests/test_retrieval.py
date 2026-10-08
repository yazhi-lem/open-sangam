"""Tests for line-level passage retrieval (tools/retrieval.py).

Pure local: reads the committed corpus, no network, no model calls.
"""

import socket

import pytest

from avai.tools.retrieval import BM25Index, graphemes, retrieve_passages, tokenize


def test_exact_line_returns_its_source():
    results = retrieve_passages("வல்வில் ஓரி கொல்லி குடவரை", limit=5)
    assert results, "expected at least one passage"
    top = results[0]
    assert top["source_id"] == "kurunthokai_100:5"
    assert top["verse_id"] == "kurunthokai_100"
    assert top["field"] == "sangam"
    assert top["line"] == 5
    assert "ஓரி" in top["text"]


def test_inflected_query_still_finds_line():
    # "கொல்லியின்" is not in the corpus line; the prefix stem must match "கொல்லி".
    results = retrieve_passages("ஓரியின் கொல்லியின் குடவரை", limit=10)
    assert "kurunthokai_100:5" in {r["source_id"] for r in results}


def test_idyll_section_reports_whole_poem_line():
    results = retrieve_passages("வானி யைந்த இரு முந்நீர்ப்", poem="maduraikanchi", limit=3)
    top = results[0]
    assert top["verse_id"] == "maduraikanchi_007"
    assert top["line"] == 1
    assert top["poem_line"] == 75  # section 7 starts at line 75


def test_poem_filter():
    results = retrieve_passages("அருவி", poem="kurunthokai", limit=20)
    assert results
    assert all(r["poem"] == "kurunthokai" for r in results)


def test_every_result_has_provenance():
    for r in retrieve_passages("யானை மலை", limit=20):
        assert r["source_id"].startswith(r["verse_id"] + ":")
        assert r["field"] in {"sangam", "colophon", "urai", "english"}
        assert isinstance(r["draft"], bool)
        assert r["score"] > 0


def test_commentary_is_marked_draft_until_verified():
    results = retrieve_passages("அருவி", limit=50)
    commentary = [r for r in results if r["field"] != "sangam"]
    # No record is scholar-verified yet, so all commentary must be flagged.
    assert all(r["draft"] for r in commentary)


@pytest.mark.parametrize("query", ["", "   ", "!!!"])
def test_empty_or_symbol_query_returns_nothing(query):
    assert retrieve_passages(query) == []


def test_limit_is_clamped():
    assert len(retrieve_passages("அருவி", limit=500)) <= 20
    assert len(retrieve_passages("அருவி", limit=0)) <= 1


def test_ranking_is_deterministic():
    a = [r["source_id"] for r in retrieve_passages("காந்தள் வேலி", limit=10)]
    b = [r["source_id"] for r in retrieve_passages("காந்தள் வேலி", limit=10)]
    assert a == b


def test_retrieval_makes_no_network_calls(monkeypatch):
    def refuse(*args, **kwargs):
        raise AssertionError("retrieval must not open network connections")

    monkeypatch.setattr(socket, "create_connection", refuse)
    monkeypatch.setattr(socket.socket, "connect", refuse)
    assert retrieve_passages("காந்தள்", limit=3)


def test_graphemes_keep_vowel_signs_and_pulli_with_their_letter():
    assert graphemes("கொல்லியின்") == ["கொ", "ல்", "லி", "யி", "ன்"]
    assert graphemes("ஔவை") == ["ஔ", "வை"]


def test_tokenize_adds_grapheme_prefix_stems():
    assert tokenize("கொல்லியின்") == ["கொல்லியின்", "~கொல்", "~கொல்லி"]
    assert tokenize("ஓரி") == ["ஓரி", "~ஓரி"]
    assert tokenize("Kapilar") == ["kapilar", "~ka", "~kap"]


def test_bm25_prefers_rarer_terms():
    passages = [
        {"text": "யானை மலை", "poem": "x"},
        {"text": "யானை", "poem": "x"},
        {"text": "யானை காந்தள்", "poem": "x"},
    ]
    index = BM25Index(passages)
    ranked = index.search("காந்தள் யானை", limit=3)
    assert ranked[0][1] == 2


def test_poet_colophon_line_is_labelled():
    results = retrieve_passages("கபிலர்", poem="kurunthokai", limit=20)
    colophon = [r for r in results if r["source_id"] == "kurunthokai_100:8"]
    assert colophon and colophon[0]["field"] == "colophon"
