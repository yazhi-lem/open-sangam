# API Contracts

All Cloud Functions are served under the Firebase Functions base URL.
In development use the emulator: `http://127.0.0.1:5001`.

---

## POST `/translate`

Translate a Sangam Tamil verse using Gemini 2.5 Flash.

### Request

```json
{
  "verse": "string — original Sangam Tamil verse text",
  "targetLang": "english | urai"
}
```

### Response `200`

```json
{
  "text": "string — translated text",
  "model": "gemini-2.5-flash",
  "targetLang": "english | urai"
}
```

### Error `400`

```json
{ "message": "`verse` is required" }
```

### Error `500`

```json
{ "message": "Translation failed", "error": "string" }
```

---

## POST `/analyze-word`

Fetch etymological analysis for a single Tamil word.

### Request

```json
{
  "word": "string — Tamil word in original script"
}
```

### Response `200`

```json
{
  "root": "string — root word in Tamil script",
  "urichol": "string — grammatical / semantic class",
  "etymology": "string — brief etymology in English",
  "gloss": "string — English gloss"
}
```

### Error `400`

```json
{ "message": "`word` is required" }
```

### Error `500`

```json
{ "message": "Word analysis failed", "error": "string" }
```

---

## Firestore Collections

### `poems/{poemId}/verses/{verseId}`

See `data/schema/verse_schema.json` for the full document shape.

### `contributions/{contributionId}`

```json
{
  "verseId": "string",
  "poemId": "string",
  "field": "urai | english",
  "proposedText": "string",
  "authorId": "string",
  "authorName": "string",
  "createdAt": "timestamp",
  "status": "pending | approved | rejected"
}
```
