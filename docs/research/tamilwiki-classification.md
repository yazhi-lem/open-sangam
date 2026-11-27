# Tamil Wiki — scouting and classifying `Category:Finalised`

Status: research · Verified: 2026-11-27 against live `tamil.wiki` (MediaWiki 1.43.11) · Method:
MediaWiki Action API, read-only; every 9th page sampled for content-based classification

Companion to [`tamil-wiki-scout.md`](tamil-wiki-scout.md) (which covers `ta.wikipedia.org` and
`ta.wikisource.org`). This note answers: what is on `tamil.wiki`, what `Category:Finalised` means,
how the 9,082 pages split by type, and what Open Sangam should and should not take from it.

---

## 1. What the site is

| Metric | Value |
|---|---|
| Articles | 11,703 |
| All pages | 30,710 |
| Files | 17,277 |
| Registered users | 160 |
| Licence | **CC BY-SA 4.0** for original text (`Tamil_Wiki:Copyright`) |

The site is a **curated Tamil-heritage encyclopaedia**, not a text corpus: it holds biographies of
Tamil authors, work-level articles on classical texts, temple/place entries, and art-form pages.
It is *not* Semantic MediaWiki / Wikibase / Cargo — 31 extensions, none structured-data — so there
is no machine-readable infobox API to lean on.

### Licence caveat — read this before ingesting anything

The copyright page grants CC BY-SA 4.0 **only to the site's own text**, then adds two carve-outs:

- some **images** remain third-party copyright → do not mirror the 17,277 files;
- some **text** is quoted from other publishers under a fair-dealing claim (Indian Copyright Act
  §52(1)(a)(ii)) → that quoted material stays with its original owner.

Practical rule for Open Sangam: **text-only, original contributions, per-page attribution, no
images, no block quotations.** Anything that reads like a reproduced passage gets dropped, not
paraphrased into the corpus.

---

## 2. What `Category:Finalised` is

`Category:Finalised` is the wiki's own **review-complete marker**, applied by its editors. It is
not a topic category. Membership: **9,082 pages**. Almost every member also carries
`Category:Tamil Content` (9,079), so the two together mean "written in Tamil, reviewed".

| Marker | Pages |
|---|---:|
| `Finalised` | 9,082 |
| `Tamil Content` | 9,079 |
| `ஆண்` / `பெண்` (gender) | 2 pages only — gender tagging is essentially unused |

---

## 3. Classification by declared category

The taxonomy is thin: **279 distinct categories across 9,082 pages**, and the largest single
bucket is "no topic category at all".

| Class | Pages | Share | Examples |
|---|---:|---:|---|
| person (any role category) | **2,854** | 31.4% | புலவர், கவிஞர், எழுத்தாளர், தமிழறிஞர் |
| place / temple | 681 | 7.5% | சமணத் தலம், இந்து மத ஆலயம், மலேசியா, ஈழம் |
| work | 298 | 3.3% | நாவல், சிற்றிலக்கியம், வெண்பா, கலம்பகம் |
| organisation / periodical / award | 186 | 2.0% | இதழ், இலக்கிய அமைப்பு, இலக்கிய விருது |
| art form | 172 | 1.9% | சிவ தாண்டவங்கள் (109), சிவ வடிவங்கள் |
| list / disambiguation | 107 | 1.2% | பெயர் பட்டியல், Disambiguation |
| religion | 78 | 0.9% | கிறிஸ்தவம், சமணம், இஸ்லாம், வைணவம் |
| period | 10 | 0.1% | 10-ம் நூற்றாண்டு… |
| **uncategorised** | **4,696** | **51.7%** | carries only `Finalised` + `Tamil Content` |

Role detail among the person pages:

| Role category | Pages |
|---|---:|
| புலவர் (poet) | 969 |
| கவிஞர் (poet) | 703 |
| எழுத்தாளர் (writer) | 634 |
| இதழாளர் (journalist) | 288 |
| சிறுகதையாசிரியர் (short-story writer) | 231 |
| நாவலாசிரியர் (novelist) | 171 |
| தமிழறிஞர் (Tamil scholar) | 164 |
| மொழிபெயர்ப்பாளர் (translator) | 128 |
| உரையாசிரியர் (commentator) | 38 |
| **சங்க காலப் புலவர் (Sangam-era poet)** | **6** |

Note the last row: the wiki has **969 "புலவர்" pages but only 6 tagged "சங்க காலப் புலவர்"**. The
classical/modem split is not encoded — every Tamil poet from Kapilar to a 2020s lyricist lands in
the same bucket.

---

## 4. Classifying the 4,696 uncategorised pages

Categories cannot classify half the wiki, so I sampled **every 9th uncategorised page (520 pages)**
and classified by content: the lead's `(பிறப்பு: …)` / `(இறப்பு: …)` parenthetical, the role list
in the first sentence ("ஆய்வாளர், எழுத்தாளர், மொழிபெயர்ப்பாளர்"), and work/place markers.

| Inferred class | Sample | Share |
|---|---:|---:|
| person | 253 | 49% |
| concept / other (art forms, food, institutions, terms) | 139 | 27% |
| work | 104 | 20% |
| place / temple | 24 | 5% |

Extrapolating to all 4,696 and adding the declared categories gives the working estimate:

| Whole wiki (`Finalised`) | Estimate |
|---|---:|
| people | ≈ 5,200–5,700 |
| works | ≈ 1,200 |
| places / temples | ≈ 900 |
| art forms & concepts | ≈ 1,100 |
| lists, orgs, religion | ≈ 400 |

**So `tamil.wiki` is roughly a biographical dictionary with a literature annexe** — not an epic
story corpus. It has no verse text at all: `tirukkural` is a 171 KB encyclopaedia article, never
the 1,330 couplets.

---

## 5. What this gives Open Sangam

### 5.1 The one immediately useful asset: a poet-name authority

Our corpus carries **565 distinct poet strings across 3,878 attributed records**. Tamil Wiki's
`புலவர்` category holds **969** poet articles.

| Measure | Result |
|---|---|
| Exact-name overlap (after whitespace normalisation) | **256 / 565 (45%)** |
| Our strings that collapse under whitespace normalisation alone | 565 → **511** (47 groups with >1 spelling) |

The 47 internal duplicates are real data errors, e.g.:

- `பாலை பாடிய பெருங்கடுங்கோ` (56 records) vs `பாலை பாடிய பெருங் கடுங்கோ` (3) vs
  `பாலைபாடிய பெருங்கடுங்கோ` (3) vs `பாலை பாடிய பெருங் கடுங்கோ.` (1) — four spellings, one poet
- `பெருங்குன்றூர் கிழார்` (12) vs `பெருங்குங்கூர்கிழார்` (3)
- `வெள்ளிவீதியார்` (8) vs `வெள்ளி வீதியார்` (5)
- `மருதன் இளநாகனார்` (38) vs `மருதன் இள நாகனார்` (1)

They also explain the duplicate `Poet - …` notes already visible in the generated Obsidian vault
(`Poet - கழார்க் கீரன் எயிற்றியார்` alongside `Poet - கழார்க்கீரன் எயிற்றியார்`).

**Action:** treat tamil.wiki `புலவர்` as the authority list, write a normaliser, and cut the 47
groups to one canonical spelling each. This fixes the vault, the graph and search at once, and
owes nothing to the wiki's prose.

### 5.2 Secondary: work-level reference depth

Its work articles are longer and better sourced than ours in places (e.g. `நற்றிணை` 42 KB with
publication history: 1915 Narayanasamy Iyer, 1940, 1957 Murray Rajam, 1962 Somu Sundaranar). That
is *bibliographic* material our catalogue lacks — usable as `notes`/provenance, never as verse.

### 5.3 Not usable

| Content | Why not |
|---|---|
| 17,277 images | third-party copyright per the site's own carve-out |
| Quoted passages | the site's fair-dealing claim does not travel with a CC BY-SA re-publication |
| Modern author biographies (5,000+) | irrelevant to the classical corpus; would swamp it |
| Temple / place pages | out of scope until the artifact register needs a place index |

---

## 6. What was actually done (2026-11-27)

The authority index was extracted and the corpus normalised — the derived artefact
this note recommended, and nothing else:

| Artefact | Content |
|---|---|
| `data/library/tamilwiki-poets.json` | 1,660 names (969 புலவர் · 703 கவிஞர் · 6 சங்க காலப் புலவர்), with role, page size and URL. **Names only — no article text.** |
| `data/library/poet-aliases.json` | 55 `raw → canonical` mappings, merged (never replaced) on each run |
| `backend/python/normalizer/canonicalize_poets.py` | derives and applies the mappings; dry-run by default |
| `backend/python/tests/test_poet_alias.py` | fails if duplicate spellings, alias chains or scrape artefacts return |

Result on our corpus:

| Measure | Before | After |
|---|---:|---:|
| Distinct `poet` strings | 565 | **508** |
| Duplicate spelling groups | 47 | **0** |
| Records whose poet was a colophon placeholder | 78 | 0 (`poet: null`) |
| Obsidian `Poet -` notes for one person | up to 4 | 1 |

The policy stayed conservative: only names that actually had more than one
spelling were rewritten. The authority decides *which* spelling wins inside a
duplicate group; a poet with a single established spelling is untouched, so the
vault does not churn for cosmetic reasons.

Article prose was **not** ingested, and no image was mirrored.

## 7. Recommended handling

1. **Ingest one derived artefact only:** `data/library/tamilwiki-poets.json` — 969 poet names with
   article URL and byte size, used as a name-authority index. No prose copied.
2. **Normalise our 565 poet strings to 511** using it; regenerate the Obsidian vault and the
   knowledge graph afterwards so duplicate `Poet -` notes disappear.
3. **Do not ingest article prose** for now. If a work's catalogue entry needs bibliographic depth,
   copy the *facts with citation* into `data/library/catalog.json`, not the paragraphs.
4. **Never mirror images.** If provenance is needed, link the article URL.

Attribution line to use if any text is ever quoted: "Source: Tamil Wiki
(https://tamil.wiki/…), CC BY-SA 4.0".
