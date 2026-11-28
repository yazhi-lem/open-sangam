# Obsidian vault (generated)

Status: generated data · Verified: 2026-11-27

This directory is produced by `backend/python/knowledge/export_obsidian.py`
from the corpus, library registers and Avai research. **Do not edit notes here
by hand** — regenerate with:

```bash
cd backend/python
python -m knowledge.export_obsidian --out ../../obsidian-vault --verses index
```

The exporter prunes notes it no longer generates (a renamed poet must not leave
an orphan note behind), but it never touches this file or any other file in the
vault root.

Essays are **not** exported: [`../content/articles/`](../content/articles) is
the single source of truth. The old `08 Research/Articles/` copies were removed
on 2026-11-20.
