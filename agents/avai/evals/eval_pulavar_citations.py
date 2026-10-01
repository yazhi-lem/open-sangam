"""eval_pulavar_citations.py — Benchmark evaluator for Pulavar citations & red-team gold set.

Runs the gold set through PulavarCitationValidator deterministically without external
network calls or API keys, reporting:
1. Citation Accuracy (Target: >= 90%)
2. Claim Coverage
3. Abstention Correctness
4. Source Integrity
"""

from __future__ import annotations

import sys
from typing import Any, Dict, List

from ..citation_validator import PulavarCitationValidator
from .pulavar_gold_set import GOLD_SET_CASES


def evaluate_gold_set(verbose: bool = False) -> Dict[str, Any]:
    """Runs all test cases in GOLD_SET_CASES and computes evaluation metrics."""
    validator = PulavarCitationValidator()

    total_cases = len(GOLD_SET_CASES)
    total_citations_evaluated = 0
    correct_citation_evaluations = 0

    total_factual_claims_accepted = 0
    supported_factual_claims_accepted = 0

    total_abstention_expected = 0
    correct_abstentions = 0

    total_resolved_sources = 0
    intact_sources = 0

    category_results: Dict[str, Dict[str, int]] = {}

    for case in GOLD_SET_CASES:
        cid = case["id"]
        cat = case["category"]
        query = case["query"]
        mock_resp = case["mock_response"]
        expected_abstain = case["expected_abstain"]
        expected_reason = case["expected_reason"]
        expected_citations = case.get("expected_citations", [])

        if cat not in category_results:
            category_results[cat] = {"total": 0, "passed": 0}
        category_results[cat]["total"] += 1

        answer = validator.validate_answer(mock_resp, user_query=query)

        # Check Abstention Correctness
        is_abstention_correct = (answer.is_abstained == expected_abstain)
        if expected_abstain:
            total_abstention_expected += 1
            if is_abstention_correct:
                # Also verify reason aligns
                if expected_reason == "none" or answer.abstention_reason == expected_reason:
                    correct_abstentions += 1

        # Check Citations and Claims
        case_passed = False
        if expected_abstain:
            # For abstained cases, no citations should be returned
            if answer.is_abstained and len(answer.citations) == 0:
                case_passed = True
                correct_citation_evaluations += 1
            total_citations_evaluated += 1
        else:
            # For accepted cases
            if not answer.is_abstained:
                def _canon(x: str) -> str:
                    v = validator.verse_index.get(x.lower())
                    return v.get("id", x.lower()) if v else x.lower()

                actual_cids = [_canon(c.source_id) for c in answer.citations]
                matches_expected = all(_canon(ec) in actual_cids for ec in expected_citations)
                if matches_expected:
                    case_passed = True

                for c in answer.citations:
                    total_citations_evaluated += 1
                    total_resolved_sources += 1
                    if c.is_valid:
                        correct_citation_evaluations += 1
                        intact_sources += 1

                for cl in answer.claims:
                    if validator._is_factual_claim(cl.claim_text):
                        total_factual_claims_accepted += 1
                        if cl.is_supported:
                            supported_factual_claims_accepted += 1
            else:
                total_citations_evaluated += 1

        if case_passed:
            category_results[cat]["passed"] += 1

        if verbose:
            status_str = "PASS" if case_passed else "FAIL"
            print(f"[{status_str}] {cid} ({cat}): is_abstained={answer.is_abstained} (expected {expected_abstain})")

    # Compute final metrics
    citation_accuracy = (
        (correct_citation_evaluations / total_citations_evaluated * 100.0)
        if total_citations_evaluated > 0
        else 0.0
    )

    claim_coverage = (
        (supported_factual_claims_accepted / total_factual_claims_accepted * 100.0)
        if total_factual_claims_accepted > 0
        else 100.0
    )

    abstention_correctness = (
        (correct_abstentions / total_abstention_expected * 100.0)
        if total_abstention_expected > 0
        else 100.0
    )

    source_integrity = (
        (intact_sources / total_resolved_sources * 100.0)
        if total_resolved_sources > 0
        else 100.0
    )

    overall_passed_cases = sum(c["passed"] for c in category_results.values())
    case_pass_rate = (overall_passed_cases / total_cases * 100.0) if total_cases > 0 else 0.0

    return {
        "total_cases": total_cases,
        "overall_passed_cases": overall_passed_cases,
        "case_pass_rate_pct": round(case_pass_rate, 2),
        "citation_accuracy_pct": round(citation_accuracy, 2),
        "claim_coverage_pct": round(claim_coverage, 2),
        "abstention_correctness_pct": round(abstention_correctness, 2),
        "source_integrity_pct": round(source_integrity, 2),
        "category_results": category_results,
    }


def main():
    print("=" * 70)
    print("  Sangam Avai — Pulavar Citation & Red-Team Gold Set Evaluation")
    print("=" * 70)
    results = evaluate_gold_set(verbose=True)

    print("\n" + "-" * 70)
    print(f"Total Test Cases Evaluated : {results['total_cases']}")
    print(f"Passed Test Cases          : {results['overall_passed_cases']}/{results['total_cases']} ({results['case_pass_rate_pct']}%)")
    print(f"Citation Accuracy          : {results['citation_accuracy_pct']}%  (Target: >= 90.0%)")
    print(f"Claim Coverage             : {results['claim_coverage_pct']}%")
    print(f"Abstention Correctness     : {results['abstention_correctness_pct']}%")
    print(f"Source Integrity           : {results['source_integrity_pct']}%")
    print("-" * 70)
    print("\nPer-Category Breakdown:")
    for cat, data in results["category_results"].items():
        pct = round(data["passed"] / data["total"] * 100, 1) if data["total"] > 0 else 0
        print(f"  • {cat:<26}: {data['passed']}/{data['total']} passed ({pct}%)")
    print("=" * 70)

    if results["citation_accuracy_pct"] >= 90.0:
        print("\nSUCCESS: Target citation accuracy of at least 90% is ACHIEVED.")
        return 0
    else:
        print(f"\nFAILURE: Target not met ({results['citation_accuracy_pct']}% < 90.0%)")
        return 1


if __name__ == "__main__":
    sys.exit(main())
