"""
scrape_pathinen_minor.py
------------------------
Ingest the minor Pathinenkilkkanakku works (beyond Thirukkural and Naladiyar)
from Project Madurai.

Project Madurai numbers are shared across some volumes: `pmuni0025` bundles
Inna / Iniyavai / Kalavazhi / Muthumozhikkanchi, `pmuni0027` bundles the two
Ainthinai works, `pmuni0029` bundles Kaar / Elathi / Sirupanchamulam, and
`pmuni0051` bundles Innnilai / Kainnilai. Each work therefore declares an
explicit `start`/`end` marker (regex over stripped lines) so we extract only its
own span.

Verse extraction is **strictly sequential**: a line ending in an integer is only
accepted when that integer equals the next expected verse number. This rejects
years, page numbers and stray numerals in the header/prose.

Usage:
    cd backend/python
    python -m scraper.scrape_pathinen_minor --report          # parse, print counts, write nothing
    python -m scraper.scrape_pathinen_minor --work all        # write every work that validates
    python -m scraper.scrape_pathinen_minor --work nanmanikkadikai
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

import requests
from bs4 import BeautifulSoup

REPO = Path(__file__).parents[3]
DATA_TEXT = REPO / "data" / "texts"
RAW_CACHE = REPO / "data" / "raw" / "projectmadurai"
PM_BASE = "https://www.projectmadurai.org/pm_etexts/utf8"
HEADERS = {
    "User-Agent": (
        "OpenSangam/1.0 (educational research; "
        "https://github.com/yazhi-lem/open-sangam)"
    )
}

TINAI_MAP = {
    "குறிஞ்சி": "kurinji",
    "முல்லை": "mullai",
    "மருதம்": "marutam",
    "நெய்தல்": "neytal",
    "பாலை": "palai",
}


@dataclass
class Work:
    id: str
    ta: str
    en: str
    poet: str
    unit: str
    expected: int
    pm_id: str
    start: str | None = None   # regex; content begins AFTER the matched line
    end: str | None = None     # regex; content stops AT the matched line
    tinai: str | None = None
    notes: str = ""
    extra: dict = field(default_factory=dict)
    publish: bool = False  # only True once the edition parses cleanly
    skip: str | None = None  # extra per-work regex of lines to drop
    allow_gaps: bool = False  # edition may omit a few verses; publish partial, labelled
    heading_title: bool = False  # `N. <rest>` is always a title, never verse text


# ── Manifest ──────────────────────────────────────────────────────────────
# `expected` is the historically attested verse count. A run that does not hit
# it exactly is reported, not written.
WORKS: list[Work] = [
    # Project Madurai's edition carries 106 numbered verses (the traditional
    # count is 100, with six verses appended in this recension).
    Work("nanmanikkadikai", "நான்மணிக்கடிகை", "Nanmanikkadikai", "விளம்பி நாகனார்", "verses", 106, "pmuni0047", publish=True, heading_title=True),
    Work("acharakkovai", "ஆசாரக்கோவை", "Acharakkovai", "பெருவாயின் முள்ளியார்", "verses", 100, "pmuni0024", allow_gaps=True, publish=True, heading_title=True),
    Work("pazhamozhi-nanuru", "பழமொழி நானூறு", "Pazhamozhi Nanuru", "முன்றுறை அரையனார்", "verses", 400, "pmuni0036", allow_gaps=True, publish=True),
       Work("thirikadugam", "திரிகடுகம்", "Thirikadukam", "நல்லாதனார்", "verses", 100, "pmuni0048", publish=True, heading_title=True),
    Work("thinaimalai-nurraimpathu", "திணைமாலை நூற்றைம்பது", "Thinaimalai Nurraimbathu", "கணிமேதையார்", "verses", 150, "pmuni0056"),
    Work("iniyavai-narpathu", "இனியவை நாற்பது", "Iniyavai Narpathu", "பூதஞ்சேந்தனார்", "verses", 40, "pmuni0025",
         start=r"^2\.\s*இனியவை\s*நாற்பது", end=r"^இனியவை\s*நாற்பது\s*முற்றிற்று", publish=True),
    Work("muthumozhikkanchi", "முதுமொழிக்காஞ்சி", "Muthumozhikkanchi", "முதுமொழிக்காஞ்சி", "verses", 100, "pmuni0025",
         start=r"^4\.\s*முதுமொழிக்\s*காஞ்சி", end=r"^முதுமொழிக்காஞ்சி\s*முற்றிற்று", publish=True),
    # ── bundled volumes ──
    Work("inna-narpathu", "இன்னா நாற்பது", "Inna Narpathu", "கபிலர்", "verses", 40, "pmuni0025",
         start=r"^1\.\s*இன்னா\s*நாற்பது", end=r"^இன்னா\s*நாற்பது\s*முற்றிற்று", publish=True),
    Work("kalavazhi-narpathu", "களவழி நாற்பது", "Kalavazhi Narpathu", "பொய்கையார்", "verses", 40, "pmuni0025",
         start=r"^3\.\s*களவழி\s*நாற்பது", end=r"^களவழி\s*நாற்பது\s*முற்றிற்று", publish=True),
    Work("ainthinai-aimpathu", "ஐந்திணை ஐம்பது", "Ainthinai Aimpathu", "மாறன் பொறையனார்", "verses", 50, "pmuni0027",
         start=r"^1\.\s.*ஐந்திணை\s*ஐம்பது", end=r"^ஐந்திணை\s*ஐம்பது\s*முற்றிற்று", allow_gaps=True, publish=True, skip=r"^(இடம்|ஒழுக்கம்|பொருள்)\s*[-:]"),
    Work("ainthinai-ezhupathu", "ஐந்திணை எழுபது", "Ainthinai Ezhupathu", "மூவாதியார்", "verses", 70, "pmuni0027",
         start=r"^2\.\s.*ஐந்திணை\s*எழுபது", end=r"^ஐந்திணை\s*எழுபது\s*முற்றிற்று", allow_gaps=True, publish=True, skip=r"^(இடம்|ஒழுக்கம்|பொருள்)\s*[-:]"),
    # Kainnilai has 60 verses; the catalog's earlier count of 40 was wrong.
    Work("kainnilai", "கைந்நிலை", "Kainnilai", "புல்லங்காடனார்", "verses", 60, "pmuni0051",
         start=r"^2\.\s*புல்லங்காடனாரின்\s*கைந்நிலை", end=r"^கைந்நிலை\s*முற்றிற்று", publish=True, heading_title=True),
    Work("kaar-narpathu", "கார் நாற்பது", "Kaar Narpathu", "மதுரைக் கண்ணங்கூத்தனார்", "verses", 40, "pmuni0029",
         start=r"^1\.\s.*கார்\s*நாற்பது", end=r"^2\.\s*கணிமேதையார்",
         skip=r"^(இதுவுமது|@|\()|வற்புறுத்த|ஆற்றாமை|உரைத்தது", publish=True),
    Work("elathi", "ஏலாதி", "Elathi", "கணிமேதையார்", "verses", 80, "pmuni0029",
         start=r"^2\.\s*கணிமேதையார்.*ஏலாதி", end=r"^ஏலாதி\s*முற்றிற்று", publish=True),
    Work("sirupanjamulam", "சிறுபஞ்சமூலம்", "Sirupanchamulam", "காரியாசான்", "verses", 100, "pmuni0029",
         start=r"^3\.\s*காரியாசான்", end=r"^சிறுபஞ்சமூலம்\s*முற்றிற்று", allow_gaps=True, publish=True),
]

NUM_TAIL = re.compile(r"[ \t]+(\d{1,4})\s*$")
NUM_PAREN = re.compile(r"\((\d{1,4})\)\s*$")
HEADING = re.compile(r"^\d+\.\s")
TINAI_HEADING = re.compile(r"^\d+\.\s*(குறிஞ்சி|முல்லை|மருதம்|நெய்தல்|பாலை)\s*$")
PAL_HEADING = re.compile(r"^\d+\.\s*(அறப்பால்|பொருட்பால்|இன்பப்பால்|வீட்டுப்பால்|காமத்துப்பால்)\s*$")


# ── Fetch ─────────────────────────────────────────────────────────────────
def fetch(pm_id: str) -> list[str]:
    RAW_CACHE.mkdir(parents=True, exist_ok=True)
    cache = RAW_CACHE / f"{pm_id}.html"
    if cache.exists():
        html = cache.read_text(encoding="utf-8", errors="ignore")
    else:
        url = f"{PM_BASE}/{pm_id}.html"
        resp = requests.get(url, headers=HEADERS, timeout=60)
        resp.raise_for_status()
        # Project Madurai serves UTF-8 but does not always declare it; trusting
        # `resp.text` yields latin-1 mojibake. Decode the bytes explicitly.
        html = resp.content.decode("utf-8", errors="replace")
        cache.write_text(html, encoding="utf-8")

    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text("\n").replace("\xa0", " ")
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    # Content starts after the Project Madurai distribution notice.
    for i, ln in enumerate(lines):
        if "kept intact" in ln.lower():
            return lines[i + 1:]
    return lines


# ── Parse ─────────────────────────────────────────────────────────────────
def slice_span(lines: list[str], work: Work) -> list[str]:
    start = 0
    if work.start:
        for i, ln in enumerate(lines):
            if re.search(work.start, ln):
                start = i + 1
                break
        else:
            raise ValueError(f"{work.id}: start marker not found: {work.start}")
    end = len(lines)
    if work.end:
        for i in range(start, len(lines)):
            if re.search(work.end, lines[i]):
                end = i
                break
    return lines[start:end]


def _is_heading(ln: str) -> bool:
    """Short `N. <few words>` lines are chapter headings, not verses."""
    m = re.match(r"^(\d+)\.\s+(.*)$", ln)
    if not m:
        return False
    rest = m.group(2).strip()
    return len(rest) < 18


SKIP_LINE = re.compile(
    r"^[(@]|^%|^-{3,}|^கடவுள்|^நூல்\s*$|^சிறப்புப்\s*பாயிரம்|^இயல்\s*$|முற்றிற்று|முற்றும்"
)

def _skip(ln: str, skip: str | None) -> bool:
    if SKIP_LINE.search(ln):
        return True
    return bool(skip and re.search(skip, ln))


def _is_contiguous(verses) -> bool:
    nums = sorted({v["number"] for v in verses})
    return bool(nums) and nums == list(range(1, len(nums) + 1))


def _best(candidates):
    """Prefer a parser whose numbering is contiguous 1..n, then the largest yield."""
    return max(candidates, key=lambda vs: (1 if _is_contiguous(vs) else 0, len(vs)))


def parse_verses(lines: list[str], skip: str | None = None, heading_title: bool = False) -> tuple[list[dict], list[str]]:
    candidates = [
        _parse_trailing(lines, skip),
        _parse_heading_numbered(lines, skip, heading_title),
        _parse_paren_trailing(lines, skip),
        _parse_leading(lines, skip),
    ]
    warnings: list[str] = []
    verses = _clean_numbers(_best(candidates), warnings)
    return verses, warnings


def _clean_numbers(verses, warnings):
    seen, clean = set(), []
    for v in verses:
        if not v.get("text") or v["number"] in seen:
            continue
        seen.add(v["number"])
        clean.append(v)
    clean.sort(key=lambda v: v["number"])
    if clean:
        nums = [v["number"] for v in clean]
        missing = [n for n in range(nums[0], nums[-1] + 1) if n not in seen]
        if missing:
            warnings.append(f"missing numbers in edition: {missing[:12]}{'…' if len(missing) > 12 else ''}")
        if nums[0] != 1:
            warnings.append(f"starts at verse {nums[0]}, not 1")
    return clean


def _parse_trailing(lines, skip=None):
    verses, buf, last = [], [], 0
    chapter = tinai = None
    for ln in lines:
        if _update_chapter_check(ln):
            buf = []
            chapter, tinai = _update_chapter(ln, chapter, tinai)
            continue
        if _skip(ln, skip) or _is_heading(ln):
            buf = []
            continue
        buf.append(ln)
        m = NUM_TAIL.search(ln)
        if not m:
            continue
        num = int(m.group(1))
        if num <= last:
            continue
        parts = [re.sub(r"\s+\d{1,4}\s*$", "", x).strip() for x in buf]
        text = " ".join(x for x in parts if x).strip()
        buf = []
        if not text:
            continue
        verses.append({"number": num, "text": text, "chapter": chapter, "tinai": tinai})
        last = num
    return verses


def _parse_leading(lines, skip=None):
    verses, cur = [], None
    chapter = tinai = None
    for ln in lines:
        m = re.match(r"^(\d{1,4})\.\s+(.*)$", ln)
        if m:
            if _is_heading(ln) or _skip(ln, skip):
                if cur:
                    verses.append(cur); cur = None
                chapter, tinai = _update_chapter(ln, chapter, tinai)
                continue
            if cur:
                verses.append(cur)
            cur = {"number": int(m.group(1)), "parts": [m.group(2)], "chapter": chapter, "tinai": tinai}
            continue
        if _update_chapter_check(ln) or _skip(ln, skip):
            if cur:
                verses.append(cur); cur = None
            chapter, tinai = _update_chapter(ln, chapter, tinai)
            continue
        if cur:
            cur["parts"].append(ln)
    if cur:
        verses.append(cur)
    return [
        {"number": v["number"], "text": " ".join(v["parts"]).strip(), "chapter": v["chapter"], "tinai": v["tinai"]}
        for v in verses
    ]


def _parse_heading_numbered(lines, skip=None, heading_title=False):
    """Verses introduced by a leading `N.` (with an optional title) and no trailing number."""
    verses, cur = [], None
    chapter = tinai = None
    for ln in lines:
        if _update_chapter_check(ln):
            chapter, tinai = _update_chapter(ln, chapter, tinai)
            if cur:
                verses.append(cur)
                cur = None
            continue
        m = re.match(r"^(\d{1,4})\.\s*(.*)$", ln)
        if m:
            num = int(m.group(1))
            rest = m.group(2).strip()
            if cur is None or num > cur["number"]:
                if cur:
                    verses.append(cur)
                # A short `N. title` is a heading; a long one is the first verse line
                # unless this edition always numbers verses with a title.
                if not heading_title and len(rest) >= 18:
                    cur = {"number": num, "title": "", "parts": [rest], "chapter": chapter, "tinai": tinai}
                else:
                    cur = {"number": num, "title": rest, "parts": [], "chapter": chapter, "tinai": tinai}
                continue
            # num <= current: either a group heading (short) or a repeated first line.
            if len(rest) < 18:
                continue  # group/chapter heading, not verse content
            if not cur["parts"] and cur["title"]:
                cur["parts"].append(rest)
                cur["title"] = ""
            else:
                cur["parts"].append(rest)
            continue
        if _skip(ln, skip) or ln.startswith("("):
            continue
        if cur:
            cur["parts"].append(ln)
    if cur:
        verses.append(cur)
    return [
        {
            "number": v["number"],
            "text": " ".join(v["parts"]).strip(),
            "title": v["title"],
            "chapter": v["chapter"],
            "tinai": v["tinai"],
        }
        for v in verses
    ]


def _parse_paren_trailing(lines, skip=None):
    """Verses ending in a parenthetical number, e.g. `... ஈண்டு.  (1)`."""
    verses, buf = [], []
    chapter = tinai = None
    last = 0
    for ln in lines:
        if _update_chapter_check(ln):
            buf = []
            chapter, tinai = _update_chapter(ln, chapter, tinai)
            continue
        if _skip(ln, skip):
            buf = []
            continue
        buf.append(ln)
        m = NUM_PAREN.search(ln)
        if not m:
            continue
        num = int(m.group(1))
        if num <= last:
            continue
        parts = [NUM_PAREN.sub("", x).strip() for x in buf]
        text = " ".join(x for x in parts if x).strip()
        buf = []
        if not text:
            continue
        verses.append({"number": num, "text": text, "chapter": chapter, "tinai": tinai})
        last = num
    return verses


def _update_chapter(ln: str, chapter, tinai):
    mt = TINAI_HEADING.match(ln)
    mp = PAL_HEADING.match(ln)
    if mt:
        return mt.group(1), TINAI_MAP.get(mt.group(1))
    if mp:
        return mp.group(1), tinai
    for name in TINAI_MAP:
        if ln.strip().endswith(name):
            return name, TINAI_MAP[name]
    return chapter, tinai


def _update_chapter_check(ln: str) -> bool:
    return bool(TINAI_HEADING.match(ln) or PAL_HEADING.match(ln)) or any(
        ln.strip().endswith(name) and len(ln.strip()) < 16 for name in TINAI_MAP
    )


# ── Emit ──────────────────────────────────────────────────────────────────
def to_records(work: Work, verses: list[dict]) -> list[dict]:
    width = 4 if work.expected >= 1000 else 3
    # Schema requires `^[a-z]+_\d{2,4}$`; the poem id may keep hyphens but the
    # record-id prefix must be letters only.
    prefix = re.sub(r"[^a-z]", "", work.id)
    source_url = f"{PM_BASE}/{work.pm_id}.html"
    return [
        {
            "id": f"{prefix}_{v['number']:0{width}d}",
            "poem": work.id,
            "number": v["number"],
            "title": "",
            "heading": v["chapter"] or "",
            "tinai": v["tinai"] or "unknown",
            "sangamTamil": v["text"],
            "urai": None,
            "english": None,
            "lines": [{"lineNumber": 1, "text": v["text"], "words": []}],
            "culturalNotes": [],
            "audioUrl": None,
            "source": source_url,
            "verified": False,
        }
        for v in verses
    ]


def write_package(work: Work, records: list[dict]) -> None:
    """Write the frontend bundle, per-record normalized files and OKF datapackage."""
    nums = {r["number"] for r in records}
    missing = [x for x in range(1, work.expected + 1) if x not in nums]
    coverage = {"available": len(records), "expected": work.expected, "missing": missing}
    out_dir = DATA_TEXT / work.id
    norm = out_dir / "normalized"
    norm.mkdir(parents=True, exist_ok=True)

    (out_dir / f"{work.id}.json").write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    for rec in records:
        (norm / f"{rec['id']}.json").write_text(
            json.dumps(rec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )

    package = {
        "name": f"open-sangam-{work.id}",
        "title": f"{work.ta} — {work.en}",
        "description": f"{work.en} ({work.ta}), Pathinenkilkkanakku — {len(records)} verses.",
        "version": "0.1.0",
        "licenses": [{"name": "odc-pddl", "title": "Open Data Commons Public Domain Dedication and License"}],
        "sources": [{"title": "Project Madurai", "path": f"https://www.projectmadurai.org/pm_etexts/utf8/{work.pm_id}.html"}],
        "contributors": [{"name": "Open Tamil NLP contributors", "role": "scraper"}],
        "keywords": ["Tamil", "Pathinenkilkkanakku", work.en],
        "coverage": coverage,
    }
    (out_dir / "datapackage.json").write_text(
        json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--work", default="all", help="work id or 'all'")
    ap.add_argument("--report", action="store_true", help="parse only; print counts, write nothing")
    args = ap.parse_args(argv)

    selected = WORKS if args.work == "all" else [w for w in WORKS if w.id == args.work]
    if not selected:
        print(f"unknown work: {args.work}", file=sys.stderr)
        return 2

    ok, bad = [], []
    for work in selected:
        try:
            lines = fetch(work.pm_id)
            span = slice_span(lines, work)
            verses, warnings = parse_verses(span, work.skip, work.heading_title)
        except Exception as exc:  # network / marker problems
            bad.append((work.id, f"error: {exc}"))
            print(f"  {work.id:26s} ERROR {exc}", file=sys.stderr)
            continue

        n = len(verses)
        nums = {v["number"] for v in verses}
        missing = [x for x in range(1, work.expected + 1) if x not in nums]
        exact = n == work.expected and _is_contiguous(verses)
        partial = (
            work.allow_gaps
            and 0 < n < work.expected
            and len(missing) <= 6
            and max(nums) <= work.expected
        )
        status = "OK " if exact else ("PART" if partial else "MISMATCH")
        print(f"  {work.id:26s} {status} {n:>3}/{work.expected} verses")
        for w in warnings:
            print(f"      ! {w}")
        if exact or partial:
            ok.append(work)
            if work.publish and not args.report:
                records = to_records(work, verses)
                write_package(work, records)
                print(f"      wrote data/texts/{work.id}/ ({len(records)} records)")
        else:
            bad.append((work.id, f"{len(verses)}/{work.expected}"))

    print(f"\n{len(ok)} works validated, {len(bad)} need review")
    for wid, why in bad:
        print(f"  - {wid}: {why}")
    return 0 if not bad else 1


if __name__ == "__main__":
    raise SystemExit(main())
