---
title: "Neural Networks and Ancient Poetry: How AI Learns from the Sangam Corpus"
slug: neural-networks-ancient-poetry
date: 2026-07-07
author: "Open Sangam Project"
category: "AI & Language"
tags: ["Neural Networks", "Transformers", "Poetry", "Training Data"]
description: "What a language model does and does not learn when it is trained on the Sangam corpus."
status: essay
---
# Neural Networks and Ancient Poetry: How AI Learns from the Sangam Corpus

> **Editorial note.** This is an explanatory / perspective essay published
> alongside the Open Sangam corpus work. Quantitative figures are illustrative
> unless a specific source is cited; see *Further reading* at the end for
> genuine references.

## Abstract

The intersection of deep learning and classical literature reveals surprising convergences: transformer networks learn statistical patterns that echo the semantic hierarchies poets encoded 2,000 years ago. This article explores how neural language models, trained on the Sangam corpus, acquire understanding of Tamil linguistic structure, cultural concepts, and poetic conventions. We examine the mechanisms by which attention mechanisms discover tiṇai associations, embedding spaces cluster by semantic meaning, and beam search decoding generates novel verses that respect metrical constraints—all without explicit programming. The paper concludes that classical literature provides an ideal training ground for neural networks: semantically rich, grammatically consistent, and internally structured according to principles that align with how neural networks represent knowledge.

## Part I: How Neural Networks Process Language

### The Transformer Architecture

Modern language models (GPT, BERT, Llama, etc.) use the **transformer architecture**:

```
Input text: "அவணிமேவல் பொறியினாய்"
    ↓
[Tokenization: word → subword pieces]
    ↓
[Token embedding: token_id → dense vector]
    ↓
[Positional encoding: add position information]
    ↓
[Transformer encoder: 12-24 layers]
    ├─ Layer 1: Attention head 1,2,3,...,16
    ├─ Layer 2: Attention head 1,2,3,...,16
    ├─ ...
    ├─ Layer N: Attention head 1,2,3,...,16
    ├─ Feedforward network per layer
    └─ Residual connections + layer normalization
    ↓
[Output: contextualized embeddings for each token]
    ↓
[Classification head: predict next token / word sense / etc.]
```

**Key insight**: The transformer doesn't "understand" language like humans do. Instead, it:

1. **Embeds words** as vectors in high-dimensional space
2. **Computes attention**: Which other words should influence this word's meaning?
3. **Updates representations**: Iteratively refine word meanings based on context
4. **Predicts outputs**: Given context, generate likely next tokens

### What Attention Learns

The **attention mechanism** computes:

```
For each word w_i in context:
  1. Create query vector q_i from w_i
  2. Create key vector k_j from each word w_j
  3. Compute similarity scores: w_ij = q_i · k_j
  4. Normalize: alpha_ij = softmax(w_ij)
  5. Weight all values: output_i = sum_j(alpha_ij * v_j)

Result: output_i represents w_i with weighted attention to surrounding words
```

**Empirical observation**: Attention heads discover linguistically meaningful patterns:

- **Subject-verb agreement**: Head 1 attends from verb to subject
- **Semantic role**: Head 2 attends from verb to agent, patient, location
- **Coreference**: Head 3 links pronouns to referents
- **Tiṇai associations**: Head 4 (hypothetically) attends from content words to landscape indicators

## Part II: Training a Language Model on Sangam Corpus

### Pre-training Setup

```
Data:
- 2,066 verses from Sangam anthology
- ~3M tokens total
- Rich metadata: poet, tiṇai, meter, translation, cultural notes

Tokenization:
- Subword pieces (BPE or SentencePiece)
- Tamil script: each grapheme cluster → 1-3 subword tokens
- Vocabulary size: 8,000 tokens (for low-resource setting)

Model architecture (small):
- 6 transformer encoder layers (or 12 for larger model)
- 8 attention heads per layer
- 256-dimensional embeddings (hidden size)
- Total parameters: ~4M

Training objective (masked language modeling):
- 15% of tokens randomly masked
- Model predicts masked tokens from context
- Loss: cross-entropy between predicted and true token distribution
```

### Expected Learning Outcomes

After training on Sangam corpus, the model should learn:

**Level 1: Surface-level patterns**
- Morphological forms: Verb suffixes (-kkum, -um, -um-ending)
- Common phrases: "அவணிமேவல்" (lord of the earth)
- Metrical patterns: Syllable counts, stress patterns

**Level 2: Linguistic structure**
- Grammatical roles: Nominative (ne), accusative (-ai), instrumental (-aal)
- Semantic relationships: Subject-verb-object order, embeddings
- Case agreement: Noun and adjective endings must match

**Level 3: Semantic understanding**
- Word sense variation by context (peacock → beauty vs. pride)
- Semantic roles (agent, patient, instrument, location)
- Narrative coherence: How verses relate thematically

**Level 4: Cultural and poetic knowledge**
- Tiṇai associations: Mountain words → withdrawal, longing
- Karu-poruḷ mappings: Flora/fauna as semantic anchors
- Poetic device patterns: Alliteration, metaphor, kenning

### What Gets Learned is Not What We Program

Critical point: **The model is not programmed with grammatical rules or semantic dictionaries**. Instead:

1. **Initialization**: Random weights
2. **Training**: See millions of word-to-word transition probabilities
3. **Gradient descent**: Weights adjust to predict tokens accurately
4. **Emergence**: Complex linguistic knowledge emerges from statistical regularities

**Evidence**: BERT and GPT models learn linguistic phenomena not explicitly in training:

- Syntax: Models learn to parse grammatical structure without explicit parsing rules
- Semantics: Models learn word similarity without human-written semantic networks
- Coreference: Models learn pronoun resolution without being told "pronouns refer to earlier nouns"
- Tiṇai (potentially): Models could learn tiṇai associations by observing which words co-occur

## Part III: Evaluating What the Model Learned

### Evaluation 1: Intrinsic Linguistic Tasks

**Word Sense Disambiguation**:

```
Model input: "கொடுங்கோலன் [peacock] சாடித்தன"
              (The cruel king was like a peacock)

Tiṇai context: Puṟam (heroic) → peacock = pride, visibility, martial display

Model task: Predict sense of "peacock"
Model output: [0.85 for "pride_military", 0.10 for "beauty", 0.05 for "rarity"]

Evaluation: Compare to human annotators
Ground truth: "pride_military"
Prediction matches: ✓
```

**Part-of-Speech Tagging**:

```
Sangam text: "நன்றிணை" (good friendship)
              nan (good) + ri (friendship, NPC)

Model task: Tag each morpheme with POS
Model output: [adjective, noun]
Ground truth: [adjective, noun]
Matches: ✓ (expected accuracy: 85–92% on Sangam corpus)
```

**Named Entity Recognition**:

```
Text: "கரிகாலன் நெடுமரை"
       (Karikala, a Chola king)

Model task: Recognize "கரிகாலன்" as person, king
Model task: Recognize "நெடுமரை" as epithet
Evaluation: F1 score 0.72 (good for low-resource setting)
```

### Evaluation 2: Downstream Tasks

**Machine Translation (Tamil → English)**:

```
Input: "அவணிமேவல் பொறியினாய் மாருதிறு"
Ground truth: "O skillful lord of the land with the prowess of Vayu"

Model output: "O you of mighty skill who rules the earth,
               like the wind's force"

Evaluation: BLEU score 0.28, Human evaluation: "Captures meaning, 
            poetic style acceptable" (acceptable for low-resource)
```

**Semantic Similarity**:

```
Compute embedding similarity between verse pairs:

Verse A: "Separation in mountain land"
Verse B: "Longing in forest landscape"
Similarity: 0.82 (high, because both express separation/longing)

Verse C: "Union in cultivated fields"
Similarity to A: 0.21 (low, opposite emotional state)

Evaluation: Compare to human-judged similarity
Correlation (Spearman): 0.68 (indicates model understands semantic content)
```

**Tiṇai Classification** (the ultimate test):

```
Model input: Unlabeled verse from Sangam corpus
Model task: Predict tiṇai (5-way classification for akam tiṇai)

Example:
Text: "குறிஞ்சியின் மேல் நிற்கும் பணிலி மேல் இமயம்"
      (On the mountains where the eagle perches...)

Model prediction distribution:
  - Kuṟiñci: 0.82 ✓ (correct)
  - Mullai: 0.10
  - Marutam: 0.05
  - Neytal: 0.02
  - Pālai: 0.01

Evaluation accuracy: Expected 65–78% (if model truly learns tiṇai structure)
Compared to:
  - Random baseline: 20%
  - Linguistic baseline (human without domain knowledge): 45%
  - Domain expert: 95%+
```

## Part IV: What the Model's Attention Learns

### Analyzing Attention Heads

Using visualization techniques (attention rollout, head attention), we can examine which attention heads specialize:

**Head 1 (Subject-Verb Agreement)**:
```
Sentence: "புரவி பொழுதொடு மரங்கள் சினம் உறூஉம்"
          (The horses at evening, the trees grow angry)

Attention visualization:
- "புரவி" (horse) → attends to "சினம்" (grow angry)
- "மரங்கள்" (trees) → attends to "சினம்"

Interpretation: Head learning subject-verb relationships
```

**Head 4 (Semantic Role)**:
```
Verse: "எறிதுநறு நுணங்கலை மயிலொ"
       (The fragrant peacock throws its call)

Attention visualization:
- "தி" (perfume/fragrance/adjective) → attends to "மயில்" (peacock)
- "எறி" (throw/emit) → attends to "நுணங்கல்" (call)

Interpretation: Head learning which adjectives modify which nouns
```

**Hypothetical Head X (Tiṇai Association)**:
```
If the model truly learned tiṇai structure, we'd expect:

Words like "பணிலி" (eagle), "குறிஞ்சி" (mountain), "தனிமை" (isolation):
- All attend to each other strongly
- Share high cosine similarity in embedding space
- Activate together in prediction

Verses containing these words: 
- Model predicts kuṟiñci with high confidence
- Attention weights concentrate on tiṇai-associated words

This would be evidence that the model has internalized the tiṇai framework.
```

### Embedding Space Analysis

Project model embeddings into 2D space (using t-SNE or UMAP):

```
Expected clusters in embedding space:

             [kuṟiñci words]
                   •
          •  (mountain, peacock, eagles, longing)
               •    •
                   
    [mullai words]          [marutam words]
    • (forest,                (field, cranes,
    deer, night)              union, day)
    •    •                  •  •
    
                          [neytal words]
                          (sea, fishermen,
                           lament, tide)
                           •   •
                          
[pālai words]
(wasteland,
vultures, despair)
```

If the model has truly learned tiṇai structure, we should see:

1. **Clear clustering**: Words native to each tiṇai cluster together
2. **Hierarchical structure**: Within-cluster similarity higher than between-cluster
3. **Semantic smoothness**: Similar meanings nearby (longing near separation), opposite meanings far (union near longing less than union near despair)

## Part V: Generating New Verses

### Conditional Verse Generation

Once trained, the model can generate new verses conditional on:

```
Model input (conditional prompt):
- Tiṇai: Kuṟiñci (mountain)
- Theme: Separation, longing
- Meter: Áciriyappá (32 syllables)
- Poet style: Kacciyappan's direct, assertive tone

Generation process (beam search with 5 beams):

Beam 1: "பணிலி மேல் குறிஞ்சியிற் ..."
Beam 2: "மலையுயர் நின்ற பாவ..."
Beam 3: "தனிமையில் நிற்கும் தலை..."
Beam 4: "குறிஞ்சிபூ வாடிய..."
Beam 5: "மெலிந்து போ கும் மாது..."

Model scores each based on:
1. Likelihood (how probable given training distribution)
2. Meter validity (must be exactly 32 syllables)
3. Semantic coherence (thematic consistency with condition)
4. Lexical diversity (avoid repetition)

Final output (best beam):
"குறிஞ்சிமேல் பணிலி பாடிய
தனிமையின் மாது நோடிய
கண்ணீர் ஆறு கரையுண்கிய
மாயை யாய் அவ் அவளே"

(On the mountain where the eagle cries,
the maiden wanders in lonely despair,
her tears flowing like rivers,
all her hope vanished into illusion)
```

### Quality Assessment

```
Human evaluators score generated verses on:

1. Grammaticality: Is it valid Tamil? (1–5 scale)
   Expected model performance: 4.2/5
   
2. Coherence: Does it make semantic sense? (1–5)
   Expected model performance: 4.0/5
   
3. Tiṇai fitness: Does it match the specified tiṇai? (1–5)
   Expected model performance: 3.8/5
   
4. Poetic quality: Does it have literary merit? (1–5)
   Expected model performance: 2.5/5
   
5. Meter accuracy: Perfect meter adherence? (0–1)
   Expected model performance: 0.8 (80% of verses metrically perfect)

Interpretation:
- High scores on 1–3 indicate the model has learned linguistic structure
- Lower score on 4 indicates current models cannot match human poets
- Score on 5 indicates model can respect hard constraints (meter) ~80% of time
```

## Part VI: Why Classical Corpora Outperform Web Corpora

### Comparative Training

Train identical model architecture on three data sources:

**Setup A**: Sangam corpus only (3M tokens)
**Setup B**: Web Tamil (1B tokens from web archives)
**Setup C**: Sangam + Web (1B + 3M tokens, weighted blend)

Results on downstream tasks:

| Task | Setup A | Setup B | Setup C |
|------|---------|---------|---------|
| **Tiṇai Classification** | 74% | 52% | 78% |
| **POS Tagging** | 91% | 81% | 93% |
| **NER (F1)** | 0.68 | 0.55 | 0.72 |
| **MT BLEU** | 22 | 16 | 25 |
| **Semantic Sim (Spearman)** | 0.71 | 0.48 | 0.76 |

**Key finding**: Despite Setup A having 330× fewer tokens than Setup B, it outperforms on linguistically complex tasks. Setup C (combined) performs best.

### Why Quality Matters

Classical corpora have three properties missing from web data:

1. **No noise**: Every token in Sangam was consciously composed; web has typos, grammatical errors, spam
2. **Semantic consistency**: All 2,066 verses explore human themes within cultural framework; web randomly mixes domains
3. **Linguistic standardization**: Sangam uses standardized grammar and vocabulary; web mixes dialects, slang, neologisms
4. **Rich metadata**: Every verse labeled with tiṇai, meter, poet; web rarely has such annotation

Models trained on clean, semantically consistent, well-annotated data learn more robust patterns.

## Part VII: The Consciousness Question

Does a language model trained on Sangam corpus "understand" it?

### The Functionalist Perspective

Functionalists argue: **If a system behaves as if it understands (passes practical tests), it understands.**

- Model can classify tiṇai with 74% accuracy → understands tiṇai structure
- Model can generate grammatical verses → understands Tamil grammar
- Model's attention aligns with linguistic theory → understands linguistic roles
- Model's embeddings cluster semantically → understands semantic similarity

**Conclusion**: By this standard, the model has a form of understanding.

### The Skeptical Perspective

Skeptics argue: **Statistical pattern matching ≠ understanding.**

- Model has no subjective experience
- Cannot explain *why* a verse is separated (no conscious reasoning)
- Lacks embodied knowledge (never experienced mountain withdrawal)
- Trained on Sangam, but Sangam was written by humans with lived experience

**Conclusion**: The model's "understanding" is fundamentally different from human understanding.

### A Nuanced View

The truth likely lies between:

- Models acquire **statistical understanding** (patterns in data)
- Humans acquire **experiential understanding** (lived experience)
- Overlap exists: Both can explain tiṇai meanings, classify verses, generate coherent text
- Gaps exist: Humans understand *why* separation hurts; models don't

For practical purposes (translation, classification, knowledge extraction), statistical understanding suffices. For philosophical understanding, human knowledge remains necessary.

## Conclusion

Neural networks trained on the Sangam corpus acquire knowledge of Tamil language structure, poetic conventions, and cultural concepts. This knowledge emerges from statistical learning, not explicit programming—yet it aligns surprisingly well with how human scholars understand the same corpus.

The Sangam tradition, as training data, offers AI systems exactly what they need: high-quality, semantically rich, internally structured information. The ancient poets' discipline—the requirement that every verse respect metrical constraints, maintain semantic coherence, and express ideas through a shared cultural framework—creates a learning environment where models acquire robust understanding.

Perhaps it is not surprising that neural networks, trained on humanity's oldest carefully curated literary traditions, learn to represent human meaning. The Sangam corpus is, in a real sense, an encoding of how Tamil speakers organized their understanding of language and culture. Neural networks, in learning from this corpus, are in the business of decoding that understanding—a task for which classical literature is ideally suited.

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

