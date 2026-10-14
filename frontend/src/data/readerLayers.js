/**
 * readerLayers.js — which layers the reader shows, and how trustworthy each is.
 *
 * Pure functions (no React) so they can be unit-tested with `node --test`.
 * Contract with data/schema/verse_schema.json: `verified` is true only after
 * scholar sign-off; `englishMeta` / `yazhi_uraiMeta` / `uraiMeta` mark an
 * AI-drafted field.
 */

export const LAYER_OPTIONS = [
  { id: 'sangam', label: 'சங்கம்', hint: 'Original Sangam Tamil' },
  { id: 'urai', label: 'உரை', hint: 'Modern Tamil prose commentary' },
  { id: 'english', label: 'English', hint: 'English translation' },
  { id: 'all', label: 'All', hint: 'All three layers' },
]

const LAYER_IDS = new Set(LAYER_OPTIONS.map((l) => l.id))

/** Normalise a stored/legacy layer id ('both' was the old name for 'all'). */
export function normalizeLayer(layer) {
  if (layer === 'both') return 'all'
  return LAYER_IDS.has(layer) ? layer : 'all'
}

/** Which of the three text layers are visible for a toggle value. */
export function visibleLayers(layer) {
  const l = normalizeLayer(layer)
  return {
    sangam: l === 'sangam' || l === 'all',
    urai: l === 'urai' || l === 'all',
    english: l === 'english' || l === 'all',
  }
}

const META_KEY = { urai: 'uraiMeta', yazhi_urai: 'yazhi_uraiMeta', english: 'englishMeta' }

/**
 * Trust status of one layer of a verse.
 * @returns {{ status: 'source'|'verified'|'ai-draft'|'unverified'|'missing', model?: string }}
 */
export function layerStatus(verse, field) {
  if (!verse) return { status: 'missing' }
  if (field === 'sangam') return { status: 'source' }
  const text = verse[field]
  if (!text || !String(text).trim()) return { status: 'missing' }
  if (verse.verified === true) return { status: 'verified' }
  const meta = verse[META_KEY[field]]
  if (meta) return { status: 'ai-draft', model: meta.model || undefined }
  return { status: 'unverified' }
}

/** Short label for a draft badge, or null when no badge is needed. */
export function draftBadgeLabel(verse, field) {
  const { status } = layerStatus(verse, field)
  // Tamil text below is an AI-written draft: needs native-reviewer sign-off.
  if (status === 'ai-draft') return 'வரைவு · AI draft'
  if (status === 'unverified') return 'வரைவு · Not yet verified'
  return null
}

/** Longer tooltip explaining the badge. */
export function draftBadgeTitle(verse, field) {
  const { status, model } = layerStatus(verse, field)
  if (status === 'ai-draft') {
    return `Machine-drafted${model ? ` (${model})` : ''}; not yet reviewed by a Tamil scholar.`
  }
  if (status === 'unverified') return 'Collected from the source edition; not yet reviewed by a Tamil scholar.'
  return undefined
}

const GLOSS_FIELDS = ['root', 'urichol', 'etymology', 'gloss']

/** True when a corpus word entry carries at least one glossary field. */
export function hasGloss(word) {
  return Boolean(word) && GLOSS_FIELDS.some((k) => word[k] != null && String(word[k]).trim() !== '')
}

/**
 * Trust status of a word's glossary entry. Glossary fields come only from the
 * corpus file; `etymologyMeta` on the record marks a batch AI draft.
 * @returns {{ status: 'verified'|'ai-draft'|'unverified'|'missing', model?: string }}
 */
export function glossaryStatus(verse, word) {
  if (!hasGloss(word)) return { status: 'missing' }
  if (verse?.verified === true) return { status: 'verified' }
  if (verse?.etymologyMeta) return { status: 'ai-draft', model: verse.etymologyMeta.model || undefined }
  return { status: 'unverified' }
}

/** Badge label for a glossary entry, or null when no badge is needed. */
export function glossaryBadgeLabel(verse, word) {
  const { status } = glossaryStatus(verse, word)
  // Tamil text below is an AI-written draft: needs native-reviewer sign-off.
  if (status === 'ai-draft') return 'வரைவு · AI draft'
  if (status === 'unverified') return 'வரைவு · Not yet verified'
  return null
}
