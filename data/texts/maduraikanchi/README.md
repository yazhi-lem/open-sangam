# Maduraikanchi — திருமுருகாற்றுப்படை

Maduraikanchi (மதுரைக்காஞ்சி) is one of the Ten Idylls (Pattuppāṭṭu) of Sangam literature.
It is a long poem of 782 lines composed by Mankudi Maruthanar, describing the glory of the
Pandyan king Nedunj Cheliyan and the city of Madurai.

## Status

| Step | Status |
|------|--------|
| Scraping | ⬜ Pending |
| Normalization | ⬜ Pending |
| AI Translation (Urai) | ⬜ Pending |
| AI Translation (English) | ⬜ Pending |
| Scholar Verification | ⬜ Pending |

## Running the pipeline

```bash
cd backend/python
pip install -r requirements.txt
cp .env.example .env  # add your GEMINI_API_KEY

python -m scraper.scrape_maduraikanchi
python -m normalizer.normalize_to_json --poem maduraikanchi
python -m ai.translate_with_gemini --poem maduraikanchi --lang both
```

Raw scraped files land in `raw/` (git-ignored).
Normalized JSON files land in `normalized/` and a combined `maduraikanchi.json`.
