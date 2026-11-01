# Pulavar Answer Format with Verifiable Citations

## 1. Overview & Objective

Every factual claim Pulavar makes about Tamil literature, grammar (தொல்காப்பியம்), prosody (யாப்பிலக்கணம்) or usage
is grounded in the canonical corpus. When evidence is missing, conflicting, fabricated or out of scope, it abstains
instead of answering. The invariant: **"The model proposes; Python decides."**

## 2. Pulavar Answer Template & Schema Contract

The contract is defined in [`agents/avai/schemas.py`](../../agents/avai/schemas.py) and exposed over REST in
[`agents/avai/api/schemas.py`](../../agents/avai/api/schemas.py).

```text
PulavarAnswer
├── answer_text, answer_text_ta        inline footnote markers [^n]
├── claims[]                           one entry per factual assertion
│   ├── claim_id, claim_text, citation_ids[]
│   ├── citations[] → { citation_id "[^n]", source_id, source{poem, verse_number, poet, tinai, verified},
│   │                   is_valid, validation_notes }
│   └── evidence_status ("verified" | …), is_supported
├── citations[]                        deduplicated union of claim citations
├── evidence_status, is_abstained, abstention_reason, abstention_message_ta
└── confidence_score                   1.0 when verified · 0.0 when abstained
```

An abstained answer has empty `claims` and `citations`, `is_abstained: true`, and one reason from §4. Its
`answer_text` is the canonical Tamil message for that reason.

## 3. Evidence-Validation Rules (Python Decides)

Deterministic verification is executed by [`PulavarCitationValidator`](../../agents/avai/citation_validator.py):

1. **Pre-flight Unicode & Injection Screening**:
   - Checks text integrity against corrupted glyphs (e.g. `\ufffd`, isolated combining vowel markers). Any corrupt text triggers `unicode_corruption` abstention.
   - Detects English and Tamil prompt injections (e.g., `"ignore previous instructions"`, `"முந்தைய விதிகளைப் புறக்கணி"`). Triggers `prompt_injection` abstention.
2. **Canonical Source Verification**:
   - Resolves source IDs against `_VERSE_INDEX` (`data/texts/*/normalized/*.json`).
   - Normalizes padded numbers (e.g., `kurunthokai_40` $\rightarrow$ `kurunthokai_040`).
   - Rejection of nonexistent works or verse numbers triggers `fabricated_reference` abstention.
3. **Poet Attribution Verification**:
   - Matches proposed author against canonical colophon poet using normalized Tamil stem matching (`கபிலர்` $\leftrightarrow$ `கபிலனார்`).
   - Attribution mismatches (e.g. asserting `ஔவையார்` composed a poem by `கபிலர்`) trigger `incorrect_attribution` abstention.
4. **Verbatim Quote & Line Verification**:
   - Quoted phrases are stripped of punctuation and compared against verse line tokens and full poem text.
   - Fabricated lines or anachronistic phrases trigger `insufficient_evidence` abstention.
5. **Claim-Level Coverage & Pruning**:
   - Every factual claim must be backed by at least one verified citation.
   - If non-factual conversational pleasantries (e.g. "வணக்கம்") exist, they are preserved.
   - If all factual claims lack citations, the system unconditionally abstains.

---

## 4. Abstention Behavior & Taxonomy

| Abstention Reason | Cause | Tamil Explanatory Response |
| :--- | :--- | :--- |
| `insufficient_evidence` | No verifiable Sangam attestation for assertion | சங்க இலக்கியத் தரவுத் தொகுப்பில் இவ்வினாவிற்குரிய போதுமான நேரடிச் சான்றாதாரங்கள் கிடைக்கப்பெறவில்லை. சான்றற்ற ஊகங்களைத் தவிர்த்து, புலவர் அவை நடுநிலையுடன் மறுமொழியைத் தவிர்க்கிறது. |
| `fabricated_reference` | Verse ID / source does not exist in canonical corpus | சுட்டப்பட்ட பாடல் அல்லது மூலக் குறிப்பு சங்க இலக்கிய மூலத் தொகுப்பில் காணப்படாத போலியான ஒன்றாகும். புனையப்பட்ட மேற்கோள்களை ஏற்க இயலாது என்பதால் மறுமொழி தவிர்க்கப்பட்டது. |
| `incorrect_attribution` | Cited poet or work mismatches corpus colophon | சுட்டப்பட்ட பாடலின் பாடிய புலவர் அல்லது நூல் பற்றிய குறிப்பு மூல நூலின் செய்திகளோடு முரண்படுகிறது. தவறான அடையாளப்படுத்தலின் காரணமாக மறுமொழி தவிர்க்கப்பட்டது. |
| `conflicting_evidence` | Contradictory evidence without contested analysis | இவ்வினா தொடர்பான சான்றாதாரங்கள் ஒன்றோடொன்று முரண்படுகின்றன. போதுமான மாற்று உரைக் குறிப்புகள் இன்றி ஒருமுகமான முடிவை ஏற்க முடியாது என்பதால் மறுமொழி தவிர்க்கப்பட்டது. |
| `out_of_scope` | Query concerns modern tech, finance, or unrelated topics | இவ்வினா சங்க இலக்கியம், தொல்காப்பிய இலக்கணம் அல்லது செம்மொழித் தமிழ் மரபின் எல்லைக்கு அப்பாற்பட்டதாகும். அவையின் நெறிமுறைப்படி இதற்கு விடையளிப்பது தவிர்க்கப்படுகிறது. |
| `unicode_corruption` | Broken Unicode sequences or replacement characters | வினா அல்லது உரையில் தமிழ் ஒருங்குறி (Unicode) சிதைவு மற்றும் அங்கீகரிக்கப்படாத குறியீடுகள் கண்டறியப்பட்டன. தூய தமிழ் எழுத்துருவில் மீண்டும் வினவவும். |
| `prompt_injection` | Instruction override attempts detected | அவையின் தன்னாட்சி மற்றும் அறிவுப் பாதுகாப்பு விதிகளுக்கு முரணான கட்டளைகள் கண்டறியப்பட்டதால் இக்கோரிக்கை முற்றிலுமாக நிராகரிக்கப்பட்டது. |

---

## 5. Gold-Set Methodology & Red-Team Suite

The gold set in [`agents/avai/evals/pulavar_gold_set.py`](../../agents/avai/evals/pulavar_gold_set.py) comprises 20 rigorous test cases across 11 categories:

1. **Literature questions** (e.g. `kurunthokai_100`, `kurunthokai_040`, `purananooru_001`)
2. **Grammar questions** (prosody, Akavartpa meter, Tolkappiyam tinai conventions)
3. **Usage questions** (botanical and cultural glossary usage, e.g., Venkai tree in `ainkurunooru_208`)
4. **Incorrect source attribution** (Avvaiyar vs. Kapilar attribution attacks)
5. **Fabricated references** (`kurunthokai_9999`, `purananooru_999`)
6. **Missing evidence** (historical figures like Julius Caesar or unrecorded historical floods)
7. **Conflicting sources** (unreconciled contradictory assertions)
8. **Unsupported interpretations** (invented lines asserting ancient spacecraft)
9. **Tamil Unicode corruption** (Unicode `\ufffd` replacement characters)
10. **Prompt injection** (Tamil & English system override attempts)
11. **Out-of-scope questions** (Stock market, space propulsion)

The evaluation runner in [`agents/avai/evals/eval_pulavar_citations.py`](../../agents/avai/evals/eval_pulavar_citations.py) executes with mocked responses, requiring zero external API keys or network access.

---

## 6. Evaluation Benchmark Results

`python -m avai.evals.eval_pulavar_citations` runs the 20-case gold set against **mocked model responses**. It needs
no API key, so it tests the validator and the abstention policy, not a live model.

| Metric | Result | Note |
|---|---|---|
| Cases passed | 20/20 | every one of the 11 categories passes |
| Citation accuracy · claim coverage · abstention correctness · source integrity | 100% each | deterministic |

> The beta launch gate is different and still open: **≥ 90% citation accuracy on a 200-question gold set with a live
> model**, plus a native review of 100 answers (`factory/NEXT.md` A2–A4).

## 7. DeepEval Multi-Dimensional Evaluation

DeepEval 4.2.7 over the same 20 cases. The LLM judge (Gemini 2.5 Flash via OpenRouter, needs `OPENROUTER_API_KEY`)
scores relevancy, faithfulness and hallucination. Custom deterministic metrics score citation correctness, claim
grounding and abstention. Without a key, only the deterministic metrics run; no judge scores are invented.

| Dimension | Cases | Score |
|---|---:|---:|
| Answer relevancy (judge) | 6 substantive | 91.67% |
| Faithfulness (judge) | 6 | 100% |
| Hallucination control (judge) | 6 | 100% |
| Citation correctness · claim grounding · abstention correctness | 20 | 100% each |
| **Overall** | | **98.61%** |

What was learned:

- The one relevancy miss (`gold_lit_02`, the Kurunthokai 40 simile) paraphrased the famous line
  "செம்புலப் பெயல் நீர் போல" instead of quoting it. The gold set was kept as it was, not adjusted to pass.
- Full line-level context plus colophon metadata fixed an earlier truncation miss on `purananooru_001`.
- The 14 adversarial cases abstained with zero claims. They are scored N/A for faithfulness, not counted as passes.
- Judge errors are recorded (`INCOMPLETE_JUDGE_ERRORS`), never replaced with passing scores.

## 8. Sample Verified Tamil Responses

| Query | Response (abridged) | Citation / status |
|---|---|---|
| குறுந்தொகை 100-ஆம் பாடலின் திணை மற்றும் பாடிய புலவர் யார்? | குறிஞ்சித் திணை [^1] · கபிலர் [^1] | `kurunthokai_100` · கபிலர் · குறிஞ்சி ✅ |
| வேங்கை மரம் குறிஞ்சித் திணையில் எவ்வாறு பயில்கிறது? | ஐங்குறுநூறு 208 [^1] · கபிலர் [^1] | `ainkurunooru_208` ✅ |
| குறுந்தொகை 9999-ஆம் பாடலின் பொருள் என்ன? | the canonical `fabricated_reference` message | abstained, `citations: []` |

## 9. Native Tamil Review Status

The algorithmic validation (orthographic variants, sandhi, honorific normalisation, NFC) is automated and tested.
**Native scholarly review is pending**, and it is part of the beta gate.
