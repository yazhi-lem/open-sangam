/**
 * processedContent.js — Content normalisation, validation, and layer processing.
 *
 * The Sangam corpus comes from multiple sources (Project Madurai, Tamil Virtual
 * Academy, hand-entered scholar JSON) with slight shape differences. This module
 * normalises every record to a single internal shape so the reader never has to
 * branch on source format.
 *
 * Usage:
 *   import { normaliseVerse, processPoemData, validateRecord } from '@/content/processedContent'
 */

import { normalizeLayer, visibleLayers, layerStatus, hasGloss } from '../data/readerLayers.js'

// ── Constants ─────────────────────────────────────────────────────────────

export const REQUIRED_FIELDS = ['id', 'original']
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
  MISSING_ORIGINAL: 'missing_original',
  EMPTY_LAYERS: 'empty_layers',
  INVALID_TINAI: 'invalid_tinai',
}

// ── Normalisation ─────────────────────────────────────────────────────────

/**
 * Normalise a single verse/section record into our canonical shape.
 *
 * @param {Object} raw — incoming record from any source
 * @returns {Object} canonical verse
 */
export function normaliseVerse(raw) {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const id = raw.id ?? raw.sectionNumber ?? raw.number ?? crypto.randomUUID?.() ?? String(Math.random())
  const number = raw.number ?? raw.sectionNumber ?? raw.id
  const isSection = raw.sectionNumber != null || raw.lineStart != null

  // Prefer explicit layer objects, fall back to flat fields
  const layers = raw.layers ?? {}

  const canonical = {
    id: String(id),
    number,
    sectionNumber: raw.sectionNumber ?? null,
    lineStart: raw.lineStart ?? null,
    lineEnd: raw.lineEnd ?? null,
    title: raw.title ?? raw.heading ?? raw.poemTitle ?? null,
    poet: raw.poet ?? null,
    tinai: raw.tinai ?? null,

    // Text fields — prefer layers.*.text, fall back to root property
    sangamTamil: layers.original?.text ?? raw.sangamTamil ?? raw.original ?? '',
    transliteration: layers.transliteration?.text ?? raw.transliteration ?? '',
    urai: layers.urai?.text ?? raw.urai ?? '',
    english: layers.english?.text ?? raw.english ?? '',
    poetics: layers.poetics?.text ?? raw.poetics ?? '',
    audioUrl: raw.audioUrl ?? null,

    // Rich data
    culturalNotes: raw.culturalNotes ?? [],
    lines: normaliseLines(raw.lines),

    // Verification state
    verified: raw.verified === true,
    uraiMeta: raw.uraiMeta ?? null,
    englishMeta: raw.englishMeta ?? null,
    etymologyMeta: raw.etymologyMeta ?? null,

    // Raw provenance (preserved for debugging)
    _source: raw._source ?? 'unknown',
  }

  return canonical
}

function normaliseLines(lines) {
  if (!Array.isArray(lines)) return []
  return lines.map((line) => ({
    text: line.text ?? line.original ?? '',
    words: Array.isArray(line.words)
      ? line.words.map((w) => ({
          form: w.form ?? w.text ?? '',
          gloss: w.gloss ?? null,
          root: w.root ?? null,
          etymology: w.etymology ?? null,
          urichol: w.urichol ?? null,
        }))
      : [],
  }))
}

// ── Validation ────────────────────────────────────────────────────────────

/**
 * Validate a single normalised record. Returns a status string + messages.
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

  const text = String(verse.sangamTamil ?? '').trim()
  if (!text) {
    messages.push('Missing original Tamil text')
    return { status: VERB_STATUS.MISSING_ORIGINAL, messages }
  }

  const hasAnyLayer = TEXT_LAYER_IDS.some((id) => {
    if (id === 'original') return true // already checked
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
    return { sections: [], errors: [{ index: 0, message: 'Input is not an array' }], stats: { total: 0, valid: 0 } }
  }

  const sections = []
  const errors = []

  rawSections.forEach((raw, index) => {
    const normalised = normaliseVerse(raw)
    if (!normalised) {
      errors.push({ index, id: raw?.id ?? '?', message: 'Could not normalise record' })
      return
    }
    const { status, messages } = validateRecord(normalised)
    if (status !== VERB_STATUS.VALID) {
      errors.push({ index, id: normalised.id, status, messages })
      // Still include the record; the reader shows draft badges for it.
    }
    sections.push(normalised)
  })

  const stats = {
    total: rawSections.length,
    valid: sections.length - errors.length,
    errors: errors.length,
  }

  return { sections, errors, stats }
}

// ── Utility helpers for the reader ────────────────────────────────────────

/**
 * Build a word glossary lookup Map from a normalised verse.
 */
export function buildGlossaryMap(verse) {
  const map = new Map()
  if (!verse?.lines) return map
  for (const line of verse.lines) {
    if (!line?.words) continue
    for (const w of line.words) {
      if (!w?.form) continue
      const clean = w.form.replace(/[^\u0B80-\u0BFFa-zA-Z]/g, '').trim()
      if (clean && !map.has(clean)) map.set(clean, w)
    }
  }
  return map
}

/**
 * Extract verified layers from a normalised verse.
 */
export function verifiedLayers(verse) {
  if (!verse) return new Set()
  const result = new Set(['original'])
  if (verse.verified === true) {
    if (verse.urai?.trim()) result.add('urai')
    if (verse.english?.trim()) result.add('english')
  }
  return result
}

/**
 * Extract unique glossary entries that have gloss data.
 */
export function extractGlossaryEntries(verse, limit = 60) {
  const map = buildGlossaryMap(verse)
  return [...map.values()].filter(hasGloss).slice(0, limit)
}

/**
 * Create a summary object for a verse — useful for indexing, search, and SEO.
 */
export function verseSummary(verse) {
  if (!verse) return null
  return {
    id: verse.id,
    title: verse.title,
    poet: verse.poet,
    tinai: verse.tinai,
    previewTamil: (verse.sangamTamil ?? '').slice(0, 200),
    hasUrai: Boolean(verse.urai?.trim()),
    hasEnglish: Boolean(verse.english?.trim()),
    hasGlossary: extractGlossaryEntries(verse, 1).length > 0,
    verified: verse.verified === true,
    wordCount: (verse.sangamTamil ?? '').split(/\s+/).filter(Boolean).length,
  }
}

export { normalizeLayer, visibleLayers, layerStatus, hasGloss }
