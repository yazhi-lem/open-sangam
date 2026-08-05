# API Contracts

All Cloud Functions are served under the Firebase Functions base URL.
In development use the emulator: `http://127.0.0.1:5001`.

The `/avai/ask` endpoint (below) is served separately, by the Python agent
service in `agents/avai/api/`, not by Firebase Functions — see
`docs/api/avai-ask-prd.md` for why and `agents/avai/README.md` for how to
run it. It reuses this file's error-shape convention (`{"message": "..."}`)
so callers can share error-handling code across both APIs.

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

## POST `/avai/ask`

Ask the Avai agent swarm a question. M1: only `workflow: "qa"` runs a real
agent (ஔவையார் / Avvaiyar); other workflow values are validated and return
`501` until the M2 poet swarm lands. Full design: `docs/api/avai-ask-prd.md`.
Served by `agents/avai/api/app.py`, not Firebase Functions.

### Request

```json
{
  "message": "string — required, 1-2000 chars",
  "workflow": "qa | search | reimagine | scenario | imagery — optional, default 'qa'",
  "session_id": "string — optional, omit to start a new conversation",
  "user_id": "string — optional, defaults to 'anonymous'",
  "context": {
    "tinai": "string — optional filter hint, e.g. 'kurinji'",
    "poem": "string — optional filter hint, e.g. 'kurunthokai'",
    "limit": "integer — optional, 1-50, default 10"
  }
}
```

### Response `200`

```json
{
  "session_id": "string — echo back to continue this conversation",
  "workflow": "qa",
  "poet": "avvaiyar",
  "response_text": "string — the agent's answer",
  "citations": [
    {
      "verse_id": "string, e.g. purananooru_001",
      "poem": "string",
      "tinai": "string",
      "poet": "string"
    }
  ],
  "metadata": {
    "model": "string, e.g. openrouter:google/gemini-2.5-flash",
    "elapsed_ms": "integer",
    "timestamp": "ISO-8601"
  }
}
```

### Error `400`

```json
{ "message": "`message` invalid: Field required" }
```

### Error `501`

```json
{ "message": "Poem reimagining is Kapilar's workflow (M2), not yet wired." }
```

### Error `502`

```json
{ "message": "Agent execution failed" }
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
