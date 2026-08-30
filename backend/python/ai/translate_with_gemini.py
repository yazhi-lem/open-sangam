"""
translate_with_gemini.py
------------------------
Phased, resumable batch pipeline that fills the `english` field of the
normalized Sangam verse corpus with Gemini 2.5 Flash drafts, reached through
**OpenRouter** (the same route and the same model the Sangam Avai agents use —
see agents/avai/config.py).

Every run:
  1. rebuilds progress from disk (never trusts the state file's counters),
  2. picks a bounded batch from the *current phase* only,
  3. translates it concurrently with retries,
  4. writes each verse back with `verified: false` and an `englishMeta`
     provenance block (docs/data-governance.md §2),
  5. refreshes the poem's combined JSON + datapackage stats,
  6. appends a run record to data/pipeline/translation-state.json.

Usage:
    python -m ai.translate_with_gemini --status
    python -m ai.translate_with_gemini --lang english --limit 5 --dry-run
    python -m ai.translate_with_gemini --lang english --limit 200
    python -m ai.translate_with_gemini --lang english --poem mullaippattu

Requires (openrouter backend, the default):
    OPENROUTER_API_KEY   — https://openrouter.ai/keys
Requires (gemini backend, SANGAM_TRANSLATE_BACKEND=gemini):
    GEMINI_API_KEY
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
from pathlib import Path
from typing import Iterable, Optional

import requests
from dotenv import load_dotenv

# Anchor to this file's directory rather than the cwd, so the key loads whether
# the module is run from backend/python/ (normal) or from the repo root (CI).
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

REPO_ROOT = Path(__file__).resolve().parents[3]
DATA_BASE = REPO_ROOT / "data" / "texts"
STATE_FILE = REPO_ROOT / "data" / "pipeline" / "translation-state.json"

DEFAULT_MODEL = "google/gemini-2.5-flash"
DEFAULT_API_BASE = "https://openrouter.ai/api/v1"
DEFAULT_LIMIT = 200
DEFAULT_CONCURRENCY = 4

PROMPT_VERSION = "english-v1"
STATE_SCHEMA_VERSION = 1
MAX_RUN_HISTORY = 30

MAX_ATTEMPTS = 5
RETRY_STATUS = {408, 409, 429, 500, 502, 503, 504}
REQUEST_TIMEOUT = 120

# Ordered translation phases: smallest, most self-contained poems first, so
# quality problems surface on a few hundred verses instead of a few thousand.
# A run only draws from the current phase; the phase advances automatically
# once every poem in it reaches full English coverage.
PHASES: list[dict] = [
    {
        "phase": 1,
        "name": "Ten Idylls (பத்துப்பாட்டு)",
        "poems": [
            "mullaippattu",
            "nedunalvadai",
            "porunaratrupadai",
            "kurinjipattu",
            "sirupanatrupadai",
            "pattinappalai",
            "thirumurugatrupadai",
            "perumpanatrupadai",
            "malaipadukadam",
            "maduraikanchi",
        ],
    },
    {
        "phase": 2,
        "name": "Shorter anthologies (எட்டுத்தொகை)",
        "poems": ["paripadal", "pathitrupathu", "kalithokai", "akananooru"],
    },
    {
        "phase": 3,
        "name": "Large anthologies (எட்டுத்தொகை)",
        "poems": ["purananooru", "natrinai", "kurunthokai", "ainkurunooru"],
    },
]

FIELD_FOR_LANG = {"english": "english", "urai": "urai"}


# --------------------------------------------------------------------------- #
# Corpus access
# --------------------------------------------------------------------------- #


def phase_for_poem(poem_id: str) -> Optional[int]:
    """Return the phase number a poem belongs to, or None if unphased."""
    for phase in PHASES:
        if poem_id in phase["poems"]:
            return phase["phase"]
    return None


def phased_poem_order() -> list[str]:
    """Every poem named in PHASES, in phase order."""
    return [poem for phase in PHASES for poem in phase["poems"]]


def verse_files(poem_id: str) -> list[Path]:
    """Sorted normalized verse files for a poem.

    Non-verse files (a stray datapackage.json has been seen inside
    ainkurunooru/normalized/) are filtered out by the caller via `load_verse`,
    which returns None for anything lacking an `id`.
    """
    normalized_dir = DATA_BASE / poem_id / "normalized"
    if not normalized_dir.is_dir():
        return []
    return sorted(normalized_dir.glob("*.json"))


def load_verse(path: Path) -> Optional[dict]:
    """Load a normalized verse record, or None if the file is not a verse."""
    try:
        record = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None
    if not isinstance(record, dict) or not record.get("id"):
        return None
    return record


def discovered_poems() -> list[str]:
    """Poem ids present on disk, phase-ordered first, then any unphased extras."""
    on_disk = {p.parent.name for p in DATA_BASE.glob("*/normalized")}
    ordered = [poem for poem in phased_poem_order() if poem in on_disk]
    extras = sorted(on_disk - set(ordered))
    return ordered + extras


def poem_coverage(poem_id: str, field: str = "english") -> dict:
    """Count verses and how many already carry `field`, straight from disk."""
    total = 0
    filled = 0
    for path in verse_files(poem_id):
        verse = load_verse(path)
        if verse is None:
            continue
        total += 1
        if verse.get(field):
            filled += 1
    return {
        "poem": poem_id,
        "verses": total,
        "translated": filled,
        "remaining": total - filled,
        "phase": phase_for_poem(poem_id),
    }


def corpus_coverage(field: str = "english") -> list[dict]:
    return [poem_coverage(poem_id, field) for poem_id in discovered_poems()]


# --------------------------------------------------------------------------- #
# Phase + batch selection
# --------------------------------------------------------------------------- #


def resolve_phase(coverage: Iterable[dict], forced: Optional[int] = None) -> Optional[int]:
    """Return the phase to work on.

    The lowest-numbered phase that still has untranslated verses. Returns None
    once every phase is complete. `forced` short-circuits the auto-advance.
    """
    if forced is not None:
        return forced
    remaining_by_poem = {c["poem"]: c["remaining"] for c in coverage}
    for phase in PHASES:
        if any(remaining_by_poem.get(poem, 0) > 0 for poem in phase["poems"]):
            return phase["phase"]
    return None


def select_batch(
    field: str,
    phase: Optional[int],
    limit: int,
    poem_filter: Optional[str] = None,
    force: bool = False,
) -> list[tuple[Path, dict]]:
    """Pick up to `limit` verses needing translation, in phase/poem/verse order."""
    if poem_filter and poem_filter != "all":
        poems = [poem_filter]
    elif phase is None:
        poems = []
    else:
        phase_def = next((p for p in PHASES if p["phase"] == phase), None)
        poems = phase_def["poems"] if phase_def else []

    batch: list[tuple[Path, dict]] = []
    for poem_id in poems:
        for path in verse_files(poem_id):
            if len(batch) >= limit:
                return batch
            verse = load_verse(path)
            if verse is None:
                continue
            if verse.get(field) and not force:
                continue
            if not (verse.get("sangamTamil") or "").strip():
                continue
            batch.append((path, verse))
    return batch


# --------------------------------------------------------------------------- #
# Prompting
# --------------------------------------------------------------------------- #

SYSTEM_PROMPT = (
    "You are a classical Tamil scholar and literary translator specializing in "
    "Sangam literature (c. 300 BCE - 300 CE)."
)

# Conventions below follow docs/editorial-style-guide.md §2.
STYLE_RULES_ENGLISH = (
    "- Aim for a literary rather than a word-for-word literal rendering.\n"
    "- Keep Tamil proper nouns, transliterated in ISO 15919 (e.g. Neytal, Cōḻa).\n"
    "- Use present tense for nature imagery and past tense for narrative.\n"
    "- Preserve poetic nuance and cultural context; do not add explanation.\n"
)

STYLE_RULES_URAI = (
    "- Write clear, contemporary Tamil prose; avoid archaic constructions.\n"
    "- Keep proper nouns (kings, places) in their original Tamil.\n"
    "- Break long Sangam lines into natural prose sentences.\n"
)


def build_prompt(verse: dict, target_lang: str) -> str:
    """Build the user prompt for one verse.

    The verse's existing modern-Tamil `urai` is supplied as supporting context
    when present (2,529 of 2,553 records carry one) — it disambiguates archaic
    vocabulary and measurably improves the English draft.
    """
    if target_lang == "urai":
        target = "contemporary Tamil prose (உரை — a clear modern retelling)"
        rules = STYLE_RULES_URAI
        context = ""
    else:
        target = "contemporary literary English"
        rules = STYLE_RULES_ENGLISH
        urai = (verse.get("urai") or "").strip()
        context = (
            f"\nModern Tamil prose (urai) for this verse, as supporting context:\n{urai}\n"
            if urai
            else ""
        )

    poem = verse.get("poem", "unknown")
    number = verse.get("number", "?")
    tinai = verse.get("tinai") or "unknown"

    return (
        f"Translate the following Sangam Tamil verse into {target}.\n\n"
        f"Source: {poem} verse {number} (tiṇai: {tinai})\n\n"
        f"Verse:\n{verse.get('sangamTamil', '').strip()}\n"
        f"{context}\n"
        f"Style requirements:\n{rules}\n"
        "Return ONLY the translation itself — no preamble, no notes, no quotes, "
        "no markdown formatting."
    )


# --------------------------------------------------------------------------- #
# Model backends
# --------------------------------------------------------------------------- #


class TranslationError(RuntimeError):
    """A verse could not be translated after all retries."""


class OpenRouterBackend:
    """Chat-completions client for OpenRouter.

    Uses plain `requests` (already a dependency) rather than litellm — the
    agents need litellm for ADK model objects, a batch script does not.
    """

    provider = "openrouter"

    def __init__(self, model: str, api_key: str, api_base: str):
        self.model = model
        self.api_base = api_base.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                # OpenRouter uses these for attribution on its dashboards.
                "HTTP-Referer": "https://github.com/yazhi-lem/open-sangam",
                "X-Title": "Open Sangam",
            }
        )

    def complete(self, prompt: str, system: str | None = None) -> str:
        response = self.session.post(
            f"{self.api_base}/chat/completions",
            json={
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system or SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.3,
            },
            timeout=REQUEST_TIMEOUT,
        )
        if response.status_code in RETRY_STATUS:
            raise TranslationError(f"HTTP {response.status_code}: {response.text[:200]}")
        response.raise_for_status()
        payload = response.json()
        choices = payload.get("choices") or []
        if not choices:
            raise TranslationError(f"no choices in response: {str(payload)[:200]}")
        return (choices[0].get("message", {}).get("content") or "").strip()


class GeminiBackend:
    """Direct google-generativeai path, kept for existing GEMINI_API_KEY setups."""

    provider = "gemini"

    def __init__(self, model: str, api_key: str):
        import google.generativeai as genai  # imported lazily: optional dependency

        genai.configure(api_key=api_key)
        self.model = model
        self._model = genai.GenerativeModel(model)

    def complete(self, prompt: str, system: str | None = None) -> str:
        response = self._model.generate_content(f"{system or SYSTEM_PROMPT}\n\n{prompt}")
        return (response.text or "").strip()


def get_backend():
    """Return the translation backend selected by env vars.

    Mirrors the contract in agents/avai/config.py so a single OPENROUTER_API_KEY
    serves both the agents and this pipeline.
    """
    backend = os.getenv("SANGAM_TRANSLATE_BACKEND", "openrouter")

    if backend == "gemini":
        model = os.getenv("SANGAM_TRANSLATE_MODEL", "gemini-2.5-flash")
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise SystemExit("GEMINI_API_KEY is not set (SANGAM_TRANSLATE_BACKEND=gemini)")
        return GeminiBackend(model, api_key)

    if backend == "openrouter":
        model = os.getenv("SANGAM_TRANSLATE_MODEL", DEFAULT_MODEL)
        api_key = os.getenv("OPENROUTER_API_KEY")
        api_base = os.getenv("OPENROUTER_API_BASE", DEFAULT_API_BASE)
        if not api_key:
            raise SystemExit(
                "OPENROUTER_API_KEY is not set — get one at https://openrouter.ai/keys "
                "and put it in backend/python/.env"
            )
        return OpenRouterBackend(model, api_key, api_base)

    raise SystemExit(
        f"Unknown SANGAM_TRANSLATE_BACKEND={backend!r}; expected 'openrouter' or 'gemini'"
    )


def translate_once(backend, verse: dict, target_lang: str) -> str:
    """Translate one verse, retrying transient failures with backoff + jitter."""
    prompt = build_prompt(verse, target_lang)
    last_error: Optional[Exception] = None

    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            text = (backend.complete(prompt) or "").strip()
            if not text:
                raise TranslationError("empty response")
            if text == (verse.get("sangamTamil") or "").strip():
                raise TranslationError("model echoed the source verse")
            return text
        except (TranslationError, requests.RequestException) as exc:
            last_error = exc
            if attempt == MAX_ATTEMPTS:
                break
            delay = min(2**attempt, 30) + random.uniform(0, 1)
            time.sleep(delay)

    raise TranslationError(f"{last_error} (after {MAX_ATTEMPTS} attempts)")


# --------------------------------------------------------------------------- #
# Writing results
# --------------------------------------------------------------------------- #


def write_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def apply_translation(
    verse: dict, field: str, text: str, backend, run_id: str
) -> dict:
    """Return the verse with the draft applied and provenance recorded.

    `verified` stays false: every AI draft is unverified until a scholar reviews
    it (docs/data-governance.md §2 and §5).
    """
    verse[field] = text
    verse["verified"] = False
    if field == "english":
        verse["englishMeta"] = {
            "provider": backend.provider,
            "model": backend.model,
            "promptVersion": PROMPT_VERSION,
            "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "runId": run_id,
        }
    return verse


def refresh_poem_artifacts(poem_id: str) -> None:
    """Rebuild the combined poem JSON and datapackage stats from normalized files.

    Deliberately does not call normalizer.normalize_all — that re-derives from
    data/texts/*/raw/, which is gitignored and absent in CI. (normalize_all now
    merges AI-generated fields forward when raw/ is present, so it would no
    longer discard the translations this script just wrote — but it's still
    the wrong tool here: a nightly translation run shouldn't depend on raw/
    existing at all.)
    """
    records = []
    for path in verse_files(poem_id):
        verse = load_verse(path)
        if verse is not None:
            records.append(verse)
    if not records:
        return
    records.sort(key=lambda r: (r.get("number") or 0, r.get("id") or ""))

    combined = DATA_BASE / poem_id / f"{poem_id}.json"
    if combined.exists():
        write_json(combined, records)

    datapackage = DATA_BASE / poem_id / "datapackage.json"
    if datapackage.exists():
        try:
            package = json.loads(datapackage.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return
        stats = package.setdefault("stats", {})
        stats["records"] = len(records)
        stats["withUrai"] = sum(1 for r in records if r.get("urai"))
        stats["withEnglish"] = sum(1 for r in records if r.get("english"))
        write_json(datapackage, package)


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
    current_phase: Optional[int],
    model: str,
    provider: str,
    previous: Optional[dict] = None,
    run_record: Optional[dict] = None,
) -> dict:
    """Assemble the state document.

    Counters are always derived from `coverage` (i.e. from disk), never carried
    over from the previous file — a hand edit or a partial commit cannot
    corrupt progress. Only the run history is inherited.
    """
    previous = previous or {}
    previous_poems = previous.get("poems") or {}

    poems: dict[str, dict] = {}
    for entry in coverage:
        prior = previous_poems.get(entry["poem"], {})
        if entry["verses"] == 0:
            status = "empty"
        elif entry["remaining"] == 0:
            status = "complete"
        elif entry["translated"] > 0:
            status = "in-progress"
        else:
            status = "pending"
        poems[entry["poem"]] = {
            "phase": entry["phase"],
            "verses": entry["verses"],
            "translated": entry["translated"],
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
    total_done = sum(e["translated"] for e in coverage)

    return {
        "schemaVersion": STATE_SCHEMA_VERSION,
        "pipeline": "english-translation",
        "provider": provider,
        "model": model,
        "promptVersion": PROMPT_VERSION,
        "updatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "currentPhase": current_phase,
        "phases": [
            {"phase": p["phase"], "name": p["name"], "poems": p["poems"]} for p in PHASES
        ],
        "totals": {
            "verses": total_verses,
            "translated": total_done,
            "remaining": total_verses - total_done,
        },
        "poems": poems,
        "runs": runs,
    }


# --------------------------------------------------------------------------- #
# Commands
# --------------------------------------------------------------------------- #


def print_status(field: str) -> None:
    coverage = corpus_coverage(field)
    phase = resolve_phase(coverage)

    print(f"Open Sangam — {field} translation status\n")
    print(f"{'Poem':<24}{'Phase':>6}{'Verses':>8}{'Done':>7}{'Left':>7}  Progress")
    print("-" * 72)
    for entry in coverage:
        pct = entry["translated"] / entry["verses"] if entry["verses"] else 0
        bar = "█" * round(pct * 16) + "░" * (16 - round(pct * 16))
        phase_label = entry["phase"] if entry["phase"] is not None else "-"
        print(
            f"{entry['poem']:<24}{phase_label!s:>6}{entry['verses']:>8}"
            f"{entry['translated']:>7}{entry['remaining']:>7}  {bar} {pct:>4.0%}"
        )

    total = sum(e["verses"] for e in coverage)
    done = sum(e["translated"] for e in coverage)
    print("-" * 72)
    print(f"{'TOTAL':<24}{'':>6}{total:>8}{done:>7}{total - done:>7}")
    print()
    if phase is None:
        print("All phases complete — nothing left to translate.")
    else:
        phase_def = next(p for p in PHASES if p["phase"] == phase)
        print(f"Current phase: {phase} — {phase_def['name']}")

    state = load_state()
    runs = state.get("runs") or []
    if runs:
        last = runs[-1]
        print(
            f"Last run: {last.get('finishedAt')} · phase {last.get('phase')} · "
            f"{last.get('translated')} translated, {last.get('failed')} failed"
        )


def run_translation(args) -> int:
    field = FIELD_FOR_LANG[args.lang]
    coverage = corpus_coverage(field)
    phase = resolve_phase(coverage, args.phase)

    if phase is None and not args.poem:
        print("All phases complete — nothing to translate.")
        return 0

    batch = select_batch(field, phase, args.limit, args.poem, args.force)
    if not batch:
        scope = f"poem {args.poem}" if args.poem else f"phase {phase}"
        print(f"Nothing to translate in {scope} — already complete.")
        return 0

    poems_in_batch = sorted({verse["poem"] for _, verse in batch})
    print(
        f"Phase {phase} · {len(batch)} verse(s) across {len(poems_in_batch)} poem(s): "
        f"{', '.join(poems_in_batch)}"
    )

    if args.dry_run:
        for _, verse in batch:
            print(f"  would translate {verse['id']}")
        print("\nDry run — no API calls made, no files written.")
        return 0

    backend = get_backend()
    run_id = uuid.uuid4().hex[:12]
    started_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    print(f"Backend: {backend.provider} · model: {backend.model} · run {run_id}\n")

    failures: list[str] = []
    translated: list[tuple[Path, dict]] = []

    def work(item: tuple[Path, dict]):
        path, verse = item
        try:
            text = translate_once(backend, verse, args.lang)
        except Exception as exc:  # noqa: BLE001 — one bad verse must not end a nightly run
            return path, verse, None, f"{type(exc).__name__}: {exc}"
        return path, verse, text, None

    with ThreadPoolExecutor(max_workers=args.concurrency) as pool:
        for index, (path, verse, text, error) in enumerate(pool.map(work, batch), 1):
            if error:
                failures.append(f"{verse['id']}: {error}")
                print(f"  [{index}/{len(batch)}] ✗ {verse['id']} — {error}")
                continue
            apply_translation(verse, field, text, backend, run_id)
            write_json(path, verse)
            translated.append((path, verse))
            print(f"  [{index}/{len(batch)}] ✓ {verse['id']}")

    for poem_id in poems_in_batch:
        refresh_poem_artifacts(poem_id)

    run_record = {
        "runId": run_id,
        "startedAt": started_at,
        "finishedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "phase": phase,
        "trigger": os.getenv("SANGAM_RUN_TRIGGER", "manual"),
        "field": field,
        "provider": backend.provider,
        "model": backend.model,
        "promptVersion": PROMPT_VERSION,
        "attempted": len(batch),
        "translated": len(translated),
        "failed": len(failures),
        "poems": poems_in_batch,
        "failures": failures[:20],
    }

    coverage = corpus_coverage(field)
    next_phase = resolve_phase(coverage, args.phase)
    state = build_state(
        coverage,
        next_phase,
        backend.model,
        backend.provider,
        previous=load_state(),
        run_record=run_record,
    )
    write_json(STATE_FILE, state)

    print(
        f"\nDone. {len(translated)} translated, {len(failures)} failed. "
        f"Corpus {field}: {state['totals']['translated']}/{state['totals']['verses']}"
    )
    if next_phase != phase:
        if next_phase is None:
            print("Final phase complete — the corpus is fully drafted.")
        else:
            print(f"Phase {phase} complete → advancing to phase {next_phase}.")

    # A run that translated nothing at all is a failure worth surfacing in CI.
    return 1 if translated == [] and failures else 0


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Phased batch translation of the Sangam corpus via OpenRouter (Gemini 2.5 Flash)"
    )
    parser.add_argument("--lang", choices=["english", "urai"], default="english")
    parser.add_argument("--poem", help="restrict to a single poem id (ignores phases)")
    parser.add_argument("--phase", type=int, help="force a phase instead of auto-advancing")
    parser.add_argument(
        "--limit", type=int, default=DEFAULT_LIMIT, help=f"verses per run (default {DEFAULT_LIMIT})"
    )
    parser.add_argument(
        "--concurrency", type=int, default=DEFAULT_CONCURRENCY, help="parallel requests"
    )
    parser.add_argument("--dry-run", action="store_true", help="resolve the batch, make no calls")
    parser.add_argument("--force", action="store_true", help="re-translate verses already filled")
    parser.add_argument("--status", action="store_true", help="print coverage and exit")
    parser.add_argument(
        "--write-state",
        action="store_true",
        help="rebuild data/pipeline/translation-state.json from disk and exit",
    )
    args = parser.parse_args()

    if args.status:
        print_status(FIELD_FOR_LANG[args.lang])
        return

    if args.write_state:
        field = FIELD_FOR_LANG[args.lang]
        coverage = corpus_coverage(field)
        state = build_state(
            coverage,
            resolve_phase(coverage, args.phase),
            os.getenv("SANGAM_TRANSLATE_MODEL", DEFAULT_MODEL),
            os.getenv("SANGAM_TRANSLATE_BACKEND", "openrouter"),
            previous=load_state(),
        )
        write_json(STATE_FILE, state)
        print(f"Wrote {STATE_FILE.relative_to(REPO_ROOT)}")
        return

    sys.exit(run_translation(args))


if __name__ == "__main__":
    main()
