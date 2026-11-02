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
- [Digital Tamil Lexicon](https://the collation may vary)

#### Step B — Normalize

Use or extend the normalizer in `backend/python/normalizer/`:

```bash
cd backend/python
python -m normalizer.normalize --input ../../data/raw/<work>/ --output ../../data/texts/<work>/ --schema data/schema/verse_schema.json
```

Each JSON file must match `verse_schema.json`. The minimal shape is:

```json
{
  "id": "maduraikanchi-001",
  "poem": "maduraikanchi",
  "number": 1,
  "original": "...",
  "transliteration": "...",
  "tinai": "marutam",
  "layers": {
    "original":    { "text": "...", "verified": true },
    "transliteration": { "text": "...", "verified": true },
    "urai":         { "text": "...", "verified": false },
    "english":      { "text": "...", "verified": false },
    "glossary":     { "entries": [], "verified": false },
    "notes":        { "text": "", "verified": false }
  }
}
```

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
| JSON schema validation | `python -m normalizer.validate --schema data/schema/verse_schema.json` |
| Unit test | `cd frontend && node --test src/data/library.test.js` |
| Build | `cd frontend && npm run build` (zero TypeScript errors) |
| Scholar review | At least one Tamil scholar reviews the first 100 lines for factual accuracy |

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
