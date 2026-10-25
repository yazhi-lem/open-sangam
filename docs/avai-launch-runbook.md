# Avai Demo Launch Runbook — target 14 November

This is the operational checklist for shipping the Sangam Avai agent swarm to
production and running the public demo. It complements
`docs/agent-implementation-plan.md` (capabilities/roadmap) and
`agents/avai/README.md` (local development).

## 1. What “launched” means

- **Backend:** Cloud Run service `avai-api` serves `POST /avai/ask`,
  `GET /avai/health/live`, `GET /avai/health/ready`, and
  `GET /avai/capabilities`.
- **Frontend:** `sangam.yazhi.dev/avai` is visible in production and calls the
  deployed API through `VITE_AVAI_API_URL`.
- **Health:** readiness is strict — corpus, knowledge graph, tiṇai context,
  and the OpenRouter secret must all pass before the deploy succeeds.
- **Capability:** the capability endpoint reports all five poets, peer-mesh
  handoffs, workflows, tools, and live corpus/graph counts.

## 2. One-time repository setup

| Setting | Value |
|---|---|
| Secret `GCP_SA_KEY` | Service account JSON with `run.admin`, `artifactregistry.writer`, `iam.serviceAccountUser`, `secretmanager.secretAccessor` |
| Secret `GCP_PROJECT_ID` | Google Cloud project id |
| Secret Manager | `openrouter-api-key` = production OpenRouter key |
| Secret `VITE_AVAI_API_URL` | Cloud Run service URL printed by the deploy workflow |
| Artifact Registry | Docker repo `avai` in `asia-south1` (or `vars.AVAI_REGION`) |
| Variable `AVAI_ALLOWED_ORIGINS` | `https://sangam.yazhi.dev,https://yazhi.dev,https://chat.yazhi.dev` |
| Variable `AVAI_RATE_LIMIT_PER_MINUTE` | `12` (demo-safe default) |

The Pages workflow now sets `VITE_ENABLE_AVAI=true`. The `/avai` route only
activates when `VITE_AVAI_API_URL` is also present, so this flag can land
before the backend secret exists without exposing a broken page.

## 3. Preflight (T-7 days)

```bash
cd /home/valav/Yazhi/repos/open-sangam/agents
pytest avai/tests -q                 # must be all green
cd ../frontend && npm ci && npm run build
```

Check the live model path once with a real key:

```bash
cd ../agents
python -m avai.evals.qa_smoke        # real OpenRouter tool-calling smoke
```

Run the API locally and verify all four contracts:

```bash
cd agents
uvicorn avai.api.app:app --port 8080
curl -s localhost:8080/avai/health
curl -s localhost:8080/avai/health/live | python -m json.tool
curl -s localhost:8080/avai/health/ready | python -m json.tool
curl -s localhost:8080/avai/capabilities | python -m json.tool
```

## 4. Deploy (T-2 days)

1. Confirm `main` contains the health/capability work and the corpus changes.
2. Push to `main` (or run **Actions → Deploy Avai API to Cloud Run →
   Run workflow**).
3. The workflow runs tests → builds image → deploys with startup/liveness
   probes → smoke-tests health, strict readiness, and capabilities.
4. Copy the printed service URL into the `VITE_AVAI_API_URL` repository secret.
5. Re-run **Deploy Cloudflare Pages** so the frontend picks up the URL and
   `VITE_ENABLE_AVAI=true`.
6. Open `https://sangam.yazhi.dev/avai` and confirm the live badge reads
   “நேரலை • 5 புலவர்கள்”.

## 5. Demo-day checks (T-0)

- [ ] `/avai/health/ready` returns `status=ready` (not `degraded`).
- [ ] `/avai/capabilities` lists `nakkirar, avvaiyar, kapilar, tholkappiyar,
      paranar` and `swarm.enabled=true`.
- [ ] Ask one live question in each workflow: Q&A, search, scenario, imagery.
- [ ] Citation chip links to a real verse in `/book`.
- [ ] Rate limit returns a friendly `429` after the configured burst.
- [ ] Rotate the OpenRouter key if it was ever pasted into a public channel.

## 6. Rollback

Cloud Run keeps revisions. If the new revision is unhealthy:

```bash
gcloud run services update-traffic avai-api \
  --region asia-south1 \
  --to-revisions <PREVIOUS_REVISION>=100
```

If only the frontend is bad, redeploy the previous Cloudflare Pages build or
set `VITE_ENABLE_AVAI=false` and rebuild to hide the route while the backend
is fixed.
