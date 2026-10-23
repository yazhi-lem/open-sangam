
import argparse
import sys
import os

# Ensure that the scripts directory is in the Python path for imports
# This is crucial when running cli.py from the top-level scripts/ directory
script_dir = os.path.dirname(__file__)
if script_dir not in sys.path:
    sys.path.insert(0, script_dir)

# Import main_from_cli functions from existing scripts
from ai import translate_with_gemini
from knowledge import build_graph
from normalizer import normalize_all
from scraper import scrape_poem # This is the generic one

def main():
    parser = argparse.ArgumentParser(
        description="Open Sangam automation CLI.",
        formatter_class=argparse.RawTextHelpFormatter # For better help text formatting
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Scrape subcommand
    scrape_parser = subparsers.add_parser(
        "scrape",
        help="Scrape poems from sangathamizh.com"
    )
    # Duplicate arguments from scrape_poem.py's parser
    scrape_parser.add_argument("--poem", default="all", help="Poem ID from registry, or 'all'")
    scrape_parser.add_argument("--no-resume", action="store_true", help="Re-scrape even if raw files already exist")
    scrape_parser.set_defaults(func=scrape_poem.main_from_cli)

    # Normalize subcommand
    normalize_parser = subparsers.add_parser(
        "normalize",
        help="Normalize scraped data to JSON and Frictionless Data Packages"
    )
    # Duplicate arguments from normalize_all.py's parser
    normalize_parser.add_argument("--poem", default="all", help="Poem ID or 'all'")
    normalize_parser.set_defaults(func=normalize_all.main_from_cli)

    # Translate subcommand
    translate_parser = subparsers.add_parser(
        "translate",
        help="Batch translate Sangam verses using Gemini"
    )
    # Duplicate arguments from translate_with_gemini.py's parser
    translate_parser.add_argument("--lang", choices=["english", "urai", "yazhi_urai"], default="english")
    translate_parser.add_argument("--poem", help="restrict to a single poem id (ignores phases)")
    translate_parser.add_argument("--phase", type=int, help="force a phase instead of auto-advancing")
    translate_parser.add_argument("--limit", type=int, default=translate_with_gemini.DEFAULT_LIMIT, help=f"verses per run (default {translate_with_gemini.DEFAULT_LIMIT})")
    translate_parser.add_argument("--concurrency", type=int, default=translate_with_gemini.DEFAULT_CONCURRENCY, help="parallel requests")
    translate_parser.add_argument("--dry-run", action="store_true", help="resolve the batch, make no calls")
    translate_parser.add_argument("--force", action="store_true", help="re-translate verses already filled")
    translate_parser.add_argument("--status", action="store_true", help="print coverage and exit")
    translate_parser.add_argument(
        "--write-state",
        action="store_true",
        help="rebuild data/pipeline/translation-state.json from disk and exit",
    )
    translate_parser.set_defaults(func=translate_with_gemini.main_from_cli)

    # Build-graph subcommand
    build_graph_parser = subparsers.add_parser(
        "build-graph",
        help="Interlink the Open Sangam corpus into a knowledge graph"
    )
    # build_graph.py doesn't have any specific CLI args yet, but it's good to keep this structure.
    build_graph_parser.set_defaults(func=build_graph.main_from_cli)

    args = parser.parse_args()

    if hasattr(args, "func"):
        # Call the corresponding main_from_cli function
        exit_code = args.func(args)
        if isinstance(exit_code, int):
            sys.exit(exit_code)
    else:
        parser.print_help()
        sys.exit(1)

if __name__ == "__main__":
    main()
