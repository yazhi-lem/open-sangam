# Project Open Sangam

> An interactive educational platform bridging ancient Classical Tamil literature and modern readers.

Open Sangam transforms static, archaic web archives of Sangam-era poetry into a multi-layered learning experience — providing linguistic, cultural, and historical context. Think "Duolingo for Ancient Literature."

## Features

- **Layered View** — Toggle between Sangam Tamil, Modern Tamil prose (*Urai*), and English for every verse
- **Click-to-Define Glossary** — Click any word for root meaning, grammatical class (*Urichol*), and etymology
- **Sangam World** — Immersive Tiṇai landscape navigator (Kuṟiñci · Mullai · Marutam · Neytal · Pālai)
- **Cultural Context Cards** — Pop-up explanations for historical references
- **Audio Recitation** — Recorded / synthesized verses for pronunciation and meter
- **AI Translation** — Gemini 2.5 Flash-powered contemporary prose and English equivalents
- **Community Contributions** — Scholar-reviewed translation edits (Phase 4)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js (Vite) + Tailwind CSS |
| Backend / Storage | Firebase / Firestore |
| Cloud Functions | Node.js (Firebase Functions) |
| Data Pipeline | Python + BeautifulSoup |
| AI Translation | Google Gemini 2.5 Flash |

## Project Structure

```
open-sangam/
├── frontend/        # React + Tailwind web app
├── backend/
│   ├── functions/   # Firebase Cloud Functions
│   └── python/      # Scraping, normalization & AI scripts
├── data/
│   ├── schema/      # JSON schema (Verse → Line → Word)
│   └── texts/       # Processed poem data
└── docs/            # Architecture, governance, style guide
```

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Python Pipeline

```bash
cd backend/python
python -m venv .venv && .venv/bin/pip install -r requirements.txt

# Scrape all 17 Sangam poems (resumes from where it left off)
.venv/bin/python -m scraper.scrape_poem --poem all

# Normalize to OKF datapackage (JSON schema + datapackage.json)
.venv/bin/python -m normalizer.normalize_all --poem all

# Generate English translations via Gemini (requires GEMINI_API_KEY in .env)
.venv/bin/python -m ai.translate_with_gemini --poem maduraikanchi --lang english
```

### Firebase Functions

```bash
cd backend/functions
npm install
firebase emulators:start
```

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | Data scraping & normalization | 🔄 In progress |
| 2 | AI English translation + human verification | ⬜ Pending |
| 3 | Library of Sangam — MVP reader live | 🔄 In progress |
| 4 | Community contribution layer | ⬜ Pending |

---

## Corpus Status

> Pipeline: **Scrape** → **Normalize** → **Library** → **English** → **Verified**
>
> `█` done · `▒` partial · `░` pending

### எட்டுத்தொகை — Eight Anthologies

```
Poem                          Verses  Scrape    Normalize  Library   English   Verified
─────────────────────────────────────────────────────────────────────────────────────────
நற்றிணை      Natrinai           400   ██████░░  ██████░░   ██████░░  ░░░░░░░░  ░░░░░░░░
குறுந்தொகை   Kurunthokai        400   ██████░░  ░░░░░░░░   ░░░░░░░░  ░░░░░░░░  ░░░░░░░░
ஐங்குறுநூறு  Ainkurunooru       500   ░░░░░░░░  ░░░░░░░░   ░░░░░░░░  ░░░░░░░░  ░░░░░░░░
கலித்தொகை   Kalithokai         149   ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
அகநானூறு    Akananooru         220   ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
பதிற்றுப்பத்து Pathitrupathu     80   ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
புறநானூறு    Purananuru         400   ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
பரிபாடல்     Paripadal           23   ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
```

> ⚠ **ஐங்குறுநூறு Ainkurunooru** — source site returns no sub-page links; needs manual URL mapping.

### பத்துப்பாட்டு — Ten Idylls

```
Poem                              Sections  Scrape    Normalize  Library   English   Verified
──────────────────────────────────────────────────────────────────────────────────────────────
திருமுருகாற்றுப்படை Tirumurugam      32    ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
சிறுபாணாற்றுப்படை  Sirupanam         25    ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
பெரும்பாணாற்றுப்படை Perumapanam      41    ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
மலைபடுகடாம்        Malaipadukadam    45    ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
மதுரைக்காஞ்சி      Maduraikanchi     63    ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
குறிஞ்சிப்பாட்டு   Kurinjipattu      25    ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
பட்டினப்பாலை       Pattinappalai     30    ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
முல்லைப்பாட்டு     Mullaippattu      18    ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
நெடுநல்வாடை        Nedunalvadai      17    ████████  ████████   ████████  ░░░░░░░░  ░░░░░░░░
```

### Overall Progress

```
Total poems          17  ██████████████░░  16 in Library (1 pending source fix)
Total records     2,066  ██████████████░░  fully normalized (94% of corpus)
Tamil prose (Urai)       ██████████░░░░░░  scraped where available on source
English translation      ░░░░░░░░░░░░░░░░  Phase 2 — Gemini pending
```

> **Readable in [சங்க நூலகம் — Library of Sangam](/frontend):**
> நற்றிணை · குறுந்தொகை · கலித்தொகை · அகநானூறு · பதிற்றுப்பத்து · புறநானூறு · பரிபாடல் · திருமுருகாற்றுப்படை · சிறுபாணாற்றுப்படை · பெரும்பாணாற்றுப்படை · மலைபடுகடாம் · மதுரைக்காஞ்சி · குறிஞ்சிப்பாட்டு · பட்டினப்பாலை · முல்லைப்பாட்டு · நெடுநல்வாடை

---

## License

[LICENSE](./LICENSE) — Content licensed under CC BY-SA where applicable.
