"""Pydantic request/response schemas for the POST /avai/ask REST endpoint.

Kept separate from the top-level `schemas.py` reserved (per
docs/agent-implementation-plan.md §3) for M2's domain models (Scenario,
ImagePromptSpec) — these are API transport shapes, not agent output schemas.
"""

from typing import Literal, Optional

from pydantic import BaseModel, Field

# "qa" is the only workflow wired to a real agent in M1 (Avvaiyar). The rest
# are accepted now so callers (e.g. chat.yazhi.dev) can code against the full
# contract ahead of the M2 poet swarm landing; requesting one returns 501
# until then. See docs/api/avai-ask-prd.md §Workflows.
Workflow = Literal["qa", "search", "reimagine", "scenario", "imagery"]

# Agent name selector — maps to a specific poet agent in the swarm.
AgentName = Literal[
    "nakkirar", "avvaiyar", "kapilar", "tholkappiyar", "english_scholar", "paranar"
]


class AskContext(BaseModel):
    """Optional filters forwarded to the agent as a hint, not enforced server-side."""

    tinai: Optional[str] = Field(
        default=None, description="Filter by tiṇai, e.g. 'kurinji'."
    )
    poem: Optional[str] = Field(
        default=None, description="Scope the query to one poem, e.g. 'kurunthokai'."
    )
    limit: int = Field(default=10, ge=1, le=50)


class AskRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    agent: AgentName = Field(
        default="nakkirar",
        description="Which poet agent to route to. Defaults to nakkirar (convener).",
    )
    workflow: Workflow = "qa"
    session_id: Optional[str] = Field(
        default=None,
        description="Reuse a prior response's session_id to continue that conversation.",
    )
    user_id: Optional[str] = Field(
        default=None, description="Caller-supplied id used to scope sessions; defaults to anonymous."
    )
    context: AskContext = Field(default_factory=AskContext)


class Citation(BaseModel):
    verse_id: str
    poem: Optional[str] = None
    tinai: Optional[str] = None
    poet: Optional[str] = None


class AskMetadata(BaseModel):
    model: str
    elapsed_ms: int
    timestamp: str


class AskResponse(BaseModel):
    session_id: str
    workflow: Workflow
    poet: str
    response_text: str
    citations: list[Citation]
    metadata: AskMetadata
    image_url: Optional[str] = Field(
        default=None,
        description="Generated image data-URI (when workflow=imagery and backend supports it).",
    )
    image_prompt: Optional[str] = Field(
        default=None,
        description="The crafted image generation prompt (when workflow=imagery).",
    )


class ErrorResponse(BaseModel):
    message: str
