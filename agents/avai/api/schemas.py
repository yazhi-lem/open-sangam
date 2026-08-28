"""Pydantic request/response schemas for the POST /avai/ask REST endpoint.
"""

from typing import Literal

from pydantic import BaseModel, Field

Workflow = Literal["qa", "search", "reimagine", "scenario", "imagery", "general"]


class AskContext(BaseModel):
    """Optional filters forwarded to the agent as a hint, not enforced server-side."""

    tinai: str | None = Field(
        default=None, description="Filter by tiṇai, e.g. 'kurinji'."
    )
    poem: str | None = Field(
        default=None, description="Scope the query to one poem, e.g. 'kurunthokai'."
    )
    limit: int = Field(default=10, ge=1, le=50)


class AskRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    workflow: Workflow | None = "qa"
    pulavar: str | None = Field(
        default=None,
        description="Direct target pulavar: nakkirar, avvaiyar, kapilar, tholkappiyar, paranar, or swarm",
    )
    poet: str | None = Field(
        default=None,
        description="Alias for pulavar (backwards compatibility).",
    )
    session_id: str | None = Field(
        default=None,
        description="Reuse a prior response's session_id to continue that conversation.",
    )
    user_id: str | None = Field(
        default=None, description="Caller-supplied id used to scope sessions; defaults to anonymous."
    )
    context: AskContext = Field(default_factory=AskContext)


class Citation(BaseModel):
    verse_id: str
    poem: str | None = None
    tinai: str | None = None
    poet: str | None = None
    pulavar: str | None = None


class AskMetadata(BaseModel):
    model: str
    elapsed_ms: int
    timestamp: str


class AskResponse(BaseModel):
    session_id: str
    workflow: Workflow
    pulavar: str
    poet: str | None = None
    response_text: str
    citations: list[Citation]
    metadata: AskMetadata


class ErrorResponse(BaseModel):
    message: str
