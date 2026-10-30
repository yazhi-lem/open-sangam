#!/usr/bin/env python3
"""Extract likely English UI strings from frontend/src into translate/strings.en.json."""
from __future__ import annotations
import json, re
from pathlib import Path

ROOT = Path(__file__).parents[1]
SRC = ROOT / "frontend" / "src"
OUT = ROOT / "translate" / "strings.en.json"

TEXT_NODE = re.compile(r">([A-Z][^<>{}`\n]{2,120})<")
OBJECT_EN = re.compile(r"\b(?:en|labelEn|nameEn|titleEn|descriptionEn)\s*:\s*['\"]([^'\"]{2,180})['\"]")
LABEL_EN = re.compile(r"\blabel\s*:\s*['\"]([^'\"]+?\s·\s[^'\"]+)['\"]")
TAMIL = re.compile(r"[\u0B80-\u0BFF]")
BAD = re.compile(r"(https?://|className|text-|bg-|border-|var\(|__|\.js|\.ts|\.json|^[A-Z_]{3,}$)")

def clean(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()

def add(found: dict[str, set[str]], value: str, file: str):
    value = clean(value)
    if not value or len(value) < 2 or TAMIL.search(value) or BAD.search(value):
        return
    if not re.search(r"[A-Za-z]{2,}", value):
        return
    found.setdefault(value, set()).add(file)

def main() -> int:
    found: dict[str, set[str]] = {}
    for path in sorted(SRC.rglob("*")):
        if path.suffix not in {".js", ".jsx"}:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        rel = str(path.relative_to(ROOT))
        for m in TEXT_NODE.finditer(text):
            add(found, m.group(1), rel)
        for m in OBJECT_EN.finditer(text):
            add(found, m.group(1), rel)
        for m in LABEL_EN.finditer(text):
            en = m.group(1).split(" · ", 1)[-1]
            add(found, en, rel)
    data = [
        {"en": value, "files": sorted(files)}
        for value, files in sorted(found.items(), key=lambda item: item[0].lower())
    ]
    OUT.write_text(json.dumps({"generatedBy": "translate/extract_strings.py", "count": len(data), "strings": data}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Extracted {len(data)} English strings → {OUT}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
