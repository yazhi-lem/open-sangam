"""One-call Sarvam Chat smoke test.

Confirms the Sarvam subscription key and model work before wiring the full
Avai agent. Reads SARVAM_API_KEY from the environment (or agents/avai/.env via
config) and never prints or logs it.

Usage (from agents/):
    python -m avai.evals.sarvam_smoke
    SANGAM_AGENT_MODEL=sarvam-105b python -m avai.evals.sarvam_smoke

For the full Avvaiyar agent through Sarvam:
    SANGAM_AGENT_BACKEND=sarvam SANGAM_AGENT_MODEL=sarvam-105b \
        python -m avai.evals.qa_smoke
"""

from __future__ import annotations

import os
import sys

from sarvamai import SarvamAI

from ..config import DEFAULT_SARVAM_MODEL


def main() -> int:
    api_key = os.getenv("SARVAM_API_KEY")
    if not api_key:
        print(
            "SARVAM_API_KEY is not set. Add it to agents/avai/.env or export it "
            "in the environment, then re-run.",
            file=sys.stderr,
        )
        return 2

    model = os.getenv("SANGAM_AGENT_MODEL", DEFAULT_SARVAM_MODEL)
    client = SarvamAI(api_subscription_key=api_key)

    print(f"Calling Sarvam Chat model={model} ...")
    response = client.chat.completions(
        messages=[
            {
                "role": "user",
                "content": (
                    "வணக்கம்! சங்க இலக்கியம் பற்றி ஒரே வாக்கியத்தில் "
                    "ஒரு சுவாரஸ்யமான தகவல் சொல்லுங்கள்."
                ),
            }
        ],
        model=model,
        max_tokens=256,
    )

    choice = response.choices[0]
    text = choice.message.content or ""
    print(f"finish_reason={choice.finish_reason}")
    print(text.strip())
    usage = response.usage
    if usage:
        print(
            f"tokens: in={usage.prompt_tokens} out={usage.completion_tokens}",
            file=sys.stderr,
        )
    return 0 if text.strip() else 1


if __name__ == "__main__":
    raise SystemExit(main())
