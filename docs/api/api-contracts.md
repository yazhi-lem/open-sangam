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

Ask the Avai agent swarm a question. All five poet workflows are wired:
`qa` → Avvaiyar, `search`/`reimagine` → Kapilar, `scenario` → Tholkappiyar,
`imagery` → Paranar, `general` → Nakkirar (convener). Omitting `workflow` and
`pulavar` lets the server classify intent. Full design:
`docs/api/avai-ask-prd.md`. Served by `agents/avai/api/app.py`, not Firebase
Functions.

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
    "timestamp": "ISO-8601",
    "token_in": "integer",
    "token_out": "integer",
    "cost_usd": "number",
    "cost_inr": "number"
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

### Health & capability endpoints

```
GET /avai/health          → {"status":"ok"}                 (legacy liveness)
GET /avai/health/live     → status, service, version, uptime
GET /avai/health/ready    → dependency checks; 503 when not answerable
GET /avai/capabilities    → poets, workflows, tools, corpus/graph, features
GET /avai/metrics         → counters/histograms (latency, tokens, USD/INR cost)
```

`/avai/health/ready` returns `200` with `status: "ready"` or `"degraded"`,
and `503` with `status: "not_ready"` when the corpus, knowledge graph, or
tiṇai data cannot load. Deployments also set `AVAI_STRICT_READINESS=1`, which
makes a missing model API key a hard readiness failure. `/avai/capabilities`
is safe to cache briefly and never includes secrets.

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
