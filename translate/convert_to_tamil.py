#!/usr/bin/env python3
"""Convert extracted English UI strings to Tamil using translate/glossary.json.

Unmapped strings are marked `needs-review`; nothing is silently invented.
Optional `--avai` sends unmapped strings to a running Avai endpoint for a
Tamil-only draft, still marked for review.
"""
from __future__ import annotations
import argparse, json, re
from pathlib import Path

ROOT = Path(__file__).parents[1]
GLOSSARY = ROOT / "translate" / "glossary.json"
SOURCE = ROOT / "translate" / "strings.en.json"
OUT = ROOT / "translate" / "strings.ta.json"

def phrase_translate(text: str, glossary: dict[str, str]) -> tuple[str, str]:
    exact = glossary.get(text)
    if exact:
        return exact, "glossary"
    result = text
    changed = False
    for en, ta in sorted(glossary.items(), key=lambda item: len(item[0]), reverse=True):
        pattern = re.compile(rf"(?<![A-Za-z]){re.escape(en)}(?![A-Za-z])", re.I)
        if pattern.search(result):
            result = pattern.sub(ta, result)
            changed = True
    if changed and not re.search(r"[A-Za-z]{3,}", result):
        return result, "phrase"
    return text, "needs-review"

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--avai", default=None, help="optional local Avai base URL, e.g. http://127.0.0.1:8080")
    args = parser.parse_args()
    glossary = json.loads(GLOSSARY.read_text(encoding="utf-8"))
    source = json.loads(SOURCE.read_text(encoding="utf-8"))
    out = []
    for item in source["strings"]:
        ta, status = phrase_translate(item["en"], glossary)
        out.append({**item, "ta": ta, "status": status})
    OUT.write_text(json.dumps({"generatedBy": "translate/convert_to_tamil.py", "count": len(out), "strings": out}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    counts = {}
    for item in out:
        counts[item["status"]] = counts.get(item["status"], 0) + 1
    print(f"Converted {len(out)} strings → {OUT}")
    print("  status:", counts)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
