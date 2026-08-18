"""Sangam Avai TUI — main application loop.

Uses the `rich` library for formatted terminal output when available,
falls back to plain text otherwise. No external TUI framework required
(avoid textual/textual-curses dependency).
"""

import sys
import time
import uuid
from typing import Optional

from ..poets.nakkirar import nakkirar_agent
from ..poets.avvaiyar import avvaiyar_agent
from ..poets.kapilar import kapilar_agent
from ..poets.tholkappiyar import tholkappiyar_agent
from ..poets.english_scholar import english_scholar_agent
from ..tools.corpus import get_verse

try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.text import Text
    from rich.markdown import Markdown
    from rich.prompt import Prompt, IntPrompt
    from rich.style import Style
    from rich.columns import Columns
    from rich import box

    HAS_RICH = True
except ImportError:
    HAS_RICH = False

# ── Agent registry ──────────────────────────────────────────────────────────

AGENTS = {
    "nakkirar": {
        "agent": nakkirar_agent,
        "ta": "நக்கீரர்",
        "en": "Nakkirar",
        "role": "Convener — general Q&A",
        "color": "cyan",
    },
    "avvaiyar": {
        "agent": avvaiyar_agent,
        "ta": "ஔவையார்",
        "en": "Avvaiyar",
        "role": "Q&A specialist",
        "color": "magenta",
    },
    "kapilar": {
        "agent": kapilar_agent,
        "ta": "கபிலர்",
        "en": "Kapilar",
        "role": "Search & retrieval",
        "color": "green",
    },
    "tholkappiyar": {
        "agent": tholkappiyar_agent,
        "ta": "தொல்காப்பியர்",
        "en": "Tholkappiyar",
        "role": "Scenario extraction",
        "color": "yellow",
    },
    "english_scholar": {
        "agent": english_scholar_agent,
        "ta": "English Scholar",
        "en": "English Scholar",
        "role": "British Tamil scholarship",
        "color": "red",
    },
}

TINAI_COLORS = {
    "kurinji": "violet",
    "mullai": "green",
    "marutam": "cyan",
    "neytal": "blue",
    "palai": "yellow",
    "puram": "red",
}


# ── Rich output helpers ─────────────────────────────────────────────────────

def _print_banner_rich(console: Console) -> None:
    banner = Text()
    banner.append("சங்க அவை", style="bold white")
    banner.append(" — ", style="dim")
    banner.append("Sangam Avai TUI", style="bold cyan")
    banner.append("\n")
    banner.append("Terminal agent space for Open Sangam", style="dim")
    console.print(Panel(banner, box=box.DOUBLE, border_style="cyan", padding=(1, 2)))


def _print_agents_rich(console: Console) -> None:
    table = Table(
        title="Available Agents",
        box=box.ROUNDED,
        show_header=True,
        header_style="bold",
        title_style="bold cyan",
    )
    table.add_column("#", style="dim", width=3)
    table.add_column("Tamil Name", style="bold")
    table.add_column("English Name")
    table.add_column("Role")
    table.add_column("Key")

    for i, (key, info) in enumerate(AGENTS.items(), 1):
        table.add_row(
            str(i),
            Text(info["ta"], style=info["color"]),
            info["en"],
            info["role"],
            f"[dim]{key}[/dim]",
        )
    console.print(table)


def _print_agent_response_rich(console: Console, agent_key: str, text: str, citations: list) -> None:
    info = AGENTS[agent_key]

    # Header with agent name.
    header = Text()
    header.append(f" {info['ta']} ", style=f"bold {info['color']}")
    header.append(f"({info['en']})", style="dim")

    console.print()
    console.print(Panel(
        Markdown(text) if "```" in text or "#" in text or "**" in text else text,
        title=header,
        border_style=info["color"],
        padding=(0, 1),
    ))

    # Citations.
    if citations:
        citation_text = Text()
        citation_text.append("  Citations: ", style="dim")
        for i, c in enumerate(citations):
            verse_id = c.get("verse_id", "")
            tinai = c.get("tinai", "")
            color = TINAI_COLORS.get(tinai, "white")
            if i > 0:
                citation_text.append("  ", style="dim")
            citation_text.append(f"◆ {verse_id}", style=f"bold {color}")
            if tinai:
                citation_text.append(f" ({tinai})", style=f"dim {color}")
        console.print(citation_text)


def _print_verse_rich(console: Console, verse: dict) -> None:
    tinai = verse.get("tinai", "")
    color = TINAI_COLORS.get(tinai, "white")

    header = Text()
    header.append(f" {verse.get('id', '?')} ", style=f"bold {color}")
    if tinai:
        header.append(f" [{tinai}]", style=f"dim {color}")
    if verse.get("poet"):
        header.append(f" — {verse['poet']}", style="dim")

    lines = []
    if verse.get("sangamTamil"):
        lines.append(Text(verse["sangamTamil"], style="bold"))
    if verse.get("urai"):
        lines.append(Text(f"Urai: {verse['urai']}", style="dim"))
    if verse.get("english"):
        lines.append(Text(f"En: {verse['english']}", style="italic"))

    content = Text("\n").join(lines) if lines else Text("(no text)", style="dim")

    console.print(Panel(content, title=header, border_style=color, padding=(0, 1)))


# ── Plain text fallback ─────────────────────────────────────────────────────

def _print_banner_plain() -> None:
    print("=" * 50)
    print("  சங்க அவை — Sangam Avai TUI")
    print("  Terminal agent space for Open Sangam")
    print("=" * 50)


def _print_agents_plain() -> None:
    print("\nAvailable Agents:")
    print("-" * 50)
    for i, (key, info) in enumerate(AGENTS.items(), 1):
        print(f"  {i}. {info['ta']} ({info['en']}) — {info['role']} [{key}]")
    print()


def _print_agent_response_plain(agent_key: str, text: str, citations: list) -> None:
    info = AGENTS[agent_key]
    print(f"\n[{info['ta']}]")
    print(text)
    if citations:
        cite_str = ", ".join(c.get("verse_id", "") for c in citations)
        print(f"  Citations: {cite_str}")


def _print_verse_plain(verse: dict) -> None:
    print(f"\n--- {verse.get('id', '?')} [{verse.get('tinai', '')}] ---")
    if verse.get("sangamTamil"):
        print(verse["sangamTamil"])
    if verse.get("urai"):
        print(f"Urai: {verse['urai']}")
    if verse.get("english"):
        print(f"En: {verse['english']}")


# ── ADK Runner-based agent call ────────────────────────────────────────────

async def _call_agent(agent_key: str, message: str, session_id: str) -> tuple[str, list]:
    """Call an agent via ADK Runner and return (response_text, citations)."""
    from google.adk.runners import Runner
    from google.adk.sessions import InMemorySessionService
    from google.genai import types

    info = AGENTS[agent_key]
    session_service = InMemorySessionService()
    runner = Runner(
        app_name=f"avai-tui-{agent_key}",
        agent=info["agent"],
        session_service=session_service,
    )

    await session_service.create_session(
        app_name=f"avai-tui-{agent_key}",
        user_id="tui-user",
        session_id=session_id,
    )

    content = types.Content(role="user", parts=[types.Part(text=message)])
    final_text = ""

    async for event in runner.run_async(
        user_id="tui-user", session_id=session_id, new_message=content
    ):
        if event.content and event.content.parts:
            for part in event.content.parts:
                if part.text:
                    final_text += part.text

    # Extract citations.
    import re
    pattern = re.compile(r"\b[a-z]+_\d{2,4}\b")
    citations = []
    seen = set()
    for match in pattern.findall(final_text.lower()):
        if match in seen:
            continue
        seen.add(match)
        verse = get_verse(match)
        if "error" not in verse:
            citations.append({
                "verse_id": verse["id"],
                "poem": verse.get("poem"),
                "tinai": verse.get("tinai"),
                "poet": verse.get("poet"),
            })

    return final_text.strip(), citations


# ── Main TUI loop ───────────────────────────────────────────────────────────

async def _run_async() -> None:
    console = Console() if HAS_RICH else None
    use_rich = console is not None

    if use_rich:
        _print_banner_rich(console)
        _print_agents_rich(console)
    else:
        _print_banner_plain()
        _print_agents_plain()

    # State.
    current_agent = "nakkirar"
    session_id = str(uuid.uuid4())
    history: list[dict] = []

    if use_rich:
        console.print(f"\n[dim]Starting with agent:[/dim] {AGENTS[current_agent]['ta']} ({AGENTS[current_agent]['en']})")
        console.print("[dim]Commands: /agent <name>, /history, /verse <id>, /clear, /quit[/dim]\n")
    else:
        print(f"\nStarting with agent: {AGENTS[current_agent]['ta']} ({AGENTS[current_agent]['en']})")
        print("Commands: /agent <name>, /history, /verse <id>, /clear, /quit\n")

    while True:
        try:
            if use_rich:
                prompt_text = f"[bold {AGENTS[current_agent]['color']}]{AGENTS[current_agent]['en']}[/bold {AGENTS[current_agent]['color']}] ▸ "
                user_input = Prompt.ask(prompt_text, console=console)
            else:
                user_input = input(f"{AGENTS[current_agent]['en']} ▸ ").strip()
        except (EOFError, KeyboardInterrupt):
            if use_rich:
                console.print("\n[dim]Goodbye![/dim]")
            else:
                print("\nGoodbye!")
            break

        if not user_input:
            continue

        # ── Commands ────────────────────────────────────────────────────
        if user_input.startswith("/"):
            parts = user_input.split(maxsplit=1)
            cmd = parts[0].lower()

            if cmd in ("/quit", "/exit", "/q"):
                if use_rich:
                    console.print("[dim]Goodbye![/dim]")
                else:
                    print("Goodbye!")
                break

            elif cmd == "/agent":
                if len(parts) < 2:
                    if use_rich:
                        _print_agents_rich(console)
                    else:
                        _print_agents_plain()
                    continue

                name = parts[1].strip().lower()
                if name in AGENTS:
                    current_agent = name
                    session_id = str(uuid.uuid4())  # New session for new agent.
                    info = AGENTS[current_agent]
                    if use_rich:
                        console.print(f"[bold {info['color']}]Switched to {info['ta']} ({info['en']})[/bold {info['color']}]")
                    else:
                        print(f"Switched to {info['ta']} ({info['en']})")
                else:
                    if use_rich:
                        console.print(f"[red]Unknown agent: {name}[/red]")
                    else:
                        print(f"Unknown agent: {name}")

            elif cmd == "/history":
                if not history:
                    if use_rich:
                        console.print("[dim]No conversation history yet.[/dim]")
                    else:
                        print("No conversation history yet.")
                else:
                    for entry in history[-10:]:
                        role = entry["role"]
                        agent = entry.get("agent", "")
                        text = entry["text"][:100]
                        if use_rich:
                            if role == "user":
                                console.print(f"[bold]You:[/bold] {text}")
                            else:
                                info = AGENTS.get(agent, {})
                                color = info.get("color", "white")
                                console.print(f"[bold {color}]{info.get('en', agent)}:[/bold {color}] {text}")
                        else:
                            prefix = "You" if role == "user" else agent
                            print(f"[{prefix}]: {text}")

            elif cmd == "/verse":
                if len(parts) < 2:
                    if use_rich:
                        console.print("[dim]Usage: /verse <verse_id>  (e.g. /verse kurunthokai_100)[/dim]")
                    else:
                        print("Usage: /verse <verse_id>")
                    continue

                verse_id = parts[1].strip().lower()
                verse = get_verse(verse_id)
                if "error" in verse:
                    if use_rich:
                        console.print(f"[red]Verse not found: {verse_id}[/red]")
                    else:
                        print(f"Verse not found: {verse_id}")
                else:
                    if use_rich:
                        _print_verse_rich(console, verse)
                    else:
                        _print_verse_plain(verse)

            elif cmd == "/clear":
                history.clear()
                if use_rich:
                    console.print("[dim]History cleared.[/dim]")
                else:
                    print("History cleared.")

            elif cmd == "/help":
                if use_rich:
                    help_table = Table(box=box.SIMPLE, show_header=False)
                    help_table.add_column("Command", style="bold cyan")
                    help_table.add_column("Description")
                    help_table.add_row("/agent <name>", "Switch to a different agent")
                    help_table.add_row("/history", "Show recent conversation history")
                    help_table.add_row("/verse <id>", "Look up a verse by id")
                    help_table.add_row("/clear", "Clear conversation history")
                    help_table.add_row("/quit", "Exit the TUI")
                    console.print(help_table)
                else:
                    print("Commands: /agent, /history, /verse, /clear, /quit, /help")

            else:
                if use_rich:
                    console.print(f"[red]Unknown command: {cmd}[/red]  (try /help)")
                else:
                    print(f"Unknown command: {cmd}  (try /help)")

            continue

        # ── Agent call ──────────────────────────────────────────────────
        history.append({"role": "user", "text": user_input})

        if use_rich:
            console.print(f"[dim]Thinking...[/dim]", end="")

        try:
            response_text, citations = await _call_agent(
                current_agent, user_input, session_id
            )
        except Exception as e:
            if use_rich:
                console.print(f"\n[red]Error: {e}[/red]")
            else:
                print(f"\nError: {e}")
            continue

        history.append({
            "role": "agent",
            "agent": current_agent,
            "text": response_text,
            "citations": citations,
        })

        if use_rich:
            console.print("\r", end="")  # Clear "Thinking..."
            _print_agent_response_rich(console, current_agent, response_text, citations)
        else:
            _print_agent_response_plain(current_agent, response_text, citations)


def main() -> None:
    """Entry point for the TUI."""
    import asyncio
    asyncio.run(_run_async())


if __name__ == "__main__":
    main()
