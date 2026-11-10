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
          translate_with_gemini / extract_etymology
             (AI drafts, always `verified: false`)
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

### `scraper/scrape_wikisource.py` — Structural epics from Tamil Wikisource

```bash
python -m scraper.scrape_wikisource --work all
python -m scraper.scrape_wikisource --work manimekalai --offline
```

Harvests the epics Wikipedia cannot give us: Wikipedia holds the explanation,
[Wikisource](https://ta.wikisource.org) holds the text. Both are CC BY-SA 4.0,
so every record carries its page URL in `source` and the work carries a
`contributors.md` attribution block.

| Work | Adapter | Records | Markup handled |
|---|---|---:|---|
| `manimekalai` | `manimekalai` | 31 (patikam + 30 kādai) | `== NN.காதை ==` + `<poem>`, edition line markers `----12-090` stripped |
| `perunkathai` | `perunkathai` | 99 chapters / 5 kāṇṭam | verse zone after `*பாடல் மூலம்`, `<poem>` blocks, wrapped headings rejoined, declared lacunae skipped |
| `ramavataram` (Kamba Ramayanam) | `kamba` | 125 paṭalam, 10,392 numbered verses | `<center><big>'''9. அகலிகைப் படலம்'''` title, bold scene lines → `scenes[]`, stanza numbers stripped |

Three rules the adapters enforce:

1. **Only the verse zone.** Editorial prefaces, prose summaries and translation
   cribs sit outside the verse marker or `<poem>`, so they are dropped instead
   of being ingested as poetry.
2. **Lacunae are preserved, never invented.** Perunkathai's surviving text is
   discontinuous (book 1 starts at chapter 32); a page that declares itself lost
   is recorded in `datapackage.json → openSangam.problems`, not fabricated.
3. **Source defects stay visible.** OCR slips and numbering collisions are left
   in place and every record stays `verified: false`.

Raw wikitext is cached under `data/texts/<work>/raw/` (gitignored), so
`--offline` re-runs the parsers with no network. Output is per-record
`normalized/*.json`, the combined `<work>.json`, a Frictionless
`datapackage.json` and `contributors.md`.

Structural works do not fit the idyll model (line numbering restarts per
chapter), so these records use the schema's third `anyOf` branch:
`sectionNumber` + `structure`, with `lineStart`/`lineEnd` omitted. See
[`docs/research/tamil-wiki-scout.md`](../research/tamil-wiki-scout.md) for the
licence analysis and per-work page counts.

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

### `normalizer/canonicalize_poets.py` — one spelling per poet

```bash
python -m normalizer.canonicalize_poets                 # dry run: report only
python -m normalizer.canonicalize_poets --write         # rewrite `poet` in the corpus
python -m normalizer.canonicalize_poets --write --refresh-authority
```

The corpus was scraped from several sources, so the same poet appeared under
different spacing and with trailing punctuation: **565 distinct `poet` strings
that collapse to 508 poets**, 47 groups of duplicates (four spellings of
பாலைபாடிய பெருங்கடுங்கோ; `வெள்ளிவீதியார்` vs `வெள்ளி வீதியார்`). Those duplicates
produced duplicate `Poet -` notes in the Obsidian vault and split the
knowledge-graph poet nodes.

| File | Role |
|---|---|
| `data/library/tamilwiki-poets.json` | 1,660 poet names from tamil.wiki categories — the spelling authority. Names, roles and page sizes only; **no article text is copied** |
| `data/library/poet-aliases.json` | `raw spelling → canonical spelling` (55 entries), merged on every run so a later re-scrape of an old spelling is still fixed |
| `normalizer/poet_alias.py` | `canonical_poet()` — imported by `normalize_all`, `build_graph` and `export_obsidian` so all three agree |

Policy, in order:

1. A name the authority knows wins, matched on Tamil letters only, so whitespace
   variants resolve to the reviewed spelling.
2. A name the authority does not know keeps the corpus's most frequent spelling —
   the script never invents a join or a split.
3. A **single-spelling name is left alone**: re-spacing it would churn the corpus
   and rename existing `Poet -` notes for no benefit. Only real duplicates move.
4. Colophon placeholders (`ஆசிரியர் அறியப்படவில்லை.`) become `poet: null`, which is
   what the schema means by unattributed — 78 records across 5 spellings.

Idempotent: a second run reports 0 changes. After a run, rebuild the derived
data with `python -m knowledge.build_graph` and
`python -m knowledge.export_obsidian`.

### Machine-drafted fields — generation pipeline

`english`, `urai` and the per-word `root`/`urichol`/`etymology`/`gloss` fields
are drafted by the scripts below and preserved across re-normalizes by
`normalize_all.py` (table above). The pipeline was removed in #136 and restored
here, with the `cli.py` entry point and tests that were missing before; the
nightly `translate-english.yml` workflow is still gone — runs are manual.

#### `ai/translate_with_gemini.py` — Translate verses

```bash
python -m ai.translate_with_gemini --status
python -m ai.translate_with_gemini --lang english --limit 5 --dry-run
python -m ai.translate_with_gemini --lang english --limit 200
```

Phased, resumable, concurrent batch translation of `english`, `urai` and
`yazhi_urai`. Every run rebuilds progress from disk (never trusting the state
file's counters), picks a bounded batch from the current phase, writes each
verse back with `verified: false` and an `englishMeta` provenance block, and
appends a run record to `data/pipeline/translation-state.json`. Uses OpenRouter
by default (`OPENROUTER_API_KEY`); set `SANGAM_TRANSLATE_BACKEND=gemini` to use
the Gemini SDK (`GEMINI_API_KEY`).

#### `ai/translate_all.py` — All three language passes

```bash
python -m ai.translate_all --status
python -m ai.translate_all --limit 200
python -m ai.translate_all --only urai --limit 50
```

Convenience wrapper that sequences `urai` → `yazhi_urai` → `english` as three
subprocess runs of `translate_with_gemini.py`, forwarding the shared flags.

#### `ai/extract_etymology.py` — Word glossary

```bash
python -m ai.extract_etymology --status
python -m ai.extract_etymology --limit 200
```

Fills the word-level `root` / `urichol` / `etymology` / `gloss` fields. Per-word
null-ness can't signal "not yet processed" (a bare particle has no root), so
completeness is tracked per verse with an `etymologyMeta` block. Same
`verified: false` rule as translation.

#### `cli.py` — One entry point

```bash
python cli.py scrape --poem all
python cli.py normalize --poem all
python cli.py translate --lang english --limit 200
python cli.py build-graph
```

Thin dispatcher over `scraper.scrape_poem`, `normalizer.normalize_all`,
`ai.translate_with_gemini` and `knowledge.build_graph`. Each underlying module
keeps its own `main()`; `cli.py` calls the shared `main_from_cli(args)` wrapper
so no logic is duplicated.

Shared helpers (poem order, verse file discovery, `.env` loading) live in
`ai/corpus_io.py`.

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

### `knowledge/extract_corpus_entities.py` — Flora, fauna, food, work & emotion index

```bash
python -m knowledge.extract_corpus_entities
```

Builds `data/library/corpus-entities.json`: flora, fauna, food/drink,
occupations, kinship, places/dynasties, landscape motifs and emotions, each with
attestation counts, poem distribution and cited sample lines.

### `knowledge/run_avai_campaigns.py` — Avai research briefs

```bash
# with the local Avai API running on :8080
python -m knowledge.run_avai_campaigns --campaign all --language ta
```

Runs the curated campaigns through the local Avai agents and writes
`data/library/avai-research/<campaign>.json` plus an `index.json` manifest.
Briefs retain citations, evidence status and abstention reasons.

### `knowledge/extract_corpus_artifacts.py` — Material-culture index

```bash
python -m knowledge.extract_corpus_artifacts
```

Scans every normalized verse line for a curated Tamil artifact lexicon
(instruments, ornaments, weapons, transport, ritual objects, vessels, textiles,
tools, writing) and writes `data/library/corpus-artifacts.json` with counts,
forms, poem distribution and cited sample lines. It is a research index, not an
archaeological identification.

### `knowledge/extract_kumari_references.py` — Kumari/Lemuria scan

```bash
python -m knowledge.extract_kumari_references
```

Scans the normalized corpus for Kumari Kandam / Lemuria terms and classifies
each hit as a direct reference, homonym, simile, or later tradition. Writes
`data/library/kumari-references.json`. The current scan finds **no direct
Sangam reference** to Kumari Kandam or Lemuria; see
`docs/research/kumari-kandam-corpus-scan.md`.

### `knowledge/export_obsidian.py` — Obsidian second brain

```bash
cd backend/python
python -m knowledge.export_obsidian --verses index
python -m knowledge.export_obsidian --verses all --clean
```

Exports the corpus, tiṇai, works, poets, artifacts, entities, curated stories,
Avai briefs and articles as a linked Obsidian vault at `obsidian-vault/`.
`--verses index` writes one verse-index note per work; `--verses all` also writes
one atomic note per verse.

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
see [docs/data/data-governance.md](./data-governance.md) §2 and §5. The
preservation rule above and that verification flag are independent: a script
re-run must never destroy a draft, verified or not.
