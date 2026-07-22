# Articles

Long-form essays published alongside the Open Sangam corpus work — on the
platform itself, the Sangam tradition, and what classical Tamil literature has
to do with modern AI for Tamil and other Indic languages.

Each `*.md` file here is the **source of truth**. A build step
(`frontend/scripts/build-articles.mjs`) renders them to HTML + a JSON manifest
the React app reads, and emits an RSS 2.0 feed.

## Reading them

- **In the app:** the *Articles* section — `/articles` (nav: கட்டுரைகள்).
- **As markdown:** open any file in this directory.
- **As a feed:** `/feed.xml` (RSS 2.0, full content included).

## Editorial status

These are **perspective / explanatory essays**, not peer-reviewed papers. Any
accuracy/BLEU-style numbers in them are *illustrative* unless a specific source
is cited. Each essay ends with a *Further reading* list of genuine works. This
is called out in an editorial note at the top of every piece, in keeping with
`docs/editorial-style-guide.md` (cite real sources; don't assert contested
points as fact).

## The essays

| # | Title | Category |
|---|-------|----------|
| 1 | Introduction to Open Sangam | Platform |
| 2 | The Ancient Sangam Era and Its Effect on Modern AI | AI & Language |
| 3 | Building AI for Low-Resource Indic Languages | AI & Language |
| 4 | The Sangam Tiṇai Framework as a Blueprint for Language Understanding | AI & Language |
| 5 | Knowledge Graphs in Digital Humanities | Digital Humanities |
| 6 | Neural Networks and Ancient Poetry | AI & Language |
| 7 | Tamil Renaissance Through Digital Humanities | Digital Humanities |
| 8 | The Sangam Effect on Computational Linguistics | AI & Language |
| 9 | Bridging Centuries: AI-Powered Accessibility for Ancient Indic Texts | Digital Humanities |

## Authoring a new article

1. Add `content/articles/<slug>.md` with frontmatter:

   ```yaml
   ---
   title: "…"
   slug: my-article-slug
   date: 2026-07-20
   author: "Open Sangam Project"
   category: "AI & Language"
   tags: ["Tamil", "NLP"]
   description: "One-line summary shown in the list and the feed."
   status: essay
   ---
   ```

2. Write the body in Markdown (GFM: tables, fenced code, blockquotes).
3. Run `npm run articles` in `frontend/` (also runs automatically on
   `npm run dev` / `npm run build`).

Set `SITE_URL` when generating for production so the RSS links are absolute:

```bash
SITE_URL=https://your-domain npm run articles
```
