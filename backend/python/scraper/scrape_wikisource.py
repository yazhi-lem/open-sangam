"""
scrape_wikisource.py
--------------------
Harvest the verse text of the structural Tamil epics from Tamil Wikisource
(`ta.wikisource.org`, CC BY-SA 4.0) into the canonical Open Sangam record
shape (verse → line → word) with a `structure` block for the chapter tree.

Why Wikisource and not Wikipedia: Wikipedia holds the *explanation*, Wikisource
holds the *text*. See docs/research/tamil-wiki-scout.md for the licence analysis
and the measured page/byte counts per work.

Adapters (one per markup convention, all measured on the live wiki):

  kamba         `கம்பராமாயணம்/<காண்டம்>/<படலம்>`
                → one record per paṭalam, `==scene==` sub-headings, 4-line
                  stanzas separated by blank lines, each closed by its number.
  perunkathai   `பெருங்கதை/<book> <chapter> <title>`
                → one record per chapter, `===scene===` headings, `<poem>`
                  blocks, surviving-text lacunae preserved verbatim.
  manimekalai   one page, `== NN.காதை ==` headings, one `<poem>` per kādai.

Everything is written with `verified: false` and a `source` URL per record;
nothing is invented and no verse is reordered. Raw wikitext is cached under
`data/texts/<work>/raw/` (gitignored) so a re-run is offline-reproducible.

Usage:
    cd backend/python
    python -m scraper.scrape_wikisource --work all
    python -m scraper.scrape_wikisource --work manimekalai --offline
"""

from __future__ import annotations

import argparse
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

REPO = Path(__file__).parents[3]
TEXTS = REPO / "data" / "texts"

API = "https://ta.wikisource.org/w/api.php"
UA = "OpenSangamBot/1.0 (https://github.com/yazhi-lem/open-sangam; corpus ingestion)"
SITE = "https://ta.wikisource.org/wiki/"
LICENSE = "CC BY-SA 4.0"

# ── work manifest ──────────────────────────────────────────────────────────
WORKS: dict[str, dict] = {
    "manimekalai": {
        "ta": "மணிமேகலை",
        "en": "Manimekalai",
        "author": "சீத்தலைச் சாத்தனார் · Sīttalai Sāttanār",
        "collection": "aimperumkappiyam",
        "adapter": "manimekalai",
        "pages": ["மணிமேகலை"],
        "level": "kadai",
        "unit": "cantos",
        "num_digits": 3,
    },
    "perunkathai": {
        "ta": "பெருங்கதை",
        "en": "Perunkathai",
        "author": "கொங்குவேளிர் · Koṅkuvēḷir",
        "collection": "tamil-classics",
        "adapter": "perunkathai",
        "prefix": "பெருங்கதை/",
        "level": "chapter",
        "unit": "chapters",
        "num_digits": 3,
    },
    "ramavataram": {
        "ta": "கம்பராமாயணம்",
        "en": "Kamba Ramayanam",
        "author": "கம்பர் · Kambar",
        "collection": "tamil-classics",
        "adapter": "kamba",
        "prefix": "கம்பராமாயணம்/",
        "level": "padalam",
        "unit": "cantos",
        "num_digits": 3,
    },
}

NOISE_LINE = re.compile(r"^[-–—=*_~·•\s]{2,}$")
ELLIPSIS_LINE = re.compile(r"^[….\s]*$")
# Wikisource's Manimekalai edition closes every line with a rule and an edition
# line marker, e.g. "... உறு துயர் காணா --------12-090".
EDITION_MARKER = re.compile(r"(?:\s*[-–—]{2,})?\s*(\d{1,2})[-–](\d{2,4})\s*$")


# ── wiki client ────────────────────────────────────────────────────────────
def api(**params) -> dict:
    params.setdefault("format", "json")
    params.setdefault("formatversion", "2")
    params.setdefault("maxlag", "5")
    data = urllib.parse.urlencode(params).encode()
    last: Exception | None = None
    for attempt in range(5):
        try:
            req = urllib.request.Request(API, data=data, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.load(resp)
        except Exception as exc:  # network flake or maxlag; back off
            last = exc
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"wikisource API failed: {last}")


def list_pages(prefix: str) -> list[str]:
    out: list[str] = []
    cont: dict = {}
    while True:
        r = api(action="query", list="allpages", apprefix=prefix, aplimit="500", apnamespace=0, **cont)
        out += [p["title"] for p in r.get("query", {}).get("allpages", [])]
        if "continue" in r:
            cont = r["continue"]
        else:
            return out


def fetch_wikitext(titles: list[str]) -> dict[str, str]:
    texts: dict[str, str] = {}
    for i in range(0, len(titles), 20):
        chunk = titles[i : i + 20]
        r = api(action="query", prop="revisions", rvprop="content", rvslots="main", titles="|".join(chunk))
        for page in r.get("query", {}).get("pages", []):
            revs = page.get("revisions") or [{}]
            slot = (revs[0].get("slots") or {}).get("main") or {}
            texts[page["title"]] = slot.get("content") or ""
        time.sleep(0.2)  # be polite: ~5 req/s ceiling
    return texts


# ── wikitext helpers ───────────────────────────────────────────────────────
def strip_templates(text: str) -> str:
    """Drop {{...}} blocks (nav headers, {{தலை}}, {{header}}) with brace matching."""
    out: list[str] = []
    depth = 0
    i = 0
    while i < len(text):
        pair = text[i : i + 2]
        if pair == "{{":
            depth += 1
            i += 2
            continue
        if pair == "}}" and depth:
            depth -= 1
            i += 2
            continue
        if not depth:
            out.append(text[i])
        i += 1
    return "".join(out)


def strip_markup(line: str) -> str:
    line = re.sub(r"<[^>]+>", "", line)
    line = re.sub(r"\[\[(?:[^\]|]*\|)?([^\]]*)\]\]", r"\1", line)
    line = re.sub(r"'{2,}", "", line)
    line = re.sub(r"\s+", " ", line)
    return line.strip()


def poem_bodies(text: str) -> list[str]:
    return re.findall(r"<poem>(.*?)</poem>", text, re.S)


def split_on_headings(text: str, level: int) -> list[tuple[str | None, str]]:
    """Split wikitext on ==/===/==== headings; returns [(heading, body)] in order."""
    marks = "=" * level
    pattern = re.compile(rf"^{marks}(?!=)\s*(.+?)\s*{marks}(?!=)\s*$", re.M)
    parts = pattern.split(text)
    if len(parts) == 1:
        return [(None, text)]
    sections: list[tuple[str | None, str]] = []
    if parts[0].strip():
        sections.append((None, parts[0]))
    for i in range(1, len(parts), 2):
        heading = strip_markup(parts[i])
        body = parts[i + 1] if i + 1 < len(parts) else ""
        sections.append((heading, body))
    return sections


def verse_lines(body: str) -> list[str]:
    """Lines of one chapter, poem tags removed, running heads and rules dropped."""
    lines: list[str] = []
    for raw in body.splitlines():
        text = EDITION_MARKER.sub("", raw)
        # editions print a running line number in an aligned column: "... யாழி னூலும் \t 5"
        text = re.sub(r"(?:\t|\s{2,})\d{1,4}\s*$", "", text)
        line = strip_markup(text).strip()
        if not line:
            continue
        if NOISE_LINE.match(line) or ELLIPSIS_LINE.match(line):
            continue
        if re.fullmatch(r"=+.*=+", line) or line.endswith("==") or line.startswith("=="):
            continue  # heading, or the second half of a heading wrapped in the source
        if line.startswith("*") or line.startswith("[[") or line.lower().startswith("பகுப்பு"):
            continue
        lines.append(line)
    return lines


def dumps(value) -> str:
    """One line of UTF-8 JSON, trailing newline, no indentation."""
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n"


def tokenize(line: str) -> list[dict]:
    """Split a line into words.

    Only `form` is emitted. The optional root/urichol/etymology/gloss fields are
    schema-optional and the frontend normalises a missing key to null
    (src/content/processedContent.js), so writing five nulls per word would add
    ~17 MB of pure `null` across the Kamba Ramayanam corpus for no information.
    """
    return [{"form": word} for word in line.split() if word]


def make_record(
    *,
    poem: str,
    ordinal: int,
    sangam: str,
    title: str | None,
    structure: dict,
    source_url: str,
    num_digits: int,
    tinai: str = "unknown",
    extra: dict | None = None,
) -> dict:
    lines = [ln for ln in sangam.splitlines() if ln.strip()]
    record = {
        "id": f"{poem}_{ordinal:0{num_digits}d}",
        "poem": poem,
        "sectionNumber": ordinal,
        "tinai": tinai,
        "sangamTamil": sangam,
        "urai": None,
        "english": None,
        "lines": [
            {"lineNumber": i + 1, "text": text, "words": tokenize(text)}
            for i, text in enumerate(lines)
        ],
        "culturalNotes": [],
        "audioUrl": None,
        "source": source_url,
        "verified": False,
        "structure": structure,
    }
    if title:
        record["title"] = title
    if extra:
        record.update(extra)
    return record


# ── adapters ───────────────────────────────────────────────────────────────
def adapt_manimekalai(work: dict, texts: dict[str, str]) -> tuple[list[dict], list[str]]:
    page = work["pages"][0]
    body = strip_templates(texts[page])
    records: list[dict] = []
    problems: list[str] = []
    for heading, section in split_on_headings(body, 2):
        if not heading:
            continue
        poems = poem_bodies(section)
        lines = verse_lines("\n".join(poems)) if poems else verse_lines(section)
        if not lines:
            problems.append(f"{page}: empty section {heading!r}")
            continue
        m = re.match(r"(\d+)\s*[.)]?\s*(.+)", heading)
        number = int(m.group(1)) if m else None
        title = (m.group(2) if m else heading).strip()
        ordinal = len(records) + 1
        records.append(
            make_record(
                poem=work["id"],
                ordinal=ordinal,
                sangam="\n".join(lines),
                title=title,
                structure={
                    "level": work["level"],
                    "book": None,
                    "chapter": title,
                    "chapterNumber": number,
                    "number": number,
                    "verseCount": None,  # edition numbers lines, not verses
                },
                source_url=SITE + urllib.parse.quote(page.replace(" ", "_")),
                num_digits=work["num_digits"],
            )
        )
    return records, problems


def adapt_perunkathai(work: dict, texts: dict[str, str]) -> tuple[list[dict], list[str]]:
    records: list[dict] = []
    problems: list[str] = []
    title_re = re.compile(r"^(\d+)\s+(\d+)\s+(.+)$")
    for page, text in sorted(texts.items(), key=lambda kv: page_order(kv[0])):
        slug = page.split("/", 1)[1] if "/" in page else page
        m = title_re.match(slug)
        if not m:
            problems.append(f"skipped (title pattern): {page}")
            continue
        book_num, chapter_num, chapter_title = int(m.group(1)), int(m.group(2)), m.group(3).strip()
        body = strip_templates(text)
        if "முழுமையாக" in body and "சிதைந்து" in body:
            problems.append(f"lacuna (source declares the section lost): {page}")
            continue
        if chapter_num == 0:
            problems.append(f"front matter (editorial preface, not verse): {page}")
            continue
        # The edition marks where verse starts; everything before it is editorial
        # prose and navigation, so only the zone after the marker is verse.
        marker = re.search(r"^\s*\*+\s*பாடல் மூலம்\s*$", body, re.M)
        zone = body[marker.end():] if marker else ""
        if not zone.strip():
            problems.append(f"skipped (no '*பாடல் மூலம்' verse marker): {page}")
            continue
        # some headings wrap across two source lines; rejoin before splitting
        zone = re.sub(r"^(=+[^\n]*)\n([^\n]*=+)\s*$", r"\1 \2", zone, flags=re.M)
        poems = poem_bodies(zone)
        lines = [ln for ln in verse_lines("\n".join(poems) if poems else zone)
                 if not re.match(rf"^{book_num}\s+{chapter_num}\s+", ln)]
        if not lines:
            problems.append(f"skipped (no verses after marker): {page}")
            continue
        records.append(
            make_record(
                poem=work["id"],
                ordinal=len(records) + 1,
                sangam="\n".join(lines),
                title=chapter_title,
                structure={
                    "level": work["level"],
                    "book": f"காண்டம் {book_num}",
                    "chapter": chapter_title,
                    "chapterNumber": chapter_num,
                    "number": chapter_num,
                    "verseCount": None,
                },
                source_url=SITE + urllib.parse.quote(page.replace(" ", "_")),
                num_digits=work["num_digits"],
            )
        )
    return records, problems


def adapt_kamba(work: dict, texts: dict[str, str]) -> tuple[list[dict], list[str]]:
    records: list[dict] = []
    problems: list[str] = []
    for page, text in sorted(texts.items(), key=lambda kv: page_order(kv[0])):
        parts = page.split("/")
        if len(parts) != 3:
            problems.append(f"skipped (not kandam/padalam): {page}")
            continue
        book, padalam = parts[1].strip(), parts[2].strip()
        body = strip_templates(text)
        # the padalam number sits in a centered bold title line
        head = re.search(r"<center>\s*<big>\s*'{3}\s*(\d+)\.\s*(.+?)'{3}", body)
        chapter_number = int(head.group(1)) if head else None
        if head:
            padalam = strip_markup(head.group(2)).strip() or padalam

        # Scenes are a bold Tamil sentence printed inside the <poem>, followed by
        # a blank line and the verses. They are harvested as `scenes`, not as verse.
        cleaned: list[str] = []
        scenes: list[dict] = []
        verses = 0
        for _heading, section in split_on_headings(body, 2):
            for poem in poem_bodies(section) or [section]:
                for raw in poem.splitlines():
                    bold = re.match(r"^\s*'{3}\s*(.+?)\s*'{3}\s*$", raw)
                    if bold:
                        label = strip_markup(bold.group(1)).strip()
                        if label:
                            scenes.append({"lineNumber": len(cleaned) + 1, "text": label})
                        continue
                    text_line = EDITION_MARKER.sub("", raw)
                    text_line = re.sub(r"^(?:\t|\s{2,})\d{1,4}\s*$", "", text_line)
                    line = strip_markup(text_line).strip()
                    if not line or NOISE_LINE.match(line) or ELLIPSIS_LINE.match(line):
                        continue
                    if re.fullmatch(r"=+.*=+", line) or line.endswith("==") or line.startswith("=="):
                        continue
                    if re.search(r"\s\d+\s*$", line):
                        verses += 1
                    line = re.sub(r"\s*\d+\s*$", "", line).strip()
                    if line:
                        cleaned.append(line)
        if not cleaned:
            problems.append(f"skipped (no verses): {page}")
            continue
        records.append(
            make_record(
                poem=work["id"],
                ordinal=len(records) + 1,
                sangam="\n".join(cleaned),
                title=padalam,
                structure={
                    "level": work["level"],
                    "book": book,
                    "chapter": padalam,
                    "chapterNumber": chapter_number,
                    "number": len(records) + 1,
                    "verseCount": verses or None,
                },
                source_url=SITE + urllib.parse.quote(page.replace(" ", "_")),
                num_digits=work["num_digits"],
                extra={"scenes": scenes} if scenes else None,
            )
        )
    return records, problems


ADAPTERS = {
    "manimekalai": adapt_manimekalai,
    "perunkathai": adapt_perunkathai,
    "kamba": adapt_kamba,
}

KANDA_ORDER = ["பாயிரம்", "பால காண்டம்", "அயோத்தியா காண்டம்", "ஆரணிய காண்டம்",
               "கிட்கிந்தா காண்டம்", "சுந்தர காண்டம்", "யுத்த காண்டம்"]


def page_order(title: str) -> tuple:
    """Stable narrative order: kandam rank for Kamba, numeric slug for Perunkathai."""
    slug = title.split("/", 1)[1] if "/" in title else title
    if title.startswith("கம்பராமாயணம்/"):
        parts = title.split("/")
        rank = KANDA_ORDER.index(parts[1]) if len(parts) > 1 and parts[1] in KANDA_ORDER else 99
        return (0, rank, parts[2] if len(parts) > 2 else "")
    m = re.match(r"(\d+)\s+(\d+)", slug)
    if m:
        return (1, int(m.group(1)), int(m.group(2)))
    return (2, 0, slug)


# ── output ─────────────────────────────────────────────────────────────────
def write_work(work_id: str, work: dict, records: list[dict], problems: list[str], offline: bool) -> None:
    out_dir = TEXTS / work_id
    out_dir.mkdir(parents=True, exist_ok=True)
    combined = out_dir / f"{work_id}.json"
    # Compact, not indented: Kamba Ramayanam is 49k lines, and indent=2 was 68 MB
    # against 39 MB compact. Per-record files below stay one-record-per-file, so
    # diffs remain reviewable without paying for pretty-printing everywhere.
    combined.write_text(dumps(records), encoding="utf-8")

    norm = out_dir / "normalized"
    norm.mkdir(exist_ok=True)
    keep = {f"{record['id']}.json" for record in records}
    for stale in norm.glob("*.json"):
        if stale.name not in keep:
            stale.unlink()  # a rename or a dropped chapter must not leave orphans
    for record in records:
        (norm / f"{record['id']}.json").write_text(dumps(record), encoding="utf-8")

    verses = sum((r.get("structure") or {}).get("verseCount") or 0 for r in records)
    lines = sum(len(r["lines"]) for r in records)
    datapackage = {
        "name": work_id,
        "title": work["en"],
        "profile": "data-package",
        "licenses": [{"name": "CC-BY-SA-4.0", "path": "https://creativecommons.org/licenses/by-sa/4.0/"}],
        "sources": [{"title": f"Tamil Wikisource — {work['ta']}", "path": SITE + urllib.parse.quote(work_id)}],
        "resources": [
            {
                "name": work_id,
                "path": f"{work_id}.json",
                "format": "json",
                "mediatype": "application/json",
                "schema": "../../schema/verse_schema.json",
                "count": len(records),
            }
        ],
        "openSangam": {
            "adapter": work["adapter"],
            "structureLevel": work["level"],
            "records": len(records),
            "lines": lines,
            "numberedVerses": verses,
            "problems": problems,
            "offline": offline,
        },
    }
    (out_dir / "datapackage.json").write_text(
        json.dumps(datapackage, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    (out_dir / "contributors.md").write_text(
        "\n".join(
            [
                f"# {work['ta']} · {work['en']} — contributors",
                "",
                "| Role | Name |",
                "|---|---|",
                f"| Author | {work['author']} |",
                "| Text source | Tamil Wikisource (ta.wikisource.org), CC BY-SA 4.0 |",
                "| Scraper | `backend/python/scraper/scrape_wikisource.py` (`{0}` adapter) |".format(work["adapter"]),
                "| Reviewer | _none yet_ — every record is `verified: false` |",
                "",
                "## Provenance",
                "",
                f"- Licences: text CC BY-SA 4.0 via Tamil Wikisource; underlying work is public domain.",
                f"- Retrieved: {time.strftime('%Y-%m-%d')}.",
                f"- Records: {len(records)} · lines: {lines} · numbered verses: {verses}.",
                "- Per-record source URL is in the record's `source` field.",
                "",
                "## Known source defects",
                "",
                "- Wikisource editions are community transcriptions; OCR slips and inconsistent",
                "  numbering are preserved as-is rather than silently corrected.",
                "- Lacunae in the underlying text are kept verbatim (`…` markers).",
                "",
            ]
        ),
        encoding="utf-8",
    )

    print(
        f"  {work_id:16} records={len(records):>3} lines={lines:>6} verses={verses:>5} "
        f"problems={len(problems)}"
    )
    for problem in problems[:6]:
        print(f"      ! {problem}")
    if len(problems) > 6:
        print(f"      ! … {len(problems) - 6} more")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Harvest structural epics from Tamil Wikisource")
    parser.add_argument("--work", default="all", help="work id, or 'all'")
    parser.add_argument("--offline", action="store_true", help="use cached raw wikitext only")
    args = parser.parse_args(argv)

    wanted = list(WORKS) if args.work == "all" else [args.work]
    for work_id in wanted:
        if work_id not in WORKS:
            raise SystemExit(f"unknown work {work_id!r}; choose from {', '.join(WORKS)}")
        work = {**WORKS[work_id], "id": work_id}
        raw_dir = TEXTS / work_id / "raw"
        raw_dir.mkdir(parents=True, exist_ok=True)

        pages = work.get("pages") or list_pages(work["prefix"])
        texts: dict[str, str] = {}
        pending: list[str] = []
        for page in pages:
            cache = raw_dir / (re.sub(r"[^\w.-]+", "_", page)[:120] + ".wikitext")
            if cache.exists():
                texts[page] = cache.read_text(encoding="utf-8")
            elif args.offline:
                continue
            else:
                pending.append(page)

        if pending:
            fetched = fetch_wikitext(pending)
            for page, text in fetched.items():
                cache = raw_dir / (re.sub(r"[^\w.-]+", "_", page)[:120] + ".wikitext")
                cache.write_text(text, encoding="utf-8")
                texts[page] = text

        if not texts:
            print(f"  {work_id}: no pages (offline cache empty)")
            continue
        records, problems = ADAPTERS[work["adapter"]](work, texts)
        write_work(work_id, work, records, problems, args.offline)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
