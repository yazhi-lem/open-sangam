"""Root agent for `adk run` / `adk web` — நக்கீரர் (Nakkirar) as entry point.

This exposes the fully-wired M2 peer mesh (via swarm.py).
"""

from .swarm import root_agent

__all__ = ["root_agent"]
