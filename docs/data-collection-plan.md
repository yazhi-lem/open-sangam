# Data Collection Plan

How Open Sangam grows from a verse archive into a layered knowledge platform.
This plan extends the pipeline described in the README with (a) richer
verse-level metadata and (b) a new **Knowledge Entities** track that powers the
`/knowledge` encyclopedia and cross-links back to the verses.

> Pipeline recap: **Scrape → Normalize → Library → English → Verified**
> (see `README.md` › Corpus Status for live per-poem progress).

---

## 1. Current state

| Track | Status |
|-------|--------|
| Verse text (Sangam Tamil) | 16 / 17 poems normalized (~2,066 records, 94%) |
| Modern Tamil prose (*urai*) | Partial — scraped only where the source carries it |
| English translation | Not started (Phase 2, Gemini) |
| Scholar verification | Not started (Phase 4) |
| Knowledge entities | **New — this plan** |

### Known corpus gaps

1. **ஐங்குறுநூறு Ainkurunooru** — the source index page exposes no per-verse
   sublinks, so the scraper cannot enumerate the 500 verses. Needs a manual URL
   map or an alternate source (see §4).
2. **பொருநராற்றுப்படை Poruṉarāṟṟuppaṭai** — the corpus currently carries **9 of
   the 10 Idylls**; this one (the bard's guide-song to Karikāla Chola) is not
   yet scraped. Add it to `scraper/registry.py` and `frontend/src/data/poems.js`.
3. **Urai coverage** is uneven; verses without source prose are candidates for
   Phase 2 AI drafting (flagged `verified: false`).

---

## 2. Verse-level metadata enrichment

Each verse should carry the scholarly apparatus that print editions
(e.g. U.V. Swaminatha Iyer) attach in their colophons (*kolu*). Proposed
additions to `data/schema/verse_schema.json`:

| Field | Type | Meaning | Source |
|-------|------|---------|--------|
| `author` | string \| null | Poet who composed the verse | Colophon |
| `patron` | string \| null | King / chieftain addressed (puṟam) | Colophon |
| `turai` | string \| null | Poetic situation / sub-theme | Colophon |
| `speaker` | string \| null | Dramatic speaker in akam (heroine, friend, foster-mother …) | Colophon |
| `tinai` | enum | Already in schema — backfill where blank | Link label / colophon |
| `meter` | string \| null | Metrical form (*āciriyappā*, *kali*, *vañci* …) | Editorial |

These are already present in most source colophons; the normalizer should
capture them into structured fields instead of discarding them.

---

## 3. Knowledge Entities (new track)

Powers `frontend/src/data/knowledge.js` and the `/knowledge` page. Unlike
verses, these are **curated** records — small in number, high in editorial
value — each cross-linkable to the verses that attest it.

### Entity types

| Entity | Est. count | Key attributes | Links to |
|--------|-----------:|----------------|----------|
| **Poet** | ~473 | name (ta/en), landscape specialism, bio, notable verses | verses authored |
| **Patron / King** | ~50 | dynasty or chieftaincy, emblem, deeds, era | verses addressed to them |
| **Tiṇai convention** | 5 + 7 | muthal / karu / uri poruḷ (akam), war-stage (puṟam) | verses in that tiṇai |
| **Instrument & performer** | ~15 | type, construction, role (*yāḻ*, *paṟai*, *pāṇar* …) | verses mentioning it |
| **Karu-poruḷ glossary** | ~200 | flora / fauna / deity / food per landscape | verses + `tinaiWorld.js` |
| **Cultural note** | open | dynasty · geography · flora · fauna · ritual · material-culture | anchored to a `sourceVerse` |

### Proposed storage

```
data/knowledge/
├── poets.json          # [{ id, ta, en, tinai, bio, verseRefs[] }]
├── patrons.json        # [{ id, ta, en, dynasty, emblem, era, verseRefs[] }]
├── instruments.json
├── glossary.json       # karu-poruḷ terms, keyed to tinai
└── conventions.json    # muthal/karu/uri + puṟam tiṇai definitions
```

Each record uses the same `verseRefs: ["purananooru_0192", …]` convention so the
UI can render "attested in N verses → read them" links. The hand-authored
`frontend/src/data/knowledge.js` is the editorial seed; as `data/knowledge/*`
is populated it becomes the generated source of truth.

### Sourcing

- **Colophons** already scraped — mine them for author/patron/turai to
  auto-seed `poets.json` and `patrons.json` (counts + verseRefs come free).
- **Tolkāppiyam Poruḷatikāram** — authoritative for tiṇai conventions.
- **Reference encyclopedias** (heritage sites, Wikipedia, TVU corpus) — for
  biographical prose only, rewritten and cited, never copied.
- **Archaeology** (Keezhadi reports) — for the "modern context" cultural notes.

---

## 4. Scraper improvements

1. **Ainkurunooru fix** — add a `verse_url_map` mode to `registry.py` for poems
   whose index has no sublinks; enumerate the 500 verse URLs explicitly, or
   switch the source for this poem.
2. **Add Poruṉarāṟṟuppaṭai** to complete the Ten Idylls.
3. **Colophon parser** — extend `normalizer/normalize_to_json.py` to split the
   colophon into `author` / `patron` / `turai` / `speaker` fields (§2).
4. **Provenance** — record `source_url` and `scraped_at` per record so the
   dataset stays reproducible and attributable (per `data-governance.md`).

---

## 5. Governance & licensing

All collection follows `docs/data-governance.md`:

- Public-domain verse text; **source attribution preserved** on every record.
- AI-drafted urai/English carry `verified: false` until scholar-reviewed.
- Curated knowledge prose is **paraphrased and cited**, released CC BY-SA 4.0 —
  reference sites are for inspiration and fact-checking, not verbatim reuse.
- Contested scholarly points (dating, the Three Sangams, attributions) are
  labelled as tradition/debate, not asserted as fact.

---

## 6. Phasing

| Phase | Deliverable | Status |
|-------|-------------|--------|
| **A** | `/knowledge` page + hand-authored `knowledge.js` seed | ✅ done |
| **B** | Corpus interlink graph — `build_graph.py` → `graph.json` + `tinai_context.json`, `/graph` explorer, tiṇai "In the Corpus" tab | ✅ done |
| **C** | Colophon parser → structured `author`/`patron`/`turai`/`speaker` fields, auto-seed `poets.json` / `patrons.json` | ⬜ next |
| **D** | Close corpus gaps (Ainkurunooru, Poruṉarāṟṟuppaṭai) | ⬜ |
| **E** | Karu-poruḷ glossary + inline verse cross-links in the reader | ⬜ |
| **F** | AI urai/English drafts → scholar verification loop | ⬜ |

---

## 7. The interlink graph (delivered)

The corpus is compiled into a single **knowledge graph** — the base "world
model" that the reader, Sangam World, and downstream projects share.

```
backend/python/knowledge/
├── build_graph.py        # miner: reads data/texts/*/*.json
└── tinai_lexicon.json    # karu-poruḷ search terms, exported from tinaiWorld.js

data/knowledge/
├── graph.json            # nodes (tiṇai·poem·poet·karu) + typed weighted edges
└── tinai_context.json    # per-tiṇai attestations, top poets, sample verses
```

**Node types** — `tinai`, `poem`, `poet`, `karu` (native flora/fauna/deity/people).
**Edge types** — `HAS_TINAI` (poem→tiṇai), `WROTE_IN` (poet→tiṇai),
`COMPOSED` (poet→poem), `ATTESTS` (tiṇai→karu, weighted by corpus occurrence,
carrying sample verse refs). Every edge weight and verse reference is derived
from the poems themselves — nothing is hand-asserted.

Regenerate after any corpus change:

```bash
# refresh the search lexicon from the curated tiṇai data (optional)
node -e "import('./frontend/src/data/tinaiWorld.js').then(m=>{ /* … */ })"
# rebuild the graph + per-tiṇai context
python backend/python/knowledge/build_graph.py
```
