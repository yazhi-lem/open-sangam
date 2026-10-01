from typing import Literal, Optional

from pydantic import BaseModel, Field

from ..schemas import (
    AbstentionReason,
    EvidenceStatus,
    PulavarAnswer,
    PulavarCitation,
    PulavarClaim,
    PulavarSourceMetadata,
)

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
    workflow: Workflow | None = Field(
        default=None,
        description="Explicit workflow: qa, search, reimagine, scenario, imagery, or general. If None/omitted, server automatically classifies message intent.",
    )
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
    citation_id: str | None = None
    quote: str | None = None
    verified: bool = True
    is_valid: bool = True


class AskMetadata(BaseModel):
    model: str
    elapsed_ms: int
    timestamp: str
    workflow: str | None = None
    routed_pulavar: str | None = None
    routing_reason: str | None = None


class AskResponse(BaseModel):
    session_id: str
    workflow: Workflow
    pulavar: str
    poet: str | None = None
    routing_reason: str | None = None
    response_text: str
    citations: list[Citation]
    metadata: AskMetadata
    # Extended Pulavar Answer Contract (Source-grounded & verifiable)
    claims: list[PulavarClaim] = Field(default_factory=list)
    is_abstained: bool = False
    abstention_reason: AbstentionReason = "none"
    evidence_status: EvidenceStatus = "verified"
    pulavar_answer: Optional[PulavarAnswer] = None


class ErrorResponse(BaseModel):
    message: str


__all__ = [
    "Workflow",
    "AskContext",
    "AskRequest",
    "Citation",
    "AskMetadata",
    "AskResponse",
    "ErrorResponse",
    "EvidenceStatus",
    "AbstentionReason",
    "PulavarSourceMetadata",
    "PulavarCitation",
    "PulavarClaim",
    "PulavarAnswer",
]

