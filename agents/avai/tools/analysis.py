"""Word etymology and prosody analysis tools for Sangam Avai."""

from typing import Optional
from .corpus import _VERSE_INDEX, get_verse


def analyze_word_etymology(word: str) -> dict:
    """Analyze a Sangam Tamil word across the corpus to extract occurrences, meanings, and roots.

    Args:
        word: The Tamil word or root to analyze (e.g. 'காந்தள்' or 'சேஎய்').

    Returns:
        dict containing total occurrences, matched forms, verse instances, and glosses.
    """
    word_clean = word.strip().lower()
    occurrences = []
    
    for verse_id, verse in _VERSE_INDEX.items():
        matched_lines = []
        for line in verse.get("lines", []):
            line_text = line.get("text", "")
            if word_clean in line_text.lower():
                matched_words = [
                    w for w in line.get("words", [])
                    if word_clean in w.get("form", "").lower() or (w.get("root") and word_clean in w.get("root").lower())
                ]
                matched_lines.append({
                    "lineNumber": line.get("lineNumber"),
                    "text": line_text,
                    "matchedWords": matched_words
                })
        if matched_lines:
            occurrences.append({
                "verseId": verse_id,
                "poem": verse.get("poem"),
                "tinai": verse.get("tinai"),
                "poet": verse.get("poet"),
                "matchedLines": matched_lines,
                "uraiSnippet": (verse.get("urai") or "")[:150]
            })

    return {
        "queryWord": word,
        "totalOccurrences": len(occurrences),
        "verses": occurrences[:10]  # Cap at top 10 relevant verses
    }


def analyze_prosody(verse_id: str) -> dict:
    """Analyze the classical Tamil prosody (யாப்பிலக்கணம்) of a verse.

    Extracts meter classification (ஆசிரியப்பா/அகவற்பா, கலிப்பா, etc.), line count,
    initial alliteration (மோனை), and second-letter rhyme (எதுகை).

    Args:
        verse_id: Verse identifier (e.g. 'kurunthokai_001').

    Returns:
        dict with meter, rhyming analysis (எதுகை/மோனை), and line structure.
    """
    verse = get_verse(verse_id)
    if "error" in verse:
        return verse

    lines = verse.get("lines", [])
    line_texts = [l.get("text", "").strip() for l in lines if l.get("text", "").strip()]
    poem_name = (verse.get("poem") or "").lower()

    # Determine default meter type based on Sangam work classification
    if "kalithokai" in poem_name:
        meter = "கலிப்பா (Kalippa)"
    elif "paripadal" in poem_name:
        meter = "பரிபாடல் (Paripadal Meter)"
    else:
        meter = "ஆசிரியப்பா / அகவற்பா (Akavartpa - Standard Sangam Meter)"

    # Analyze Monai (1st letter similarity) and Etukai (2nd letter similarity)
    monai_pairs = []
    etukai_pairs = []
    
    for i in range(len(line_texts) - 1):
        line1 = line_texts[i]
        line2 = line_texts[i + 1]
        
        if line1 and line2:
            char1_1 = line1[0] if len(line1) > 0 else ""
            char2_1 = line2[0] if len(line2) > 0 else ""
            char1_2 = line1[1] if len(line1) > 1 else ""
            char2_2 = line2[1] if len(line2) > 1 else ""

            if char1_1 == char2_1 and char1_1:
                monai_pairs.append(f"Lines {i+1}-{i+2}: '{char1_1}' ({line1[:10]}... / {line2[:10]}...)")
            if char1_2 == char2_2 and char1_2:
                etukai_pairs.append(f"Lines {i+1}-{i+2}: '{char1_2}' ({line1[:10]}... / {line2[:10]}...)")

    return {
        "verseId": verse_id,
        "poem": verse.get("poem"),
        "lineCount": len(line_texts),
        "meter": meter,
        "prosodicElements": {
            "monai": monai_pairs if monai_pairs else ["No direct adjacent monai detected"],
            "etukai": etukai_pairs if etukai_pairs else ["No direct adjacent etukai detected"]
        },
        "lines": line_texts
    }
