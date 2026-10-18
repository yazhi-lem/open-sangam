# Avai Ask API — container for Cloud Run (or any container host).
#
# Build from the REPOSITORY ROOT so the corpus and knowledge graph are in the
# build context:
#   docker build -f agents/avai/Dockerfile -t avai-api .
#   docker run -p 8080:8080 -e OPENROUTER_API_KEY=... avai-api
#
# The tools resolve data relative to the package (parents[3] of avai/tools/*),
# so the image mirrors the repo layout: /app/agents/avai + /app/data.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8080

WORKDIR /app

COPY agents/avai/requirements-runtime.txt /tmp/requirements-runtime.txt
RUN pip install -r /tmp/requirements-runtime.txt

COPY data/texts /app/data/texts
COPY data/knowledge /app/data/knowledge
COPY agents/avai /app/agents/avai

# Runtime artifacts (agent_artifacts.jsonl, interaction_graph.json) are written
# here; on Cloud Run this is ephemeral per instance, which is fine for the beta.
RUN mkdir -p /app/data/generated \
    && useradd --create-home --uid 10001 avai \
    && chown -R avai:avai /app/data/generated

USER avai
WORKDIR /app/agents

EXPOSE 8080
CMD ["sh", "-c", "exec uvicorn avai.api.app:app --host 0.0.0.0 --port ${PORT}"]
