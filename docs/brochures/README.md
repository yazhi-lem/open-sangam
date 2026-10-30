# Open Sangam brochures

Two 9-page, A4 brochures that explain Open Sangam to learners, teachers, scholars, developers and funders. The figures are a count of the public repository on 18 October 2026.

| Language | PDF |
|---|---|
| Tamil (தமிழ்) | [open-sangam-brochure-ta.pdf](open-sangam-brochure-ta.pdf) |
| English | [open-sangam-brochure-en.pdf](open-sangam-brochure-en.pdf) |

## Status

- The brochures say plainly what is not done yet: no record is signed off by a scholar, English exists for only 32 records (all machine drafts), and the reuse terms for the modern Tamil prose explanations are still to be confirmed with sangathamizh.com.
- The Tamil wording has not yet been reviewed by a native Tamil scholar. The last page of the Tamil brochure says so.
- Nothing here is linked from the site yet. Whether and where to host the PDFs publicly is a separate decision.
- The Open Sangam brand kit is deliberately not part of this folder. It is an internal working draft.

## Source and rebuild

The PDFs are printed from HTML with headless Chrome. The source is in [`src/`](src):

- `open-sangam-brochure-ta.html`, `open-sangam-brochure-en.html`: the two brochures
- `brochure.css`: shared print styles (A4, no letter-spacing on Tamil)
- `fonts/`: static instances of Noto Sans Tamil and Noto Serif Tamil (SIL OFL 1.1), so the Tamil shapes and embeds correctly. Fraunces and Arimo are expected to be installed on the machine that builds.
- `qr-*.svg`, `ornament.svg.txt`: QR codes (contribution page and repository) and the cover ornament

To rebuild both PDFs (needs `google-chrome`, `poppler-utils` and `python3`):

```bash
cd docs/brochures/src
./build.sh        # or ./build.sh en / ./build.sh ta
```

Rebuilt PDFs are written next to this README; page previews go to `src/build/` (git-ignored).
