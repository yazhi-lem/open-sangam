# Architecture

## Overview

Open Sangam is a three-tier web application:

```
Browser (React + Tailwind)
        ↕  HTTPS
Firebase Hosting  ──→  Firebase Cloud Functions (Node.js)
                                    ↕
                          Google Gemini 2.5 Flash API
                                    ↕
                          Firebase Firestore (verse data)
```

## Frontend

- **Framework**: React 18 (Vite bundler)
- **Styling**: Tailwind CSS v4 with custom CSS variables for Tamil typography
- **Routing**: React Router v6 (client-side SPA)
- **State**: Zustand for global UI state (active Tiṇai, open overlays, layer preference)
- **Fonts**: Noto Serif Tamil (verse display), Noto Sans Tamil (UI), Inter (body)

### Key Components

| Component | Responsibility |
|-----------|---------------|
| `LayeredView` | Toggle between Sangam Tamil / Urai / English |
| `VerseCard` | Display one verse with prev/next navigation |
| `WordGlossary` | Click-to-Define pop-up (root, Urichol, etymology) |
| `TinaiMap` | Tiṇai landscape selector grid |
| `CulturalContextCard` | Historical reference pop-up cards |
| `AudioPlayer` | Verse recitation playback |

## Backend

### Firebase Cloud Functions

Two HTTP functions proxy browser requests to Gemini:

- `POST /translate` — verse → Urai or English translation
- `POST /analyze-word` — word → root, Urichol, etymology, gloss

The Gemini API key is stored as a Firebase Secret (`GEMINI_API_KEY`) and never exposed to the client.

### Firestore Data Model

```
/poems/{poemId}/verses/{verseId}   ← verse documents (Verse schema)
/contributions/{contributionId}    ← scholar translation edits
/users/{userId}                    ← user profiles
```

## Data Pipeline (Python)

```
sangathamizh.com  →  scraper  →  raw JSON  →  normalizer  →  normalized JSON
                                                                     ↓
                                              ai/translate_with_gemini.py
                                       (OpenRouter → Gemini 2.5 Flash, phased)
                                                                     ↓
                                          normalized JSON + englishMeta provenance
                                          data/pipeline/translation-state.json
                                                                     ↓
                                     bundled into the frontend build (and,
                                     when used, Firestore upload)
```

**Components**

| Piece | Path | Role |
|---|---|---|
| Scraper | `backend/python/scraper/` | source HTML/PDF → `data/texts/*/raw/` |
| Normalizer | `backend/python/normalizer/` | raw → `normalized/*.json` + `datapackage.json` |
| Translator | `backend/python/ai/translate_with_gemini.py` | fills `english` via OpenRouter; phased, resumable, bounded per run |
| Run metadata | `data/pipeline/translation-state.json` | phase, per-poem coverage, last 30 run records |
| Scheduler | `.github/workflows/translate-english.yml` | nightly 02:00 UTC batch + auto-commit |
| Graph builder | `backend/python/knowledge/build_graph.py` | corpus → `data/knowledge/graph.json` |

The translator reaches Gemini through **OpenRouter**, the same gateway the
`agents/avai` assembly uses, so one `OPENROUTER_API_KEY` covers both. The
Cloud Functions path (`/translate`, `/analyze-word`) still calls the Gemini API
directly with its own Firebase Secret — it serves on-demand browser requests
for verses the batch pipeline has not reached yet.

Progress is tracked by **derivation, not bookkeeping**: coverage is recounted
from `data/texts/*/normalized/*.json` at the start of every run, so the state
file is an audit record rather than a source of truth that can drift.

## Security

- Firestore rules enforce public read, admin-only write for verses
- Contributions require authentication; authors can edit only their own
- Gemini API key stored as Firebase Secret, accessed only server-side
- CORS configured on Cloud Functions; allow-list production domain in production
