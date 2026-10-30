# translate/ — English → Tamil UI conversion

This directory is the controlled conversion pipeline for the strict
single-language policy.

## Policy

- The UI is shown in **one language at a time**.
- Avai answers must be **pure Tamil**, including headings and explanations.
- English strings are converted to Tamil, not shown alongside Tamil.
- Technical identifiers such as `kurunthokai_100` stay unchanged.
- Unmapped strings are marked `needs-review`; they are never silently guessed.

## Pipeline

```bash
cd /home/valav/Yazhi/repos/open-sangam
python translate/extract_strings.py
python translate/convert_to_tamil.py
```

Outputs:

- `translate/strings.en.json` — extracted English UI strings with source files
- `translate/strings.ta.json` — Tamil conversion with status:
  - `glossary` — exact approved term
  - `phrase` — safely composed from approved glossary terms
  - `needs-review` — not converted; requires a Tamil editor

## Add a term

Edit `translate/glossary.json`, then rerun the two scripts. Prefer short,
established Tamil terms (`நூலகம்`, `தேடல்`, `திணை`, `கலைப்பொருள்`, `ஆய்வு`).

## Avai

Avai agent instructions now require pure Tamil output. The frontend also sends a
Tamil-only research-brief instruction and uses the local Tamil fallback when the
backend is unavailable.
