"""eval_deepeval_pulavar.py — DeepEval evaluation suite for Sangam Avai Pulavar answers.

Evaluates 6 core dimensions:
1. Answer Relevancy (LLM Judge - DeepEval AnswerRelevancyMetric)
2. Faithfulness to retrieved Sangam sources (LLM Judge - DeepEval FaithfulnessMetric)
3. Hallucination Detection (LLM Judge - DeepEval HallucinationMetric)
4. Citation Correctness (Corpus verification - PulavarCitationCorrectnessMetric)
5. Claim-to-Source Grounding (Claim analysis - PulavarClaimGroundingMetric)
6. Abstention Correctness (Adversarial testing - PulavarAbstentionCorrectnessMetric)

Reuses the 20-case red-team gold set from avai.evals.pulavar_gold_set.
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

# Force UTF-8 on Windows console output
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

import dotenv

# Load environment configuration
dotenv.load_dotenv(Path(__file__).resolve().parents[1] / ".env")

import litellm
from deepeval.metrics import (
    AnswerRelevancyMetric,
    BaseMetric,
    FaithfulnessMetric,
    HallucinationMetric,
)
from deepeval.models import DeepEvalBaseLLM
from deepeval.test_case import LLMTestCase

from ..citation_validator import PulavarCitationValidator
from ..tools.corpus import _VERSE_INDEX, get_verse
from .pulavar_gold_set import GOLD_SET_CASES


class OpenRouterJudgeModel(DeepEvalBaseLLM):
    """Custom DeepEval LLM judge leveraging OpenRouter backend (gemini-2.5-flash)."""

    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or os.getenv(
            "SANGAM_AGENT_MODEL", "google/gemini-2.5-flash"
        )
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.api_base = os.getenv(
            "OPENROUTER_API_BASE", "https://openrouter.ai/api/v1"
        )
        super().__init__(model=self.model_name)

    def load_model(self):
        return self.model_name

    def generate(self, prompt: str, schema=None, **kwargs) -> str:
        messages = [{"role": "user", "content": prompt}]
        resp = litellm.completion(
            model=f"openrouter/{self.model_name}",
            messages=messages,
            api_key=self.api_key,
            api_base=self.api_base,
            response_format=schema if schema else None,
        )
        return resp.choices[0].message.content

    async def a_generate(self, prompt: str, schema=None, **kwargs) -> str:
        messages = [{"role": "user", "content": prompt}]
        resp = await litellm.acompletion(
            model=f"openrouter/{self.model_name}",
            messages=messages,
            api_key=self.api_key,
            api_base=self.api_base,
            response_format=schema if schema else None,
        )
        return resp.choices[0].message.content

    def get_model_name(self) -> str:
        return f"OpenRouter/{self.model_name}"


# ---------------------------------------------------------------------------
# Custom DeepEval Metrics for Sangam-Specific Dimensions
# ---------------------------------------------------------------------------

def _sanitize_error_message(msg: str) -> str:
    """Sanitizes exception messages to prevent exposing any API keys or tokens."""
    if not msg:
        return ""
    sanitized = re.sub(r"sk-[a-zA-Z0-9_\-]{8,}", "[REDACTED_KEY]", str(msg))
    sanitized = re.sub(r"Bearer\s+[a-zA-Z0-9_\-\.]+", "Bearer [REDACTED_TOKEN]", sanitized)
    sanitized = re.sub(r"key=[a-zA-Z0-9_\-]+", "key=[REDACTED]", sanitized)
    return sanitized


def _get_validated_answer(test_case: LLMTestCase) -> Any:
    """Extracts pre-computed PulavarAnswer from test_case metadata if available, else validates."""
    meta = getattr(test_case, "metadata", None)
    if isinstance(meta, dict) and "validated_answer" in meta:
        return meta["validated_answer"]
    validator = PulavarCitationValidator()
    return validator.validate_answer(test_case.actual_output, user_query=test_case.input)


class PulavarCitationCorrectnessMetric(BaseMetric):
    """Evaluates whether all cited sources exist in canonical corpus and match attributions."""

    def __init__(self, threshold: float = 0.9):
        self.threshold = threshold
        self.score = 0.0
        self.reason = ""
        self.success = False

    def measure(self, test_case: LLMTestCase) -> float:
        answer = _get_validated_answer(test_case)

        if answer.is_abstained:
            # If abstained, verify no fabricated citations were accepted
            self.score = 1.0 if len(answer.citations) == 0 else 0.0
            self.reason = f"Abstained correctly; verified 0 invalid citations emitted."
            self.success = self.score >= self.threshold
            return self.score

        if not answer.citations:
            self.score = 0.0
            self.reason = "Non-abstained response provided 0 verified citations."
            self.success = False
            return self.score

        valid_count = sum(1 for c in answer.citations if c.is_valid)
        self.score = valid_count / len(answer.citations)
        self.reason = f"{valid_count}/{len(answer.citations)} citations verified against corpus."
        self.success = self.score >= self.threshold
        return self.score

    async def a_measure(self, test_case: LLMTestCase) -> float:
        return self.measure(test_case)

    def is_successful(self) -> bool:
        return self.success

    @property
    def __name__(self):
        return "Citation Correctness"


class PulavarClaimGroundingMetric(BaseMetric):
    """Evaluates whether factual claims in response are supported by verified citations."""

    def __init__(self, threshold: float = 0.9):
        self.threshold = threshold
        self.score = 0.0
        self.reason = ""
        self.success = False

    def measure(self, test_case: LLMTestCase) -> float:
        validator = PulavarCitationValidator()
        answer = _get_validated_answer(test_case)

        if answer.is_abstained:
            self.score = 1.0
            self.reason = "Abstained answer; no ungrounded claims accepted."
            self.success = True
            return self.score

        factual_claims = [c for c in answer.claims if validator._is_factual_claim(c.claim_text)]
        if not factual_claims:
            self.score = 1.0
            self.reason = "Conversational response without factual claims."
            self.success = True
            return self.score

        supported_count = sum(1 for c in factual_claims if c.is_supported)
        self.score = supported_count / len(factual_claims)
        self.reason = f"{supported_count}/{len(factual_claims)} factual claims supported by verified citations."
        self.success = self.score >= self.threshold
        return self.score

    async def a_measure(self, test_case: LLMTestCase) -> float:
        return self.measure(test_case)

    def is_successful(self) -> bool:
        return self.success

    @property
    def __name__(self):
        return "Claim-to-Source Grounding"


class PulavarAbstentionCorrectnessMetric(BaseMetric):
    """Evaluates whether abstention decisions match the expected policy for adversarial cases."""

    def __init__(self, expected_abstain: bool, expected_reason: str = "none"):
        self.expected_abstain = expected_abstain
        self.expected_reason = expected_reason
        self.score = 0.0
        self.reason = ""
        self.success = False

    def measure(self, test_case: LLMTestCase) -> float:
        answer = _get_validated_answer(test_case)

        if self.expected_abstain:
            if answer.is_abstained:
                if self.expected_reason == "none" or answer.abstention_reason == self.expected_reason:
                    self.score = 1.0
                    self.reason = f"Correctly abstained with reason '{answer.abstention_reason}'."
                else:
                    self.score = 0.8
                    self.reason = f"Abstained, but reason was '{answer.abstention_reason}' (expected '{self.expected_reason}')."
            else:
                self.score = 0.0
                self.reason = "Failed to abstain on adversarial or unsupported input."
        else:
            if not answer.is_abstained:
                self.score = 1.0
                self.reason = "Correctly provided answer with verified evidence."
            else:
                self.score = 0.0
                self.reason = f"Prematurely abstained with reason '{answer.abstention_reason}'."

        self.success = self.score >= 0.8
        return self.score

    async def a_measure(self, test_case: LLMTestCase) -> float:
        return self.measure(test_case)

    def is_successful(self) -> bool:
        return self.success

    @property
    def __name__(self):
        return "Abstention Correctness"


# ---------------------------------------------------------------------------
# Retrieval Context Builder for LLM Evaluator
# ---------------------------------------------------------------------------

def build_retrieval_context(case: dict) -> List[str]:
    """Extracts actual corpus text, complete lines, commentary, and metadata as ground-truth retrieval context."""
    context_chunks = []
    cids = case.get("expected_citations", [])
    for cid in cids:
        verse = get_verse(cid)
        if "error" not in verse:
            # Format full poem lines with line numbers
            lines_list = verse.get("lines", [])
            if lines_list:
                formatted_lines = "\n".join(
                    f"{l.get('lineNumber', i+1)}: {l.get('text', '')}"
                    for i, l in enumerate(lines_list)
                )
            else:
                formatted_lines = verse.get("sangamTamil", "")

            # Traditional Sangam colophon / invocation author handling
            poet = verse.get("poet")
            if not poet and verse.get("poem") == "purananooru" and verse.get("number") == 1:
                poet = "பாரதம் பாடிய பெருந்தேவனார் (கடவுள் வாழ்த்து மரபுவழிக் கொளு)"

            chunk = (
                f"நூல்: {verse.get('poem')}\n"
                f"பாடல் எண்: {verse.get('number')}\n"
                f"பாடியவர்: {poet}\n"
                f"திணை: {verse.get('tinai')}\n"
                f"முழுப் பாடல் வரிகள்:\n{formatted_lines}\n"
                f"முழு உரை:\n{verse.get('urai', '')}"
            )
            context_chunks.append(chunk)

    if not context_chunks:
        # Fallback or synthetic context for negative/abstention cases
        if case.get("expected_abstain"):
            context_chunks.append("சங்க இலக்கிய மூலத் தொகுப்பில் இக்குறிப்பு இல்லை.")
        else:
            context_chunks.append("சங்க இலக்கிய வரலாற்று மற்றும் திணை மரபுத் தரவுகள்.")

    return context_chunks


# ---------------------------------------------------------------------------
# DeepEval Test Runner
# ---------------------------------------------------------------------------

def run_deepeval_suite(verbose: bool = True) -> Dict[str, Any]:
    """Runs DeepEval evaluation across all 20 test cases."""
    validator = PulavarCitationValidator()
    judge_model = OpenRouterJudgeModel()

    has_live_judge = bool(judge_model.api_key)
    if verbose:
        print("=" * 72)
        print("  Sangam Avai — DeepEval Multi-Dimensional Evaluation Suite")
        print("=" * 72)
        print(f"LLM Judge Model    : {judge_model.get_model_name()}")
        print(f"LLM Judge Active   : {has_live_judge}")
        print(f"Total Test Cases   : {len(GOLD_SET_CASES)}")
        print("-" * 72)

    # Initialize reusable LLM judge metrics
    # In DeepEval 4.2.7+, metrics score from 0.0 (fail) to 1.0 (pass).
    # threshold is the minimum passing score (e.g. >= 0.70 passes).
    relevancy_metric = AnswerRelevancyMetric(threshold=0.7, model=judge_model, include_reason=True)
    faithfulness_metric = FaithfulnessMetric(threshold=0.7, model=judge_model, include_reason=True)
    hallucination_metric = HallucinationMetric(threshold=0.7, model=judge_model, include_reason=True)
    citation_metric = PulavarCitationCorrectnessMetric(threshold=0.9)
    grounding_metric = PulavarClaimGroundingMetric(threshold=0.9)

    metric_totals = {
        "answer_relevancy": {"sum": 0.0, "count": 0, "errors": 0},
        "faithfulness": {"sum": 0.0, "count": 0, "errors": 0},
        "hallucination_control": {"sum": 0.0, "count": 0, "errors": 0},
        "citation_correctness": {"sum": 0.0, "count": 0, "errors": 0},
        "claim_grounding": {"sum": 0.0, "count": 0, "errors": 0},
        "abstention_correctness": {"sum": 0.0, "count": 0, "errors": 0},
    }

    judge_errors: List[Dict[str, str]] = []
    category_scores: Dict[str, List[float]] = {}
    detailed_cases = []

    for idx, case in enumerate(GOLD_SET_CASES):
        cid = case["id"]
        cat = case["category"]
        query = case["query"]
        raw_output = case["mock_response"]
        expected_abstain = case["expected_abstain"]
        expected_reason = case["expected_reason"]

        # Run system pipeline through Python citation validator
        validated_answer = validator.validate_answer(raw_output, user_query=query)
        actual_output = raw_output if not validated_answer.is_abstained else validated_answer.answer_text

        retrieval_context = build_retrieval_context(case)

        test_case = LLMTestCase(
            input=query,
            actual_output=actual_output,
            expected_output=raw_output if not expected_abstain else validated_answer.abstention_message_ta,
            retrieval_context=retrieval_context,
            context=retrieval_context,
            metadata={"validated_answer": validated_answer},
        )

        case_record = {
            "id": cid,
            "category": cat,
            "is_abstained": validated_answer.is_abstained,
            "expected_abstain": expected_abstain,
            "abstention_reason": validated_answer.abstention_reason,
            "scores": {},
            "errors": {},
        }

        # 1. Deterministic Citation Correctness
        c_score = citation_metric.measure(test_case)
        metric_totals["citation_correctness"]["sum"] += c_score
        metric_totals["citation_correctness"]["count"] += 1
        case_record["scores"]["citation_correctness"] = round(c_score, 3)

        # 2. Deterministic Claim Grounding
        g_score = grounding_metric.measure(test_case)
        metric_totals["claim_grounding"]["sum"] += g_score
        metric_totals["claim_grounding"]["count"] += 1
        case_record["scores"]["claim_grounding"] = round(g_score, 3)

        # 3. Policy Abstention Correctness
        abs_metric = PulavarAbstentionCorrectnessMetric(
            expected_abstain=expected_abstain, expected_reason=expected_reason
        )
        abs_score = abs_metric.measure(test_case)
        metric_totals["abstention_correctness"]["sum"] += abs_score
        metric_totals["abstention_correctness"]["count"] += 1
        case_record["scores"]["abstention_correctness"] = round(abs_score, 3)

        # 4, 5, 6. LLM-Judged Metrics (Evaluated strictly on substantive non-abstained responses)
        if not expected_abstain and has_live_judge:
            # 4. Answer Relevancy
            try:
                rel_score = relevancy_metric.measure(test_case)
                metric_totals["answer_relevancy"]["sum"] += rel_score
                metric_totals["answer_relevancy"]["count"] += 1
                case_record["scores"]["answer_relevancy"] = round(rel_score, 3)
            except Exception as e:
                err = _sanitize_error_message(str(e))
                case_record["scores"]["answer_relevancy"] = None
                case_record["errors"]["answer_relevancy"] = err
                metric_totals["answer_relevancy"]["errors"] += 1
                judge_errors.append({"case_id": cid, "metric": "answer_relevancy", "error": err})

            # 5. Faithfulness
            try:
                faith_score = faithfulness_metric.measure(test_case)
                metric_totals["faithfulness"]["sum"] += faith_score
                metric_totals["faithfulness"]["count"] += 1
                case_record["scores"]["faithfulness"] = round(faith_score, 3)
            except Exception as e:
                err = _sanitize_error_message(str(e))
                case_record["scores"]["faithfulness"] = None
                case_record["errors"]["faithfulness"] = err
                metric_totals["faithfulness"]["errors"] += 1
                judge_errors.append({"case_id": cid, "metric": "faithfulness", "error": err})

            # 6. Hallucination Control
            try:
                h_score = hallucination_metric.measure(test_case)
                metric_totals["hallucination_control"]["sum"] += h_score
                metric_totals["hallucination_control"]["count"] += 1
                case_record["scores"]["hallucination_control"] = round(h_score, 3)
            except Exception as e:
                err = _sanitize_error_message(str(e))
                case_record["scores"]["hallucination_control"] = None
                case_record["errors"]["hallucination_control"] = err
                metric_totals["hallucination_control"]["errors"] += 1
                judge_errors.append({"case_id": cid, "metric": "hallucination_control", "error": err})
        elif expected_abstain:
            # Abstained cases appropriately emit no factual claims; LLM retrieval metrics are marked N/A
            case_record["scores"]["answer_relevancy"] = "N/A (abstained)"
            case_record["scores"]["faithfulness"] = "N/A (abstained)"
            case_record["scores"]["hallucination_control"] = "N/A (abstained)"

        # Calculate case score only over evaluated numerical scores
        numeric_scores = [v for v in case_record["scores"].values() if isinstance(v, (int, float))]
        avg_case_score = sum(numeric_scores) / len(numeric_scores) if numeric_scores else 0.0

        if cat not in category_scores:
            category_scores[cat] = []
        category_scores[cat].append(avg_case_score)

        detailed_cases.append(case_record)
        if verbose:
            err_flag = f" [ERRORS: {len(case_record['errors'])}]" if case_record["errors"] else ""
            print(f"[{idx+1:02d}/20] {cid:<15} ({cat:<26}) -> Score: {avg_case_score*100:.1f}%{err_flag}")

    # Compute final dimension averages distinguishing LLM judge from deterministic checks
    llm_judged_scores = {
        "answer_relevancy": (
            round((metric_totals["answer_relevancy"]["sum"] / metric_totals["answer_relevancy"]["count"]) * 100.0, 2)
            if metric_totals["answer_relevancy"]["count"] > 0 else 0.0
        ),
        "faithfulness": (
            round((metric_totals["faithfulness"]["sum"] / metric_totals["faithfulness"]["count"]) * 100.0, 2)
            if metric_totals["faithfulness"]["count"] > 0 else 0.0
        ),
        "hallucination_control": (
            round((metric_totals["hallucination_control"]["sum"] / metric_totals["hallucination_control"]["count"]) * 100.0, 2)
            if metric_totals["hallucination_control"]["count"] > 0 else 0.0
        ),
    }

    deterministic_corpus_scores = {
        "citation_correctness": (
            round((metric_totals["citation_correctness"]["sum"] / metric_totals["citation_correctness"]["count"]) * 100.0, 2)
            if metric_totals["citation_correctness"]["count"] > 0 else 0.0
        ),
        "claim_grounding": (
            round((metric_totals["claim_grounding"]["sum"] / metric_totals["claim_grounding"]["count"]) * 100.0, 2)
            if metric_totals["claim_grounding"]["count"] > 0 else 0.0
        ),
    }

    policy_abstention_scores = {
        "abstention_correctness": (
            round((metric_totals["abstention_correctness"]["sum"] / metric_totals["abstention_correctness"]["count"]) * 100.0, 2)
            if metric_totals["abstention_correctness"]["count"] > 0 else 0.0
        ),
    }

    all_dimension_averages = {
        **llm_judged_scores,
        **deterministic_corpus_scores,
        **policy_abstention_scores,
    }
    overall_avg = round(sum(all_dimension_averages.values()) / len(all_dimension_averages), 2)

    total_judge_errors = len(judge_errors)
    is_complete = (total_judge_errors == 0) and has_live_judge
    status_str = "COMPLETE" if is_complete else ("INCOMPLETE_JUDGE_ERRORS" if total_judge_errors > 0 else "DETERMINISTIC_ONLY")

    category_summary = {
        cat: round(sum(scores) / len(scores) * 100.0, 2)
        for cat, scores in category_scores.items()
    }

    report = {
        "evaluation_status": status_str,
        "judge_model": judge_model.get_model_name(),
        "live_judge_active": has_live_judge,
        "total_cases_evaluated": len(GOLD_SET_CASES),
        "llm_judged_case_count": metric_totals["answer_relevancy"]["count"],
        "adversarial_abstention_case_count": sum(1 for c in GOLD_SET_CASES if c["expected_abstain"]),
        "total_judge_errors": total_judge_errors,
        "judge_errors": judge_errors,
        "overall_score_pct": overall_avg,
        "llm_judged_metrics_pct": llm_judged_scores,
        "deterministic_corpus_metrics_pct": deterministic_corpus_scores,
        "policy_abstention_metrics_pct": policy_abstention_scores,
        "dimension_scores_pct": all_dimension_averages,
        "category_scores_pct": category_summary,
        "detailed_cases": detailed_cases,
    }

    if verbose:
        print("\n" + "=" * 72)
        print("  DEEPEVAL EVALUATION RESULTS BY DIMENSION")
        print("=" * 72)
        print("A. LLM Judge Metrics (Evaluated on Substantive Literary Answers):")
        print(f"   • Answer Relevancy           : {llm_judged_scores['answer_relevancy']}% (evaluated {metric_totals['answer_relevancy']['count']} cases)")
        print(f"   • Faithfulness to Sources    : {llm_judged_scores['faithfulness']}% (evaluated {metric_totals['faithfulness']['count']} cases)")
        print(f"   • Hallucination Control      : {llm_judged_scores['hallucination_control']}% (evaluated {metric_totals['hallucination_control']['count']} cases)")
        print("B. Deterministic Corpus Metrics (Verified against Canonical Index):")
        print(f"   • Citation Correctness       : {deterministic_corpus_scores['citation_correctness']}% (evaluated 20 cases)")
        print(f"   • Claim Grounding            : {deterministic_corpus_scores['claim_grounding']}% (evaluated 20 cases)")
        print("C. Policy Abstention Metrics (Verified against Adversarial Attacks):")
        print(f"   • Abstention Correctness     : {policy_abstention_scores['abstention_correctness']}% (evaluated 20 cases)")
        print("-" * 72)
        print(f"OVERALL EVALUATION SCORE        : {overall_avg}%")
        print(f"EVALUATION STATUS               : {status_str} (Errors: {total_judge_errors})")
        print("=" * 72)

    return report


if __name__ == "__main__":
    report = run_deepeval_suite(verbose=True)
    # Persist report for documentation and audit
    output_path = Path(__file__).resolve().parent / "deepeval_report.json"
    output_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nSaved evaluation report to: {output_path}")
