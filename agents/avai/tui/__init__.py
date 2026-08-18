"""Sangam Avai TUI — Terminal User Interface for the agent swarm.

A rich terminal experience for interacting with all five poet agents,
featuring agent selection, formatted output with citations, conversation
history, and tiṇai color coding.

Usage (from agents/):
    python -m avai.tui.app

Or via the entry point:
    avai-tui
"""

from .app import main

if __name__ == "__main__":
    main()
