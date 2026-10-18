# API Contracts

The public Gemini Cloud Functions (`/translate`, `/analyze-word`) were removed;
the site is static and reads data from the corpus and Firestore.

The `/avai/ask` endpoint (below) is served by the Python agent
service in `agents/avai/api/` — see
`docs/api/avai-ask-prd.md` for why and `agents/avai/README.md` for how to
run it. It reuses this file's error-shape convention (`{"message": "..."}`)
so callers can share error-handling code across both APIs.

---

## POST `/avai/ask`

Ask the Avai agent swarm a question. M1: only `workflow: "qa"` runs a real
agent (ஔவையார் / Avvaiyar); other workflow values are validated and return
`501` until the M2 poet swarm lands. Full design: `docs/api/avai-ask-prd.md`.
Served by `agents/avai/api/app.py`.

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
