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
pip install -r requirements.txt

# 1. Scrape source text
python -m scraper.scrape_maduraikanchi

# 2. Normalize to JSON schema
python -m normalizer.normalize_to_json

# 3. Generate AI translations
python -m ai.translate_with_gemini
```

### Firebase Functions

```bash
cd backend/functions
npm install
firebase emulators:start
```

## Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | 🔄 In progress | Data scraping & normalization — 17 of 17 Sangam poems |
| 2 | ⬜ Pending | AI English translation (Gemini) + human verification |
| 3 | ⬜ Pending | MVP reader launch |
| 4 | ⬜ Pending | Community contribution layer |

### Poem Corpus (Phase 1)

| Collection | Poem | Status |
|------------|------|--------|
| எட்டுத்தொகை | நற்றிணை Natrinai (400) | ⬜ |
| எட்டுத்தொகை | குறுந்தொகை Kurunthokai (400) | ⬜ |
| எட்டுத்தொகை | ஐங்குறுநூறு Ainkurunooru (500) | ⬜ |
| எட்டுத்தொகை | கலித்தொகை Kalithokai | ⬜ |
| எட்டுத்தொகை | அகநானூறு Akananooru (400) | ⬜ |
| எட்டுத்தொகை | பதிற்றுப்பத்து Pathitrupathu | ⬜ |
| எட்டுத்தொகை | புறநானூறு Purananuru (400) | 🔄 |
| எட்டுத்தொகை | பரிபாடல் Paripadal | ⬜ |
| பத்துப்பாட்டு | திருமுருகாற்றுப்படை Tirumurugaatrupadai | ⬜ |
| பத்துப்பாட்டு | சிறுபாணாற்றுப்படை Sirupanatrupadai | ⬜ |
| பத்துப்பாட்டு | பெரும்பாணாற்றுப்படை Perumpanatrupadai | ⬜ |
| பத்துப்பாட்டு | மலைபடுகடாம் Malaipadukadam | ⬜ |
| பத்துப்பாட்டு | மதுரைக்காஞ்சி Maduraikanchi (782 lines, 63 sections) | ✅ |
| பத்துப்பாட்டு | குறிஞ்சிப்பாட்டு Kurinjipattu | ⬜ |
| பத்துப்பாட்டு | பட்டினப்பாலை Pattinappalai | ⬜ |
| பத்துப்பாட்டு | முல்லைப்பாட்டு Mullaippattu | ⬜ |
| பத்துப்பாட்டு | நெடுநல்வாடை Nedunalvadai | ⬜ |

## License

[LICENSE](./LICENSE) — Content licensed under CC BY-SA where applicable.
