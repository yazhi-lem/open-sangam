from typing import List, Literal, Optional
from pydantic import BaseModel, Field

class KaruElements(BaseModel):
    flora: List[str] = Field(description="Plants, trees, or flowers mentioned in the verse")
    fauna: List[str] = Field(description="Animals, birds, or insects mentioned in the verse")
    landscape: List[str] = Field(description="Geographical features like mountains, rivers, or fields")

class Scenario(BaseModel):
    speaker: str = Field(description="The persona speaking the verse (e.g., Thalaivi, Thozhi, Thalaivan)")
    addressee: str = Field(description="The person being spoken to")
    tinai: str = Field(description="The classical landscape or situation (Kurinji, Mullai, Marutam, Neytal, Palai, or Puram tinais)")
    uripporul: str = Field(description="The core emotional theme (e.g., union, separation, waiting)")
    karu: KaruElements = Field(description="The regional elements that form the backdrop of the poem")
    dramaticSituation: str = Field(description="A concise summary of the dramatic context")
    evidenceLines: List[int] = Field(description="The specific line numbers that provide the strongest evidence for this extraction")

class ImageResult(BaseModel):
    prompt: str = Field(description="The prompt used to generate the image")
    aspect_ratio: str = Field(description="The aspect ratio used")
    image_data_uri: Optional[str] = Field(default=None, description="The generated image as a data URI")
    disclaimer: str = Field(
        default="AI-recreated imagery — not a historical depiction.",
        description="Mandatory disclaimer for all generated images."
    )

EvidenceStatus = Literal["verified", "partially_verified", "unsupported", "conflicting", "abstained"]

AbstentionReason = Literal[
    "insufficient_evidence",
    "fabricated_reference",
    "incorrect_attribution",
    "conflicting_evidence",
    "out_of_scope",
    "unicode_corruption",
    "prompt_injection",
    "none"
]

class PulavarSourceMetadata(BaseModel):
    source_id: str = Field(description="Normalized verse or source identifier, e.g. 'kurunthokai_100'")
    poem: Optional[str] = Field(default=None, description="Poem or anthology name, e.g. 'kurunthokai'")
    verse_number: Optional[int] = Field(default=None, description="Verse number if applicable")
    poet: Optional[str] = Field(default=None, description="Attributed poet / author")
    tinai: Optional[str] = Field(default=None, description="Classical tiṇai")
    matched_quote: Optional[str] = Field(default=None, description="Quoted original Tamil line or phrase verified in source")
    line_numbers: List[int] = Field(default_factory=list, description="Verified line numbers in source")
    source_type: str = Field(default="corpus_verse", description="Type of source: corpus_verse, grammar_rule, colophon")
    verified: bool = Field(default=False, description="True if verified against primary corpus data")

class PulavarCitation(BaseModel):
    citation_id: str = Field(description="Unique reference marker, e.g. '[^1]' or 'c1'")
    source_id: str = Field(description="Target source identifier, e.g. 'kurunthokai_100'")
    source: Optional[PulavarSourceMetadata] = Field(default=None, description="Resolved source metadata")
    quote: Optional[str] = Field(default=None, description="Exact or normalized quote from source supporting claim")
    is_valid: bool = Field(default=False, description="Whether Python validator confirmed this citation")
    validation_notes: Optional[str] = Field(default=None, description="Validator check details or mismatch notes")

class PulavarClaim(BaseModel):
    claim_id: str = Field(description="Claim index or id, e.g. 'claim_1'")
    claim_text: str = Field(description="Individual factual assertion made in the response")
    claim_text_ta: Optional[str] = Field(default=None, description="Tamil rendition of the factual claim")
    citation_ids: List[str] = Field(default_factory=list, description="Associated citation IDs supporting this claim")
    citations: List[PulavarCitation] = Field(default_factory=list, description="Full verified citation objects")
    evidence_status: EvidenceStatus = Field(default="unsupported", description="Verification status of this specific claim")
    is_supported: bool = Field(default=False, description="True only if supported by verified citations")

class PulavarAnswer(BaseModel):
    answer_text: str = Field(description="Final answer text in Tamil / English")
    answer_text_ta: Optional[str] = Field(default=None, description="Tamil-first response text")
    claims: List[PulavarClaim] = Field(default_factory=list, description="Decomposed factual claims")
    citations: List[PulavarCitation] = Field(default_factory=list, description="All verified source citations")
    evidence_status: EvidenceStatus = Field(default="verified", description="Overall evidence status")
    is_abstained: bool = Field(default=False, description="True if Pulavar abstains from answering")
    abstention_reason: AbstentionReason = Field(default="none", description="Reason for abstention")
    abstention_message_ta: Optional[str] = Field(default=None, description="Tamil explanation for abstention")
    confidence_score: float = Field(default=1.0, description="Deterministic confidence score between 0.0 and 1.0")

