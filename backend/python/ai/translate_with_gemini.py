"""
translate_with_gemini.py
------------------------
Reads normalized verse JSON files and fills in AI-generated translations
(Modern Tamil Urai and English) using Google Gemini 2.5 Flash.

Usage:
    python -m ai.translate_with_gemini [--poem maduraikanchi] [--lang english|urai|both]

Requires:
    GEMINI_API_KEY environment variable (or set in .env)
"""

import argparse
import json
import os
import time
from pathlib import Path

import google.generativeai as genai
from dotenv import load_dotenv
from tqdm import tqdm

load_dotenv()

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
MODEL_NAME = "gemini-2.5-flash"

DATA_BASE = Path(__file__).parents[3] / "data" / "texts"


def build_prompt(verse_text: str, target_lang: str) -> str:
    lang_label = (
        "contemporary Tamil prose (Urai — உரை, a clear modern retelling)"
        if target_lang == "urai"
        else "contemporary English"
    )
    return (
        "You are a classical Tamil scholar specializing in Sangam literature (c. 300 BCE – 300 CE).\n"
        f"Translate the following Sangam Tamil verse into {lang_label}.\n"
        "Preserve poetic nuance and cultural context. Be concise and accurate.\n\n"
        "Verse:\n"
        f"{verse_text}\n\n"
        "Return ONLY the translation, no preamble or explanation."
    )


def translate_verse(verse_text: str, target_lang: str, model) -> str:
    prompt = build_prompt(verse_text, target_lang)
    response = model.generate_content(prompt)
    return response.text.strip()


def process_poem(poem_id: str, lang: str) -> None:
    poem_file = DATA_BASE / poem_id / f"{poem_id}.json"
    if not poem_file.exists():
        raise FileNotFoundError(
            f"{poem_file} not found — run normalize_to_json first"
        )

    verses = json.loads(poem_file.read_text(encoding="utf-8"))
    model = genai.GenerativeModel(MODEL_NAME)
    langs = ["urai", "english"] if lang == "both" else [lang]

    for verse in tqdm(verses, desc=f"Translating {poem_id}"):
        changed = False
        for tgt in langs:
            field = "urai" if tgt == "urai" else "english"
            if verse.get(field):
                continue  # already translated; skip
            try:
                verse[field] = translate_verse(verse["sangamTamil"], tgt, model)
                changed = True
                time.sleep(0.5)  # rate-limit courtesy
            except Exception as exc:
                print(f"\n  ⚠ verse {verse['number']} ({tgt}): {exc}")

        if changed:
            # Write back the individual normalized file
            normalized_dir = DATA_BASE / poem_id / "normalized"
            out = normalized_dir / f"{verse['id']}.json"
            if out.exists():
                out.write_text(
                    json.dumps(verse, ensure_ascii=False, indent=2), encoding="utf-8"
                )

    # Rewrite combined file
    poem_file.write_text(json.dumps(verses, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nDone. Updated {poem_file}")


def main() -> None:
    parser = argparse.ArgumentParser(description="AI-translate normalized verses via Gemini")
    parser.add_argument("--poem", default="maduraikanchi")
    parser.add_argument(
        "--lang", choices=["english", "urai", "both"], default="both"
    )
    args = parser.parse_args()
    process_poem(args.poem, args.lang)


if __name__ == "__main__":
    main()
