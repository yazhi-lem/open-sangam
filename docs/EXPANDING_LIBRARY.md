# Expanding the Open Sangam Library — a scholar's order of work

> This is guidance, not a wish-list. Every recommendation below is grounded in
> what the corpus actually holds today (20 readable works, 32 catalogued) and in
> what is public-domain and reachable.

---

## The principle: depth before breadth

A metadata-only title is a *promise*, not a library. We currently have **16
catalogued works with zero lines of text**. Adding a 17th empty title impresses
nobody; finishing one of the 16 teaches a child to read.

Rank work by this score, not by fame:

> **Reader value = (lines readable) × (languages per line) × (verified?)**

A 40-verse work with Tamil + urai + English is worth more than a 4,000-verse
work with only Tamil.

---

## Tier 0 — Finish the small didactic works (highest return, lowest cost)

These are already catalogued, public-domain, and tiny. Our scraper already
handles Project Madurai page structure, so each is a day's work, not a project.

| Work | Verses | Why it's a quick win |
|---|---|---|
| Inna Narpathu | 40 | one page packet |
| Iniyavai Narpathu | 40 | one page packet |
| Kaar Narpathu | 40 | one page packet |
| Nanmani Kkadikai | 100 | gnomic, good for prompt corpora |
| Ainthinai Aimpathu | 50 | already tiṇai-tagged by nature |
| Thinaimozhi Aimpathu | 50 | tiṇai glossary gold |
| Elathi | 80 | ethics, short |
| Kainnilai | 40 | akam micro-corpus |
| Sirupanchamulam | 100 | ethics |
| Muthumozhikkanchi | 100 | maxims (good for summarisation eval) |
| Thirikadukam | 100 | ethics |
| Acharakkovai | 100 | social conduct |
| Ainthinai Ezhupathu | 70 | tiṇai micro-corpus |
| Thinaimalai Nurraimpathu | 150 | tiṇai sequence |
| Pazhamozhi Nanuru | 400 | proverbs; high cultural value |
| Nanmanikkadikai | 100 | wisdom couplets |

**Target:** all 18 Pathinenkilkkanakku works readable by end of the next
quarter. That takes the reader from 2 of 18 to 18 of 18 in a category a learner
can actually finish.

Effort: ~1–2 days each once the packet format is agreed; share one `packet.json`
schema so the UI reuses `PoemCard` and the reader unchanged.

---

### Tier 0 — ingestion status (measured, not promised)

`backend/python/scraper/scrape_pathinen_minor.py` is the manifest-driven ingester.
It validates strictly (sequential numbering, schema v2) and only **publishes**
works whose edition parses cleanly (`publish=True`). Current run against live
Project Madurai:

| Work | Edition | Parsed | Status |
|---|---|---|---|
| Inna Narpathu | pmuni0025 §1 | 40/40 | ✅ published (reader) |
| Kalavazhi Narpathu | pmuni0025 §3 | 40/40 | ✅ published (reader) |
| Elathi | pmuni0029 §2 | 80/80 | ✅ published (reader) |
| Iniyavai Narpathu | pmuni0775 | 40/40 | ⚠️ parses by count, but the commentary edition leaks headings — needs a per-work skip profile |
| Kaar Narpathu | pmuni0029 §1 | 40/40 | ⚠️ interleaves `இதுவுமது` colophons — needs a skip profile |
| Nanmanikkadikai | pmuni0047 | 106/100 | ⚠️ edition has extra verses; needs collation |
| Acharakkovai | pmuni0047? (wrong id) | 78/100 | ⚠️ wrong page; find the right editon |
| Ainthinai Aimpathu | pmuni0027 §1 | 49/50 | ⚠️ one numbering anomaly |
| Ainthinai Ezhupathu | pmuni0027 §2 | 65/70 | ⚠️ attested lost verses (25, 26, 62) |
| Sirupanchamulam | pmuni0029 §3 | 98/100 | ⚠️ two missing |
| Pazhamozhi / Thirikadugam / Thinaimalai / Kainnilai | — | low | ⚠️ verse numbers at line start / page-number artefacts |

**Rule:** a work flips to `publish=True` only when it parses contiguous 1..n,
passes `normalizer.validate_corpus` with **0 errors**, and carries no header or
colophon contamination (enforced by `frontend/src/data/pathinen.test.js`).

## Tier 1 — Depth per verse (the scholar's real request)

We have **2,552 readable Sangam verses**, but most carry only the original. The
value is not more poems; it is the *three layers* the project promises:

1. **Modern Tamil urai** — line by line, in contemporary Tamil.
2. **English** — public-domain (Pope/Ellis) where it exists; otherwise new.
3. **Glossary** — `karu-poruḷ` word notes tied to the tiṇai.

Pick **one anthology** and take it to 100% verified rather than 10% across ten.
Suggested order (scholarly density per line):

1. **Kurunthokai** (400 short akam poems) — highest teaching value per verse.
2. **Natrinai** (400) — the great akam anthology.
3. **Purananooru** (400) — the puram canon; already partly translated publicly.
4. **Ainkurunooru** (500) — five tiṇai hundreds; ideal for a tiṇai-first UI.

**Gate:** no layer flips to `verified: true` without a named scholar in
`contributors.md` for that work.

---

## Tier 2 — Structural texts (new navigation model required)

These cannot reuse the verse-pager. They need chapter/canto/sutra navigation.
Build **one** structural reader, then the rest are data.

| Work | Structure | Why it matters |
|---|---|---|
| **Tholkappiyam** | 3 adhikarams, 1,610 sutras | the grammar *of* the language; anchors every other text |
| **Iraiyanar Akapporul** | 60 sutras + Nakkiranar urai | the theory behind akam poetry we already host |
| **Nannul** | 462 sutras | medieval grammar; bridges classical → modern |
| **Silappathikaram** | 3 kandams, 30 cantos | the epic every Tamil child meets first |
| **Manimekalai** | 30 cantos | philosophical sequel |

Recommended data field (deterministic, testable):

```json
{ "structure": { "level": "canto", "book": "Puhar Kandam", "number": 1 } }
```

Do **Tholkappiyam first** after Kurunthokai: it is the key that explains the
corpus we already have, and its 1,610 sutras are individually short — ideal for
line-level layers.

---

## Tier 3 — The large devotional and epic corpora

Add only after Tier 2's structural reader exists.

- **Thevaram** (Tirumurai 1–3) — start with **Thirugnanasambandar**, then Appar.
- **Thiruvasagam** (51 pathigams) — small enough to finish completely; intense
  vocabulary; excellent for a devotional reading mode.
- **Periya Puranam** (4,253) — hagiography; needs name-entity linking to poets.
- **Nalayira Divya Prabandham** (4,000 pasurams) — large; add by divya-desam
  grouping, not all at once.
- **Kamba Ramayanam** (10,553) — add by kandam; reuse the structural reader.

---

## Tier 4 — What only Tamil has (differentiators)

These are what make the library *Tamil*, not just "classics":

1. **Tamil-Brahmi inscriptions** — Eran, Mangulam, Jambai, Arittapatti. Short,
   dated, and they push the record back to c. 3rd century BCE. They need a
   transliteration + gloss layer, not a translation.
2. **Sangam-era epigraphy and hero stones (naṭukal)** — tie to the existing
   `data/library/corpus-artifacts.json` (hero-stone entries already exist).
3. **Tamil numerals and measurement systems** — *āḻākku*, *uḻakku*, land units,
   time units; a small, self-contained reference that no other site has.
4. **Yāḻ and pann music** — instrument taxonomy and the *pann* system; links to
   the existing `music-yazh` research brief.
5. **Tiṇai poetics** — a browsable *karu-poruḷ* index crossing poems by motif
   (already half-built by `corpus-entities.json`).

Each of these needs a small custom schema, not the verse schema. Say so in the
catalog `kind` so the UI does not try to paginate them.

---

## What NOT to expand

- **Do not add a title you cannot source.** A citation-less count is a lie; the
  pandit's rule is "nil verse, nil count".
- **Do not invent counts.** If it is lost, `"count": null` and `"unit":
  "fragments"` — the schema now enforces `count > 0` or `null`.
- **Do not mix transliteration schemes.** One file, one scheme (`k` not `g`,
  `th` not `t` for த). The catalog test fails otherwise.
- **Do not ship a new romanised name without a Tamil label.** The card layout
  breaks on mismatched lengths.

---

## Definition of done for any work

A work may flip `metadata → reader` only when:

- [ ] `data/texts/<id>/<id>.json` validates against `verse_schema.json` v2
- [ ] every record has `poem`, `sangamTamil`, `lines`, `source`, `verified`
- [ ] at least the `original` layer is complete for the whole work
- [ ] `data/texts/<id>/contributors.md` names scraper, normaliser, reviewer
- [ ] `frontend/src/data/libraryCatalog.test.js` passes
- [ ] `frontend && npm run build` is clean

---

எழுத்து அறிந்தவன் படிப்பான்; பொருள் அறிந்தவன் பயில்வான்; உரை அறிந்தவனே
தமிழ்க்கு வழிகாட்டுவான். **Start with the 40-verse works. Then teach one
anthology to speak in three tongues.**
