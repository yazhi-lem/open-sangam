# Tamil Library Roadmap

Open Sangam starts as a Sangam reader. The Tamil Library is the next layer: one
catalog and one reader experience for poems, didactic works, classics, artifacts,
manuscripts, inscriptions, and eventually multilingual documents.

The design rule is simple: **catalog records and readable corpora are separate.**
A work can appear in the library as `metadata` or `planned` without pretending
that a reader can open it. This keeps the catalog honest while ingestion catches
up.

---

## 1. What exists now

| Layer | Path | Status |
|---|---|---|
| Sangam poetry registry | `frontend/src/data/poems.js` | 18 works readable |
| Wider library catalog | `data/library/catalog.json` | Pathinenkilkkanakku (18), Tamil classics, artifact collections |
| Catalog UI | `frontend/src/pages/Book.jsx` (`/book`) | Sangam + Thirukkural + Naladiyar readable; rest catalogued |
| Pathinenkilkkanakku texts | `data/texts/thirukkural/`, `data/texts/naladiyar/` | 1,730 verses with public-domain English |
| Corpus schema | `data/schema/verse_schema.json` | poem → section/verse → line → word |
| Gap repair | `backend/python/scraper/scrape_projectmadurai.py` | All idyll line gaps and heading-range defects repaired |

Availability values in the catalog:

- `reader` — normalized verse JSON exists and opens in `/book/:id`
- `metadata` — catalog record only
- `planned` — future collection placeholder (objects, manuscripts, inscriptions)

The catalog deliberately lists **Pathinenkilkkanakku** as eighteen works,
including the Tirukkural and Naladiyar. Only Sangam works are readable at
present; the catalog is the ingestion queue.

---

## 2. Target library model

The current verse schema is poetry-shaped (record → lines → words). A library
needs a broader document model. The next schema should cover:

```json
{
  "id": "thirukkural_001",
  "workId": "thirukkural",
  "kind": "verse | chapter | page | object | inscription | manuscript",
  "ordinal": 1,
  "text": {
    "original": { "script": "Taml", "lang": "ta", "value": "..." },
    "transliteration": { "scheme": "ISO-15919", "value": "..." },
    "modern": { "lang": "ta", "value": "..." },
    "translations": [
      { "lang": "en", "value": "...", "source": "...", "rights": "..." }
    ]
  },
  "glossary": [],
  "notes": [],
  "provenance": {
    "source": "...",
    "rights": "...",
    "verified": false
  }
}
```

Backwards compatibility: Sangam records keep `lines[]`/`words[]`, and a
document adapter presents them as `kind: "verse"`.

---

## 3. Multilingual reader requirements

1. **Language is data, not a layout mode.** A document declares available
   languages; the reader shows only those layers.
2. **Script and language are separate.** Tamil text may have Tamil script,
   Latin transliteration, or both. Never slice by UTF-16 code unit or byte.
3. **RTL-ready layout hooks.** The reader should switch direction from document
   metadata, even though Tamil is LTR.
4. **Per-layer provenance.** Every translation/commentary layer carries source,
   rights, translator, and verification status.
5. **Fallback chain.** Original → modern Tamil → English → other languages. A
   missing layer must not blank the page.
6. **Glossary per language.** Word lookups should return Tamil root/etymology
   and the selected UI language gloss.

Near-term UI work:

- language picker driven by `work.languages` / `work.translations`
- “show original + translation” split view
- per-layer badge for draft / machine / scholar-verified
- catalog filter by language and availability

---

## 4. Ingestion queue

### Phase A — Pathinenkilkkanakku (highest value, smallest texts)

Sources to evaluate, in order:

1. **Project Madurai** — clean UTF-8 e-texts for most minor works; explicit
   free-distribution terms.
2. **Tamil Virtual Academy** — scanned editions, useful for verification.
3. **Archive.org / Digital Library of India** — public-domain commentaries for
   urai, OCR quality varies.

Status:

1. ✅ Tirukkural (1,330 couplets) — Tamil + public-domain Pope translation
2. ✅ Naladiyar (400) — Tamil + public-domain Pope/Ellis translation
3. ⬜ Pazhamozhi Nanuru (400)
4. Thinaimalai Nurraimpathu (150)
5. Nanmanikkadigai, Thirikadugam, Acharakkovai (100 each)
6. Remaining forty-verse works

Each work gets a `data/texts/<id>/normalized/` corpus using the existing
normalizer pattern, plus a catalog `availability: "reader"` flip only after
validation passes.

### Phase B — Classics and grammar

Tholkappiyam, Silappatikaram, Manimekalai, Nannul, Tevaram, Nalayira Divya
Prabandham. These need chapter/canto navigation, not just verse pagination.

### Phase C — Artifacts and documents

Hero stones, inscriptions, coins, palm-leaf manuscripts, sculpture. These need
the new document/object schema, image viewers, and per-item rights review. Do
not bulk-download museum images without a rights record.

---

## 5. Validation gates

A work may be marked `reader` only when:

- every catalog record has a source URL/citation and rights note;
- `python -m normalizer.validate_corpus` passes with zero schema/integrity errors;
- line/chapter counts match the catalog `count` (or the difference is documented);
- the frontend builds without TypeScript/JSX errors;
- at least one native Tamil reviewer signs off on the first ten records.

Catalog-only work needs no corpus test, but must keep `availability` honest.

---

## 6. Operational model

```
data/library/catalog.json          ← curated catalog (works + collections)
        │
        ├── data/texts/<work>/      ← normalized readable corpus (when available)
        │
        └── frontend/src/data/library.js
                    │
                    └── /book  ← catalog + reader entry point
```

Future additions should not hard-code new works in React. Add them to
`data/library/catalog.json`; the UI reads the catalog. Only works with a
`loader` in `frontend/src/data/poems.js` open the verse reader today.
