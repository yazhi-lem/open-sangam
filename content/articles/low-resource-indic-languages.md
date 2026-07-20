---
title: "Building AI Models for Low-Resource Indic Languages: Lessons from Open Sangam"
slug: low-resource-indic-languages
date: 2026-06-16
author: "Open Sangam Project"
category: "AI & Language"
tags: ["Low-Resource NLP", "Indic Languages", "Sanskrit", "Telugu", "Kannada"]
description: "Why classical corpora are an asset for building AI in low-resource Indic languages, and how the Open Sangam method generalises."
status: essay
---
# Building AI Models for Low-Resource Indic Languages: Lessons from Open Sangam

> **Editorial note.** This is an explanatory / perspective essay published
> alongside the Open Sangam corpus work. Quantitative figures are illustrative
> unless a specific source is cited; see *Further reading* at the end for
> genuine references.

## Abstract

India's 22 constitutionally recognized languages, spoken by 1.4 billion people, remain severely under-resourced in computational linguistics compared to English. The median Indic language has 100–500 times fewer digital tokens than English, limiting the performance of neural language models. Open Sangam demonstrates a pathway forward: by combining high-quality classical corpora, multi-layered knowledge graphs, and community contribution, projects can build robust language models even in low-resource settings. This article surveys the landscape of Indic-language NLP, identifies bottlenecks, and proposes how Open Sangam's methodology can extend to all of India's linguistic traditions.

## Part I: The Low-Resource Crisis in Indic NLP

### Scale of the Problem

| Language | Native Speakers | Estimated Digital Tokens | Tokens per Speaker |
|----------|-----------------|--------------------------|-------------------|
| English | 1.5B (global) | 100B+ | ~67 |
| Mandarin | 1.1B | 50B+ | ~45 |
| Spanish | 600M | 50B+ | ~83 |
| Hindi | 345M | 1–5B | ~0.003–0.015 |
| Tamil | 80M | 500M–1B | ~0.006–0.0125 |
| Telugu | 84M | 300M–500M | ~0.0036–0.006 |
| Kannada | 54M | 100M–300M | ~0.0019–0.0056 |
| Malayalam | 37M | 50M–200M | ~0.0014–0.0054 |

**Key observation**: While Hindi and Tamil have hundreds of millions of speakers, they have 10,000–100,000 times fewer digital tokens than English. This disparity stems not from linguistic community size but from:

1. **Historical factors**: Colonial digitization favored English; post-independence digitization concentrated on Hindi
2. **Infrastructure gaps**: Lower internet penetration in rural India (where most Indic speakers live)
3. **Economic incentives**: Tech companies optimized for English-speaking markets
4. **Script and encoding**: Legacy Indic script encoding incompatibilities limited early text digitization

### Consequences for AI

Large language models (LLMs) exhibit a scaling law:

```
Model performance ∝ log(training_tokens)
```

Doubling training data improves performance by ~3–5% (depending on task). Conversely, reducing training data by 100× reduces performance by 15–30% across standard NLP benchmarks.

Current Indic-language models:

- **Named Entity Recognition**: F1 scores of 55–70% (vs. 92% for English)
- **Machine Translation**: BLEU scores of 15–25% (vs. 30–45% for high-resource pairs)
- **Question Answering**: Exact match accuracy of 10–30% (vs. 80%+ for English)
- **Text Summarization**: ROUGE scores 20–40% lower than English baselines

This performance gap directly correlates with training data scarcity.

### Why Current Solutions Fail

**Approach 1: Transfer Learning from High-Resource Languages**

Strategy: Train a model on English, then fine-tune on the target Indic language.

Limitations:
- English and Indic languages differ fundamentally (morphology, syntax, writing systems)
- English captures few Indic-specific concepts (eg. tiṇai landscapes, Indian cultural norms)
- Fine-tuning on scarce Indic data can catastrophically forget English knowledge while not acquiring robust Indic patterns

**Approach 2: Machine Translation Pivoting**

Strategy: Translate Indic text to English, process in English, translate back.

Limitations:
- Introduces cumulative translation errors (each translation loses ~15–30% semantic fidelity)
- Loses Indic-specific cultural and linguistic nuance
- Prohibitively expensive at scale

**Approach 3: Multilingual Models**

Strategy: Train a single model on many languages simultaneously (mBERT, XLM-R).

Limitations:
- Multilingual models sacrifice per-language performance (Indic languages perform 5–15% worse in multilingual settings)
- Still limited by aggregate corpus size; adding Indic languages dilutes model capacity
- Struggle with language-specific phenomena (eg. Tamil's complex case system)

**What's needed**: Domain-specific, language-specific approaches that leverage *quality* (not quantity) of data.

## Part II: Classical Corpora as the Solution

### Why Classical Literature Changes the Game

Unlike web-sourced data, classical corpora offer:

| Property | Web Text | Classical Literature |
|----------|----------|----------------------|
| **Linguistic quality** | Mixed; grammatically incorrect common | Grammatically well-formed, metrically constrained |
| **Metadata richness** | Minimal; source URL only | Author, composition date, theme, meter, colophon |
| **Curation** | Algorithmic; includes spam, duplicates | Scholarly; centuries of editorial refinement |
| **Semantic consistency** | Noisy; topic drift across sentences | Coherent domain; focused exploration of human themes |
| **Availability** | Often behind paywalls / copyright | Public domain; digitization permissible |

A model trained on 5M tokens of classical literature often outperforms one trained on 50M tokens of web text, because each classical token carries more linguistic information.

### Classical Corpora of Indic Languages

**Tamil**:
- **Sangam literature**: 2,066 verses (3M tokens)
- **Silappatikaram**: ~5,700 lines of narrative poetry
- **Manimekalai**: ~6,000 lines
- **Total classical corpus**: ~50M tokens

**Sanskrit**:
- **Rigveda**: 10,552 verses (1M tokens)
- **Vedic literature**: 50,000+ verses total
- **Classical dramas**: Kalidasa, Bhasa, Ashvaghosha
- **Total classical corpus**: ~200M tokens

**Telugu**:
- **Satakas**: 100+ poets, 50,000+ verses
- **Classical dramas**: Nannaya, Tikkana
- **Puranic texts**: Versions of Sanskrit epics in Telugu
- **Total classical corpus**: ~100M tokens

**Kannada**:
- **Vachanas**: 20,000 devotional verses
- **Champu literature**: Mixed prose-poetry narratives
- **Classical poetry**: Court poets of medieval kingdoms
- **Total classical corpus**: ~50M tokens

**Malayalam**:
- **Manipravalam texts**: Medieval Malayalam-Sanskrit blends
- **Ezuthachan's works**: Reformulation of Sanskrit epics
- **Classical devotional literature**: Saint poets
- **Total classical corpus**: ~40M tokens

Across Indic languages, hundreds of millions of tokens of classical literature exist, largely digitized by heritage organizations but **not yet structured for AI training**.

## Part III: Open Sangam's Methodology

### The Four-Pillar Approach

Open Sangam demonstrates a replicable methodology:

#### Pillar 1: Data Normalization to Schema

Raw text → structured JSON with explicit schema:

```json
{
  "poem_id": "purananuru",
  "verse_id": "purn_0192",
  "verse_number": 192,
  "verse_text_tamil": "...",
  "lines": [
    {
      "line_number": 1,
      "line_text": "...",
      "words": [
        {
          "word_id": "purn_0192_1_1",
          "text": "நன்",
          "root": "நன்",
          "part_of_speech": "adjective",
          "morphological_analysis": "nan (good)",
          "meaning": "good, beneficial"
        }
      ]
    }
  ],
  "metadata": {
    "poet": "Kacciyappan",
    "tiṇai": "puṟam",
    "theme": "praise of the Chola king",
    "meter": "āciriyappā",
    "source": "sangathamizh.com/purananuru/192"
  }
}
```

**Benefits**:
- Language models can use structured metadata to improve predictions
- Morphological analysis enables better tokenization and stemming
- Standardized schema enables downstream tooling (glossaries, graphs)

#### Pillar 2: Knowledge Graph Construction

From normalized data, extract a knowledge graph:

**Nodes**: Tiṇai, Poem, Poet, Karu (cultural entity)
**Edges**: COMPOSED, WROTE_IN, ATTESTS (weighted by frequency)

```
Poet: Kacciyappan
  ├── COMPOSED → Purananuru (poem)
  │     ├── HAS_TIṆAI → Puṟam (heroic)
  │     │     ├── ATTESTS → Chola Dynasty
  │     │     ├── ATTESTS → Warrior Ethics
  │     │     └── ATTESTS → Martial Valor
  └── WROTE_IN → Puṟam
```

**Benefits for AI**:
- Provides semantic structure to the corpus
- Enables knowledge graph embeddings (TransE, DistMult)
- Supports semantic search ("Find all verses about X theme")
- Grounds language model training in structured knowledge

#### Pillar 3: Multi-Layered Translation

For each verse, provide:

1. **Original**: Sangam Tamil
2. **Modern Tamil Prose** (*Urai*): Contemporary paraphrase
3. **English Translation**: Bridge to global audience
4. **AI-Generated or Scholar-Verified**: Mark authenticity status

```
Original: "அவணிமேவல் பொறியினாய்..."
Urai: "நிலத்தை ஆளுகின்ற திறமையுள்ள..."
English: "O you who possess the skill to rule the land..."
Status: verified (scholar-reviewed)
```

**Benefits for Language Models**:
- Training on source + target enables translation models
- Comparing model-generated vs. human translation shows where understanding breaks down
- Multi-representation learning improves model robustness

#### Pillar 4: Community Contribution Layer

Structured mechanisms for scholars and community members to:

- **Verify translations**: Confirm AI-generated translations are accurate
- **Add commentary**: Explain cultural references and poetic devices
- **Expand metadata**: Enrich poems with additional colophon information
- **Suggest corrections**: Report textual errors or variant readings

Benefits for AI:
- Creates feedback loop to improve models
- Builds community investment in the resource
- Scales verification beyond individual researchers

## Part IV: Scaling Open Sangam Methodology

### Template for Sanskrit

**Rigveda Reconstruction Project**:

1. **Digitize and normalize**: Rigveda's 10,552 verses + commentaries into schema
2. **Graph construction**: Hymn → deities → ritual contexts → weapons/objects
3. **Translation layers**: Original Vedic Sanskrit + Classical Sanskrit paraphrases + English
4. **Community verification**: Sanskritic scholars verify translations and cultural notes

Expected outcomes:
- 50M-token Sanskrit corpus with rich metadata
- Language model understanding Vedic vocabulary and ritual concepts
- Foundation for translating Upanishads, Puranas, dramas

### Template for Telugu

**Telegu Classical Poetry Archive**:

1. **Collect sataka corpus**: 50,000+ verses from Telugu poets (Balladeva, Tenali Rama, etc.)
2. **Normalize**: Structure with author, date, theme, meter
3. **Knowledge graph**: Poets → literary movements → cultural concepts
4. **Multi-layer translation**: Classical Telugu → Modern Telugu → English
5. **Integration with Open Sangam**: Cross-link similar themes across Tamil-Telugu-Sanskrit

### Template for Kannada

**Kannada Vachana Digital Archive**:

1. **Collect vachana corpus**: 20,000 verses + variant readings
2. **Normalize**: Author (saint-poet), spiritual theme, philosophical position
3. **Knowledge graph**: Saints → spiritual movements → philosophical concepts
4. **Translation**: Original Kannada → Modern Kannada → English
5. **Commentary layer**: Existing scholarly commentaries digitized and linked

## Part V: Impact on Language Model Performance

### Hypothetical Performance Improvement

Suppose we build language models on three different training setups:

**Setup 1**: Web-only Tamil (1B tokens from Common Crawl, Wikipedia, web archives)
- Named Entity Recognition F1: 62%
- Machine Translation BLEU: 18
- Question Answering EM: 28%

**Setup 2**: Web + Classical Corpus (1B web + 100M classical Tamil + Sanskrit)
- NER F1: 71% (+14%)
- MT BLEU: 24 (+33%)
- QA EM: 35% (+25%)

**Setup 3**: Classical-focused (100M classical Tamil + Sanskrit + enhanced metadata)
- NER F1: 68% (+10% vs. web-only, accounting for smaller dataset)
- MT BLEU: 22 (+22%)
- QA EM: 32% (+14%)

**Key insight**: Classical corpora, despite smaller size, improve model performance on linguistically complex tasks (morphology, semantic understanding) by providing high-quality, semantically rich training data.

### Why Quality Matters More Than Quantity

Modern language models exhibit an interesting phenomenon: **beyond a certain corpus size, quality matters more than quantity for downstream task performance**.

This is because:

1. **Models can memorize noise**: A model trained on 10B tokens of web text learns 50M+ spurious associations (typos, grammatical errors, biased phrasings)

2. **Classical corpora avoid noise**: Each token in a classical text was consciously crafted; models learn robust patterns, not noise

3. **Downstream tasks require robust patterns**: NER, translation, question answering benefit more from learning robust linguistic patterns than from memorizing spurious associations

Empirically:
- A model trained on 100M tokens of high-quality literary text often outperforms one trained on 10B tokens of web text on downstream tasks requiring linguistic understanding (morphology, semantic role labeling, coreference resolution)

This finding suggests **the way forward for Indic languages is not to collect more web data (which is expensive and of questionable quality) but to digitize, structure, and leverage classical corpora (which exist, are high-quality, and are public domain)**.

## Part VI: Challenges and Mitigation Strategies

### Challenge 1: Annotation Cost

**Problem**: Constructing knowledge graphs and multi-layer translations requires expert labor.

**Mitigation**:
- **Crowdsourcing + expert verification**: Use crowd platforms (Amazon Mechanical Turk, local platforms) for initial translation drafts, then expert verification
- **AI-assisted annotation**: Use existing AI models to generate draft translations and metadata, reducing expert burden to verification only
- **Phased rollout**: Start with high-impact subsets (most famous verses, most studied poets)

### Challenge 2: Variant Readings

**Problem**: Classical texts exist in multiple manuscript traditions. Which version is authoritative?

**Mitigation**:
- **Represent all variants**: Store alternative readings in schema
- **Cite sources**: Every reading links to its source manuscript or edition
- **Let models learn**: Train models on all variants, then analyze how choice affects predictions
- **Community curation**: Engage scholarly community in deciding "canonical" versions for each text

### Challenge 3: Language Evolution

**Problem**: Classical language differs from modern language. Models trained on classical corpora may not generalize to contemporary text.

**Mitigation**:
- **Joint training**: Combine classical + contemporary corpora
- **Domain adaptation**: Use fine-tuning techniques to adapt classical-trained models to modern tasks
- **Explicit evolution annotation**: Link classical words to modern equivalents
- **Separate specialized models**: Build domain-specific models (classical Tamil NLP system, modern Tamil NLP system) rather than forcing one model to handle both

### Challenge 4: Script and Encoding

**Problem**: Legacy Indic script encoding (ISCII) incompatibilities with modern Unicode caused historical data loss.

**Mitigation**:
- **Systematic re-digitization**: For texts digitized in legacy encodings, re-scan from original documents and re-digitize in Unicode
- **Encoding conversion tools**: Build robust tools to convert legacy encodings to modern Unicode (with manual verification)
- **Future-proof storage**: Store all data in UTF-8 Unicode with explicit script tagging

## Part VII: Global Impact

### Replication Across Language Communities

The Open Sangam methodology is deliberately language-agnostic. It can be applied to:

**European Languages**:
- Old English (Beowulf, Anglo-Saxon Chronicle)
- Old Norse (Eddas, sagas)
- Middle French (Arthurian romances)
- Medieval Latin

**Asian Languages**:
- Classical Chinese (I Ching, Book of Poetry)
- Classical Japanese (Tale of Genji, No drama)
- Classical Arabic (Pre-Islamic poetry, Quran commentary)
- Classical Persian (Shahnameh, Rubaiyat)

**African and Indigenous Languages**:
- Ge'ez (Aksumite literature)
- Amharic classical literature
- Indigenous American languages (where texts exist)

Each tradition has classical corpora that could be digitized, structured, and used to improve modern language models. Open Sangam provides a template.

### Building Multilingual Indic Models

Beyond single-language models, Open Sangam enables **cross-lingual transfer**:

If we build classical corpora for Sanskrit, Tamil, Telugu, Kannada, and Malayalam:

1. **Common semantic frames**: Many concepts (dharma, bhakti, rasa) appear across languages
2. **Shared poetry traditions**: Cross-cultural influences (Tamil poets influenced by Sanskrit, Telugu by Tamil)
3. **Morphological similarities**: Indic languages share grammatical features

A model trained on all five classical corpora + metadata linking cross-linguistic concepts would:

- Better understand low-resource language through high-resource language transfer
- Identify universal patterns in Indic linguistic tradition
- Enable cross-lingual question answering ("Answer this Tamil question using Telugu sources")

## Part VIII: Economic and Social Implications

### Democratizing AI Development

Current AI development concentrates computational resources in English, Mandarin, Spanish. This creates a feedback loop:

```
More data in English
    ↓
Better English models
    ↓
More incentive for English-language content creation
    ↓
More English data
    ↓
[repeat]
```

Result: Linguistic diversity decreases; endangered languages become even more marginalized.

By building high-performance models for Indic languages using classical corpora, projects like Open Sangam **break this cycle**:

1. Indic language models become competitive with high-resource languages
2. More incentive for content creation in Indic languages
3. More data available for training
4. Virtuous cycle of improving model performance

### Economic Impact for Indian Language Communities

Better language models enable:

- **Educational technology**: Adaptive learning systems in Tamil, Telugu, Kannada, etc.
- **Accessibility**: Voice assistants, text-to-speech, speech recognition in Indic languages
- **E-commerce**: Better product search, recommendation systems, customer service in Indic languages
- **Digital content creation**: Translation tools, content generation for creators using Indic languages

The Indian language internet economy—currently ~$5B annually—could grow to $50B+ if language AI models reached parity with English.

### Reclaiming Intellectual Sovereignty

India's classical traditions were colonized intellectually—studied through Western academic frameworks, owned by Western institutions. Better Indic-language models enable:

- **Indigenous research**: Indian researchers studying Indian classical texts using Indian tools
- **Endogenous knowledge systems**: AI trained on Indic knowledge systems (Ayurveda, philosophy, mathematics) rather than Western knowledge systems only
- **Soft power**: Indic cultural heritage becomes a global public good, positioning India as a knowledge provider globally

## Conclusion: The Path Forward

The low-resource crisis in Indic NLP is not unsolvable; it requires recognizing that **classical corpora are assets, not historical curiosities**. India possesses thousands of years of high-quality, carefully curated literary heritage. By systematically digitizing, structuring, and leveraging these corpora, AI researchers can build language models that rival high-resource languages in performance while embodying cultural depth and nuance.

Open Sangam demonstrates this path. By extending its methodology—data normalization, knowledge graphs, multi-layer translation, community contribution—to other Indic languages and classical traditions, India can:

1. **Achieve parity with high-resource language models**
2. **Build AI systems that understand Indic cultural concepts authentically**
3. **Create economic incentives for Indic language content creation**
4. **Democratize AI development globally** by proving low-resource language modeling is viable

The ancient Sangam poets could not have imagined their verses would enable machine learning 2,000 years hence. Yet here we are: the past becomes the foundation for the future.

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

