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
scrape_poem  →  normalize_all  →  translate_with_gemini / translate_all  →  extract_etymology  →  build_graph
   (raw/)        (normalized/)         (english, urai)                        (word glossary)      (knowledge graph)
```

Each stage reads the previous stage's output and writes further into the same
`data/texts/{poem_id}/normalized/*.json` records — nothing downstream ever
touches `raw/`. `build_graph.py` is a read-only fan-in at the end: it derives
the knowledge graph from whatever the corpus currently holds and never writes
back into `data/texts/`.

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
| `root` / `urichol` / `etymology` / `gloss` (per word), `etymologyMeta` | Kept only if the word count still matches the existing record. A source-text correction that changes word count breaks the positional mapping, so etymology is dropped for that verse — a print line, `N record(s) kept AI-generated content`, tells you when this happened, and `extract_etymology.py --poem <id>` picks it back up. |

`normalizer/normalize_to_json.py` is a **deprecated**, maduraikanchi-only
predecessor to `normalize_all.py` — running it caused the exact class of bug
this section describes (two differently-padded, non-merged copies of every
maduraikanchi record). Do not run it; it's kept only for history.

### `ai/translate_with_gemini.py` — English + Urai

```bash
python -m ai.translate_with_gemini --status
python -m ai.translate_with_gemini --lang english --limit 200
python -m ai.translate_with_gemini --lang urai --poem mullaippattu
```

Drafts the `english` or `urai` field via Gemini 2.5 Flash (OpenRouter),
phased smallest-poems-first (see `README.md` › English translation). Also
available as `ai/translate_all.py`, which runs both languages in one command.

**Preservation:** a verse that already has the target field is skipped by
default — `select_batch()` filters on `verse.get(field)`. `--force`
re-translates it anyway (e.g. after a prompt-quality fix); that is the one
deliberate, explicit override to the "preserve" rule, and it's opt-in per
run, never the default.

### `ai/extract_etymology.py` — Word glossary

```bash
python -m ai.extract_etymology --status
python -m ai.extract_etymology --limit 50
python -m ai.extract_etymology --poem mullaippattu
```

Drafts `root`/`urichol`/`etymology`/`gloss` for every word in a verse, the
data behind the reader's click-to-define glossary. Unlike English/urai, a
word's fields can legitimately all come back null (a bare grammatical
particle has no root) — so completeness can't be read off the word fields
themselves.

**Preservation:** a verse counts as done once it carries an `etymologyMeta`
block, not once its words are non-null — see `verse_is_annotated()`. `--force`
re-annotates an already-glossed verse; same opt-in override as translation.

### `knowledge/build_graph.py` — Knowledge graph

```bash
python -m knowledge.build_graph
```

Reads every normalized poem and rebuilds `data/knowledge/graph.json` +
`data/knowledge/tinai_context.json` from scratch. **Preservation is moot
here** — the graph is entirely derived (nodes/edges/weights mined from
whatever the corpus currently holds), so a full rebuild is always correct;
there is no upstream AI content in `data/knowledge/` to lose.

## 3. Governance

Every AI-drafted field lands `verified: false` until a scholar reviews it —
see [docs/data-governance.md](./data-governance.md) §2 and §5. The
preservation rule above and that verification flag are independent: a script
re-run must never destroy a draft, verified or not.
