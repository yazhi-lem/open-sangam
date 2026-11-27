"""
canonicalize_poets.py
---------------------
Collapse every spelling variant of a poet name in the corpus to one canonical
form, and write the alias table the rest of the pipeline reads.

Inputs
  data/texts/*/*.json            the `poet` field of every record
  data/library/tamilwiki-poets.json
                                 1,660 poet names from tamil.wiki (names only,
                                 CC BY-SA 4.0) — the spelling authority

Outputs
  data/library/poet-aliases.json  { raw spelling -> canonical spelling }
  data/texts/*/*.json            `poet` rewritten in place (combined + normalized)

Rules
  1. A name the authority knows wins, matched on Tamil letters only, so
     whitespace variants resolve to the reviewed spelling.
  2. A name the authority does not know keeps the most frequent spelling
     already in the corpus — the script never invents a join or a split.
  3. Anonymous markers ("அறியப்படவில்லை", "unknown") become None, not a name.
  4. Nothing else in a record is touched: lines, urai, english, verified and the
     machine-drafted word fields are read and written back unchanged.

Idempotent: a second run reports 0 changes. Re-running `normalize_all` keeps the
canonical names, because normalize_all applies `canonical_poet()` to the poet it
reads from raw/.

Usage:
    cd backend/python
    python -m normalizer.canonicalize_poets            # dry run: report only
    python -m normalizer.canonicalize_poets --write    # apply to the corpus
    python -m normalizer.canonicalize_poets --write --refresh-authority
                                                       # re-derive from tamil.wiki
"""

from __future__ import annotations

import argparse
import json
import re
import time
import unicodedata
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

from normalizer.poet_alias import clean_poet, name_key

REPO = Path(__file__).parents[3]
TEXTS = REPO / "data" / "texts"
AUTHORITY_PATH = REPO / "data" / "library" / "tamilwiki-poets.json"
ALIASES_PATH = REPO / "data" / "library" / "poet-aliases.json"

API = "https://tamil.wiki/api.php"
UA = "OpenSangamBot/1.0 (+https://github.com/yazhi-lem/open-sangam; poet authority)"
AUTHORITY_CATEGORIES = ["சங்க காலப் புலவர்", "புலவர்", "கவிஞர்"]  # preference order


# ── authority ──────────────────────────────────────────────────────────────
def _api(**params) -> dict:
    params.setdefault("format", "json")
    params.setdefault("formatversion", "2")
    params.setdefault("maxlag", "5")
    data = urllib.parse.urlencode(params).encode()
    last: Exception | None = None
    for attempt in range(4):
        try:
            req = urllib.request.Request(API, data=data, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.load(resp)
        except Exception as exc:
            last = exc
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"tamil.wiki API failed: {last}")


def refresh_authority() -> dict:
    """Re-read the poet categories from tamil.wiki (names + page sizes only)."""
    rows: dict[str, dict] = {}
    for role in AUTHORITY_CATEGORIES:
        titles: list[str] = []
        cont: dict = {}
        while True:
            r = _api(action="query", list="categorymembers", cmtitle=f"Category:{role}",
                     cmlimit="500", cmtype="page", **cont)
            titles += [m["title"] for m in r.get("query", {}).get("categorymembers", [])]
            if "continue" in r:
                cont = r["continue"]
            else:
                break
        sizes: dict[str, int] = {}
        for i in range(0, len(titles), 40):
            r = _api(action="query", prop="info", titles="|".join(titles[i : i + 40]))
            for page in r.get("query", {}).get("pages", []):
                sizes[page["title"]] = page.get("length", 0)
            time.sleep(0.2)
        for title in titles:
            entry = rows.setdefault(
                title,
                {"ta": title, "roles": [], "bytes": sizes.get(title, 0),
                 "url": "https://tamil.wiki/wiki/" + title.replace(" ", "_")},
            )
            if role not in entry["roles"]:
                entry["roles"].append(role)
            entry["bytes"] = max(entry["bytes"], sizes.get(title, 0))
        print(f"  {role}: {len(titles)}")
    order = {r: i for i, r in enumerate(AUTHORITY_CATEGORIES)}
    poets = sorted(rows.values(), key=lambda e: (order.get(e["roles"][0], 9), e["ta"]))
    for entry in poets:
        entry["roles"].sort(key=lambda r: order.get(r, 9))
    doc = {
        "schemaVersion": 1,
        "description": (
            "Poet-name authority index derived from tamil.wiki category membership "
            "(புலவர் / கவிஞர் / சங்க காலப் புலவர்). Names and page lengths only — no article "
            "text is copied. Used by backend/python/normalizer/canonicalize_poets.py to collapse "
            "spelling variants in the corpus."
        ),
        "generatedBy": "cd backend/python && python -m normalizer.canonicalize_poets --refresh-authority",
        "source": "https://tamil.wiki (Tamil Wiki), CC BY-SA 4.0",
        "retrieved": time.strftime("%Y-%m-%d"),
        "count": len(poets),
        "poets": poets,
    }
    AUTHORITY_PATH.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"  authority written: {len(poets)} names → {AUTHORITY_PATH.relative_to(REPO)}")
    return doc


def load_authority() -> dict[str, list[str]]:
    """key (Tamil letters only) → candidate spellings, best first."""
    if not AUTHORITY_PATH.exists():
        return {}
    doc = json.loads(AUTHORITY_PATH.read_text(encoding="utf-8"))
    index: dict[str, list[str]] = defaultdict(list)
    for entry in doc.get("poets", []):
        index[name_key(entry["ta"])].append(entry["ta"])
    return index


# ── corpus scan ────────────────────────────────────────────────────────────
def data_files() -> list[Path]:
    files: list[Path] = []
    for path in sorted(TEXTS.glob("*/*.json")):
        if "raw" in path.parts:
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        if isinstance(data, list) and data and isinstance(data[0], dict) and "poem" in data[0]:
            files.append(path)
    return files


def scan(files: list[Path]) -> tuple[Counter, Counter]:
    """Return (poet spelling counts, raw placeholder counts).

    Placeholders are colophon text such as "ஆசிரியர் அறியப்படவில்லை." — they are
    not names, so they are counted separately and rewritten to `poet: null`.
    """
    counts: Counter = Counter()
    placeholders: Counter = Counter()
    for path in files:
        for record in json.loads(path.read_text(encoding="utf-8")):
            raw = record.get("poet")
            if not raw:
                continue
            poet = clean_poet(raw)
            if poet:
                counts[poet] += 1
            else:
                placeholders[raw] += 1
    return counts, placeholders


def build_aliases(counts: Counter, authority: dict[str, list[str]]) -> dict[str, str]:
    groups: dict[str, list[tuple[str, int]]] = defaultdict(list)
    for spelling, n in counts.items():
        groups[name_key(spelling)].append((spelling, n))

    aliases: dict[str, str] = {}
    for key, variants in groups.items():
        if len(variants) == 1:
            # No duplicate to resolve. Re-spacing a single-variant name would
            # churn the corpus and rename existing Poet notes for no benefit,
            # so the established spelling stays until someone asks otherwise.
            continue
        from_authority = authority.get(key)
        if from_authority:
            canonical = from_authority[0]
        else:
            # never invent a join/split: keep the spelling the corpus uses most
            canonical = sorted(variants, key=lambda v: (-v[1], len(v[0]), v[0]))[0][0]
        for spelling, _ in variants:
            if spelling != canonical:
                aliases[spelling] = canonical
    return dict(sorted(aliases.items()))


# ── apply ──────────────────────────────────────────────────────────────────
def dumps_like(records: list[dict], original: str) -> str:
    """Keep the file's existing layout so the diff is the poet lines, not a reformat."""
    if "\n  " in original or original.startswith("[\n"):
        return json.dumps(records, ensure_ascii=False, indent=2) + "\n"
    return json.dumps(records, ensure_ascii=False, separators=(",", ":")) + "\n"


def rewrite(files: list[Path], aliases: dict[str, str]) -> int:
    changed = 0
    for path in files:
        original = path.read_text(encoding="utf-8")
        records = json.loads(original)
        touched = False
        for record in records:
            raw = record.get("poet")
            if not raw:
                continue
            poet = clean_poet(raw)
            if poet is None:
                # "ஆசிரியர் அறியப்படவில்லை." is a colophon placeholder, not a name.
                # The schema says null means unattributed, so the placeholder goes.
                record["poet"] = None
                touched = True
                changed += 1
                continue
            canonical = aliases.get(poet, poet)
            if raw != canonical:
                record["poet"] = canonical
                touched = True
                changed += 1
        if touched:
            path.write_text(dumps_like(records, original), encoding="utf-8")
    return changed


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Canonicalise `poet` spellings in the corpus")
    parser.add_argument("--write", action="store_true", help="apply; default is a dry run")
    parser.add_argument("--refresh-authority", action="store_true",
                        help="re-read the poet categories from tamil.wiki first")
    args = parser.parse_args(argv)

    if args.refresh_authority:
        print("Refreshing authority from tamil.wiki…")
        refresh_authority()

    authority = load_authority()
    files = data_files()
    counts, placeholders = scan(files)
    before_variants = len(counts)
    before_people = len({name_key(name) for name in counts})
    aliases = build_aliases(counts, authority)

    groups = defaultdict(list)
    for spelling, n in counts.items():
        groups[name_key(spelling)].append((spelling, n))
    dupes = {k: v for k, v in groups.items() if len(v) > 1}
    from_wiki = sum(1 for key in groups if key in authority)

    print(f"records files      : {len(files)}")
    print(f"poet strings       : {before_variants} → {before_people} poets")
    print(f"duplicate groups   : {len(dupes)}")
    print(f"authority matches  : {from_wiki} poets ({from_wiki / max(before_people, 1):.0%})")
    singles = sum(1 for v in groups.values() if len(v) == 1)
    print(f"anonymous colophons: {sum(placeholders.values())} record(s) across "
          f"{len(placeholders)} spelling(s) → poet: null")
    print(f"aliases to apply   : {len(aliases)}  (from {len(dupes)} duplicate groups; "
          f"{singles} single-spelling names left untouched)")

    if not args.write:
        for raw, canonical in list(aliases.items())[:15]:
            print(f"  {raw!r} → {canonical!r}")
        print("\nDry run. Re-run with --write to apply.")
        return 0

    changed = rewrite(files, aliases)

    # Merge, never replace. Once the corpus is canonical there are no duplicates
    # left to derive, so a second --write would otherwise wipe the table and a
    # later re-scrape of an old spelling would go unfixed.
    existing: dict[str, str] = {}
    if ALIASES_PATH.exists():
        existing = json.loads(ALIASES_PATH.read_text(encoding="utf-8")).get("aliases", {})
    merged = dict(sorted({**existing, **aliases}.items()))

    ALIASES_PATH.write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "description": ("raw poet spelling → canonical spelling. "
                                "Authority: data/library/tamilwiki-poets.json (tamil.wiki, CC BY-SA 4.0); "
                                "unlisted poets keep the corpus's most frequent spelling."),
                "generatedBy": "cd backend/python && python -m normalizer.canonicalize_poets --write",
                "updated": time.strftime("%Y-%m-%d"),
                "stats": {
                    "poetStrings": before_variants,
                    "poets": before_people,
                    "duplicateGroups": len(dupes),
                    "authorityMatches": from_wiki,
                    "aliases": len(merged),
                },
                "aliases": merged,
            },
            ensure_ascii=False,
            indent=1,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"\nrewrote {changed} poet fields across {len(files)} files")
    print(f"aliases written → {ALIASES_PATH.relative_to(REPO)}")
    print("Now rebuild derived data: python -m knowledge.build_graph && "
          "python -m knowledge.export_obsidian")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
