"""
vectorize.py
------------
Embeds every verse (Tamil + urai + English combined) via OpenRouter and
stores the vectors in a local Chroma collection for semantic search, plus a
flat, human-downloadable export alongside data/knowledge/graph.json.

Two outputs, two different lifecycles:
  - data/generated/vectors/   — the Chroma persistent DB (gitignored, like
    the rest of data/generated/ — a rebuildable local/deployment index, not
    source data).
  - data/knowledge/vectors/{poem_id}.jsonl — one JSON object per verse
    (id, metadata, embedding), committed like graph.json: the downloadable
    artifact, and always rebuilt straight from the Chroma collection after a
    write, so it can never drift from what's actually indexed.

Same OpenRouter account as translate_with_gemini.py / extract_etymology.py,
but a different endpoint (/embeddings, not /chat/completions) and a
restricted model: this account's allowed-providers setting only clears
google-ai-studio/google-vertex/anthropic/etc., and only
`google/gemini-embedding-001` (3072-dim) is reachable through it — see
docs/pipeline-scripts.md.

Usage:
    python -m ai.vectorize --status
    python -m ai.vectorize --limit 5 --dry-run
    python -m ai.vectorize --poem thirumurugatrupadai
    python -m ai.vectorize --search "young Murugan on the mountain" --k 5

Requires OPENROUTER_API_KEY (same as the rest of the ai/ pipeline).
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

import chromadb
import requests

from ai.translate_with_gemini import (
    REPO_ROOT,
    TranslationError,
    discovered_poems,
    load_verse,
    verse_files,
)

VECTOR_DB_DIR = REPO_ROOT / "data" / "generated" / "vectors"
EXPORT_DIR = REPO_ROOT / "data" / "knowledge" / "vectors"
STATE_FILE = REPO_ROOT / "data" / "pipeline" / "vectorize-state.json"

COLLECTION_NAME = "sangam_verses"
EMBED_MODEL = "google/gemini-embedding-001"
EMBED_API_BASE = "https://openrouter.ai/api/v1"

DEFAULT_LIMIT = 100
DEFAULT_CONCURRENCY = 4
MAX_ATTEMPTS = 5
RETRY_STATUS = {408, 409, 429, 500, 502, 503, 504}
REQUEST_TIMEOUT = 60

PROMPT_VERSION = "vectorize-v1"
STATE_SCHEMA_VERSION = 1
MAX_RUN_HISTORY = 30


# --------------------------------------------------------------------------- #
# Embedding backend
# --------------------------------------------------------------------------- #


class EmbeddingBackend:
    """Minimal OpenRouter /embeddings client — a sibling to OpenRouterBackend
    in translate_with_gemini.py, kept separate because it's a different
    endpoint and response shape, not a chat completion."""

    provider = "openrouter"
    model = EMBED_MODEL

    def __init__(self, api_key: str, api_base: str = EMBED_API_BASE):
        self.api_base = api_base.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://github.com/yazhi-lem/open-sangam",
                "X-Title": "Open Sangam",
            }
        )

    def embed(self, text: str) -> list[float]:
        response = self.session.post(
            f"{self.api_base}/embeddings",
            json={"model": self.model, "input": text},
            timeout=REQUEST_TIMEOUT,
        )
        if response.status_code in RETRY_STATUS:
            raise TranslationError(f"HTTP {response.status_code}: {response.text[:200]}")
        response.raise_for_status()
        payload = response.json()
        data = payload.get("data") or []
        if not data or not data[0].get("embedding"):
            raise TranslationError(f"no embedding in response: {str(payload)[:200]}")
        return data[0]["embedding"]


def get_backend() -> EmbeddingBackend:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise SystemExit(
            "OPENROUTER_API_KEY is not set — get one at https://openrouter.ai/keys "
            "and put it in backend/python/.env"
        )
    return EmbeddingBackend(api_key, os.getenv("OPENROUTER_API_BASE", EMBED_API_BASE))


def embed_once(backend: EmbeddingBackend, text: str) -> list[float]:
    """Embed one string, retrying transient failures with backoff + jitter."""
    last_error: Exception | None = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            return backend.embed(text)
        except (TranslationError, requests.RequestException) as exc:
            last_error = exc
            if attempt == MAX_ATTEMPTS:
                break
            delay = min(2**attempt, 30) + random.uniform(0, 1)
            time.sleep(delay)
    raise TranslationError(f"{last_error} (after {MAX_ATTEMPTS} attempts)")


# --------------------------------------------------------------------------- #
# Verse -> text / metadata
# --------------------------------------------------------------------------- #


def build_embed_text(verse: dict) -> str:
    """Combine Tamil + urai + English into one string, each field labeled so
    the model can weigh the register/language, not just concatenated text."""
    parts = []
    sangam = (verse.get("sangamTamil") or "").strip()
    urai = (verse.get("urai") or "").strip()
    english = (verse.get("english") or "").strip()
    if sangam:
        parts.append(f"Tamil: {sangam}")
    if urai:
        parts.append(f"Urai: {urai}")
    if english:
        parts.append(f"English: {english}")
    return "\n".join(parts)


def build_metadata(verse: dict) -> dict:
    return {
        "poem": verse.get("poem") or "",
        "number": verse.get("number") or verse.get("sectionNumber") or 0,
        "tinai": verse.get("tinai") or "unknown",
    }


# --------------------------------------------------------------------------- #
# Chroma collection
# --------------------------------------------------------------------------- #


def get_collection():
    VECTOR_DB_DIR.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(path=str(VECTOR_DB_DIR))
    return client.get_or_create_collection(COLLECTION_NAME, metadata={"model": EMBED_MODEL})


def indexed_ids(collection, poem_id: str | None = None) -> set[str]:
    where = {"poem": poem_id} if poem_id else None
    result = collection.get(where=where, include=[])
    return set(result.get("ids") or [])


# --------------------------------------------------------------------------- #
# Batch selection
# --------------------------------------------------------------------------- #


def select_batch(
    collection, limit: int, poem_filter: str | None = None, force: bool = False
) -> list[tuple[str, dict]]:
    poems = [poem_filter] if poem_filter else discovered_poems()
    already = set() if force else indexed_ids(collection, poem_filter)

    batch: list[tuple[str, dict]] = []
    for poem_id in poems:
        for path in verse_files(poem_id):
            if len(batch) >= limit:
                return batch
            verse = load_verse(path)
            if verse is None:
                continue
            if verse["id"] in already and not force:
                continue
            if not build_embed_text(verse).strip():
                continue
            batch.append((verse["id"], verse))
    return batch


# --------------------------------------------------------------------------- #
# Downloadable export
# --------------------------------------------------------------------------- #


def export_poem(collection, poem_id: str) -> int:
    """Rewrite data/knowledge/vectors/{poem_id}.jsonl straight from Chroma —
    the export can never drift from what's actually indexed."""
    result = collection.get(
        where={"poem": poem_id}, include=["embeddings", "documents", "metadatas"]
    )
    ids = result.get("ids") or []
    if not ids:
        return 0

    rows = []
    for verse_id, embedding, document, metadata in zip(
        ids, result["embeddings"], result["documents"], result["metadatas"]
    ):
        rows.append(
            {
                "id": verse_id,
                "poem": metadata.get("poem"),
                "number": metadata.get("number"),
                "tinai": metadata.get("tinai"),
                "text": document,
                "model": EMBED_MODEL,
                "dims": len(embedding),
                "embedding": [round(float(x), 6) for x in embedding],
            }
        )
    rows.sort(key=lambda r: r["number"] or 0)

    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    out = EXPORT_DIR / f"{poem_id}.jsonl"
    out.write_text(
        "\n".join(json.dumps(row, ensure_ascii=False) for row in rows) + "\n",
        encoding="utf-8",
    )
    return len(rows)


# --------------------------------------------------------------------------- #
# State
# --------------------------------------------------------------------------- #


def load_state() -> dict:
    if not STATE_FILE.exists():
        return {}
    try:
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def write_state(run_record: dict | None = None) -> None:
    previous = load_state()
    runs = list(previous.get("runs") or [])
    if run_record:
        runs.append(run_record)
    runs = runs[-MAX_RUN_HISTORY:]
    state = {
        "schemaVersion": STATE_SCHEMA_VERSION,
        "pipeline": "vectorize",
        "model": EMBED_MODEL,
        "promptVersion": PROMPT_VERSION,
        "updatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "runs": runs,
    }
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


# --------------------------------------------------------------------------- #
# Commands
# --------------------------------------------------------------------------- #


def print_status(collection) -> None:
    print(f"Open Sangam — vector index status (model: {EMBED_MODEL})\n")
    print(f"{'Poem':<24}{'Verses':>8}{'Vectorized':>12}{'Left':>7}  Progress")
    print("-" * 70)
    total_verses = 0
    total_vectorized = 0
    for poem_id in discovered_poems():
        total = sum(1 for p in verse_files(poem_id) if load_verse(p) is not None)
        vectorized = len(indexed_ids(collection, poem_id))
        total_verses += total
        total_vectorized += vectorized
        pct = vectorized / total if total else 0
        bar = "█" * round(pct * 16) + "░" * (16 - round(pct * 16))
        print(
            f"{poem_id:<24}{total:>8}{vectorized:>12}{total - vectorized:>7}  {bar} {pct:>4.0%}"
        )
    print("-" * 70)
    print(f"{'TOTAL':<24}{total_verses:>8}{total_vectorized:>12}{total_verses - total_vectorized:>7}")


def run_search(collection, query: str, k: int) -> int:
    backend = get_backend()
    embedding = embed_once(backend, query)
    result = collection.query(query_embeddings=[embedding], n_results=k)
    ids = result.get("ids", [[]])[0]
    distances = result.get("distances", [[]])[0]
    metadatas = result.get("metadatas", [[]])[0]
    documents = result.get("documents", [[]])[0]
    if not ids:
        print("No results — the index is empty. Run without --search first.")
        return 0
    for verse_id, distance, metadata, document in zip(ids, distances, metadatas, documents):
        print(f"{verse_id}  (tinai: {metadata.get('tinai')}, distance: {distance:.4f})")
        print(f"  {document.splitlines()[0][:100]}")
    return 0


def run_vectorize(args) -> int:
    collection = get_collection()

    if args.search:
        return run_search(collection, args.search, args.k)

    batch = select_batch(collection, args.limit, args.poem, args.force)
    if not batch:
        scope = f"poem {args.poem}" if args.poem else "the corpus"
        print(f"Nothing to vectorize in {scope} — already indexed.")
        return 0

    poems_in_batch = sorted({verse["poem"] for _, verse in batch})
    print(f"{len(batch)} verse(s) across {len(poems_in_batch)} poem(s): {', '.join(poems_in_batch)}")

    if args.dry_run:
        for verse_id, _ in batch:
            print(f"  would vectorize {verse_id}")
        print("\nDry run — no API calls made, no writes.")
        return 0

    backend = get_backend()
    run_id = uuid.uuid4().hex[:12]
    started_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    print(f"Backend: {backend.provider} · model: {backend.model} · run {run_id}\n")

    failures: list[str] = []
    embedded: list[tuple[str, dict, list[float]]] = []

    def work(item: tuple[str, dict]):
        verse_id, verse = item
        try:
            vector = embed_once(backend, build_embed_text(verse))
        except Exception as exc:  # noqa: BLE001 — one bad verse must not end a run
            return verse_id, verse, None, f"{type(exc).__name__}: {exc}"
        return verse_id, verse, vector, None

    with ThreadPoolExecutor(max_workers=args.concurrency) as pool:
        for index, (verse_id, verse, vector, error) in enumerate(pool.map(work, batch), 1):
            if error:
                failures.append(f"{verse_id}: {error}")
                print(f"  [{index}/{len(batch)}] ✗ {verse_id} — {error}")
                continue
            embedded.append((verse_id, verse, vector))
            print(f"  [{index}/{len(batch)}] ✓ {verse_id}")

    if embedded:
        collection.upsert(
            ids=[verse_id for verse_id, _, _ in embedded],
            embeddings=[vector for _, _, vector in embedded],
            documents=[build_embed_text(verse) for _, verse, _ in embedded],
            metadatas=[build_metadata(verse) for _, verse, _ in embedded],
        )

    exported = 0
    for poem_id in poems_in_batch:
        exported += export_poem(collection, poem_id)

    run_record = {
        "runId": run_id,
        "startedAt": started_at,
        "finishedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "trigger": os.getenv("SANGAM_RUN_TRIGGER", "manual"),
        "attempted": len(batch),
        "embedded": len(embedded),
        "failed": len(failures),
        "poems": poems_in_batch,
        "failures": failures[:20],
    }
    write_state(run_record)

    print(
        f"\nDone. {len(embedded)} embedded, {len(failures)} failed. "
        f"Exported {exported} vector(s) to {EXPORT_DIR.relative_to(REPO_ROOT)}/."
    )
    return 1 if embedded == [] and failures else 0


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Embed verses via OpenRouter and store them in a local Chroma vector DB"
    )
    parser.add_argument("--poem", help="restrict to a single poem id")
    parser.add_argument(
        "--limit", type=int, default=DEFAULT_LIMIT, help=f"verses per run (default {DEFAULT_LIMIT})"
    )
    parser.add_argument(
        "--concurrency", type=int, default=DEFAULT_CONCURRENCY, help="parallel requests"
    )
    parser.add_argument("--dry-run", action="store_true", help="resolve the batch, make no calls")
    parser.add_argument("--force", action="store_true", help="re-embed verses already indexed")
    parser.add_argument("--status", action="store_true", help="print coverage and exit")
    parser.add_argument("--search", help="semantic search the index and print top matches")
    parser.add_argument("--k", type=int, default=5, help="results to return for --search")
    args = parser.parse_args()

    if args.status:
        print_status(get_collection())
        return

    sys.exit(run_vectorize(args))


if __name__ == "__main__":
    main()
