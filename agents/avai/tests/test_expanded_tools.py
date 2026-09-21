"""Tests for expanded tools (etymology, prosody, colophon metadata, parallel verses)."""

import pytest
from avai.tools import (
    analyze_word_etymology,
    analyze_prosody,
    get_colophon_metadata,
    find_parallel_verses,
)


def test_analyze_word_etymology():
    result = analyze_word_etymology("காந்தள்")
    assert result["queryWord"] == "காந்தள்"
    assert isinstance(result["totalOccurrences"], int)
    assert isinstance(result["verses"], list)
    if result["totalOccurrences"] > 0:
        first = result["verses"][0]
        assert "verseId" in first
        assert "matchedLines" in first


def test_analyze_prosody_valid():
    result = analyze_prosody("kurunthokai_001")
    assert "error" not in result
    assert result["verseId"] == "kurunthokai_001"
    assert result["poem"] == "kurunthokai"
    assert result["lineCount"] > 0
    assert "meter" in result
    assert "monai" in result["prosodicElements"]
    assert "etukai" in result["prosodicElements"]


def test_analyze_prosody_invalid():
    result = analyze_prosody("nonexistent_verse_9999")
    assert "error" in result


def test_get_colophon_metadata_valid():
    result = get_colophon_metadata("kurunthokai_001")
    assert "error" not in result
    assert result["verseId"] == "kurunthokai_001"
    assert result["poem"] == "kurunthokai"
    assert result["poet"] == "திப்புத் தோளார்."
    assert result["tinai"] == "kurinji"
    assert "culturalNotes" in result


def test_get_colophon_metadata_invalid():
    result = get_colophon_metadata("invalid_id_123")
    assert "error" in result


def test_find_parallel_verses():
    results = find_parallel_verses("kurunthokai_001", limit=3)
    assert isinstance(results, list)
    assert len(results) <= 3
    if results:
        first = results[0]
        assert "verseId" in first
        assert first["verseId"] != "kurunthokai_001"
        assert "score" in first
        assert "reasons" in first
