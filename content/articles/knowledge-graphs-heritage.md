---
title: "Preserving Literary Heritage Through Technology: The Role of Knowledge Graphs in Digital Humanities"
slug: knowledge-graphs-heritage
date: 2026-06-30
author: "Open Sangam Project"
category: "Digital Humanities"
tags: ["Knowledge Graphs", "Digital Humanities", "Preservation", "RDF"]
description: "Knowledge graphs as a bridge between humanities scholarship and computation — with Open Sangam as the worked example."
status: essay
---
# Preserving Literary Heritage Through Technology: The Role of Knowledge Graphs in Digital Humanities

> **Editorial note.** This is an explanatory / perspective essay published
> alongside the Open Sangam corpus work. Quantitative figures are illustrative
> unless a specific source is cited; see *Further reading* at the end for
> genuine references.

## Abstract

Digital humanities projects increasingly face a fundamental challenge: how to represent complex, multi-layered literary and cultural knowledge in computable form while respecting scholarly rigor and preserving human understanding. This article examines how knowledge graphs—a technology developed for web search and AI applications—can serve as a bridge between traditional humanities scholarship and computational methods. Using Open Sangam as a case study, we explore how knowledge graphs enable researchers to simultaneously preserve classical literature, make it accessible to new audiences, and create training data for AI systems. The paper argues that knowledge graphs represent the optimal format for digitizing humanities materials: they are rigorous, transparent, queryable, and amenable to both human interpretation and machine learning.

## Part I: From Archives to Knowledge Structures

### The Problem with Digital Archives

Early digital humanities projects (1990s–2000s) created large text repositories:

- **Project Gutenberg**: Plain text of public-domain books
- **Internet Archive**: Scanned PDFs of rare texts
- **Google Books**: Full-text indexing of millions of books

**Limitations**:

1. **No semantic structure**: A 1,000-page text is stored as flat bytes; relationships between concepts are implicit
2. **No metadata**: Lacks scholarly apparatus (author biography, historical context, critical apparatus)
3. **No connections**: Each text is isolated; cross-references and influences are not captured
4. **No queryability**: Users must read entire texts to find relevant passages
5. **Not machine-readable**: Computers see text as strings, not meaning

**Result**: Archives are preserved but not understood at scale. To learn from the corpus, scholars must read manually—a task that becomes impossible for large collections.

### The Knowledge Graph Approach

A **knowledge graph** represents information as:

```
Nodes: Concepts, entities, works
Edges: Relationships between nodes
Weights: Frequency, confidence, or importance of relationships
```

Example:

```
Node: Kacciyappan (poet)
  ├─ WROTE → Purananuru (poem)
  │    ├─ HAS_TIṆAI → Puṟam (exterior/heroic)
  │    ├─ ATTESTS → Chola Dynasty
  │    └─ CONTAINS → 400 verses
  ├─ LIVED_IN → Chola Kingdom
  ├─ SPECIALIZED_IN → War poetry (frequency: 0.92)
  └─ CONTEMPORARY_WITH → Silappatikaram (date range: ~1st–2nd century CE)
```

**Advantages**:

1. **Explicit structure**: Relationships are formalized; queries can traverse the graph
2. **Rich metadata**: Each node carries properties (author, date, theme, language)
3. **Cross-linking**: Concepts connect to related concepts; influence networks become visible
4. **Queryable**: Ask questions like "Find all poets who wrote in Kuṟiñci landscape"
5. **Machine-readable**: Computers can traverse the graph, extract patterns, and train models

## Part II: Knowledge Graphs in Digital Humanities

### Historical Precedent

Scholarly editions have always used graph-like structures:

- **Apparatus criticus** (textual variants): Represents multiple versions of a text as nodes, showing which variants appear in which manuscripts
- **Cross-references**: Print indices link verses to related concepts, creating implicit graph structures
- **Commentary**: Scholarly notes link passages to external knowledge (historical events, mythological references, other texts)

**Key insight**: Scholars have always organized knowledge as interconnected networks. Knowledge graphs simply make this structure explicit and computable.

### Contemporary Examples

**DBpedia** (Wikipedia extracted as a knowledge graph):

- 4.5M nodes (Wikipedia articles)
- 3.3B edges (links between articles)
- Each node carries properties (person: birth year, occupation, nationality; work: author, publication date, genre)

**Wikidata** (structured knowledge base):

- 100M+ items
- Represents facts across all Wikipedia languages
- Enables cross-lingual queries: "All works by Tamil authors published in 19th century"

**WordNet** (lexical semantics graph):

- Words as nodes
- Relations: hypernym (is-a), meronym (part-of), antonym
- Enables semantic similarity computations

**CIDOC-CRM** (cultural heritage metadata standard):

- Formal ontology for museum and heritage information
- Represents objects, artists, events, time periods as interconnected entities
- Used by cultural institutions worldwide

### Open Sangam's Knowledge Graph

Open Sangam implements a humanities knowledge graph specifically for Sangam literature:

**Node types**:
- **Tiṇai**: 5 akam + 7 puṟam landscape types
- **Poem**: 17 classical works
- **Verse**: 2,066 individual verses
- **Poet**: 473 named and anonymous authors
- **Patron/King**: 50+ documented rulers
- **Karu**: Flora, fauna, deities, social roles native to each tiṇai
- **Cultural_Note**: Historical facts (governance, commerce, warfare, daily life)

**Edge types**:
- **HAS_TIṆAI**: Poem → Tiṇai (structural)
- **CONTAINS**: Poem → Verse (compositional)
- **COMPOSED**: Poet → Poem (authorship)
- **WROTE_IN**: Poet → Tiṇai (specialization)
- **ADDRESSES**: Poet → Patron (patronage)
- **ATTESTS**: Tiṇai → Karu (frequency-weighted evidence)
- **REFERENCES**: Verse → Cultural_Note (contextual grounding)

**Weights and metadata**:
- Edge weights: Frequency of attestation, confidence scores
- Temporal properties: Dates of composition, historical period
- Spatial properties: Geographic locations mentioned
- Linguistic properties: Meter, language variant (archaic vs. contemporary)

## Part III: Knowledge Graphs as a Bridge Between Humanities and AI

### Problem 1: Data Format for Machine Learning

**Traditional humanistic output**: Narrative essays, scholarly books, annotated texts

**Problem**: Language models cannot train on prose descriptions of knowledge; they require structured data.

**Solution**: Knowledge graphs provide structured training data.

```
Humanities input:
"Kacciyappan was a renowned Sangam-era poet who lived during the Chola 
dynasty, likely in the 1st or 2nd century CE. He specialized in puṟam 
(heroic) poetry, composing verses in the Purananuru anthology that praise 
Chola kings and celebrate martial valor. His verses frequently reference 
Chola court life, coastal fortifications, and warrior ethics."

Knowledge graph representation:
Kacciyappan [node]
  ├─ LIVED_IN_PERIOD: [1st–2nd century CE, confidence: 0.7]
  ├─ LIVED_IN_REGION: Chola_Kingdom
  ├─ SPECIALIZATION: Puram_Poetry [frequency: 47/52 verses = 0.90]
  ├─ COMPOSED: Purananuru [poem]
  │    ├─ PUBLISHED_IN: Sangam_Anthology
  │    ├─ HAS_SUBJECT: Chola_Kings, Martial_Valor
  │    └─ CONTAINS: 52 verses [by Kacciyappan]
  └─ ATTESTS_CONCEPTS: [Chola_Court_Life, Coastal_Fortification, Warrior_Ethics]

→ This structure can be:
   1. Queried by scholars
   2. Trained on by language models
   3. Visualized interactively
   4. Extended by community contributors
```

### Problem 2: Transparency and Verification

**AI criticism**: "Black box" models make predictions without explanation; users don't know why the model chose a particular translation or entity.

**Knowledge graph solution**: Every edge in the graph has:

1. **Source**: Which verse or scholarly source supports this relationship
2. **Confidence**: How confident is this relationship (0–1 scale)
3. **Verifier**: Which scholar verified this
4. **Timestamp**: When was it added/modified

```
Edge: Kacciyappan WROTE Purananuru
  ├─ confidence: 0.95 (10/10 verses internally consistent)
  ├─ sources: ["colophon_0047", "colophon_0048", "colophon_0050"]
  ├─ verified_by: "U.V. Swaminatha Iyer" (scholar)
  └─ added_at: 2024-06-15

Edge: Kacciyappan LIVED_IN Chola_Kingdom
  ├─ confidence: 0.6 (indirect evidence; no explicit biography)
  ├─ sources: ["context_analysis", "historical_records"]
  ├─ verified_by: "pending" (marked for community verification)
  └─ added_at: 2024-03-20
```

This transparency enables:

- **Scholars to evaluate claims**: See the evidence base for each assertion
- **Models to learn uncertainty**: Confidence scores become part of training
- **Communities to contribute**: Contributors verify and update relationships

### Problem 3: Interdisciplinary Accessibility

**Challenge**: Humanities scholars speak different languages than computer scientists

- **Humanists** use: narrative, interpretation, ambiguity, multiple valid readings
- **Computer scientists** use: formal logic, algorithms, deterministic outputs

**Knowledge graphs as translation layer**:

- Humanists create graph nodes and edges using intuitive interfaces
- Graph is stored in semantic web standard formats (RDF, OWL)
- Computer scientists query and train models on graph
- Results are visualized and explained back to humanists

## Part IV: Detailed Knowledge Graph Design for Literary Corpora

### Ontology: Entity Types

An **ontology** defines what kinds of entities and relationships are permitted in the graph.

```
Entity Classes:

1. LiteraryWork
   properties: title, language, compositionDate, genre, lineCount
   subclasses: Poem, Collection, Anthology

2. Verse
   properties: text, lineNumber, tiṇai, meter, translation_modern
   related_to: WorkContainment, VerseTheme, VerseEntity

3. Person (abstract)
   subclasses: Poet, Patron, Deity

4. Poet
   properties: name_Tamil, name_English, era, specialization
   related_to: Composition, Patronage, Tiṇai_Specialization

5. Patron
   properties: name, dynasty, titles, eraOfRule, symbols
   related_to: SupportsPoet, MentionedInVerse

6. LandscapeCategory (Tiṇai)
   properties: Tamil_name, semantic_associations, associated_emotions
   subclasses: AkamTinai, PuramTinai

7. CulturalEntity
   subclasses: Flora, Fauna, Deity, RitualPractice, SocialRole

8. CulturalNote
   properties: text, historical_context, relatedVerses
   related_to: SourceVerse, HistoricalEvent, CulturalConcept
```

### Properties: Rich Metadata

Each entity carries properties that make it machine-queryable:

```
Verse {
  id: "purananuru_0192",
  poem: "Purananuru",
  verse_number: 192,
  tiṇai: "Puram",
  meter: "Aciriya_Venpa",
  author: "Kacciyappan",
  text_sangam: "நன் னெஞ்சினோய்...",
  text_modern_tamil: "நல்ல நெஞ்சம் உள்ள...",
  text_english: "O noble-hearted one...",
  themes: ["warrior_valor", "kingship", "duty"],
  cultural_references: ["Chola_dynasty", "Madurai", "warfare"],
  mentioned_entities: ["Warrior", "King", "Horse"],
  meter_analysis: {
    pattern: "syllable_count=32",
    feet: "4×8",
    type: "aciriya_venpa"
  },
  verification_status: "verified",
  verified_by: "scholar_0042",
  verified_date: "2024-06-15"
}
```

### Relationships: Structured Connections

```
Relationships in Sangam Knowledge Graph:

COMPOSITIONAL:
- Poem.contains(Verse)
- Anthology.contains(Poem)

SEMANTIC:
- Verse.expresses(Theme)
- Theme.belongs_to(Tiṇai)
- Tiṇai.characterizes(CulturalEntity)

AUTHORSHIP:
- Poet.wrote(Poem)
- Poet.wrote_verse(Verse)
- Poet.specialized_in(Tiṇai) [weighted by %-verses-in-tiṇai]

HISTORICAL:
- Poet.lived_during(HistoricalPeriod)
- Poet.patronized_by(Patron)
- Verse.references(HistoricalEvent)

REFERENTIAL:
- Verse.mentions(Person)
- Verse.mentions(Place)
- Verse.mentions(Deity)
- Verse.alludes_to(LiteraryWork)

THEMATIC:
- Verse.expresses_emotion(Emotion)
- Verse.demonstrates_principle(Principle)
- Verse.illustrates_cultural_practice(Practice)
```

## Part V: Querying Knowledge Graphs

Knowledge graphs become powerful when queried. Examples:

### Query 1: Which poets specialized in mountain landscapes?

```
SPARQL query:
SELECT ?poet ?poem_count
WHERE {
  ?poet wrote_in kurinchi .
  ?poet wrote ?poem .
}
GROUP BY ?poet
ORDER BY desc(count(?poem))

Result:
Poet                    | Verses in Kurinchi
─────────────────────────────────────
Silappatikara_poet      | 47
Akananooru_poets        | 43
Kurunthokai_poets       | 31
```

### Query 2: What themes appear in coastal verses?

```
SPARQL query:
SELECT ?theme ?frequency
WHERE {
  ?verse has_tinai neytal .
  ?verse expresses_theme ?theme .
}
GROUP BY ?theme
ORDER BY desc(count(?theme))

Result:
Theme               | Frequency
──────────────────────────────
Separation          | 124
Longing             | 98
Impermanence        | 67
Loss                | 54
```

### Query 3: Which Chola kings are mentioned most frequently?

```
SPARQL query:
SELECT ?king ?verse_count
WHERE {
  ?verse mentions ?king .
  ?king dynasty chola .
}
GROUP BY ?king
ORDER BY desc(count(?verse))

Result:
King                        | Verses Mentioning
──────────────────────────────────────────────
Karikala_Chola              | 32
Nedunjezhyan_Chola          | 28
Kopperunchola               | 19
```

### Query 4: Cross-temporal analysis—How do Sangam themes compare to later Tamil literature?

```
SPARQL query:
SELECT ?theme ?sangam_freq ?later_freq
WHERE {
  ?sangam_verse sangam_period true .
  ?sangam_verse expresses_theme ?theme .
  ?later_verse later_period true .
  ?later_verse expresses_theme ?theme .
}
GROUP BY ?theme
ORDER BY desc(abs(?sangam_freq - ?later_freq))

Result:
Theme                   | Sangam % | Later Literature %
─────────────────────────────────────────────────────
Warrior_Valor           | 42%      | 8%
Romantic_Love           | 38%      | 52%
Philosophical_Duty      | 18%      | 22%
```

This reveals cultural shifts: Sangam emphasized war; later literature shifted to romance.

## Part VI: Community Contribution and Verification

Knowledge graphs become most powerful when they enable **crowdsourced scholarship**:

### Contribution Interface

```
Community Member (scholar or enthusiast)
    ↓
    [Proposes new edge or entity]
    ↓
Edit interface shows:
- Current graph state
- Proposed change
- Evidence required
- Versioning history
    ↓
    [Expert review]
    ↓
Three-level decision:
- ACCEPT (add to graph, confidence = 0.95)
- PROVISIONAL (add with confidence = 0.6, marked for review)
- REJECT (feedback on why rejected)
    ↓
Updated graph version
    ↓
Versioning system tracks all changes, enables rollback
```

### Quality Assurance

```
Contributor: Scholar at Tamil Studies Department
Proposes: Poet X lived 1st century CE (confidence: 0.8)
Evidence provided:
  - Literary analysis of archaic language patterns
  - Comparison to datable colophons
  - Cross-reference to historical records

Reviewer (expert): Accepts with confidence 0.75
(Slightly lower than proposed, because evidence is indirect)

Result: Graph updated with timestamped edge
  Poet_X, lived_in_period, 1st_century_CE
    ├─ confidence: 0.75
    ├─ contributor: "Scholar_Name"
    ├─ reviewer: "Expert_Name"
    ├─ evidence_type: ["linguistic_analysis", "comparative_study", "historical_context"]
    └─ timestamp: 2024-08-15
```

## Part VII: Technical Implementation

### Storage Formats

**RDF (Resource Description Framework)**:
```
turtle:
<http://open-sangam.org/poet/kacciyappan> 
  <http://open-sangam.org/property/wrote> 
  <http://open-sangam.org/poem/purananuru> .

<http://open-sangam.org/poem/purananuru>
  <http://open-sangam.org/property/has_tinai>
  <http://open-sangam.org/tinai/puram> .
```

**JSON-LD (Linked Data JSON)**:
```json
{
  "@context": "http://open-sangam.org/context.jsonld",
  "@graph": [
    {
      "@id": "http://open-sangam.org/poet/kacciyappan",
      "@type": "Poet",
      "name": "Kacciyappan",
      "wrote": {"@id": "http://open-sangam.org/poem/purananuru"},
      "era": "1st-2nd century CE"
    }
  ]
}
```

**Property Graph (Neo4j)**:
```cypher
MATCH (p:Poet {name: "Kacciyappan"})-[w:WROTE]->(poem:Poem)
RETURN p, w, poem
```

### Querying: SPARQL vs. Cypher

**SPARQL** (for RDF graphs):
```sparql
SELECT ?poet ?poem
WHERE {
  ?poet wrote_in tinai:kurinchi .
  ?poet composed ?poem .
}
```

**Cypher** (for property graphs):
```cypher
MATCH (p:Poet)-[w:WROTE_IN {tinai: "kurinchi"}]->(:Tinai),
      (p)-[:COMPOSED]->(poem:Poem)
RETURN p.name, poem.title
```

## Part VIII: Impact on Accessibility and Education

### Use Case 1: Interactive Scholar Workbench

Scholars researching Sangam poetry can:

1. **Query the graph**: "Show me all verses by poets patronized by Chola kings, set in mountain landscapes, with romantic themes"
2. **Visualize results**: Interactive network showing poet clusters, thematic distributions
3. **Cross-reference**: Click any verse to see related verses, historical context, scholarly notes
4. **Contribute**: Suggest new interpretations, verify translations, add commentary
5. **Export data**: Download subgraph for further analysis (CSV, JSON, RDF)

### Use Case 2: Adaptive Learning Platform

Students learning Sangam literature use the graph to:

1. **Explore by interest**: "Show me love poetry from forest landscapes"
2. **Learn context progressively**: Click any word → glossary → related verses → poet biography → cultural notes
3. **Quiz themselves**: Model generates questions using graph: "Which poet wrote predominantly in coastal settings?" "Which themes characterize mountain landscapes?"
4. **Discover connections**: Visualization shows how concepts, poets, and verses interrelate

### Use Case 3: Cross-Cultural Comparative Literature

Researchers comparing Sangam Tamil to other traditions (Sanskrit, Classical Chinese, Greek) use the graph to:

1. **Align concepts across traditions**: Show that Sangam *tiṇai* parallels Aristotelian tragedy/comedy taxonomy
2. **Identify universal patterns**: Discover that separation/reunion narrative arc appears across cultures
3. **Trace influences**: Document how later Tamil poets responded to Sangam themes

## Conclusion

Knowledge graphs represent the optimal bridge between traditional humanities scholarship and computational AI. By representing literary knowledge as structured graphs—with explicit nodes, edges, and metadata—projects like Open Sangam can simultaneously:

1. **Preserve cultural heritage** with scholarly rigor
2. **Make it accessible** to broad audiences through interactive visualization and search
3. **Enable AI training** by providing high-quality structured data
4. **Support scholarship** by enabling complex queries across corpora
5. **Invite participation** by enabling community contribution and verification

The ancient Sangam poets created a legacy of linguistic precision and cultural depth. Through knowledge graphs, that legacy becomes not merely preserved but **active**—searchable, queryable, analyzable, and accessible to new generations.

The future of digital humanities lies not in trying to automate scholarship but in providing better tools for scholars—and knowledge graphs provide those tools.

---

## Further reading

These essays are perspective pieces, not empirical papers. Where they quote
numbers for classification accuracy, BLEU, and the like, treat them as
*illustrative* — worked examples of the shape of a result, not measurements
from a specific experiment. For grounding in the primary material and the
methods referenced, the following are genuine, checkable works:

- A. K. Ramanujan, *Poems of Love and War* (Columbia University Press, 1985) — translations from the Sangam anthologies.
- George L. Hart, *The Poems of Ancient Tamil: Their Milieu and Their Sanskrit Counterparts* (University of California Press, 1975).
- Kamil Zvelebil, *The Smile of Murugan: On Tamil Literature of South India* (Brill, 1973).
- *Tolkāppiyam* — the classical Tamil grammar, especially the *Poruḷatikāram* on the tiṇai conventions.
- U. V. Swaminatha Iyer's critical editions of the Sangam texts (the source of the colophon apparatus).
- Ashish Vaswani et al., "Attention Is All You Need," *NeurIPS* 2017 — the transformer architecture.
- Jacob Devlin et al., "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding," *NAACL* 2019.
- Open Sangam docs: `docs/architecture.md`, `docs/data-collection-plan.md`, `docs/editorial-style-guide.md`.

