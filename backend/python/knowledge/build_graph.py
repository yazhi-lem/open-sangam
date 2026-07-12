#!/usr/bin/env python3
"""
build_graph.py — Interlink the Open Sangam corpus into a knowledge graph.

Reads every normalized poem JSON under data/texts/ and cross-links the entities
that the corpus already carries — poems, tiṇai landscapes, poets — and mines the
verse text for the karu-poruḷ (native flora/fauna/deity/people) of each tiṇai
using the curated lexicon exported from frontend/src/data/tinaiWorld.js.

Outputs (consumed by the frontend graph explorer + expanded tiṇai knowledge):

  data/knowledge/graph.json          nodes + typed, weighted edges
  data/knowledge/tinai_context.json  per-tiṇai corpus attestations & samples

Design goal: a base "world graph" of Sangam consciousness — every node reachable
from every other through the relationships the poems themselves assert.

Usage:  python -m knowledge.build_graph        (from backend/python/)
        python backend/python/knowledge/build_graph.py
"""
from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────────────────
HERE = Path(__file__).resolve()
REPO = HERE.parents[3]
TEXTS = REPO / "data" / "texts"
OUT = REPO / "data" / "knowledge"
LEXICON = HERE.parent / "tinai_lexicon.json"

TINAI_EN = {
    "kurinji": "Kuṟiñci · Mountains",
    "mullai": "Mullai · Forest",
    "marutam": "Marutam · Cropland",
    "neytal": "Neytal · Seashore",
    "palai": "Pālai · Wasteland",
    "puram": "Puṟam · Public life",
    "unknown": "Unclassified",
}

# Poets whose names carry an anonymous / lost-attribution marker — excluded from
# the poet graph so an "unknown author" bucket does not dominate the links.
ANON_MARKERS = ("அறியப்படவில்லை", "பெயர்", "unknown")

MIN_TERM_LEN = 3          # skip very short lexicon terms (over-match risk)
MAX_SAMPLES = 3           # sample verse refs kept per attestation
TOP_POETS_PER_TINAI = 8
TOP_POETS_GRAPH = 40      # poets promoted to graph nodes (by verse count)


def clean_poet(name: str | None) -> str | None:
    if not name:
        return None
    name = name.strip().rstrip(".。 ").strip()
    if not name:
        return None
    if any(m in name for m in ANON_MARKERS):
        return None
    return name


def strip_tamil(text: str) -> str:
    """Collapse whitespace/punctuation so substring matches are robust."""
    return re.sub(r"\s+", " ", text or "")


def load_corpus() -> list[dict]:
    records = []
    for pj in sorted(TEXTS.glob("*/*.json")):
        if "normalized" in pj.parts:
            continue
        try:
            data = json.loads(pj.read_text(encoding="utf-8"))
        except Exception:
            continue
        if isinstance(data, list):
            records.extend(v for v in data if isinstance(v, dict))
    return records


def main() -> None:
    lexicon = json.loads(LEXICON.read_text(encoding="utf-8"))
    corpus = load_corpus()

    # ── aggregations ─────────────────────────────────────────────────────────
    tinai_verse_count: Counter = Counter()
    poem_tinai: dict[str, Counter] = defaultdict(Counter)
    poet_count: Counter = Counter()
    poet_tinai: dict[str, Counter] = defaultdict(Counter)
    poet_poem: dict[str, Counter] = defaultdict(Counter)
    tinai_poet: dict[str, Counter] = defaultdict(Counter)

    # per-tinai karu attestations: category -> term -> {en, count, samples[]}
    attest: dict[str, dict] = {
        t: defaultdict(lambda: {"en": None, "count": 0, "samples": []})
        for t in lexicon
    }
    tinai_samples: dict[str, list] = defaultdict(list)

    for v in corpus:
        tinai = v.get("tinai") or "unknown"
        poem = v.get("poem") or "unknown"
        num = v.get("number")
        vid = v.get("id")
        text = strip_tamil(v.get("sangamTamil", ""))
        poet = clean_poet(v.get("poet"))

        tinai_verse_count[tinai] += 1
        poem_tinai[poem][tinai] += 1
        if poet:
            poet_count[poet] += 1
            poet_tinai[poet][tinai] += 1
            poet_poem[poet][poem] += 1
            tinai_poet[tinai][poet] += 1

        # keep a couple of representative verses per tinai
        if tinai in lexicon and len(tinai_samples[tinai]) < 6 and text:
            snippet = " / ".join(text.split(" / ")) if False else text
            tinai_samples[tinai].append({
                "id": vid, "poem": poem, "number": num, "poet": poet,
                "snippet": snippet[:120],
            })

        # karu-porul term mining
        if tinai in lexicon and text:
            for cat in ("flora", "fauna", "landscape", "people", "deity"):
                for entry in lexicon[tinai].get(cat, []):
                    ta = entry["ta"] if isinstance(entry, dict) else entry
                    en = entry.get("en") if isinstance(entry, dict) else None
                    if not ta or len(ta) < MIN_TERM_LEN:
                        continue
                    if ta in text:
                        rec = attest[tinai].setdefault(f"{cat}:{ta}", {
                            "cat": cat, "ta": ta, "en": en, "count": 0, "samples": []
                        })
                        rec["cat"] = cat
                        rec["ta"] = ta
                        rec["en"] = rec["en"] or en
                        rec["count"] += 1
                        if len(rec["samples"]) < MAX_SAMPLES and vid:
                            rec["samples"].append(
                                {"id": vid, "poem": poem, "number": num}
                            )

    # ── build tinai_context.json ─────────────────────────────────────────────
    tinai_context = {}
    for t in lexicon:
        rows = sorted(attest[t].values(), key=lambda r: -r["count"])
        by_cat = defaultdict(list)
        for r in rows:
            by_cat[r["cat"]].append(r)
        tinai_context[t] = {
            "verseCount": tinai_verse_count.get(t, 0),
            "topPoets": [
                {"poet": p, "count": c}
                for p, c in tinai_poet[t].most_common(TOP_POETS_PER_TINAI)
            ],
            "poemBreakdown": sorted(
                (
                    {"poem": pm, "count": cnt[t]}
                    for pm, cnt in poem_tinai.items() if cnt[t]
                ),
                key=lambda r: -r["count"],
            ),
            "attested": {cat: by_cat.get(cat, []) for cat in
                         ("flora", "fauna", "landscape", "people", "deity")},
            "sampleVerses": tinai_samples[t],
        }

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "tinai_context.json").write_text(
        json.dumps(tinai_context, ensure_ascii=False, indent=1), encoding="utf-8"
    )

    # ── build graph.json (nodes + typed weighted edges) ──────────────────────
    nodes: list[dict] = []
    edges: list[dict] = []
    seen: set[str] = set()

    def add_node(nid, label, ntype, **extra):
        if nid in seen:
            return
        seen.add(nid)
        nodes.append({"id": nid, "label": label, "type": ntype, **extra})

    # tinai nodes
    for t in TINAI_EN:
        if tinai_verse_count.get(t):
            add_node(f"tinai:{t}", TINAI_EN[t], "tinai",
                     tinai=t, weight=tinai_verse_count[t])

    # poem nodes + poem→tinai edges
    for pm, cnt in poem_tinai.items():
        add_node(f"poem:{pm}", pm, "poem", weight=sum(cnt.values()))
        for t, c in cnt.items():
            if f"tinai:{t}" in seen:
                edges.append({"source": f"poem:{pm}", "target": f"tinai:{t}",
                              "rel": "HAS_TINAI", "weight": c})

    # poet nodes (top by volume) + poet edges
    for poet, _ in poet_count.most_common(TOP_POETS_GRAPH):
        add_node(f"poet:{poet}", poet, "poet", weight=poet_count[poet])
        for t, c in poet_tinai[poet].most_common():
            if f"tinai:{t}" in seen:
                edges.append({"source": f"poet:{poet}", "target": f"tinai:{t}",
                              "rel": "WROTE_IN", "weight": c})
        for pm, c in poet_poem[poet].most_common():
            if f"poem:{pm}" in seen:
                edges.append({"source": f"poet:{poet}", "target": f"poem:{pm}",
                              "rel": "COMPOSED", "weight": c})

    # karu entity nodes + tinai→entity edges (attested in corpus)
    for t in lexicon:
        for r in attest[t].values():
            if r["count"] < 1:
                continue
            nid = f"karu:{t}:{r['ta']}"
            add_node(nid, f"{r['ta']} · {r['en'] or ''}".strip(" ·"),
                     "karu", cat=r["cat"], weight=r["count"])
            edges.append({"source": f"tinai:{t}", "target": nid,
                          "rel": "ATTESTS", "weight": r["count"],
                          "cat": r["cat"]})

    graph = {
        "meta": {
            "records": len(corpus),
            "nodes": len(nodes),
            "edges": len(edges),
            "relTypes": ["HAS_TINAI", "WROTE_IN", "COMPOSED", "ATTESTS"],
            "nodeTypes": ["tinai", "poem", "poet", "karu"],
            "generatedFrom": "data/texts/*/*.json",
        },
        "nodes": nodes,
        "edges": edges,
    }
    (OUT / "graph.json").write_text(
        json.dumps(graph, ensure_ascii=False, indent=1), encoding="utf-8"
    )

    # ── console summary ──────────────────────────────────────────────────────
    print(f"corpus records : {len(corpus)}")
    print(f"graph nodes    : {len(nodes)}  ({Counter(n['type'] for n in nodes)})")
    print(f"graph edges    : {len(edges)}  ({Counter(e['rel'] for e in edges)})")
    for t in lexicon:
        att = sum(1 for r in attest[t].values() if r["count"])
        print(f"  {t:8s} verses={tinai_verse_count.get(t,0):4d} "
              f"karu_attested={att:2d} top_poet="
              f"{(tinai_poet[t].most_common(1) or [('—',0)])[0][0]}")


if __name__ == "__main__":
    main()
