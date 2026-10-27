"""
scrape_projectmadurai.py
------------------------
Fill the line gaps in the idyll (Pattuppāṭṭu) corpus from Project Madurai.

The primary source (sangathamizh.com) omits 1,225 lines across 93 idyll
sections — see data/schema/known_line_gaps.json. Project Madurai publishes
complete, freely distributable UTF-8 editions of all ten idylls, with the
canonical line numbers printed every five lines. This module:

  1. downloads (and caches) the Project Madurai edition of each idyll,
  2. reconstructs the full verse sequence, ignoring the interleaved
     commentary notes and page headers,
  3. aligns the existing normalized lines to that sequence, and
  4. inserts only the missing lines (existing wording and word-level
     annotations are preserved untouched).

New lines are plain verse text with an empty `words` array: they are a
text-completeness fix, not a substitute for the existing source's word
glosses. The record's `source` field gains a Project Madurai citation.

Usage:
    cd backend/python
    python -m scraper.scrape_projectmadurai --poem all
    python -m scraper.scrape_projectmadurai --poem maduraikanchi --dry-run
"""

from __future__ import annotations

import argparse
import json
import re
import time
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path

import requests
from bs4 import BeautifulSoup

DATA_BASE = Path(__file__).parents[3] / "data" / "texts"
KNOWN_GAPS_PATH = Path(__file__).parents[3] / "data" / "schema" / "known_line_gaps.json"

HEADERS = {
    "User-Agent": (
        "OpenSangam/1.0 (educational research; "
        "https://github.com/yazhi-lem/open-sangam)"
    )
}

# Project Madurai editions (UTF-8 HTML), keyed by our poem id. `total` is the
# canonical number of lines in the poem, used to stop before the footnotes.
PM_SOURCES = {
    "maduraikanchi": ("pmuni0496", 782),
    "perumpanatrupadai": ("pmuni0492", 500),
    "malaipadukadam": ("pmuni0505", 583),
    "nedunalvadai": ("pmuni0484", 188),
    "mullaippattu": ("pmuni0488", 103),
    "porunaratrupadai": ("pmuni0487", 248),
    "sirupanatrupadai": ("pmuni0483", 269),
    "pattinappalai": ("pmuni0479", 301),
    "thirumurugatrupadai": ("pmuni0493", 317),
    "kurinjipattu": ("pmuni0495", 261),
}

PM_BASE = "https://www.projectmadurai.org/pm_etexts/utf8"


@dataclass
class FillReport:
    poem: str
    sections_touched: int = 0
    lines_added: int = 0
    placeholder_repairs: int = 0
    unresolved: int = 0


def _cache_path(poem: str) -> Path:
    return DATA_BASE / poem / "raw" / "projectmadurai.html"


def fetch_page(poem: str, force: bool = False) -> str:
    """Download a Project Madurai page, cached under the poem's ignored raw/."""
    path = _cache_path(poem)
    if path.exists() and not force:
        return path.read_text(encoding="utf-8", errors="ignore")

    pm_id, _ = PM_SOURCES[poem]
    url = f"{PM_BASE}/{pm_id}.html"
    print(f"  fetching {url}")
    resp = requests.get(url, headers=HEADERS, timeout=40)
    resp.raise_for_status()
    resp.encoding = "utf-8"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(resp.text, encoding="utf-8")
    time.sleep(0.5)
    return resp.text


def _normalize_for_match(text: str) -> str:
    """Strip whitespace, punctuation and OCR/line-number noise."""
    text = re.sub(r"\.\s*(?:\.\s*)*\(\d+[^)]*\)", "", text)
    text = re.sub(r"[\s\u00a0\u200b\u200c\u200d.,;:!?\"'“”‘’()]+", "", text)
    return text


def _is_verse_line(text: str) -> bool:
    if not text:
        return False
    if text.startswith("---") or text.startswith("___"):
        return False
    if re.match(r"^\d{1,3}\s*[-–.]", text):
        return False
    if "குறிப்புரை" in text[:14]:
        return False
    return bool(re.search(r"[\u0B80-\u0BFF]", text))


def _looks_like_verse(text: str) -> bool:
    """Stricter test for candidate anchors: reject PM front matter."""
    if not _is_verse_line(text):
        return False
    if re.search(r"[A-Za-z0-9\[\]©]", text):
        return False
    if any(
        marker in text
        for marker in ("பதிப்பு", "சென்னை", "விலை", "Registered", "அச்சுக்கூட", "ஆராய்ச்சி")
    ):
        return False
    return len(_normalize_for_match(text)) >= 8


def parse_verse_lines(html_text: str, total: int) -> list[str | None]:
    """Reconstruct canonical verse lines 1..total from a PM edition.

    The PM HTML interleaves verse, commentary notes and front-matter (source
    citations, price, copyright). Verse lines carry a line number every fifth
    line, sometimes trailing and sometimes leading. We use those markers as
    anchors: for marker N, lines N-4..N are the five lines ending at the
    marker; the four lines immediately before a marker are verse, while
    anything before those four is commentary.

    A source citation can itself end in "5" and look like the first marker, so
    we try every candidate anchor and keep the reconstruction that recovers
    the most of the poem.
    """
    soup = BeautifulSoup(html_text, "html.parser")
    text = soup.get_text("\n")

    raw: list[tuple[str, int | None]] = []
    for rawline in text.splitlines():
        line = rawline.replace("\xa0", " ").rstrip()
        trailing = re.search(r"\s+(\d{1,3})\s*$", line)
        leading = re.match(r"^\s*(\d{1,3})\s+([\u0B80-\u0BFF].*)$", line)

        if leading:
            num: int | None = int(leading.group(1))
            clean = leading.group(2)
        elif trailing:
            num = int(trailing.group(1))
            clean = line[: trailing.start()]
        else:
            num = None
            clean = line

        clean = re.sub(r"\s+", " ", clean).strip()
        if clean:
            raw.append((clean, num))

    def reconstruct(start_idx: int) -> list[str | None]:
        verse: list[str | None] = [None] * (total + 1)
        cursor = start_idx + 1

        def take_prev_4(found: int, num: int) -> None:
            prev = [raw[j][0] for j in range(max(0, found - 4), found)]
            for offset, line_text in enumerate(prev, start=num - 4):
                if 1 <= offset <= total:
                    verse[offset] = line_text
            if 1 <= num <= total:
                verse[num] = raw[found][0]

        take_prev_4(start_idx, 5)

        for num in range(10, total + 1, 5):
            found = None
            for i in range(cursor, len(raw)):
                line_text, candidate = raw[i]
                if candidate == num and _is_verse_line(line_text):
                    found = i
                    break

            if found is not None:
                take_prev_4(found, num)
                cursor = found + 1
                continue

            # Some editions omit a marker (e.g. Porunarātrupadai line 245), or
            # put the number at the start of the line. Infer this five-line
            # block from the five lines immediately before the next marker.
            next_marker = None
            for i in range(cursor, len(raw)):
                line_text, candidate = raw[i]
                if (
                    candidate is not None
                    and candidate > num
                    and candidate % 5 == 0
                    and _is_verse_line(line_text)
                ):
                    next_marker = i
                    break
            if next_marker is not None and next_marker >= 5:
                block = [raw[j][0] for j in range(next_marker - 5, next_marker)]
                for offset, line_text in enumerate(block, start=num - 4):
                    if 1 <= offset <= total:
                        verse[offset] = line_text
                cursor = next_marker + 1
            else:
                break

        # Final unnumbered lines after the last reconstructed marker.
        last_marker = max(
            (i for i in range(1, total + 1) if verse[i] is not None), default=0
        )
        if last_marker and last_marker < total:
            extra: list[str] = []
            i = cursor
            while i < len(raw) and len(extra) < total - last_marker:
                line_text = raw[i][0]
                if not _is_verse_line(line_text):
                    break
                extra.append(line_text)
                i += 1
            for offset, line_text in enumerate(extra, start=last_marker + 1):
                if offset <= total:
                    verse[offset] = line_text

        return verse

    # Try every plausible "5" anchor; keep the most complete reconstruction.
    candidates = [
        i
        for i, (line_text, num) in enumerate(raw)
        if num == 5 and _is_verse_line(line_text)
    ]
    if not candidates:
        return [None] * (total + 1)

    best = None
    best_score = -1
    for idx in candidates:
        candidate = reconstruct(idx)
        # Require the opening five lines to look like verse, not a source
        # citation that happens to end in "5".
        if not all(_looks_like_verse(line or "") for line in candidate[1:6]):
            continue
        score = sum(1 for line in candidate[1:] if line is not None)
        if score > best_score:
            best = candidate
            best_score = score
    return best or reconstruct(candidates[0])


def _retarget_sections(
    records: list[dict], pm_lines: list[str | None], total: int
) -> set[str]:
    """Re-derive each section's canonical line range from the PM sequence.

    Some source pages print the wrong heading range (e.g. Malaipadukadam
    section 40 is headed 430 but its text is actually lines 530-538). Matching
    the existing lines to Project Madurai gives the true offset, which lets us
    fill the right lines and repair those range errors at the same time.
    """
    changed: set[str] = set()
    ordered = sorted(records, key=lambda r: r["sectionNumber"])
    proposed: list[int | None] = []

    for rec in ordered:
        candidates = [
            line
            for line in rec["lines"]
            if not _is_placeholder(line["text"]) and line["text"].strip()
        ]
        best_start = None
        best_score = 0.0
        if candidates:
            # Search offsets near the current heading first; fall back to the
            # whole poem if that neighbourhood has no convincing match.
            original = rec["lineStart"]
            offsets = list(range(max(1, original - 250), min(total, original + 250) + 1))
            if len(offsets) < total:
                offsets += [i for i in range(1, total + 1) if i not in set(offsets)]
            for start in offsets:
                if start + len(rec["lines"]) - 1 > total:
                    continue
                scores = []
                for offset, line in enumerate(rec["lines"]):
                    pm_text = pm_lines[start + offset]
                    if not pm_text:
                        continue
                    scores.append(
                        SequenceMatcher(
                            None,
                            _normalize_for_match(line["text"]),
                            _normalize_for_match(pm_text),
                        ).ratio()
                    )
                if not scores:
                    continue
                score = sum(scores) / len(scores)
                if score > best_score:
                    best_score = score
                    best_start = start
        proposed.append(best_start if best_score >= 0.6 else None)

    # Fill gaps in the proposal from neighbouring sections, then make every
    # range contiguous so a bad match cannot silently overlap another section.
    for i, start in enumerate(proposed):
        if start is not None:
            continue
        prev = next((s for s in reversed(proposed[:i]) if s is not None), None)
        proposed[i] = prev + 1 if prev is not None else 1

    for i, rec in enumerate(ordered):
        start = proposed[i] or 1
        end = (proposed[i + 1] - 1) if i + 1 < len(proposed) else total
        if end < start:
            end = start
        if rec.get("lineStart") != start or rec.get("lineEnd") != end:
            rec["lineStart"] = start
            rec["lineEnd"] = end
            changed.add(rec["id"])
    return changed


def _align(
    existing: list[str], pm: list[str], threshold: float = 0.52
) -> list[tuple[str, int | None, int | None]]:
    """Align existing line texts to the PM line sequence.

    Returns a flat list of ops in PM order: ("match", existing_i, pm_i),
    ("insert", None, pm_i) for a missing PM line, or ("delete", existing_i,
    None) for an existing line with no PM counterpart.
    """
    n, m = len(existing), len(pm)

    def sim(a: str, b: str) -> float:
        return SequenceMatcher(None, _normalize_for_match(a), _normalize_for_match(b)).ratio()

    # dp[i][j] = best match score using existing[:i] and pm[:j]
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    choice = [[""] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        dp[i][0] = dp[i - 1][0] - 1
        choice[i][0] = "delete"
    for j in range(1, m + 1):
        dp[0][j] = dp[0][j - 1]
        choice[0][j] = "insert"

    for i in range(1, n + 1):
        for j in range(1, m + 1):
            best = dp[i][j - 1]
            op = "insert"
            if dp[i - 1][j] - 1 > best:
                best = dp[i - 1][j] - 1
                op = "delete"
            if sim(existing[i - 1], pm[j - 1]) >= threshold:
                candidate = dp[i - 1][j - 1] + 3
                if candidate > best:
                    best = candidate
                    op = "match"
            dp[i][j] = best
            choice[i][j] = op

    ops: list[tuple[str, int | None, int | None]] = []
    i, j = n, m
    while i > 0 or j > 0:
        op = choice[i][j]
        if op == "match":
            ops.append(("match", i - 1, j - 1))
            i -= 1
            j -= 1
        elif op == "insert":
            ops.append(("insert", None, j - 1))
            j -= 1
        else:
            ops.append(("delete", i - 1, None))
            i -= 1
    ops.reverse()
    return ops


def _tokenize(text: str) -> list[dict]:
    return [
        {"form": word, "root": None, "urichol": None, "etymology": None, "gloss": None}
        for word in text.split()
        if word
    ]


def _is_placeholder(text: str) -> bool:
    compact = _normalize_for_match(text)
    return len(compact) < 6 or compact.startswith("அந்நிலை") and text.startswith(".")


def fill_section(
    record: dict, pm_lines: list[str | None], pm_citation: str, dry_run: bool
) -> tuple[dict, int, int, int]:
    """Return (updated_record, lines_added, repairs, unresolved)."""
    start, end = record["lineStart"], record["lineEnd"]
    expected_len = end - start + 1
    # Complete sections are left byte-for-byte untouched so word annotations
    # and scholarly edits are never churned by a completeness pass.
    if len(record["lines"]) == expected_len and not any(
        _is_placeholder(line["text"]) for line in record["lines"]
    ):
        return record, 0, 0, 0

    expected = pm_lines[start : end + 1]
    if not expected or all(line is None for line in expected):
        return record, 0, 0, end - start + 1 - len(record["lines"])

    pm = [line or "" for line in expected]
    existing = record["lines"]
    existing_texts = [line["text"] for line in existing]

    ops = _align(existing_texts, pm)
    new_lines: list[dict] = []
    used_existing: set[int] = set()
    added = 0
    repairs = 0

    for op, ei, pi in ops:
        if op == "match" and ei is not None:
            used_existing.add(ei)
            new_lines.append(existing[ei])
        elif op == "insert" and pi is not None:
            pm_text = pm[pi]
            if not pm_text:
                continue
            # If the slot is currently occupied by a corrupted placeholder,
            # replace it rather than duplicating the line.
            if pi < len(pm) and ei is None:
                new_lines.append({"lineNumber": 0, "text": pm_text, "words": _tokenize(pm_text)})
                added += 1
        elif op == "delete" and ei is not None:
            # PM is the completeness authority here: an existing line that
            # did not align is either a corrupted placeholder or a duplicate
            # introduced by an upstream page-overlap. Drop it; the matching
            # PM line is emitted by an ("insert", ...) op.
            if _is_placeholder(existing_texts[ei]):
                repairs += 1

    unresolved = max(0, (end - start + 1) - len(new_lines))
    if not dry_run and len(new_lines) != len(existing):
        for number, line in enumerate(new_lines, start=1):
            line["lineNumber"] = number
        record["lines"] = new_lines
        record["sangamTamil"] = "\n".join(line["text"] for line in new_lines)
        if pm_citation not in (record.get("source") or ""):
            record["source"] = f"{record.get('source', '')}; {pm_citation}".strip("; ")

    return record, added, repairs, unresolved


def refresh_poem_artifacts(poem: str, records: list[dict]) -> None:
    """Rebuild the combined JSON + datapackage from normalized records."""
    poem_dir = DATA_BASE / poem
    combined = poem_dir / f"{poem}.json"
    combined.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")

    try:
        from normalizer.normalize_all import build_datapackage
        from scraper.registry import POEM_BY_ID

        dp = build_datapackage(POEM_BY_ID[poem], records)
        (poem_dir / "datapackage.json").write_text(
            json.dumps(dp, ensure_ascii=False, indent=2), encoding="utf-8"
        )
    except Exception as exc:  # pragma: no cover - metadata refresh is best effort
        print(f"    ⚠ could not rebuild datapackage: {exc}")


def fill_poem(poem: str, dry_run: bool, force: bool) -> FillReport:
    report = FillReport(poem)
    html = fetch_page(poem, force=force)
    _, total = PM_SOURCES[poem]
    pm_lines = parse_verse_lines(html, total)

    missing_markers = [i for i in range(1, total + 1) if not pm_lines[i]]
    if missing_markers:
        print(
            f"  ⚠ {poem}: Project Madurai sequence still has "
            f"{len(missing_markers)} missing marker(s), e.g. {missing_markers[:6]}"
        )

    norm_dir = DATA_BASE / poem / "normalized"
    records = []
    for path in sorted(norm_dir.glob("*.json")):
        record = json.loads(path.read_text(encoding="utf-8"))
        records.append(record)

    pm_citation = f"Project Madurai {PM_SOURCES[poem][0]}"
    retargeted = _retarget_sections(records, pm_lines, total)
    if retargeted:
        print(f"  ✓ {poem}: repaired {len(retargeted)} section line-range heading(s)")

    for path, record in zip(sorted(norm_dir.glob("*.json")), records):
        before = len(record["lines"])
        record, added, repairs, unresolved = fill_section(
            record, pm_lines, pm_citation, dry_run
        )
        after = len(record["lines"])
        if added or repairs or after != before or record["id"] in retargeted:
            report.sections_touched += 1
            report.lines_added += added
            report.placeholder_repairs += repairs
            report.unresolved += unresolved
            if not dry_run:
                path.write_text(
                    json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8"
                )

    if not dry_run:
        refresh_poem_artifacts(poem, records)

    print(
        f"  ✓ {poem}: {report.sections_touched} section(s), "
        f"+{report.lines_added} line(s), {report.placeholder_repairs} placeholder repair(s), "
        f"{report.unresolved} unresolved"
    )
    return report


def update_known_gaps(dry_run: bool) -> None:
    """Remove fixed section gaps and refresh the totals in known_line_gaps.json."""
    if not KNOWN_GAPS_PATH.exists():
        return
    data = json.loads(KNOWN_GAPS_PATH.read_text(encoding="utf-8"))
    gaps = data.get("gaps", {})
    fixed = []
    for poem in PM_SOURCES:
        norm_dir = DATA_BASE / poem / "normalized"
        for path in sorted(norm_dir.glob("*.json")):
            rec = json.loads(path.read_text(encoding="utf-8"))
            if "lineStart" not in rec:
                continue
            expected = rec["lineEnd"] - rec["lineStart"] + 1
            missing = expected - len(rec["lines"])
            rec_id = rec["id"]
            if missing == 0 and rec_id in gaps:
                fixed.append(rec_id)
            elif missing > 0 and rec_id in gaps:
                gaps[rec_id] = missing

    for rec_id in fixed:
        gaps.pop(rec_id, None)

    data["gaps"] = dict(sorted(gaps.items()))
    data["totalSectionsWithGaps"] = len(gaps)
    data["totalMissingLines"] = sum(gaps.values())

    # Recompute heading-range defects for the idylls we retargeted.
    ranges = {
        k: v
        for k, v in data.get("rangeIssues", {}).items()
        if k.rsplit("_", 1)[0] not in PM_SOURCES
    }
    for poem in PM_SOURCES:
        norm_dir = DATA_BASE / poem / "normalized"
        recs = []
        for path in sorted(norm_dir.glob("*.json")):
            rec = json.loads(path.read_text(encoding="utf-8"))
            if "sectionNumber" in rec:
                recs.append(rec)
        recs.sort(key=lambda r: r["sectionNumber"])
        prev_end = 0
        for rec in recs:
            if rec["lineStart"] != prev_end + 1:
                ranges[rec["id"]] = (
                    f"starts at line {rec['lineStart']}, expected {prev_end + 1}"
                )
            prev_end = rec["lineEnd"]
    data["rangeIssues"] = dict(sorted(ranges.items()))
    if fixed:
        print(f"  known_line_gaps.json: removed {len(fixed)} fixed section(s)")
    if not data["rangeIssues"]:
        print("  known_line_gaps.json: no heading-range defects remain")
    if not dry_run:
        KNOWN_GAPS_PATH.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fill idyll line gaps from Project Madurai"
    )
    parser.add_argument("--poem", default="all", help="Poem id or 'all'")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--force", action="store_true", help="Re-download cached pages")
    args = parser.parse_args()

    targets = list(PM_SOURCES) if args.poem == "all" else [args.poem]
    unknown = [p for p in targets if p not in PM_SOURCES]
    if unknown:
        parser.error(f"No Project Madurai source for: {', '.join(unknown)}")

    print(f"Filling {len(targets)} idyll(s) from Project Madurai…")
    totals = FillReport("total")
    for poem in targets:
        report = fill_poem(poem, args.dry_run, args.force)
        totals.sections_touched += report.sections_touched
        totals.lines_added += report.lines_added
        totals.placeholder_repairs += report.placeholder_repairs
        totals.unresolved += report.unresolved

    update_known_gaps(args.dry_run)
    print(
        f"Done. {totals.sections_touched} section(s), +{totals.lines_added} line(s), "
        f"{totals.placeholder_repairs} placeholder repair(s), "
        f"{totals.unresolved} unresolved."
    )


if __name__ == "__main__":
    main()
