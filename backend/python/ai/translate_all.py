"""
translate_all.py
-----------------
Convenience wrapper around translate_with_gemini.py that runs ALL THREE
corpus translation passes — Modern Tamil prose (urai), Yazhi Urai (a
colloquial paraphrase), and English — in one command, instead of remembering
to invoke `--lang urai` / `--lang yazhi_urai` / `--lang english` separately.

translate_with_gemini.py already does the actual drafting for all three
fields (FIELD_FOR_LANG); this script just sequences three clean subprocess
invocations of it — urai first (it's at 99% coverage, so this mops up the
last stragglers cheaply, and both other passes use it as context), then
yazhi_urai (the easy-to-read paraphrase of that urai), then english (the
larger, ongoing Phase 2 effort) — and forwards the shared flags to each.

Each sub-run still writes its own data/pipeline/translation-state.json
(translate_with_gemini.py tracks one field's coverage per file — running
all three langs here means the file reflects whichever ran most recently,
i.e. english, after this script finishes; that's a pre-existing property of
the underlying pipeline, not something this wrapper changes).

Usage:
    python -m ai.translate_all --status
    python -m ai.translate_all --limit 5 --dry-run
    python -m ai.translate_all --limit 200
    python -m ai.translate_all --poem mullaippattu
    python -m ai.translate_all --only urai --limit 50

Requires the same environment as translate_with_gemini.py (OPENROUTER_API_KEY
by default; GEMINI_API_KEY if SANGAM_TRANSLATE_BACKEND=gemini).
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent

# urai first (nearly done — mop up stragglers, and both passes below use it
# as context), then yazhi_urai (a paraphrase of that urai), then english (the
# larger ongoing phase-by-phase effort, so it's what the run "ends on").
LANG_ORDER = ["urai", "yazhi_urai", "english"]

LANG_LABELS = {
    "urai": "Modern Tamil (urai)",
    "yazhi_urai": "Yazhi Urai (colloquial)",
    "english": "English",
}


def build_command(lang: str, args: argparse.Namespace) -> list[str]:
    cmd = [sys.executable, "-m", "ai.translate_with_gemini", "--lang", lang]
    if args.status:
        cmd.append("--status")
        return cmd
    if args.poem:
        cmd += ["--poem", args.poem]
    if args.phase is not None:
        cmd += ["--phase", str(args.phase)]
    cmd += ["--limit", str(args.limit), "--concurrency", str(args.concurrency)]
    if args.dry_run:
        cmd.append("--dry-run")
    if args.force:
        cmd.append("--force")
    return cmd


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run the urai, yazhi_urai, and English translation passes together."
    )
    parser.add_argument(
        "--only",
        choices=["urai", "yazhi_urai", "english"],
        help="run a single language pass instead of all three",
    )
    parser.add_argument("--poem", help="restrict to a single poem id (ignores phases)")
    parser.add_argument("--phase", type=int, help="force a phase instead of auto-advancing")
    parser.add_argument("--limit", type=int, default=200, help="verses per run, per language (default 200)")
    parser.add_argument("--concurrency", type=int, default=4, help="parallel requests")
    parser.add_argument("--dry-run", action="store_true", help="resolve the batch, make no calls")
    parser.add_argument("--force", action="store_true", help="re-translate verses already filled")
    parser.add_argument("--status", action="store_true", help="print coverage for both languages and exit")
    args = parser.parse_args()

    langs = [args.only] if args.only else LANG_ORDER

    exit_code = 0
    for i, lang in enumerate(langs):
        if i > 0:
            print()
        print(f"=== {LANG_LABELS[lang]} ===")
        result = subprocess.run(build_command(lang, args), cwd=HERE.parent, check=False)
        if result.returncode != 0:
            exit_code = result.returncode

    sys.exit(exit_code)


if __name__ == "__main__":
    main()
