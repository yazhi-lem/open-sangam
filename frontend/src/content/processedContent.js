/**
 * processedContent.js — Content normalisation, validation, and layer processing.
 *
 * The canonical corpus (data/schema/verse_schema.json, v2) is FLAT: a record is
 * `{ id, poem, number, sangamTamil, urai, english, lines[], source, verified }`.
 * Older exports and hand-entered scholar JSON sometimes differ slightly, so this
 * module is the single place that adapts an input record to the canonical shape
 * before the reader or an index touches it.
 *
 * Consumers:
 *   - frontend/src/components/reader/Reader.jsx  (buildGlossaryMap, extractGlossaryEntries)
 *   - future indexers / search (verseSummary, processPoemData)
 *
 * Keep this module pure (no React, no DOM) so it can be unit-tested with `node --test`.
 */

import { normalizeLayer, visibleLayers, layerStatus, hasGloss } from '../data/readerLayers.js'

// ── Constants ─────────────────────────────────────────────────────────────

/** Fields the v2 schema requires on every record. */
export const REQUIRED_FIELDS = ['id', 'poem', 'sangamTamil', 'lines', 'source', 'verified']

export const TEXT_LAYER_IDS = [
  'original',
  'transliteration',
  'urai',
  'english',
  'glossary',
  'notes',
  'poetics',
  'context',
  'voice',
]

export const VERB_STATUS = {
  VALID: 'valid',
  MISSING_ID: 'missing_id',
  MISSING_POEM: 'missing_poem',
  MISSING_ORIGINAL: 'missing_original',
  EMPTY_LAYERS: 'empty_layers',
}

// Akshara-safe: keep Tamil block, combining marks and Latin letters; drop punctuation.
const CLEAN_FORM_RE = /[^\u0B80-\u0BFFa-zA-Z]/g

// ── Normalisation ─────────────────────────────────────────────────────────

/** Small deterministic id generator so this stays pure (no crypto/DOM). */
function fallbackId(seed) {
  return `anon-${String(seed)}`
}

/**
 * Normalise a single verse/section record into the canonical v2 shape.
 *
 * Handles both flat records (`sangamTamil`, `urai`, …) and nested ones
 * (`layers.original.text`) so imported data from any source converges.
 *
 * @param {Object} raw  — incoming record from any source
 * @param {number} [index] — used only to build a deterministic fallback id
 * @returns {Object|null} canonical verse, or null if the input is not an object
 */
export function normaliseVerse(raw, index = 0) {
  if (!raw || typeof raw !== 'object') return null

  const layers = raw.layers ?? {}
  const pick = (layerId, ...fallbacks) =>
    layers[layerId]?.text ?? fallbacks.find((v) => v != null && v !== '') ?? ''

  const id = raw.id ?? raw.sectionNumber ?? raw.number ?? fallbackId(index)

  return {
    // Schema identity
    id: String(id),
    poem: raw.poem ?? null,
    number: raw.number ?? raw.sectionNumber ?? null,
    sectionNumber: raw.sectionNumber ?? null,
    lineStart: raw.lineStart ?? null,
    lineEnd: raw.lineEnd ?? null,
    title: raw.title ?? raw.heading ?? raw.poemTitle ?? null,
    poet: raw.poet ?? null,
    tinai: raw.tinai ?? null,

    // Text fields (flat-first, then nested layers)
    sangamTamil: pick('original', raw.sangamTamil, raw.original),
    transliteration: pick('transliteration', raw.transliteration),
    urai: pick('urai', raw.urai),
    yazhi_urai: raw.yazhi_urai ?? '',
    english: pick('english', raw.english),
    poetics: pick('poetics', raw.poetics),
    audioUrl: raw.audioUrl ?? null,

    // Rich data
    culturalNotes: Array.isArray(raw.culturalNotes) ? raw.culturalNotes : [],
    lines: normaliseLines(raw.lines),

    // Verification / provenance (schema fields are preserved, not invented)
    verified: raw.verified === true,
    uraiMeta: raw.uraiMeta ?? raw.yazhi_uraiMeta ?? null,
    englishMeta: raw.englishMeta ?? null,
    etymologyMeta: raw.etymologyMeta ?? null,
    source: raw.source ?? null,
  }
}

function normaliseLines(lines) {
  if (!Array.isArray(lines)) return []
  return lines.map((line) => ({
    number: line?.number ?? null,
    text: line?.text ?? line?.original ?? '',
    words: Array.isArray(line?.words)
      ? line.words.map((w) => ({
          form: w?.form ?? w?.text ?? '',
          gloss: w?.gloss ?? null,
          root: w?.root ?? null,
          etymology: w?.etymology ?? null,
          urichol: w?.urichol ?? null,
        }))
      : [],
  }))
}

// ── Validation ────────────────────────────────────────────────────────────

/**
 * Validate a single normalised record against the v2 required fields.
 *
 * @param {Object} verse — normalised verse
 * @returns {{ status: string, messages: string[] }}
 */
export function validateRecord(verse) {
  const messages = []

  if (!verse?.id) {
    messages.push('Missing id')
    return { status: VERB_STATUS.MISSING_ID, messages }
  }
  if (!verse.poem) {
    messages.push('Missing poem id')
    return { status: VERB_STATUS.MISSING_POEM, messages }
  }

  if (!String(verse.sangamTamil ?? '').trim()) {
    messages.push('Missing original Tamil text')
    return { status: VERB_STATUS.MISSING_ORIGINAL, messages }
  }

  const hasAnyLayer = TEXT_LAYER_IDS.some((id) => {
    if (id === 'original') return true
    const value = verse[id]
    return value && (Array.isArray(value) ? value.length > 0 : String(value).trim().length > 0)
  })
  if (!hasAnyLayer) {
    messages.push('No secondary layers (urai, english, glossary, etc.)')
    return { status: VERB_STATUS.EMPTY_LAYERS, messages }
  }

  return { status: VERB_STATUS.VALID, messages }
}

// ── Batch processing ──────────────────────────────────────────────────────

/**
 * Process an entire poem's worth of raw records.
 *
 * @param {Object[]} rawSections
 * @returns {{ sections: Object[], errors: Object[], stats: Object }}
 */
export function processPoemData(rawSections) {
  if (!Array.isArray(rawSections)) {
    return {
      sections: [],
      errors: [{ index: 0, message: 'Input is not an array' }],
      stats: { total: 0, valid: 0, errors: 1 },
    }
  }

  const sections = []
  const errors = []

  rawSections.forEach((raw, index) => {
    const normalised = normaliseVerse(raw, index)
    if (!normalised) {
      errors.push({ index, id: raw?.id ?? '?', message: 'Could not normalise record' })
      return
    }
    const { status, messages } = validateRecord(normalised)
    if (status !== VERB_STATUS.VALID) {
      errors.push({ index, id: normalised.id, status, messages })
    }
    // Keep the record even if incomplete: the reader shows a draft badge for it.
    sections.push(normalised)
  })

  return {
    sections,
    errors,
    stats: { total: rawSections.length, valid: sections.length - errors.length, errors: errors.length },
  }
}

// ── Utilities used by the reader ──────────────────────────────────────────

/** Build a word → gloss lookup Map from a verse (or a raw section). */
export function buildGlossaryMap(verse) {
  const map = new Map()
  if (!verse?.lines) return map
  for (const line of verse.lines) {
    if (!line?.words) continue
    for (const w of line.words) {
      if (!w?.form) continue
      const clean = String(w.form).replace(CLEAN_FORM_RE, '').trim()
      if (clean && !map.has(clean)) map.set(clean, w)
    }
  }
  return map
}

/** Glossary entries that actually carry gloss data, capped at `limit`. */
export function extractGlossaryEntries(verse, limit = 60) {
  return [...buildGlossaryMap(verse).values()].filter(hasGloss).slice(0, limit)
}

/** Set of layer ids that have been scholar-verified for this verse. */
export function verifiedLayers(verse) {
  if (!verse) return new Set()
  const result = new Set(['original'])
  if (verse.verified === true) {
    if (String(verse.urai ?? '').trim()) result.add('urai')
    if (String(verse.english ?? '').trim()) result.add('english')
  }
  return result
}

/** Compact summary for indexing, search and SEO. */
export function verseSummary(verse) {
  if (!verse) return null
  const text = String(verse.sangamTamil ?? '')
  return {
    id: verse.id,
    poem: verse.poem,
    title: verse.title,
    poet: verse.poet,
    tinai: verse.tinai,
    previewTamil: text.slice(0, 200),
    hasUrai: Boolean(String(verse.urai ?? '').trim()),
    hasEnglish: Boolean(String(verse.english ?? '').trim()),
    hasGlossary: extractGlossaryEntries(verse, 1).length > 0,
    verified: verse.verified === true,
    wordCount: text.split(/\s+/).filter(Boolean).length,
  }
}

export { normalizeLayer, visibleLayers, layerStatus, hasGloss }
