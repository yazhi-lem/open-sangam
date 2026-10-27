"""
run_avai_campaigns.py
---------------------
Run the curated research campaigns against a local Avai API and store the
answers as research briefs.

Usage:
    cd backend/python
    python -m knowledge.run_avai_campaigns --campaign all
    python -m knowledge.run_avai_campaigns --campaign women-poets --base-url http://127.0.0.1:8080

Output: data/library/avai-research/<campaign-id>.json
"""

from __future__ import annotations

import argparse
import json
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

REPO = Path(__file__).parents[3]
CAMPAIGNS_PATH = REPO / "data" / "library" / "research-campaigns.json"
OUT_DIR = REPO / "data" / "library" / "avai-research"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run Avai research campaigns")
    parser.add_argument("--campaign", default="all")
    parser.add_argument("--base-url", default="http://127.0.0.1:8080")
    parser.add_argument("--language", choices=["ta", "en"], default="ta")
    parser.add_argument("--timeout", type=int, default=180)
    args = parser.parse_args(argv)

    campaigns = json.loads(CAMPAIGNS_PATH.read_text(encoding="utf-8"))["campaigns"]
    if args.campaign != "all":
        campaigns = [c for c in campaigns if c["id"] == args.campaign]
        if not campaigns:
            raise SystemExit(f"Unknown campaign: {args.campaign}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for campaign in campaigns:
        prompt = campaign["promptTa"] if args.language == "ta" else campaign["promptEn"]
        payload = {
            "message": prompt,
            "pulavar": campaign["agent"],
            "workflow": campaign["workflow"],
        }
        print(f"→ {campaign['id']} ({campaign['agent']})")
        started = time.time()
        try:
            response = requests.post(
                f"{args.base_url.rstrip('/')}/avai/ask",
                json=payload,
                timeout=args.timeout,
            )
            response.raise_for_status()
            data = response.json()
        except Exception as exc:
            print(f"  ERROR: {exc}")
            continue

        brief = {
            "schemaVersion": 1,
            "campaignId": campaign["id"],
            "titleTa": campaign["ta"],
            "titleEn": campaign["en"],
            "agent": campaign["agent"],
            "workflow": campaign["workflow"],
            "language": args.language,
            "prompt": prompt,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "elapsedSeconds": round(time.time() - started, 1),
            "responseText": data.get("response_text", ""),
            "pulavarAnswer": data.get("pulavar_answer"),
            "citations": data.get("citations", []),
            "claims": data.get("claims", []),
            "isAbstained": data.get("is_abstained", False),
            "abstentionReason": data.get("abstention_reason"),
            "evidenceStatus": data.get("evidence_status"),
            "metadata": data.get("metadata"),
        }
        out = OUT_DIR / f"{campaign['id']}.json"
        out.write_text(json.dumps(brief, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(
            f"  ✓ {len(brief['responseText'])} chars · "
            f"{len(brief['citations'])} citations · {brief['elapsedSeconds']}s → {out.name}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
