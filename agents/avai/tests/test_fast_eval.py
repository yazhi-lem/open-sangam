"""Smoke test for the fast deterministic evaluation harness."""

from avai.evals.fast_eval import run_fast_eval


def test_fast_eval_all_checks_pass():
    report = run_fast_eval(verbose=False)

    assert report["status"] == "pass", report
    assert report["passed"] == report["total"]
    assert {check["name"] for check in report["checks"]} == {
        "agent_contracts",
        "routing_map",
        "intent_routing",
        "tool_contracts",
        "citation_gold_set",
        "robustness_dataset",
        "safety_guards",
    }
