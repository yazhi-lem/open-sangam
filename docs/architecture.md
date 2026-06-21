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
                                                        AI translation (Gemini)
                                                                     ↓
                                                         Firestore upload
```

## Security

- Firestore rules enforce public read, admin-only write for verses
- Contributions require authentication; authors can edit only their own
- Gemini API key stored as Firebase Secret, accessed only server-side
- CORS configured on Cloud Functions; allow-list production domain in production
