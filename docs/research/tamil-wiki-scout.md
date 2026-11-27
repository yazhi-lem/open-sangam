# Tamil Wikipedia + Wikisource scout — the epic-story expansion

Status: research · Verified: 2026-11-27 against live `ta.wikipedia.org` (MediaWiki 1.48.0-wmf.6)
and `ta.wikisource.org` · Method: MediaWiki Action API, read-only, no bulk download committed

This is a dissection, not an ingestion. It answers three questions: what Tamil Wikipedia
actually contains at *story* granularity, which Tamil Wikisource pages carry the *verse text*,
and what is legally safe to bring into Open Sangam.

---

## 1. Licensing — the gate that decides everything

| Source | Licence | Compatible with Open Sangam (CC BY-SA)? |
|---|---|---|
| `ta.wikipedia.org` | CC BY-SA 4.0 | Yes — attribution + share-alike |
| `ta.wikisource.org` | CC BY-SA 4.0 | Yes — attribution + share-alike |
| Wikidata | CC0 | Yes — no obligation |
| `jeyamohan.in` | "share freely on the Internet"; permission required for print/TV/e-book | **No** — link out only |
| `venmurasu.in` | no licence stated; print/e-book sale links present | **No** — link out only |

Two obligations follow from CC BY-SA 4.0 for every harvested page:

1. **Attribution** — name the article, the wiki, and the licence, and link the source revision.
2. **Share-alike** — our derived record stays CC BY-SA. This is already the project's content
   licence, so no conflict; but the credit line must render in the reader, not just in git.

Underlying *texts* (Silappathikaram, Kamba Ramayanam, Perunkathai…) are public domain; the wiki
licence governs the wiki's *edition, OCR and notes*, not the poem.

---

## 2. Tamil Wikipedia — what it is, in numbers

| Metric | Value |
|---|---|
| Articles | 192,432 |
| All pages | 638,894 |
| Words in search index | 57,197,585 |
| Active users / admins | 383 / 31 |

### 2.1 The literature category tree

| Category | Size |
|---|---|
| `பகுப்பு:தமிழ் இலக்கியம்` | 159 articles |
| `பகுப்பு:சங்க இலக்கியம்` | 57 articles |
| `பகுப்பு:தமிழ்க் காப்பியங்கள்` (depth 2) | 7 categories / **83 articles** |
| ↳ `ஐம்பெருங்காப்பியங்கள்` | 6 |
| ↳ `ஐஞ்சிறு காப்பியங்கள்` | 6 |
| ↳ `சிலப்பதிகாரம்` | **22** |
| ↳ Islamic / Christian / Sri Lankan Tamil epics | 44 |
| `பகுப்பு:நாயன்மார்கள்` | **65** |

**Important:** there is no `பகுப்பு:கதைமாந்தர்கள்` (characters). Character articles exist
(`கண்ணகி`, `கோவலன்`, `மாதவி`) but are unlinked from any character taxonomy — we would build
that index ourselves.

### 2.2 Work-level articles (measured byte size, section count, citations)

| Article | Bytes | Sections | `<ref>` |
|---|---:|---:|---:|
| சிலப்பதிகாரம் | 87,162 | 45 | 11 |
| தொல்காப்பியம் | 50,944 | many | 12+ |
| சீவக சிந்தாமணி | 44,309 | 10 | **50** |
| கம்பராமாயணம் | 32,286 | 18 | 24 |
| கண்ணகி (character) | 25,801 | — | — |
| சேக்கிழார் | 20,220 | — | — |
| திருவிளையாடல் புராணம் | 17,309 | 9 | 2 |
| திருவாசகம் | 11,101 | — | — |
| **பெரியபுராணம்** | 8,459 | 6 | 4 |
| மணிமேகலை (காப்பியம்) | 7,908 | 7 | 6 |
| கோவலன் (character) | 7,907 | — | — |
| குண்டலகேசி | 4,075 | — | — |
| வளையாபதி | 3,648 | — | — |

The **Silappathikaram article is the model to copy**: 45 sections, one per *kādai*, in narrative
order — that is already a story spine we can align 1:1 with the verse text.

### 2.3 Story-level coverage (the part that matters for "epic stories")

| Story corpus | Articles on ta.wiki | Size profile |
|---|---:|---|
| Periya Puranam — Nāyaṉmār lives | **65** | median 12.2 KB; 3.3 KB (சத்தி) – 46.5 KB (சிறுத்தொண்டர்) |
| Thiruvilaiyāṭal — the 64 games | **55** | ~1 KB each (`படலச் சுருக்கம்` + refs) |
| Silappathikaram topics | 22 | includes characters, dance, law, religion |

Nāyaṉmār articles are structured as **scene-by-scene prose** (`வேடர் குல மைந்தன்` ·
`"அவன் நமக்கினியன்" – காளத்திநாதர்` · …), each with an infobox and 2–12 citations. This is
exactly the shape of a Story record — and it exists for the whole Periya Puranam, whose *text*
is missing from Wikisource (see §4).

---

## 3. Tamil Wikisource — the verse text layer

38,580 articles / 664,536 pages, CC BY-SA 4.0. WikiSource is where the *text* lives; Wikipedia
is where the *explanation* lives. Measured by prefix (`list=allpages`), with wikitext fetched
(`prop=revisions`) to classify the markup:

| Work | Pages | Wikitext bytes | Markup profile | Verdict |
|---|---:|---:|---|---|
| **கம்பராமாயணம்** | 137 | 2,305,771 | 41 `<poem>`, 10 proofread transclusions | **Harvest first** — kāṇṭam → paṭalam → scene headings → 4-line verses |
| **பெருங்கதை** | 104 | 668,784 | 98 `<poem>` | **Harvest** — cleanest large epic, `பெருங்கதை/1 32 கரடு பெயர்த்தது` style |
| **மணிமேகலை** | 1 (+1) | 625,861 | `<poem>` per kādai, numbered lines | Harvest — one mega-page, 30 kādai sections |
| **சிலப்பதிகாரம்** | 39 | 223,641 | mixed: `:` verse lines, 2 `<poem>`, **1 legacy `<FONT>` page** | Harvest with a custom parser + de-dup |
| **கல்லாடம்** | 26 | 139,912 | mostly plain | Harvest |
| **நீலகேசி** | 1 | 139,034 | single page | Harvest |
| **திருவிளையாடற் புராணம்** | 66 | 25,091 | **66 proofread transclusions** (`<pages index="…pdf">`) | Harvest via Page: namespace, 64 games |
| **சீவக சிந்தாமணி** | 2 + ~50 | 8,020 + fragments | ilambakam pages named `1. நாமகள் இலம்பகம்- பாடல் 225-250` | Harvest with a naming-normaliser |
| **பெரியபுராணம்** | **0** | 0 | — | **Absent** |
| **குண்டலகேசி / வளையாபதி** | 0 | 0 | — | Lost works — correctly absent |
| கந்தபுராணம் | 1 | 26 | stub | Not usable |
| சூளாமணி | 0 | — | — | Absent |

### 3.1 Already-covered — do not re-ingest

These duplicates what the Project Madurai pipeline already produced, and are useful only as a
**validation oracle** for line numbering:

| Work | Wikisource pages / bytes | Our corpus |
|---|---|---|
| திருக்குறள் | 548 / 3,460,637 | 1,330 records |
| புறநானூறு | 69 / 816,402 | 400 |
| அகநானூறு | 45 / 741,982 | 400 |
| கலித்தொகை | 191 / 543,199 | 149 |
| குறுந்தொகை | 46 / 350,279 | 400 |
| நற்றிணை | 436 / 145,775 | 400 (mostly index stubs on-wiki) |
| திருவாசகம் | 61 / 486,181 | not in corpus |

---

## 4. The two real gaps

1. **Periya Puranam text is nowhere free.** Periyapuranam on ta.wiki is an 8.5 KB summary; on
   ta.wikisource there are zero pages, and search only returns encyclopaedia entries and the
   `கலைக்களஞ்சியம்/` Nāyaṉmār articles. Yet the *stories* are the richest storytelling material
   in Tamil. Options: (a) build a story layer from the 65 ta.wiki Nāyaṉmār articles (CC BY-SA,
   legal, no verse text), (b) source a public-domain edition (U. V. Swaminatha Iyer's
   *Periyapurāṇam* commentary is PD in India) and OCR it, (c) both — story now, verse later.
2. **Civaka Cintamani naming is chaotic.** Its 13 ilambakams are split across pages titled
   `1. நாமகள் இலம்பகம்`, `1. நாமகள் இலம்பகம்- பாடல் 51-75`, `1:3. நாமகள் இலம்பகம்- பாடல் 51-75`,
   `2. கோவிந்தையார் இலம்பகம் -கதைச்சுருக்கம்`. Needs a normaliser, and coverage is partial.

---

## 5. Format defects to budget for

| Defect | Where | Cost |
|---|---|---|
| Legacy `<B>` / `<FONT COLOR>` wrapping + a duplicated modernised line per verse | Silappathikaram `2.மனையறம்படுத்த காதை` and near neighbours | parser rule: strip tags, drop the second copy |
| OCR typos in the original (`சிறப்பி்`) | Silappathikaram | manual or dictionary-driven correction; mark `verified: false` |
| Proofread-page transclusion (`<pages index="…pdf">`) | Thiruvilaiyadal, 10 Kamba pages, Kuttrala | fetch `Page:` namespace, not the article |
| Verse numbering restarts per kādai | Manimekalai, Silappathikaram | `structure.number` per chapter, not global |
| Index/stub pages mixed with text pages | Natrinai (436 pages / 146 KB) | size threshold + `#REDIRECT` filter |
| Scene headings used as section titles | Kamba Ramayanam | good — maps to `structure.chapter` |

---

## 6. Jeyamohan's digital work — Venmurasu

Technically the most accessible modern Tamil text online, and legally the most constrained.

| Fact | Value |
|---|---|
| Books | 26 (+ book 0), *Mahābhārata* retelling, 2014–2020 |
| Chapters | ~1,950 |
| Delivery | React SPA; `/manifest/index.json` (book + chapter counts + hashes); `/content/<slug>.zip` — **plain UTF-8 JSON** (`contentHtml` per chapter), no DRM |
| Commerce | `buyLinks` per book → print and e-book stores |
| Licence | none granted; site text: *"articles can be shared freely on the Internet… to publish in part or in full on other media, prior permission from the author is required"* |

**Decision: reference only.** Open Sangam can link to Venmurasu, cite it, and quote short
passages under fair quotation — it cannot ingest the text into a CC BY-SA corpus. The same
applies to Jeyamohan's essays and his literary-history writing, which would otherwise be an
excellent secondary source.

Note also that Venmurasu is *Ithihāsa*, not Sangam; it belongs in a "modern Tamil retellings"
shelf if it ever gets a licence, not in the classical corpus.

---

## 7. Rights classification (proposed, mirrors `ARTIFACT_LIBRARY.md`)

| Source | Use | Rights | Rule |
|---|---|---|---|
| ta.wikipedia | Story prose, character notes, framing | CC BY-SA 4.0 | Ingest with attribution block + revision URL |
| ta.wikisource | Verse text of PD works | CC BY-SA 4.0 (PD underlying) | Ingest with attribution; keep the wiki's edition note |
| ta.wikisource `கலைக்களஞ்சியம்/` | Encyclopaedia entries | CC BY-SA 4.0 | Ingest as notes, never as verse |
| Wikidata | IDs, dates, relationships | CC0 | Free to join on |
| jeyamohan.in, venmurasu.in | Modern retellings | permission-required | Link and cite only; no text |
| YouTube talks (S. Ramakrishnan, Bava Chelladurai) | Editorial guidance | all rights reserved | Do not transcribe; derive a curated list by hand (§9) |

---

## 8. Proposed pipeline (fits the existing gates)

```
scraper/wikisource.py
  ├── manifest per work (prefix → ordered page list)
  ├── fetch wikitext (POST, ≤25 titles/req, UA + maxlag)
  ├── format adapters: poem | proofread-transclusion | legacy-FONT | plain
  ├── normalise → structure { level, book, chapter, number }
  └── validate against verse_schema v2 + known_line_gaps

knowledge/wikipedia_stories.py
  ├── category walk (காப்பியங்கள், நாயன்மார், திருவிளையாடல்கள்)
  ├── extract: lead, section headings, cited verses, references
  └── emit data/library/epic-stories.json  (titleTa/titleEn/summaryTa/work/recordRefs/attribution)
```

Two schema facts constrain this:

- `verse_schema.json` v2 has **no `structure` field**, yet `frontend/src/data/structure.js`
  already renders `structure: { level, book, chapter, number }`. Kamba Ramayanam and
  Silappathikaram cannot land as flat `number`-keyed records. Either add an optional `structure`
  object to v2 (backwards compatible) or cut v3 — decide before the first epic lands.
- `frontend/src/data/poems.js` has 36 entries and `data/library/catalog.json` 32 works; epics are
  `availability: metadata` today. Each harvested epic flips one row to `reader`.

New reader kinds needed: `paṭalam` (Kamba), `kādai` (Silappathikaram / Manimekalai),
`ilambakam` (Civaka), `game` (Thiruvilaiyadal) — extend `SECTION_KINDS` in `structure.js`.

---

## 9. Story/authorship canon — inputs I could not verify here

The brief cites speeches by **S. Ramakrishnan** and **Bava Chelladurai** as the source of the
"best stories and authors". I could not verify any speech content from this environment
(no video access; DuckDuckGo returned a bot challenge). Treat the following as **a curation task
with a named human owner, not as a harvested source**:

- Do **not** transcribe or paraphrase the talks; derive a ranked list and cite the talk
  (title, venue, date, URL) per recommendation.
- Record each recommendation as `{ work, story, recommendedBy, talkUrl, timestamp, note }` so a
  reader can hear the original.
- Rank with the existing rule in `docs/EXPANDING_LIBRARY.md`
  (`lines × languages × verified`), not by fame.

---

## 10. Recommended order of work

| # | Step | Why now | Rough effort | Status |
|---|---|---|---|---|---|
| 1 | Add `structure` to verse schema + `SECTION_KINDS` | blocks every epic | 0.5 day | ✅ done (2026-11-27) |
| 2 | `scraper/scrape_wikisource.py` with the `<poem>` adapter | unlocks Perunkathai and Manimekalai in one pass | 1–2 days | ✅ done |
| 3 | Harvest **Manimekalai** (30 kādai) | pairs with Silappathikaram already catalogued; completes the twin epics | 1 day | ✅ 31 records / 4,856 lines |
| 4 | Harvest **Perunkathai** (104 pages) | richest untouched story cycle, cleanest markup | 1–2 days | ✅ 99 chapters / 16,188 lines |
| 5 | `knowledge/wikipedia_stories.py` → 65 Nāyaṉmār + 55 paṭalam story records | only legal route to Periya Puranam stories | 2 days | ☐ next |
| 6 | Harvest **Kamba Ramayanam** (137 pages, 2.3 MB) | biggest single win; needs the proofread adapter for 10 pages | 2–3 days | ✅ 125 paṭalam / 10,392 verses / 147 scenes |
| 7 | Silappathikaram cleanup (legacy HTML, duplicated lines, OCR typos) | highest editorial cost, do last | 3–5 days | ☐ |
| 8 | Venmurasu / Jeyamohan | blocked on permission — send the request, then wait | — | ☐ blocked |
| 9 | Per-chapter lazy loading for structural works | the reader currently downloads a whole epic (22 MB) to show one paṭalam | 1–2 days | ☐ |

Tamil.wiki (`Category:Finalised`) was scouted separately and classified — see
[`tamilwiki-classification.md`](tamilwiki-classification.md). Headline: it is a biographical
dictionary (≈5,200–5,700 people, 969 `புலவர்` pages), not a text corpus, and only 6 pages are
tagged as Sangam-era poets.

Every ingested record stays `verified: false` and carries `source` + attribution until a named
scholar signs off, per `docs/data/data-governance.md`.
