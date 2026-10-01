"""citation_validator.py — Deterministic Python-side validation engine for Pulavar answers.

Guiding Principle: "The model proposes; Python decides."
Validates claims, citations, poet attributions, verse numbers, and quotes against
the primary Sangam corpus. Enforces explicit abstention when evidence is missing,
fabricated, conflicting, or out of scope.
"""

from __future__ import annotations

import json
import re
import unicodedata
from typing import Any, List, Optional, Tuple

from .schemas import (
    AbstentionReason,
    EvidenceStatus,
    PulavarAnswer,
    PulavarCitation,
    PulavarClaim,
    PulavarSourceMetadata,
)
from .tools.corpus import _VERSE_INDEX, get_verse

# Regex patterns
_VERSE_ID_REGEX = re.compile(r"\b([a-z]+_\d{1,4})\b", re.IGNORECASE)
_INLINE_CITATION_REGEX = re.compile(r"\[\^?(\d+|[a-z0-9_-]+)\]", re.IGNORECASE)
_FOOTNOTE_DEF_REGEX = re.compile(
    r"^\[\^?(\d+|[a-z0-9_-]+)\]:\s*(.+)$", re.MULTILINE
)
_PUNCTUATION_STRIP_REGEX = re.compile(r"[\s\.,;:!?\"'“”‘’—–\(\)\[\]{}]+")

# Known prompt injection signatures
_PROMPT_INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(all\s+)?(previous|prior)\s+instructions", re.IGNORECASE),
    re.compile(r"system\s+prompt\s+override", re.IGNORECASE),
    re.compile(r"(reveal|print|show)\s+(the\s+)?(system\s+prompt|developer\s+mode)", re.IGNORECASE),
    re.compile(r"முந்தைய\s+விதிகளைப்\s*புறக்கணி", re.IGNORECASE),
    re.compile(r"கட்டளைகளை\s*மீறி", re.IGNORECASE),
]

# Standard Tamil poet normalization map for common honorifics / orthographic variations
_POET_NORMALIZATION = {
    "கபிலர்": "கபிலர்",
    "கபிலனார்": "கபிலர்",
    "ஔவையார்": "ஔவையார்",
    "ஒளவையார்": "ஔவையார்",
    "அவ்வையார்": "ஔவையார்",
    "நக்கீரர்": "நக்கீரர்",
    "நக்கீரனார்": "நக்கீரர்",
    "பரணர்": "பரணர்",
    "தொல்காப்பியர்": "தொல்காப்பியர்",
    "திப்புத்தோளார்": "திப்புத்தோளார்",
    "திப்புத் தோளார்": "திப்புத்தோளார்",
    "வெள்ளிவீதியார்": "வெள்ளிவீதியார்",
    "இளங்கோவடிகள்": "இளங்கோவடிகள்",
    "காவேரிப்பூம்பட்டினத்துக் காரிக்கண்ணனார்": "காவேரிப்பூம்பட்டினத்துக் காரிக்கண்ணனார்",
}

# Standard Tamil abstention message strings
ABSTENTION_MESSAGES_TA = {
    "insufficient_evidence": (
        "சங்க இலக்கியத் தரவுத் தொகுப்பில் இவ்வினாவிற்குரிய போதுமான நேரடிச் சான்றாதாரங்கள் கிடைக்கப்பெறவில்லை. "
        "சான்றற்ற ஊகங்களைத் தவிர்த்து, புலவர் அவை நடுநிலையுடன் மறுமொழியைத் தவிர்க்கிறது."
    ),
    "fabricated_reference": (
        "சுட்டப்பட்ட பாடல் அல்லது மூலக் குறிப்பு சங்க இலக்கிய மூலத் தொகுப்பில் காணப்படாத போலியான ஒன்றாகும். "
        "புனையப்பட்ட மேற்கோள்களை ஏற்க இயலாது என்பதால் மறுமொழி தவிர்க்கப்பட்டது."
    ),
    "incorrect_attribution": (
        "சுட்டப்பட்ட பாடலின் பாடிய புலவர் அல்லது நூல் பற்றிய குறிப்பு மூல நூலின் செய்திகளோடு முரண்படுகிறது. "
        "தவறான அடையாளப்படுத்தலின் காரணமாக மறுமொழி தவிர்க்கப்பட்டது."
    ),
    "conflicting_evidence": (
        "இவ்வினா தொடர்பான சான்றாதாரங்கள் ஒன்றோடொன்று முரண்படுகின்றன. போதுமான மாற்று உரைக் குறிப்புகள் இன்றி "
        "ஒருமுகமான முடிவை ஏற்க முடியாது என்பதால் மறுமொழி தவிர்க்கப்பட்டது."
    ),
    "out_of_scope": (
        "இவ்வினா சங்க இலக்கியம், தொல்காப்பிய இலக்கணம் அல்லது செம்மொழித் தமிழ் மரபின் எல்லைக்கு அப்பாற்பட்டதாகும். "
        "அவையின் நெறிமுறைப்படி இதற்கு விடையளிப்பது தவிர்க்கப்படுகிறது."
    ),
    "unicode_corruption": (
        "வினா அல்லது உரையில் தமிழ் ஒருங்குறி (Unicode) சிதைவு மற்றும் அங்கீகரிக்கப்படாத குறியீடுகள் கண்டறியப்பட்டன. "
        "தூய தமிழ் எழுத்துருவில் மீண்டும் வினவவும்."
    ),
    "prompt_injection": (
        "அவையின் தன்னாட்சி மற்றும் அறிவுப் பாதுகாப்பு விதிகளுக்கு முரணான கட்டளைகள் கண்டறியப்பட்டதால் "
        "இக்கோரிக்கை முற்றிலுமாக நிராகரிக்கப்பட்டது."
    ),
    "none": "",
}


def normalize_tamil_text(text: str) -> str:
    """Normalizes Tamil text using Unicode NFC form."""
    if not text:
        return ""
    return unicodedata.normalize("NFC", text).strip()


def check_unicode_integrity(text: str) -> bool:
    """Checks for Unicode corruption such as replacement characters or isolated combining characters."""
    if not text:
        return True
    if "\ufffd" in text:
        return False
    # Check for isolated Tamil vowel signs without base consonant
    # Tamil dependent vowel signs: U+0BBE to U+0BCD, U+0BD7
    chars = list(text)
    for i, c in enumerate(chars):
        if 0x0BBE <= ord(c) <= 0x0BD7:
            if i == 0:
                return False
            prev = chars[i - 1]
            # Previous must be a Tamil consonant or another valid character
            if not (0x0B95 <= ord(prev) <= 0x0BB9):
                return False
    return True


def check_prompt_injection(text: str) -> bool:
    """Returns True if the text contains a prompt injection signature."""
    for pattern in _PROMPT_INJECTION_PATTERNS:
        if pattern.search(text):
            return True
    return False


def _clean_for_match(text: str) -> str:
    """Removes spaces, punctuation, and case to compare Tamil/English substrings safely."""
    norm = normalize_tamil_text(text).lower()
    return _PUNCTUATION_STRIP_REGEX.sub("", norm)


def _normalize_poet_name(poet: str | None) -> str:
    if not poet:
        return ""
    norm = normalize_tamil_text(poet)
    for variant, canonical in _POET_NORMALIZATION.items():
        if variant in norm or norm in variant:
            return canonical
    return norm


def verify_source(source_id: str) -> Tuple[bool, Optional[dict], Optional[str]]:
    """Verifies whether a source_id exists in the canonical Sangam verse index.

    Returns:
        (is_valid, verse_dict_or_none, error_message_or_none)
    """
    clean_id = source_id.strip().lower()
    verse = get_verse(clean_id)
    if "error" in verse:
        return False, None, f"Source '{clean_id}' does not exist in corpus"
    return True, verse, None


def verify_poet_attribution(
    cited_poet: str | None, actual_poet: str | None
) -> Tuple[bool, Optional[str]]:
    """Verifies that the cited poet matches the primary colophon poet attribution."""
    if not cited_poet:
        return True, None
    if not actual_poet:
        return False, "Corpus lists no author, but citation asserted a specific poet"

    norm_cited = _clean_for_match(_normalize_poet_name(cited_poet))
    norm_actual = _clean_for_match(_normalize_poet_name(actual_poet))

    if norm_cited in norm_actual or norm_actual in norm_cited:
        return True, None
    return False, f"Poet mismatch: cited '{cited_poet}', but corpus has '{actual_poet}'"


def verify_quote_in_verse(
    quote: str | None, verse: dict
) -> Tuple[bool, List[int], Optional[str]]:
    """Verifies that a quoted Tamil snippet exists verbatim in the verse text or lines.

    Returns:
        (is_verified, matched_line_numbers, error_note)
    """
    if not quote or not quote.strip():
        return True, [], None

    clean_quote = _clean_for_match(quote)
    if len(clean_quote) < 3:
        # Quote too short to be meaningful
        return True, [], None

    matched_lines = []
    lines = verse.get("lines", [])
    for line in lines:
        line_clean = _clean_for_match(line.get("text", ""))
        if clean_quote in line_clean or line_clean in clean_quote:
            matched_lines.append(line.get("lineNumber", 0))

    if matched_lines:
        return True, matched_lines, None

    # Check full poem text if line-level match wasn't found (due to enjambment)
    full_text_clean = _clean_for_match(verse.get("sangamTamil", ""))
    if clean_quote in full_text_clean:
        return True, [1], None

    # Check commentary (urai) as secondary source
    urai_clean = _clean_for_match(verse.get("urai", ""))
    if clean_quote in urai_clean:
        return True, [], None

    return False, [], f"Quote '{quote}' was not found in the verified text of {verse.get('id')}"


def parse_raw_proposal(raw_output: str) -> dict:
    """Parses model output which may be raw JSON, Markdown with footnotes, or plain text."""
    trimmed = raw_output.strip()

    # 1. Try parsing full JSON or ```json block
    json_candidate = trimmed
    if "```json" in trimmed:
        match = re.search(r"```json\s*(.*?)\s*```", trimmed, re.DOTALL)
        if match:
            json_candidate = match.group(1).strip()
    elif trimmed.startswith("{") and trimmed.endswith("}"):
        json_candidate = trimmed

    if json_candidate.startswith("{"):
        try:
            parsed = json.loads(json_candidate)
            if isinstance(parsed, dict) and ("claims" in parsed or "answer_text" in parsed):
                return parsed
        except Exception:
            pass

    # 2. Parse Markdown footnotes e.g. [^1]: kurunthokai_100
    footnote_sources: dict[str, str] = {}
    for match in _FOOTNOTE_DEF_REGEX.finditer(trimmed):
        fn_id, fn_target = match.groups()
        footnote_sources[fn_id] = fn_target.strip()

    # Split text into lines/sentences to extract claims
    cleaned_lines = []
    for line in trimmed.split("\n"):
        if _FOOTNOTE_DEF_REGEX.match(line):
            continue
        cleaned_lines.append(line)
    body_text = "\n".join(cleaned_lines).strip()

    claims_data = []
    # Check paragraphs / non-empty lines for assertions
    paragraphs = [p.strip() for p in body_text.split("\n") if p.strip() and not p.startswith("#")]
    for idx, p in enumerate(paragraphs):
        citation_ids = []
        for cite_match in _INLINE_CITATION_REGEX.finditer(p):
            cid = cite_match.group(1)
            citation_ids.append(cid)

        # Also find direct verse IDs in paragraph
        for vid in _VERSE_ID_REGEX.findall(p):
            citation_ids.append(vid)

        claims_data.append({
            "claim_id": f"claim_{idx + 1}",
            "claim_text": p,
            "citation_ids": list(dict.fromkeys(citation_ids)),
            "raw_footnote_sources": footnote_sources,
        })

    return {
        "answer_text": body_text,
        "claims": claims_data,
        "raw_footnotes": footnote_sources,
    }


class PulavarCitationValidator:
    """Deterministic validation engine for Pulavar answers and citations."""

    def __init__(self, verse_index: Optional[dict] = None):
        self.verse_index = verse_index if verse_index is not None else _VERSE_INDEX

    def validate_answer(
        self,
        raw_model_output: str,
        user_query: str = "",
        allow_abstention: bool = True,
    ) -> PulavarAnswer:
        """Validates a model response deterministically.

        Rules enforced:
        1. Query and text must pass Unicode integrity checks.
        2. Query and text must not be prompt injections.
        3. Factual claims must each have at least one valid citation.
        4. Every cited source must exist in the canonical corpus.
        5. Quoted texts and poet attributions must match the corpus.
        6. Unsupported or fabricated claims cause abstention.
        7. Model proposes; Python decides.
        """
        # Step 0: Unicode Integrity Check
        if not check_unicode_integrity(user_query) or not check_unicode_integrity(raw_model_output):
            return self._build_abstention(
                reason="unicode_corruption",
                confidence=0.0,
            )

        # Step 1: Prompt Injection Check
        if check_prompt_injection(user_query) or check_prompt_injection(raw_model_output):
            return self._build_abstention(
                reason="prompt_injection",
                confidence=0.0,
            )

        # Step 2: Parse raw output into candidate proposal
        parsed = parse_raw_proposal(raw_model_output)
        answer_text = parsed.get("answer_text", raw_model_output).strip()
        raw_claims = parsed.get("claims", [])
        explicit_abstained = parsed.get("is_abstained", False)
        explicit_reason = parsed.get("abstention_reason", "none")

        if explicit_abstained and explicit_reason != "none":
            return self._build_abstention(
                reason=explicit_reason,
                original_text=answer_text,
                confidence=1.0,
            )

        # Check for textual abstention signals in output or query
        abstention_signal = self._detect_textual_abstention(raw_model_output, user_query)
        if abstention_signal != "none":
            return self._build_abstention(
                reason=abstention_signal,
                original_text=answer_text,
                confidence=1.0,
            )

        # If there are no claims extracted, parse sentences as claims
        if not raw_claims and answer_text:
            sentences = [s.strip() for s in re.split(r"[.!?।]\s*", answer_text) if len(s.strip()) > 15]
            raw_claims = [
                {
                    "claim_id": f"claim_{i+1}",
                    "claim_text": sent,
                    "citation_ids": _VERSE_ID_REGEX.findall(sent),
                }
                for i, sent in enumerate(sentences)
            ]

        # Step 3: Validate each claim and its citations
        validated_claims: List[PulavarClaim] = []
        all_verified_citations: dict[str, PulavarCitation] = {}
        has_fabricated_source = False
        has_attribution_mismatch = False
        has_quote_mismatch = False
        has_unsupported_claim = False

        for raw_claim in raw_claims:
            claim_id = raw_claim.get("claim_id", "claim")
            claim_text = raw_claim.get("claim_text", "")
            raw_cite_ids = raw_claim.get("citation_ids", [])
            raw_citations = raw_claim.get("citations", [])

            # Extract cited source IDs
            candidate_sources = list(raw_cite_ids)
            for c in raw_citations:
                sid = c.get("source_id") or c.get("verse_id")
                if sid:
                    candidate_sources.append(sid)

            # Map footnote markers e.g. '1' -> 'kurunthokai_100' if available
            footnotes = raw_claim.get("raw_footnote_sources", {}) or parsed.get("raw_footnotes", {})
            resolved_sources = []
            for item in candidate_sources:
                if item in footnotes:
                    target = footnotes[item]
                    vids = _VERSE_ID_REGEX.findall(target)
                    resolved_sources.extend(vids if vids else [target])
                else:
                    vids = _VERSE_ID_REGEX.findall(item)
                    resolved_sources.extend(vids if vids else [item])

            resolved_sources = list(dict.fromkeys(resolved_sources))
            claim_citations: List[PulavarCitation] = []

            # Check if this assertion requires citations (factual claims)
            is_factual = self._is_factual_claim(claim_text)

            for idx, src_id in enumerate(resolved_sources):
                cite_key = f"c_{src_id}_{idx}"
                # Extract any quote or poet hints from raw_citations
                hint_poet = None
                hint_quote = None
                for rc in raw_citations:
                    if rc.get("source_id") == src_id or rc.get("verse_id") == src_id:
                        hint_poet = rc.get("poet")
                        hint_quote = rc.get("quote")

                # If no explicit hint, check if claim text mentions known poets or quotes
                if not hint_poet:
                    for poet_key in _POET_NORMALIZATION:
                        if poet_key in claim_text:
                            hint_poet = poet_key
                            break

                # Verify source in corpus
                is_valid_src, verse, err_msg = verify_source(src_id)
                if not is_valid_src:
                    has_fabricated_source = True
                    cit = PulavarCitation(
                        citation_id=f"[^{cite_key}]",
                        source_id=src_id,
                        is_valid=False,
                        validation_notes=err_msg or "Fabricated or non-existent source",
                    )
                    claim_citations.append(cit)
                    continue

                # Verify poet attribution if specified
                poet_ok, poet_err = verify_poet_attribution(hint_poet, verse.get("poet"))
                if not poet_ok:
                    has_attribution_mismatch = True

                # Verify quote if specified
                quote_ok, matched_lines, quote_err = verify_quote_in_verse(hint_quote, verse)
                if not quote_ok:
                    has_quote_mismatch = True

                is_citation_valid = is_valid_src and poet_ok and quote_ok
                val_notes = []
                if poet_err:
                    val_notes.append(poet_err)
                if quote_err:
                    val_notes.append(quote_err)

                src_meta = PulavarSourceMetadata(
                    source_id=verse["id"],
                    poem=verse.get("poem"),
                    verse_number=verse.get("number"),
                    poet=verse.get("poet"),
                    tinai=verse.get("tinai"),
                    matched_quote=hint_quote if quote_ok else None,
                    line_numbers=matched_lines,
                    source_type="corpus_verse",
                    verified=is_citation_valid,
                )

                cit = PulavarCitation(
                    citation_id=f"[^{cite_key}]",
                    source_id=verse["id"],
                    source=src_meta,
                    quote=hint_quote,
                    is_valid=is_citation_valid,
                    validation_notes="; ".join(val_notes) if val_notes else "Verified against canonical corpus",
                )
                claim_citations.append(cit)
                if is_citation_valid:
                    all_verified_citations[verse["id"]] = cit

            # Determine claim evidence status
            valid_cites = [c for c in claim_citations if c.is_valid]
            if is_factual and not valid_cites:
                has_unsupported_claim = True
                status: EvidenceStatus = "unsupported"
                is_supported = False
            elif valid_cites:
                status = "verified"
                is_supported = True
            else:
                # Non-factual conversational sentence
                status = "verified"
                is_supported = True

            validated_claims.append(
                PulavarClaim(
                    claim_id=claim_id,
                    claim_text=claim_text,
                    claim_text_ta=claim_text,
                    citation_ids=[c.source_id for c in valid_cites],
                    citations=claim_citations,
                    evidence_status=status,
                    is_supported=is_supported,
                )
            )

        # Step 4: Python Decision Logic on Abstention & Output
        if has_fabricated_source:
            return self._build_abstention(
                reason="fabricated_reference",
                original_text=answer_text,
                claims=validated_claims,
                confidence=0.0,
            )

        if has_attribution_mismatch:
            return self._build_abstention(
                reason="incorrect_attribution",
                original_text=answer_text,
                claims=validated_claims,
                confidence=0.0,
            )

        if has_quote_mismatch:
            return self._build_abstention(
                reason="insufficient_evidence",
                original_text=answer_text,
                claims=validated_claims,
                confidence=0.2,
            )

        # If all factual claims are unsupported, we must abstain!
        factual_claims = [c for c in validated_claims if self._is_factual_claim(c.claim_text)]
        if factual_claims and all(not c.is_supported for c in factual_claims):
            return self._build_abstention(
                reason="insufficient_evidence",
                original_text=answer_text,
                claims=validated_claims,
                confidence=0.0,
            )

        # Step 5: Filter out unsupported claims if some claims are verified
        supported_claims = [c for c in validated_claims if c.is_supported]
        final_citations = list(all_verified_citations.values())

        # If we have verified claims, assemble final answer text
        if supported_claims:
            clean_answer_lines = [c.claim_text for c in supported_claims]
            final_answer_text = "\n".join(clean_answer_lines)
            overall_status: EvidenceStatus = "verified" if not has_unsupported_claim else "partially_verified"
            return PulavarAnswer(
                answer_text=final_answer_text,
                answer_text_ta=final_answer_text,
                claims=supported_claims,
                citations=final_citations,
                evidence_status=overall_status,
                is_abstained=False,
                abstention_reason="none",
                confidence_score=1.0 if overall_status == "verified" else 0.85,
            )

        # Fallback if no supported claims found
        return self._build_abstention(
            reason="insufficient_evidence",
            original_text=answer_text,
            claims=validated_claims,
            confidence=0.0,
        )

    def _is_factual_claim(self, text: str) -> bool:
        """Determines if a statement is a factual claim requiring citation."""
        clean = text.strip()
        if not clean or len(clean) < 10:
            return False
        # Greetings, conversational pleasantries, questions, or disclaimers
        ignore_patterns = [
            r"^(வணக்கம்|நலமா|வாழ்க|அன்புடையீர்|அவைத் தலைவர்)",
            r"^(hello|hi|welcome|greetings)",
            r"\?$",
        ]
        for pat in ignore_patterns:
            if re.search(pat, clean, re.IGNORECASE):
                return False
        return True

    def _detect_textual_abstention(self, text: str, query: str) -> AbstentionReason:
        """Detects whether the query or response signals an abstention topic."""
        combined = f"{query} {text}".lower()

        # Out of scope topics (modern tech, modern foreign history, finance, sports)
        out_of_scope_keywords = [
            "bitcoin", "cryptocurrency", "stock market", "javascript", "python programming",
            "விண்வெளி ஓடம்", "வேற்றுக்கிரக", "பங்குச் சந்தை", "மின்னணு நாணயம்",
            "spacecraft", "aeroplane", "quantum physics",
        ]
        for kw in out_of_scope_keywords:
            if kw.lower() in combined:
                return "out_of_scope"

        # Explicit Tamil abstention phrases from poet personas
        tamil_abstain_phrases = [
            "சான்றுகள் கிடைக்கப்பெறவில்லை",
            "போதிய சான்றுகள் இல்லை",
            "நினைவிலிருந்து மட்டுமே கூற இயலாது",
            "இல்லாத பாடல்",
            "சங்க இலக்கியத்தில் காணப்படவில்லை",
            "மறுமொழி தவிர்க்கப்படுகிறது",
        ]
        for phrase in tamil_abstain_phrases:
            if phrase in text:
                return "insufficient_evidence"

        return "none"

    def _build_abstention(
        self,
        reason: AbstentionReason,
        original_text: str = "",
        claims: Optional[List[PulavarClaim]] = None,
        confidence: float = 0.0,
    ) -> PulavarAnswer:
        msg_ta = ABSTENTION_MESSAGES_TA.get(reason, ABSTENTION_MESSAGES_TA["insufficient_evidence"])
        return PulavarAnswer(
            answer_text=msg_ta,
            answer_text_ta=msg_ta,
            claims=claims or [],
            citations=[],
            evidence_status="abstained",
            is_abstained=True,
            abstention_reason=reason,
            abstention_message_ta=msg_ta,
            confidence_score=confidence,
        )


__all__ = [
    "PulavarCitationValidator",
    "normalize_tamil_text",
    "check_unicode_integrity",
    "check_prompt_injection",
    "verify_source",
    "verify_poet_attribution",
    "verify_quote_in_verse",
    "ABSTENTION_MESSAGES_TA",
]
