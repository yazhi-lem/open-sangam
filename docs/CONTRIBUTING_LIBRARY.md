# Contributing to the Open Sangam Library

> **Tamil first, English second.** தமிழ் முன்னிறுத்தப்படுகிறது; ஆங்கிலம் இரண்டாம் இடத்தில்.
> This document is a **living guide**. If something is unclear, open an issue and we will clarify it together.

---

## 1. What the Library is

The Open Sangam Library is not a static list. It is a **growing, structured corpus** of Tamil literature in three layers for every work:

1. **Sangam Tamil / Classical Tamil** — the original text (`original` layer)
2. **Modern Tamil urai** — line-by-line explanation (`urai` layer)
3. **English translation** — public-domain or scholar-reviewed (`english` layer)

Each work also carries metadata: author, period, language tags, collection grouping, and availability status.

---

## 2. Where the data lives

| Path | Purpose |
|---|---|
| `data/library/catalog.json` | Master catalog of **all works** — collections, metadata, availability |
| `frontend/src/data/poems.js` | **Readable** works with dynamic loaders for the `/book/:id` reader |
| `data/texts/<work>/` | Normalized verse JSON — one file per poem or per line bundle |
| `data/library/artifacts.json` | Material-culture objects (inscriptions, sculpture, coins) |
| `data/library/stories.json` | Auto-extracted akam/puram story seeds from the corpus |
| `data/library/corpus-entities.json` | Lexical index: flora, fauna, emotions, occupations, motifs |
| `data/library/corpus-artifacts.json` | Material-culture terms attested in verse lines |

---

## 3. Three ways to contribute

### 3.1 Add a new work to the catalog (5 minutes)

Edit `data/library/catalog.json`. Add your work to the `works` array with this shape:

```json
{
  "id": "ramavataram",
  "ta": "கம்பராமாயணம்",
  "en": "Kamba Ramayanam",
  "collection": "tamil-classics",
  "author": "கம்பர் · Kamban",
  "period": "c. 12th century CE",
  "count": 10553,
  "unit": "verses",
  "languages": ["ta"],
  "translations": ["en"],
  "availability": "metadata",
  "source": "Project Madurai / Tamil Virtual Academy",
  "rights": "public-domain text",
  "notes": "Tamil adaptation of the Ramayana in six kandas."
}
```

**Rules:**
- `id` must be URL-safe (kebab-case ASCII).
- `collection` must match an existing collection `id` in `catalog.json`, or add a new collection.
- `availability` is one of:
  - `reader` — has normalized JSON and loads in `/book`
  - `metadata` — catalog record only; no corpus yet
  - `planned` — collection placeholder (e.g. lost texts)
- `count` + `unit` should be honest; use `0` if the count is unknown.
- `source` should name the primary text repository (Project Madurai, Tamil Virtual Academy, etc.).

After editing, run the test:

```bash
cd frontend
node --test src/data/library.test.js
```

### 3.2 Produce normalized verse JSON (a few hours)

This makes a catalog work move from `metadata` → `reader`.

#### Step A — Scrape or source the raw text

Place raw text under `data/raw/<work>/`. Sources:
- [Project Madurai](https://projectmadurai.org) (public-domain Tamil texts)
- [Tamil Virtual Academy](https://www.tamilvu.org) (classical and medieval)
- [Tamil Lexicon](https://dsal.uchicago.edu/dictionaries/tamil-lex/) (University of Chicago, for glosses) [needs-decision]

> Replace the bracketed marker above with the exact edition/URL you are using. If you only
> need the royal word-lists, Project Madurai already carries them.

#### Step B — Normalize

Use the corpus normalizers in `backend/python/normalizer/`. The individual files are
`normalize_all.py` (normalise all poems), `normalize_to_json.py` (a **deprecated** single-poem
helper) and `validate_corpus.py` (schema report). There is **no** `normalizer.normalize` module.

```bash
cd backend/python
# Normalise every scraped poem into OKF data packages
python -m normalizer.normalize_all
# …or a single poem
python -m normalizer.normalize_all --poem natrinai
# Validate against data/schema/verse_schema.json (summary report)
python -m normalizer.validate_corpus
# …and list every line gap
python -m normalizer.validate_corpus --gaps
```

Each JSON file must match `verse_schema.json`. The minimal shape is:

The canonical schema is **flat** (`verse_schema.json` v2). Required keys are
`id`, `poem`, `sangamTamil`, `lines`, `source`, `verified`. The minimal record:

```json
{
  "id": "maduraikanchi-001",
  "poem": "maduraikanchi",
  "number": 1,
  "tinai": "marutam",
  "sangamTamil": "...",
  "urai": "",
  "english": "",
  "lines": [
    { "number": 1, "text": "...", "words": [{ "form": "...", "gloss": "..." }] }
  ],
  "source": "Project Madurai",
  "verified": false
}
```

Do **not** invent a `layers` object — it is not in the schema. The
`verified` flag covers the whole record; per-layer trust is derived by
`frontend/src/content/processedContent.js`.

#### Step C — Register in `poems.js`

Add an entry in `frontend/src/data/poems.js`:

```js
{
  id: 'ramavataram',
  ta: 'கம்பராமாயணம்', en: 'Kamba Ramayanam',
  collection: 'tamil-classics',
  count: 10553, unit: 'verses',
  available: true,
  loader: () => import('@data/texts/ramavataram/ramavataram.json'),
}
```

Then run the frontend build to confirm:

```bash
cd frontend
npm run build
```

### 3.3 Write translations or urai (ongoing)

For works already in the corpus, the biggest need is verified `urai` and `english` layers.

- **Modern Tamil urai** — line-by-line prose explanation in contemporary Tamil.
- **English translation** — public-domain translations (Pope, Ellis, etc.) are accepted as draft; new translations must be original.
- Mark anything AI-drafted or unverified as `"verified": false`.
- When a scholar reviews and signs off, flip `"verified": true`.

Send us a Pull Request with the updated JSON files and a note of which lines were reviewed.

---

## 4. Quality gates

Before a work graduates from `metadata` → `reader`, it must pass:

| Gate | How |
|---|---|
| JSON schema validation | `cd backend/python && python -m normalizer.validate_corpus` |
| Library catalog test | `cd frontend && node --test src/data/library.test.js src/data/libraryCatalog.test.js` |
| Unit test | `cd frontend && node --test src/data/library.test.js` |
| Build | `cd frontend && npm run build` (zero TypeScript errors) |
| Scholar review | At least one Tamil scholar reviews the first 100 lines for factual accuracy |

---

## 4a. Romanisation and units — one scheme, no exceptions

Tamil is transliterated by many hands. Pick **one** scheme per file so a reader
is never guessing. The catalog currently uses the Tamil Lexicon style with ASCII
fallbacks:

| Tamil | Use | Never |
|---|---|---|
| க | `k` | `g` |
| த | `th` | `t` |
| ட | `t` | `d` |
| ஞ | `nj` / `nch` in ஞ்ச | mixed `j` and `nch` in one file |
| ற / ன | `r` / `n` | `R` / `N` |

Concretely: **Silappathikaram** (not "Silappatikaram"), **Thevaram** (not
"Tevaram"), **Nanmanikkadikai** (not "…digai"), **Sirupanchamulam** (not
"…panjamulam").

And the counted `unit` must be explained, not just named:

| `unit` | Means | Tamil label |
|---|---|---|
| `sutras` | grammar aphorisms (Tholkappiyam, Iṟaiyanār) | சூத்திரங்கள் |
| `cantos` | epic chapters (Silappathikaram, Manimekalai) | காண்டங்கள் |
| `pathigams` / `hymns` | Saivite hymn-decads | பதிகங்கள் |
| `thirumurai` | the twelve Saivite books | திருமுறைகள் |
| `pasurams` | Vaishnava verses | பாசுரங்கள் |
| `fragments` | a lost work (count must be `null`) | சிதைவுகள் |

If the count is unknown or the work is lost, set `"count": null` — **never** `0`.

---

## 5. Collections policy

We group works into **collections** inside `catalog.json`. Add a new collection only when:

- It represents a recognised canonical grouping (e.g. Aimperumkappiyam, Pathinenkilkkanakku).
- It has at least one work ready to be catalogued, or a clear academic reason to include it.
- It has Tamil and English names, a `kind` tag, and a description.

Do **not** create a collection for a single work or a personal reading list.

---

## 6. Attribution and credit

- Every commit is attributed in git history.
- When a work enters the reader, we add a `contributors.md` inside `data/texts/<work>/` naming the scraper, normaliser, translator, and reviewer.
- If you are a Tamil scholar reviewing lines, your name appears in the reader UI under "Verified by".

---

## 7. Questions?

- Open a GitHub Issue with the label `library-expansion`
- Start a Discussion in the repo
- Reach out to `@yazhi-lem` on GitHub

**வாழ்க தமிழ்! 🦚**
