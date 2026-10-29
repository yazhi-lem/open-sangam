# Deep-Research Prompt — Kumari Kandam / Lemuria in Sangam Literature

Use this prompt with a Tamil-literate research agent or a human scholar. It is
designed to prevent the most common error: treating a later Tamil tradition or a
colonial geological theory as if it were directly attested in the Sangam poems.

---

## Prompt

You are a Tamil scholar of Sangam literature, Tamil epigraphy and historiography.
Investigate the claim that the Sangam corpus contains references to **Kumari
Kandam** (குமரிக்கண்டம்) or **Lemuria** (லெமூரியா).

Your first duty is **evidence classification**, not confirmation. Separate:

1. **Sangam primary text** — Ettuthokai and Pattuppattu verse lines.
2. **Sangam-era commentary/urai** — later prose that may preserve older material
   but is not itself a Sangam verse.
3. **Later Tamil literary tradition** — medieval and modern Tamil works that
   develop the Kumari Kandam story.
4. **Colonial Lemuria** — nineteenth-century geology and ethnology.
5. **Modern political/historical claims** — twentieth-century and contemporary
   narratives.

### Search terms

Search every normalized record in `sangamTamil`, `urai` and `english` for:

- குமரி
- குமரிக்கண்டம்
- குமரிமலை
- குமரியாறு
- தென்குமரி / தென் குமரி
- கடல் கொண்ட / கடல்கொண்ட
- கடல் விழுங்க
- ஆதிமந்தி
- ஆட்டன் அத்தி
- மூன்று சங்கம்
- தென்மதுரை
- கபாடபுரம்
- நாவலந்தீவு
- இமயம்–குமரி / வட இமயம்–தென் குமரி
- Lemuria / லெமூரியா

### Extraction protocol

For every hit record:

- record id;
- poem and verse/section number;
- field (`sangamTamil`, `urai`, `english`);
- exact term and surrounding 1–3 lines;
- classification:
  - `direct_land_reference`
  - `boundary_geography`
  - `place_or_river_name`
  - `homonym_young_woman`
  - `simile_sea_or_river`
  - `later_commentary`
  - `colonial_or_modern`
  - `not_found`
- whether the line is a direct statement, an image, a simile, or a later
  explanation.

### Mandatory distinctions

- **குமரி** can mean “young woman”, a river, a cape, or a place. Do not translate
  every occurrence as “Kumari Kandam”.
- **தென் குமரி** in Sangam poems usually marks the southern boundary of the known
  Tamil land, paired with **வட இமயம்**. It is a geographical limit, not a lost
  continent.
- **கடல் கொண்டன்று** can be a simile for a person swallowed by the sea or a river,
  as in the Adimanthi material. It is not automatically a land-mass claim.
- **ஆதிமந்தி** is a woman searching for her husband **ஆட்டன் அத்தி**, taken by the
  Kāviri/sea. This is a story of personal loss, not a continent.
- **நாவலந்தீவு** is Jambudvīpa, the known Indian landmass, not Lemuria.
- **Lemuria** is a nineteenth-century scientific hypothesis, not a Sangam term.
  It entered Tamil discourse later and must be dated as such.
- The **three Sangam academies** and **Then-Madurai / Kapātapuram** belong to later
  tradition; they are not attested as historical places in the Sangam verses.

### Required output

Write a structured report with these sections:

1. **Executive finding** — one paragraph.
2. **Corpus hit table** — every match with record id, poem, field, term,
   classification, snippet and note.
3. **What “Kumari” means in Sangam** — young woman, river, cape, boundary.
4. **The Adimanthi / Atthan Athi material** — what the poems actually say.
5. **The later Kumari Kandam tradition** — when and where it develops; label it
   clearly as later.
6. **Lemuria as colonial science** — origin, transmission, and why it is not a
   Sangam category.
7. **Claims table** — claim, direct evidence, verdict (`supported`,
   `partly supported`, `not supported`, `undetermined`), confidence.
8. **Annotated bibliography** — primary texts, editions, later tradition,
   historiographical studies.
9. **Five research questions** for further work.

### Constraints

- Never invent a poem number, quotation, poet or attribution.
- Quote only lines you can verify in the corpus.
- Do not cite a modern website as primary evidence.
- Do not collapse “Tamil tradition”, “Sangam text”, “colonial Lemuria” and
  “modern nationalism” into one voice.
- Where evidence is absent, say **“no direct Sangam attestation found”**.
- Use Tamil terms with Tamil script and a short English gloss.
- Keep the report analytical, not devotional or polemical.
- Target 1,500–2,000 words for the report.

---

## Corpus scan (already run)

The repository extractor:

```bash
cd backend/python
python -m knowledge.extract_kumari_references
```

writes:

```text
data/library/kumari-references.json
```

Result on the normalized corpus:

| Term | Matches | Classification |
|---|---:|---|
| குமரி | 30 | homonym / place / young woman |
| கடல் கொண்ட | 2 | simile |
| ஆதிமந்தி | 11 | possible reference |
| இறையனார் | 2 | later tradition |
| நாவலந்தீவு | 1 | possible reference |

**Direct Kumari Kandam references: 0. Direct Lemuria references: 0.**

Key verified examples:

- **Pathitrupathu 11 and 43** — “வட இமயம் … தென் குமரி” as the northern and
  southern boundaries of the known land.
- **Purananooru 6, 17, 67** — **தென் குமரி** as the southern limit; **குமரித்
  துறை** as a coastal place.
- **Akananooru 236** — “கடல் கொண்டன்று” in the Adimanthi simile; not a lost
  continent.
- **Paripadal 5** — **நாவலந்தீவு** as Jambudvīpa, the known landmass.

These are **not** evidence for Kumari Kandam or Lemuria. They are evidence for
how the Sangam poets imagined the southern boundary, the sea, and personal loss.

---

## What to ask the agent

> “Using only the normalized Sangam corpus and clearly labelled later tradition,
> produce the report described in `docs/research/kumari-kandam-prompt.md`.
> Start by listing every hit for குமரி, குமரிக்கண்டம், லெமூரியா, கடல் கொண்ட,
> ஆதிமந்தி and நாவலந்தீவு. If there is no direct Sangam reference to Kumari
> Kandam or Lemuria, state that plainly and explain what the attested terms do
> mean. Do not invent citations.”
