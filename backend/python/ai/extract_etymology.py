"""
extract_etymology.py
---------------------
Phased-free, resumable batch pipeline that fills the word-level glossary
fields — `root` (வேர்ச்சொல்), `urichol` (உரிச்சொல்), `etymology`, `gloss` — for
every word in the normalized Sangam verse corpus, via the same OpenRouter /
Gemini 2.5 Flash route as translate_with_gemini.py.

This is the batch counterpart to the frontend's live fallback: WordGlossary.jsx
/ geminiApi.js already call a Cloud Function per click when a word has no
`root` yet. Pre-filling the corpus here means most clicks resolve instantly
from disk, and the live call only covers whatever this pipeline hasn't
reached (or a form the model updates its mind about later).

Unlike English/urai translation, a word's four fields can legitimately all be
null after a real annotation attempt (a bare particle has no root, no
urichol) — so per-word null-ness can't signal "not yet processed" the way an
empty `english` string can. Completeness is tracked per verse instead, via an
`etymologyMeta` block (mirrors `englishMeta`) written once every word in the
verse has been sent to the model and a response applied.

There's also no PHASES ladder here: each verse's word annotation is
self-contained (unlike English translation, no cross-poem quality gating is
needed), so poems are simply processed in the corpus's natural phase order
(reusing discovered_poems() from translate_with_gemini for that ordering).

Every run:
  1. rebuilds progress from disk (never trusts the state file's counters),
  2. picks a bounded batch of not-yet-annotated verses,
  3. asks the model, per verse, for a JSON array of word annotations,
  4. writes each verse back with `verified: false` and an `etymologyMeta`
     provenance block,
  5. refreshes the poem's combined JSON + datapackage stats,
  6. appends a run record to data/pipeline/etymology-state.json.

Usage:
    python -m ai.extract_etymology --status
    python -m ai.extract_etymology --limit 5 --dry-run
    python -m ai.extract_etymology --limit 50
    python -m ai.extract_etymology --poem mullaippattu

Requires the same environment as translate_with_gemini.py (OPENROUTER_API_KEY
by default; GEMINI_API_KEY if SANGAM_TRANSLATE_BACKEND=gemini).
"""

from __future__ import annotations

import argparse
import json
import os
import random
import sys
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

import requests

from ai.translate_with_gemini import (
    REPO_ROOT,
    TranslationError,
    discovered_poems,
    get_backend,
    load_verse,
    refresh_poem_artifacts,
    verse_files,
    write_json,
)

STATE_FILE = REPO_ROOT / "data" / "pipeline" / "etymology-state.json"

DEFAULT_LIMIT = 50  # lower than translate's 200 — each verse now returns a
# whole JSON array of per-word annotations, not one string, so it's a
# heavier response to generate and validate per unit of work.
DEFAULT_CONCURRENCY = 4

PROMPT_VERSION = "etymology-v1"
STATE_SCHEMA_VERSION = 1
MAX_RUN_HISTORY = 30

MAX_ATTEMPTS = 5
WORD_FIELDS = ("root", "urichol", "etymology", "gloss")


# --------------------------------------------------------------------------- #
# Corpus access
# --------------------------------------------------------------------------- #


def flatten_words(verse: dict) -> list[dict]:
    """All word dicts in a verse, in line/word reading order."""
    return [word for line in verse.get("lines", []) for word in line.get("words", [])]


def verse_is_annotated(verse: dict) -> bool:
    """A verse counts as done once a run has actually applied a result to it.

    Deliberately checks `etymologyMeta`, not the word fields themselves —
    root/urichol/etymology/gloss can all be genuinely null for a word (a bare
    particle has no root) even after a successful annotation pass.
    """
    return bool(verse.get("etymologyMeta"))


def poem_coverage(poem_id: str) -> dict:
    total = 0
    annotated = 0
    for path in verse_files(poem_id):
        verse = load_verse(path)
        if verse is None:
            continue
        total += 1
        if verse_is_annotated(verse):
            annotated += 1
    return {
        "poem": poem_id,
        "verses": total,
        "annotated": annotated,
        "remaining": total - annotated,
    }


def corpus_coverage() -> list[dict]:
    return [poem_coverage(poem_id) for poem_id in discovered_poems()]


def select_batch(
    limit: int, poem_filter: str | None = None, force: bool = False
) -> list[tuple]:
    """Pick up to `limit` verses needing annotation, in corpus order."""
    poems = [poem_filter] if poem_filter else discovered_poems()

    batch: list[tuple] = []
    for poem_id in poems:
        for path in verse_files(poem_id):
            if len(batch) >= limit:
                return batch
            verse = load_verse(path)
            if verse is None:
                continue
            if verse_is_annotated(verse) and not force:
                continue
            if not (verse.get("sangamTamil") or "").strip():
                continue
            if not flatten_words(verse):
                continue
            batch.append((path, verse))
    return batch


# --------------------------------------------------------------------------- #
# Prompting
# --------------------------------------------------------------------------- #

SYSTEM_PROMPT = (
    "You are a classical Tamil philologist specializing in Sangam-era "
    "(c. 300 BCE - 300 CE) vocabulary, etymology, and grammar."
)


def build_prompt(verse: dict) -> str:
    """Build the user prompt for one verse's word-level glossary."""
    words = flatten_words(verse)
    numbered = "\n".join(f"{i + 1}. {w.get('form', '')}" for i, w in enumerate(words))

    poem = verse.get("poem", "unknown")
    number = verse.get("number", "?")
    tinai = verse.get("tinai") or "unknown"
    urai = (verse.get("urai") or "").strip()
    context = f"\nModern Tamil prose (urai) for context:\n{urai}\n" if urai else ""

    return (
        f"For EVERY word below, from {poem} verse {number} (tiṇai: {tinai}), give:\n"
        "  - root: the root word (வேர்ச்சொல்) in Tamil script, or null if the form IS the root\n"
        "  - urichol: its grammatical/semantic class (உரிச்சொல்) if it is one, else null\n"
        "  - etymology: one short sentence on derivation, cognates, or semantic shift — null if nothing notable\n"
        "  - gloss: a brief English gloss (1-4 words)\n\n"
        f"Verse:\n{verse.get('sangamTamil', '').strip()}\n"
        f"{context}\n"
        f"Words, in order (annotate ALL {len(words)}, do not merge or split any):\n{numbered}\n\n"
        "Return ONLY a JSON array, one object per word, IN THE SAME ORDER, each shaped exactly as:\n"
        '{"form": "...", "root": "...", "urichol": "...", "etymology": "...", "gloss": "..."}\n'
        f"The array MUST have exactly {len(words)} elements. No markdown, no prose, no code fences."
    )


# --------------------------------------------------------------------------- #
# Response parsing
# --------------------------------------------------------------------------- #


class EtymologyError(RuntimeError):
    """A verse's word annotations could not be obtained or parsed."""


def _strip_code_fence(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        text = text.removesuffix("```")
    return text.strip()


def _clean(value) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text or text.lower() == "null":
        return None
    return text


def parse_annotations(raw: str, expected: int) -> list[dict]:
    """Parse the model's JSON array into normalized word-field dicts."""
    try:
        data = json.loads(_strip_code_fence(raw))
    except json.JSONDecodeError as exc:
        raise EtymologyError(f"invalid JSON: {exc}") from exc
    if not isinstance(data, list):
        raise EtymologyError("response is not a JSON array")
    if len(data) != expected:
        raise EtymologyError(f"expected {expected} word annotations, got {len(data)}")

    normalized = []
    for entry in data:
        if not isinstance(entry, dict):
            raise EtymologyError("array element is not an object")
        normalized.append({field: _clean(entry.get(field)) for field in WORD_FIELDS})
    return normalized


# --------------------------------------------------------------------------- #
# Model call + retry
# --------------------------------------------------------------------------- #


def annotate_once(backend, verse: dict) -> list[dict]:
    """Annotate one verse's words, retrying transient failures with backoff."""
    words = flatten_words(verse)
    if not words:
        raise EtymologyError("verse has no words")

    prompt = build_prompt(verse)
    last_error: Exception | None = None

    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            raw = backend.complete(prompt, system=SYSTEM_PROMPT)
            return parse_annotations(raw, len(words))
        except (TranslationError, requests.RequestException, EtymologyError) as exc:
            last_error = exc
            if attempt == MAX_ATTEMPTS:
                break
            delay = min(2**attempt, 30) + random.uniform(0, 1)
            time.sleep(delay)

    raise EtymologyError(f"{last_error} (after {MAX_ATTEMPTS} attempts)")


# --------------------------------------------------------------------------- #
# Writing results
# --------------------------------------------------------------------------- #


def apply_annotations(verse: dict, annotations: list[dict], backend, run_id: str) -> dict:
    """Return the verse with per-word annotations applied and provenance recorded.

    `verified` stays false: every AI draft is unverified until a scholar
    reviews it (docs/data-governance.md §2 and §5) — same convention as
    apply_translation() in translate_with_gemini.py.
    """
    words = flatten_words(verse)
    for word, annotation in zip(words, annotations):
        for field in WORD_FIELDS:
            word[field] = annotation[field]

    verse["verified"] = False
    verse["etymologyMeta"] = {
        "provider": backend.provider,
        "model": backend.model,
        "promptVersion": PROMPT_VERSION,
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "runId": run_id,
        "wordsAnnotated": len(words),
    }
    return verse


# --------------------------------------------------------------------------- #
# State / metadata
# --------------------------------------------------------------------------- #


def load_state() -> dict:
    if not STATE_FILE.exists():
        return {}
    try:
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def build_state(
    coverage: list[dict],
    model: str,
    provider: str,
    previous: dict | None = None,
    run_record: dict | None = None,
) -> dict:
    previous = previous or {}
    previous_poems = previous.get("poems") or {}

    poems: dict[str, dict] = {}
    for entry in coverage:
        prior = previous_poems.get(entry["poem"], {})
        if entry["verses"] == 0:
            status = "empty"
        elif entry["remaining"] == 0:
            status = "complete"
        elif entry["annotated"] > 0:
            status = "in-progress"
        else:
            status = "pending"
        poems[entry["poem"]] = {
            "verses": entry["verses"],
            "annotated": entry["annotated"],
            "remaining": entry["remaining"],
            "status": status,
            "lastRunAt": prior.get("lastRunAt"),
        }

    if run_record:
        finished = run_record.get("finishedAt")
        for poem_id in run_record.get("poems", []):
            if poem_id in poems:
                poems[poem_id]["lastRunAt"] = finished

    runs = list(previous.get("runs") or [])
    if run_record:
        runs.append(run_record)
    runs = runs[-MAX_RUN_HISTORY:]

    total_verses = sum(e["verses"] for e in coverage)
    total_done = sum(e["annotated"] for e in coverage)

    return {
        "schemaVersion": STATE_SCHEMA_VERSION,
        "pipeline": "etymology-extraction",
        "provider": provider,
        "model": model,
        "promptVersion": PROMPT_VERSION,
        "updatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "totals": {
            "verses": total_verses,
            "annotated": total_done,
            "remaining": total_verses - total_done,
        },
        "poems": poems,
        "runs": runs,
    }


# --------------------------------------------------------------------------- #
# Commands
# --------------------------------------------------------------------------- #


def print_status() -> None:
    coverage = corpus_coverage()

    print("Open Sangam — etymology glossary status\n")
    print(f"{'Poem':<24}{'Verses':>8}{'Done':>7}{'Left':>7}  Progress")
    print("-" * 66)
    for entry in coverage:
        pct = entry["annotated"] / entry["verses"] if entry["verses"] else 0
        bar = "█" * round(pct * 16) + "░" * (16 - round(pct * 16))
        print(
            f"{entry['poem']:<24}{entry['verses']:>8}"
            f"{entry['annotated']:>7}{entry['remaining']:>7}  {bar} {pct:>4.0%}"
        )

    total = sum(e["verses"] for e in coverage)
    done = sum(e["annotated"] for e in coverage)
    print("-" * 66)
    print(f"{'TOTAL':<24}{total:>8}{done:>7}{total - done:>7}")

    state = load_state()
    runs = state.get("runs") or []
    if runs:
        last = runs[-1]
        print(
            f"\nLast run: {last.get('finishedAt')} · "
            f"{last.get('annotated')} annotated, {last.get('failed')} failed"
        )


def run_extraction(args) -> int:
    batch = select_batch(args.limit, args.poem, args.force)
    if not batch:
        scope = f"poem {args.poem}" if args.poem else "the corpus"
        print(f"Nothing to annotate in {scope} — already complete.")
        return 0

    poems_in_batch = sorted({verse["poem"] for _, verse in batch})
    print(f"{len(batch)} verse(s) across {len(poems_in_batch)} poem(s): {', '.join(poems_in_batch)}")

    if args.dry_run:
        for _, verse in batch:
            print(f"  would annotate {verse['id']} ({len(flatten_words(verse))} words)")
        print("\nDry run — no API calls made, no files written.")
        return 0

    backend = get_backend()
    run_id = uuid.uuid4().hex[:12]
    started_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    print(f"Backend: {backend.provider} · model: {backend.model} · run {run_id}\n")

    failures: list[str] = []
    annotated: list[tuple] = []

    def work(item: tuple):
        path, verse = item
        try:
            annotations = annotate_once(backend, verse)
        except Exception as exc:  # noqa: BLE001 — one bad verse must not end a run
            return path, verse, None, f"{type(exc).__name__}: {exc}"
        return path, verse, annotations, None

    with ThreadPoolExecutor(max_workers=args.concurrency) as pool:
        for index, (path, verse, annotations, error) in enumerate(pool.map(work, batch), 1):
            if error:
                failures.append(f"{verse['id']}: {error}")
                print(f"  [{index}/{len(batch)}] ✗ {verse['id']} — {error}")
                continue
            apply_annotations(verse, annotations, backend, run_id)
            write_json(path, verse)
            annotated.append((path, verse))
            print(f"  [{index}/{len(batch)}] ✓ {verse['id']} ({len(annotations)} words)")

    for poem_id in poems_in_batch:
        refresh_poem_artifacts(poem_id)

    run_record = {
        "runId": run_id,
        "startedAt": started_at,
        "finishedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "trigger": os.getenv("SANGAM_RUN_TRIGGER", "manual"),
        "provider": backend.provider,
        "model": backend.model,
        "promptVersion": PROMPT_VERSION,
        "attempted": len(batch),
        "annotated": len(annotated),
        "failed": len(failures),
        "poems": poems_in_batch,
        "failures": failures[:20],
    }

    coverage = corpus_coverage()
    state = build_state(coverage, backend.model, backend.provider, previous=load_state(), run_record=run_record)
    write_json(STATE_FILE, state)

    print(
        f"\nDone. {len(annotated)} annotated, {len(failures)} failed. "
        f"Corpus: {state['totals']['annotated']}/{state['totals']['verses']} verses fully glossed."
    )

    return 1 if annotated == [] and failures else 0


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Batch extraction of per-word root/urichol/etymology/gloss via OpenRouter (Gemini 2.5 Flash)"
    )
    parser.add_argument("--poem", help="restrict to a single poem id")
    parser.add_argument(
        "--limit", type=int, default=DEFAULT_LIMIT, help=f"verses per run (default {DEFAULT_LIMIT})"
    )
    parser.add_argument(
        "--concurrency", type=int, default=DEFAULT_CONCURRENCY, help="parallel requests"
    )
    parser.add_argument("--dry-run", action="store_true", help="resolve the batch, make no calls")
    parser.add_argument("--force", action="store_true", help="re-annotate verses already glossed")
    parser.add_argument("--status", action="store_true", help="print coverage and exit")
    parser.add_argument(
        "--write-state",
        action="store_true",
        help="rebuild data/pipeline/etymology-state.json from disk and exit",
    )
    args = parser.parse_args()

    if args.status:
        print_status()
        return

    if args.write_state:
        coverage = corpus_coverage()
        state = build_state(
            coverage,
            os.getenv("SANGAM_TRANSLATE_MODEL", "google/gemini-2.5-flash"),
            os.getenv("SANGAM_TRANSLATE_BACKEND", "openrouter"),
            previous=load_state(),
        )
        write_json(STATE_FILE, state)
        print(f"Wrote {STATE_FILE.relative_to(REPO_ROOT)}")
        return

    sys.exit(run_extraction(args))


if __name__ == "__main__":
    main()
