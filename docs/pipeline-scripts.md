# Pipeline Scripts

Reference for every `backend/python` script that generates or derives corpus
data, and the rule that governs all of them:

> **If a script generates a field once, a later run of any script must
> preserve it.** Re-running a pipeline to pick up new verses, fix a bug, or
> pull in a source correction must never silently revert a field that some
> earlier run — by that script or a different one — already filled in.

Everything below is run from `backend/python/` with the virtualenv active
(`python -m venv .venv && .venv/bin/pip install -r requirements.txt`; see
`README.md` › Python Pipeline for setup).

---

## 1. Pipeline order

```
scrape_poem  →  normalize_all  →  build_graph
   (raw/)        (normalized/)     (knowledge graph)
                        ↓
                    vectorize
                (embeddings + search)
```

`normalize_all` writes the `data/texts/{poem_id}/normalized/*.json`
records — nothing downstream ever touches `raw/`. `build_graph.py` and
`vectorize.py` are read-only fan-outs at the end: each derives its own
artifact from whatever the corpus currently holds and never writes back into
`data/texts/`.

## 2. Scripts

### `scraper/scrape_poem.py` — Scrape

```bash
python -m scraper.scrape_poem --poem natrinai
python -m scraper.scrape_poem --poem all       # every poem in scraper/registry.py
```

Fetches source pages from sangathamizh.com into `data/texts/{poem_id}/raw/`.
**Preservation:** re-running re-fetches every page and overwrites `raw/`
wholesale — that's fine, because `raw/` only ever holds a scrape of the source
site, never AI output. If the source page hasn't changed, the re-fetch is a
no-op in substance.

### `scraper/scrape_projectmadurai.py` — Fill idyll gaps

```bash
python -m scraper.scrape_projectmadurai --poem all
python -m scraper.scrape_projectmadurai --poem maduraikanchi --dry-run
```

Fills the idyll line gaps and repairs heading-range defects left by the primary
source, using the complete Project Madurai edition of each idyll. Existing lines
and word annotations are preserved; only missing lines are inserted, and section
`lineStart`/`lineEnd` are re-derived when the source heading was wrong. The
script also updates `data/schema/known_line_gaps.json`, so a clean validation
run stays its normal green state.

Source pages are cached under the already-ignored `data/texts/<poem>/raw/`.

### `scraper/scrape_pathinen.py` — Thirukkural + Naladiyar

```bash
python -m scraper.scrape_pathinen --work all
python -m scraper.scrape_pathinen --work thirukkural
```

Ingests the first two Pathinenkilkkanakku works from Project Madurai:

| Work | Tamil | English |
|---|---|---|
| Tirukkural | `pmuni0001` | G. U. Pope et al., 1886 (`pmuni0153`) |
| Naladiyar | `pmuni0016` | G. U. Pope / F. W. Ellis, 1893 (`pmuni0711`) |

Both translations are public domain. Four verses that are missing or
mislabelled in the HTML editions are filled from the other Project Madurai
editions and the Internet Archive scan of the same translation. No machine
translation is used.

### `normalizer/normalize_all.py` — Normalize

```bash
python -m normalizer.normalize_all --poem natrinai
python -m normalizer.normalize_all --poem all
```

Rebuilds `data/texts/{poem_id}/normalized/*.json`, the combined
`{poem_id}.json`, and `datapackage.json` from `raw/`. Because it *rebuilds*
every record from `raw/` — which never contains AI output — a naive re-run
would silently wipe every `english` translation and every word's
`root`/`urichol`/`etymology`/`gloss` back to null the next time someone
re-scrapes a poem to fix a typo or add missing verses.

**Preservation:** `merge_generated_fields()` carries these fields forward
from the normalized file already on disk before overwriting it:

| Field | Rule |
|---|---|
| `english`, `englishMeta` | Always kept — `raw/` never has an `english` field. |
| `urai` | A fresh non-empty value from `raw/` wins (a real source correction); otherwise the existing value is kept (it may be an AI draft `raw/` never had). |
| `verified` | Once `true`, stays `true` — a scrape can't un-review a scholar's approval. |
| `root` / `urichol` / `etymology` / `gloss` (per word), `etymologyMeta` | Kept only if the word count still matches the existing record. A source-text correction that changes word count breaks the positional mapping, so etymology is dropped for that verse — a print line, `N record(s) kept AI-generated content`, tells you when this happened. |

`normalizer/normalize_to_json.py` is a **deprecated**, maduraikanchi-only
predecessor to `normalize_all.py` — running it caused the exact class of bug
this section describes (two differently-padded, non-merged copies of every
maduraikanchi record). Do not run it; it's kept only for history.

### Machine-drafted fields — generation scripts removed

`english`, `urai` and the per-word `root`/`urichol`/`etymology`/`gloss` fields
from earlier batch runs stay in the corpus and are preserved by `normalize_all.py`
(table above). The scripts that generated them (`ai/translate_with_gemini.py`,
`ai/translate_all.py`, `ai/extract_etymology.py`) and the nightly
`translate-english.yml` workflow were removed; nothing in this repo generates
translations any more. Shared helpers (poem order, verse file discovery, `.env`
loading) now live in `ai/corpus_io.py`.

### `ai/vectorize.py` — Verse embeddings + semantic search

```bash
python -m ai.vectorize --status
python -m ai.vectorize --poem thirumurugatrupadai
python -m ai.vectorize --search "the young god of the mountains riding a peacock" --k 5
```

Embeds each verse's Tamil + urai + English (concatenated, each field
labeled) via `google/gemini-embedding-001` — the only embedding model
reachable through this project's OpenRouter account; its
allowed-providers setting is restricted to `google-ai-studio` /
`google-vertex` / `anthropic` / etc., which rules out the OpenAI/Cohere/BGE
embedding models one might otherwise reach for. Requires **`chromadb`**,
which lives only in `backend/python/requirements.txt` — install it into
`backend/python/.venv` (a dedicated venv; see §3), never into
`agents/.venv`, which `google-adk` pins to specific `opentelemetry-*`
versions that a stray `pip install chromadb` there will silently bump.

Two outputs, two lifecycles:

| Path | What | Committed? |
|---|---|---|
| `data/generated/vectors/` | The Chroma persistent DB (`sangam_verses` collection) | No — gitignored, like the rest of `data/generated/`: a rebuildable local/deployment index, not source data. |
| `data/knowledge/vectors/{poem_id}.jsonl` | One JSON line per verse — id, metadata, the embedded text, and the vector | Yes — the downloadable artifact, committed like `graph.json`. |

**Preservation:** a verse already present in the Chroma collection is
skipped by default (`--force` to re-embed, same opt-in override as the other
scripts). The `.jsonl` export is always **rewritten from Chroma**, never
appended to — so it can't drift from what's actually indexed, the same way
`refresh_poem_artifacts()` rebuilds a poem's combined JSON from its
normalized files rather than patching it incrementally.

### `knowledge/extract_stories.py` — Akam & Puram story seeds

```bash
python -m knowledge.extract_stories
```

Turns each Sangam verse into a structured story seed: kind (`akam`/`puram`),
archetype, characters, setting, conflict, turn, resolution, theme and cited
evidence. Akam uses the five tiṇai emotional arcs; puram is classified into war,
patronage, hero-stone, kingship, elegy, love, ethics, nature, devotion and
reflection. Writes `data/library/stories.json`.

These are research seeds, not literary retellings. Every story keeps its source
record id and a text/urai excerpt.

A separate hand-curated anthology lives in `data/library/story-anthology.json`
with full Tamil and English retellings and direct source-verse links.

### `knowledge/extract_corpus_artifacts.py` — Material-culture index

```bash
python -m knowledge.extract_corpus_artifacts
```

Scans every normalized verse line for a curated Tamil artifact lexicon
(instruments, ornaments, weapons, transport, ritual objects, vessels, textiles,
tools, writing) and writes `data/library/corpus-artifacts.json` with counts,
forms, poem distribution and cited sample lines. It is a research index, not an
archaeological identification.

### `knowledge/build_graph.py` — Knowledge graph

```bash
python -m knowledge.build_graph
```

Reads every normalized poem and rebuilds `data/knowledge/graph.json` +
`data/knowledge/tinai_context.json` from scratch. **Preservation is moot
here** — the graph is entirely derived (nodes/edges/weights mined from
whatever the corpus currently holds), so a full rebuild is always correct;
there is no upstream AI content in `data/knowledge/` to lose.

## 3. Environment — use a dedicated `backend/python/.venv`

```bash
cd backend/python
python -m venv .venv
.venv/bin/pip install -r requirements.txt
```

Never reuse `agents/.venv` for backend/python work — it's a separate
project's virtualenv (Google ADK + LiteLLM), pinned to specific
`opentelemetry-*` versions. Installing an unrelated dependency there (e.g.
`chromadb`, pulled in by `ai/vectorize.py`) silently drags those pins to a
newer, incompatible version and can break the `agents/avai` service — this
happened once already while building `vectorize.py` and was caught before it
reached a commit, but there was no venv boundary stopping it in the first
place. Keep the two environments physically separate.

## 4. Governance

Every AI-drafted field lands `verified: false` until a scholar reviews it —
see [docs/data-governance.md](./data-governance.md) §2 and §5. The
preservation rule above and that verification flag are independent: a script
re-run must never destroy a draft, verified or not.
