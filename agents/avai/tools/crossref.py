"""Parallel verse discovery and intertextuality tools for Sangam Avai."""

from typing import Optional
from .corpus import _VERSE_INDEX, get_verse


def find_parallel_verses(verse_id: str, limit: int = 5) -> list[dict]:
    """Find parallel verses sharing the same tiṇai, poet, or thematic keywords.

    Args:
        verse_id: Target verse identifier (e.g. 'kurunthokai_001').
        limit: Maximum number of parallel verses to return (default 5).

    Returns:
        list of dicts containing parallel verse metadata and match reason.
    """
    target = get_verse(verse_id)
    if "error" in target:
        return [target]

    target_tinai = target.get("tinai")
    target_poet = target.get("poet")
    target_text = (target.get("sangamTamil") or "").lower()
    
    # Extract candidate keywords (words longer than 3 chars)
    words = [w.strip(",.-! ") for w in target_text.split() if len(w.strip(",.-! ")) > 3]

    parallels = []
    for vid, verse in _VERSE_INDEX.items():
        if vid == verse_id:
            continue
            
        score = 0
        reasons = []

        # Tiṇai match
        if target_tinai and target_tinai != "unknown" and verse.get("tinai") == target_tinai:
            score += 3
            reasons.append(f"Matching tiṇai: {target_tinai}")

        # Poet match
        if target_poet and verse.get("poet") == target_poet:
            score += 4
            reasons.append(f"Same poet: {target_poet}")

        # Keyword / vocabulary overlap
        v_text = (verse.get("sangamTamil") or "").lower()
        matched_words = [w for w in words if w in v_text]
        if matched_words:
            score += len(matched_words) * 2
            reasons.append(f"Shared words: {', '.join(matched_words[:3])}")

        if score > 0:
            parallels.append({
                "verseId": vid,
                "poem": verse.get("poem"),
                "number": verse.get("number"),
                "tinai": verse.get("tinai"),
                "poet": verse.get("poet"),
                "score": score,
                "reasons": reasons,
                "sangamTamilSnippet": (verse.get("sangamTamil") or "")[:100]
            })

    # Sort by relevance score descending
    parallels.sort(key=lambda x: x["score"], reverse=True)
    return parallels[:limit]
