"""Line-level passage retrieval over the Open Sangam corpus.

Pulavar needs passages *with their source ids* so every claim can cite
`<verse_id>:<line>`. The older `search_verses` tool only does whole-query
substring matching, so a natural question ("யாழ் பற்றிய பாடல்கள்") returns
nothing unless the exact phrase occurs.

This module builds an in-memory BM25 index over:
  * every line of every record (field "sangam"), and
  * each record's prose urai and English (fields "urai" / "english").

Design constraints (Sovereignty Rule, Guardrail Pattern):
  * Pure Python, no network, no embeddings API, no foreign model calls.
  * Deterministic: same corpus + query → same ranking.
  * Every passage carries its provenance: verse id, line number in the record,
    whole-poem line number for idyll sections, field, and whether the text is
    an unverified draft (`verified` false, or AI provenance present).

Tamil words are heavily inflected (agglutinative), so each token is indexed
whole and as prefix "stems" of 2 and 3 Tamil grapheme clusters (a consonant
plus its vowel sign or pulli counts as one letter, so a stem never splits
கொ into க + ொ). This is a deliberately simple, explainable baseline; swap in a Tamil morphological
analyser or a locally hosted embedding model later without changing the
passage contract.
"""

from __future__ import annotations

import math
import re
from collections import Counter, defaultdict
from functools import lru_cache
from typing import Any, Optional

from .corpus import _VERSE_INDEX

STEM_GRAPHEMES = (2, 3)
K1 = 1.5
B = 0.75

_TOKEN_RE = re.compile(r"[\u0B80-\u0BFFa-zA-Z]+")
# Tamil dependent vowel signs, pulli (U+0BCD) and the au length mark (U+0BD7)
# attach to the preceding letter; they never start a grapheme cluster.
_TAMIL_COMBINING = set(range(0x0BBE, 0x0BCE)) | {0x0BD7}


def graphemes(word: str) -> list[str]:
    """Split a word into Tamil grapheme clusters (letters as a reader sees them)."""
    clusters: list[str] = []
    for ch in word:
        if clusters and ord(ch) in _TAMIL_COMBINING:
            clusters[-1] += ch
        else:
            clusters.append(ch)
    return clusters


def tokenize(text: str) -> list[str]:
    """Split Tamil/Latin text into lowercase word tokens plus prefix stems."""
    terms: list[str] = []
    for tok in _TOKEN_RE.findall(text or ""):
        tok = tok.lower()
        terms.append(tok)
        letters = graphemes(tok)
        for n in STEM_GRAPHEMES:
            if len(letters) >= n:
                terms.append("~" + "".join(letters[:n]))
    return terms


def _is_draft(verse: dict[str, Any], field: str) -> bool:
    if not verse.get("verified", False):
        return True
    meta_key = {"english": "englishMeta", "urai": "uraiMeta"}.get(field)
    return bool(meta_key and verse.get(meta_key))


def _passages(index: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    passages: list[dict[str, Any]] = []
    for verse_id in sorted(index):
        verse = index[verse_id]
        base = {
            "verse_id": verse_id,
            "poem": verse.get("poem"),
            "poet": verse.get("poet"),
            "tinai": verse.get("tinai"),
        }
        line_start = verse.get("lineStart")
        lines = verse.get("lines") or []
        for pos, line in enumerate(lines):
            text = (line.get("text") or "").strip()
            if not text:
                continue
            n = line.get("lineNumber")
            poem_line = (
                line_start + n - 1
                if isinstance(line_start, int) and isinstance(n, int)
                else n
            )
            # Kuṟuntokai/Naṟṟiṇai/Akanāṉūṟu records carry the poet colophon
            # ("- கபிலர்.") as their last line; it is attribution, not verse.
            is_colophon = pos == len(lines) - 1 and text.startswith("-")
            passages.append(
                {
                    **base,
                    "source_id": f"{verse_id}:{n}",
                    "field": "colophon" if is_colophon else "sangam",
                    "line": n,
                    "poem_line": poem_line,
                    "text": text,
                    "draft": False,  # source text, not a generated layer
                }
            )
        for field in ("urai", "english"):
            text = (verse.get(field) or "").strip()
            if text:
                passages.append(
                    {
                        **base,
                        "source_id": f"{verse_id}:{field}",
                        "field": field,
                        "line": None,
                        "poem_line": None,
                        "text": text,
                        "draft": _is_draft(verse, field),
                    }
                )
    return passages


class BM25Index:
    def __init__(self, passages: list[dict[str, Any]]):
        self.passages = passages
        self.doc_len: list[int] = []
        self.postings: dict[str, list[tuple[int, int]]] = defaultdict(list)
        for i, p in enumerate(passages):
            counts = Counter(tokenize(p["text"]))
            self.doc_len.append(sum(counts.values()))
            for term, tf in counts.items():
                self.postings[term].append((i, tf))
        n = len(passages)
        self.avgdl = (sum(self.doc_len) / n) if n else 0.0
        self.idf = {
            term: math.log(1 + (n - len(docs) + 0.5) / (len(docs) + 0.5))
            for term, docs in self.postings.items()
        }

    def search(
        self, query: str, limit: int, poem: str | None = None
    ) -> list[tuple[float, int]]:
        scores: dict[int, float] = defaultdict(float)
        for term in set(tokenize(query)):
            idf = self.idf.get(term)
            if idf is None:
                continue
            for i, tf in self.postings[term]:
                if poem and self.passages[i]["poem"] != poem:
                    continue
                dl = self.doc_len[i]
                denom = tf + K1 * (1 - B + B * dl / self.avgdl)
                scores[i] += idf * tf * (K1 + 1) / denom
        ranked = sorted(scores.items(), key=lambda kv: (-kv[1], kv[0]))
        return [(score, i) for i, score in ranked[:limit]]


@lru_cache(maxsize=1)
def _default_index() -> BM25Index:
    return BM25Index(_passages(_VERSE_INDEX))


# Optional[...] rather than `str | None`: google-adk 1.18's function-declaration
# parser rejects PEP 604 unions and would fail every agent run.
def retrieve_passages(
    query: str,
    poem: Optional[str] = None,  # noqa: UP045
    limit: int = 8,
) -> list[dict[str, Any]]:
    """Retrieve the corpus passages most relevant to a question, with source ids.

    Use this before answering any question about Sangam poems, poets or
    imagery. Each result is one line of a poem (field "sangam"), a poet
    colophon line (field "colophon"), or a verse's prose
    commentary/translation (field "urai"/"english"), and carries:
    source_id ("<verse_id>:<line>" or "<verse_id>:urai"), verse_id, poem,
    poet, line, poem_line (whole-poem line number for idylls), text, score,
    and draft (true for unverified commentary/translation). Cite source_id or
    verse_id for every claim; if nothing relevant is returned, say you do not
    know.

    Args:
        query: the user's question or key words, in Tamil or English.
        poem: optional poem id to restrict to, e.g. "maduraikanchi".
        limit: maximum number of passages (1-20).
    """
    if not query or not query.strip():
        return []
    limit = max(1, min(int(limit), 20))
    index = _default_index()
    results = []
    for score, i in index.search(query, limit, poem=poem):
        results.append({**index.passages[i], "score": round(score, 4)})
    return results
