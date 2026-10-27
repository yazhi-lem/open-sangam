# திருக்குறள் — Tirukkural

1,330 couplets in 133 chapters across three books (அறத்துப்பால், பொருட்பால்,
காமத்துப்பால்).

## Provenance

| Layer | Source | Rights |
|---|---|---|
| Tamil text | Project Madurai `pmuni0001` | freely distributable e-text |
| English translation | G. U. Pope, W. H. Drew, J. Lazarus, F. W. Ellis (1886), Project Madurai `pmuni0153` | public domain |

Kural 1293 is absent from the main Tamil page and is supplied from the
Parimelazhagar edition (`pmuni0450_04`). Kurals 77 and 1135 are filled from
the Bharathiyar public-domain translation because the Pope HTML page merges
or mislabels them.

Regenerate:

```bash
cd backend/python
python -m scraper.scrape_pathinen --work thirukkural
```

All 1,330 records have Tamil + English; `verified` remains false until a
scholar reviews them.
