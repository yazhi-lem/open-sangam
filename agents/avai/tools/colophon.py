"""Colophon and historical metadata lookup tools for Sangam Avai."""

from .corpus import get_verse


def get_colophon_metadata(verse_id: str) -> dict:
    """Extract colophon details (கொளு), author (பாடியோர்), patron (பாடப்பட்டோர்), and cultural notes for a verse.

    Args:
        verse_id: Verse identifier (e.g. 'kurunthokai_001').

    Returns:
        dict containing poet, poem, tinai, colophon annotations, and source references.
    """
    verse = get_verse(verse_id)
    if "error" in verse:
        return verse

    poet = verse.get("poet") or "Unknown Sangam Poet"
    poem = verse.get("poem") or ""
    tinai = verse.get("tinai") or "unknown"
    cultural_notes = verse.get("culturalNotes") or []
    source = verse.get("source") or ""
    number = verse.get("number")

    return {
        "verseId": verse_id,
        "poem": poem,
        "verseNumber": number,
        "poet": poet,
        "tinai": tinai,
        "culturalNotes": cultural_notes,
        "source": source,
        "verified": verse.get("verified", False),
        "hasAudio": verse.get("audioUrl") is not None
    }
