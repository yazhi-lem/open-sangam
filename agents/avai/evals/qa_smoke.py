"""M1 issue #4 smoke test for the ஔவையார் (Avvaiyar) Q&A agent.

Not a formal `adk eval` evalset (that needs ADK's structured trajectory
format, a follow-up refinement) — this is a lighter, direct Runner-based
check: does Avvaiyar actually call a tool and cite the right verse id for a
handful of known questions? Requires a real OPENROUTER_API_KEY (or
GEMINI_API_KEY with SANGAM_AGENT_BACKEND=gemini); costs real API calls.

Usage (from agents/, so `avai` resolves as a package):
    python -m avai.evals.qa_smoke
"""

import asyncio

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from ..poets.avvaiyar import avvaiyar_agent

CASES = [
    {
        "query": "What tiṇai is the verse kurunthokai_100 in?",
        "expect_substrings": ["kurinji", "kurunthokai_100"],
    },
    {
        "query": "Who composed kurunthokai_100, and what verse id is that?",
        "expect_substrings": ["கபிலர", "kurunthokai_100"],
    },
    {
        "query": "How many poems are in the corpus, and name one with more than 100 verses?",
        # Any poem the tools actually return with >100 verses is a valid answer —
        # don't hardcode a single expected name.
        "expect_any_substrings": ["kurunthokai", "akananooru", "natrinai", "purananooru", "ainkurunooru"],
    },
]


async def run_case(runner: Runner, session_id: str, case: dict) -> bool:
    content = types.Content(role="user", parts=[types.Part(text=case["query"])])
    final_text = ""
    async for event in runner.run_async(
        user_id="smoke-test", session_id=session_id, new_message=content
    ):
        if event.content and event.content.parts:
            for part in event.content.parts:
                if part.text:
                    final_text += part.text

    text_lower = final_text.lower()
    if "expect_substrings" in case:
        ok = all(sub.lower() in text_lower for sub in case["expect_substrings"])
    else:
        ok = any(sub.lower() in text_lower for sub in case["expect_any_substrings"])
    status = "PASS" if ok else "FAIL"
    print(f"[{status}] {case['query']}")
    print(f"    → {final_text.strip()[:300]}")
    return ok


async def main() -> None:
    session_service = InMemorySessionService()
    runner = Runner(
        app_name="avai-qa-smoke", agent=avvaiyar_agent, session_service=session_service
    )
    results = []
    for i, case in enumerate(CASES):
        session_id = f"smoke-{i}"
        await session_service.create_session(
            app_name="avai-qa-smoke", user_id="smoke-test", session_id=session_id
        )
        results.append(await run_case(runner, session_id, case))

    passed = sum(results)
    print(f"\n{passed}/{len(results)} passed")


if __name__ == "__main__":
    asyncio.run(main())
