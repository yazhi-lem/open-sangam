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
| English translation | ⬜ Pending — needs a licence-cleared translation source (see `docs/LIBRARY_ROADMAP.md`) |
| Scholar Verification | ⬜ Pending |

## Running the pipeline

```bash
cd backend/python
pip install -r requirements.txt
cp .env.example .env  # add your GEMINI_API_KEY

python -m scraper.scrape_maduraikanchi
python -m scraper.scrape_projectmadurai --poem maduraikanchi  # fills gaps + repairs line ranges
python -m normalizer.normalize_to_json --poem maduraikanchi
```

Raw scraped files land in `raw/` (git-ignored).
Normalized JSON files land in `normalized/` and a combined `maduraikanchi.json`.
