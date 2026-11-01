# Maduraikanchi — மதுரைக்காஞ்சி

Maduraikanchi (மதுரைக்காஞ்சி) is one of the Ten Idylls (Pattuppāṭṭu) of Sangam literature.
It is a long poem of 782 lines composed by Mankudi Maruthanar, describing the glory of the
Pandyan king Nedunj Cheliyan and the city of Madurai.

## Status

| Step | Status |
|------|--------|
| Scraping | ✅ Complete — 63 sections cover lines 1–782, all 782 lines present (missing source lines filled from Project Madurai `pmuni0496`) |
| Normalization (OKF) | ✅ Done — `maduraikanchi.json` + `datapackage.json` |
| Tamil Prose Urai | ✅ Done — 60/63 sections have prose translation (scraped) |
| English | ⬜ Pending — lines 1–100 are the Q4 launch scope (see `factory/NEXT.md`); the rest needs a licence-cleared translation source (see `docs/library/LIBRARY_ROADMAP.md`) |
| Scholar Verification | ⬜ Pending |

## Running the pipeline

```bash
cd backend/python
pip install -r requirements.txt

python -m scraper.scrape_maduraikanchi
python -m scraper.scrape_projectmadurai --poem maduraikanchi  # fills gaps + repairs line ranges
python -m normalizer.normalize_to_json --poem maduraikanchi
python -m normalizer.validate_corpus
```

Raw scraped files land in `raw/` (git-ignored).
Normalized JSON files land in `normalized/` and a combined `maduraikanchi.json`.
