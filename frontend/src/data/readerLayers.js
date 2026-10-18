/**
 * readerLayers.js — which layers the reader shows, and how trustworthy each is.
 *
 * Pure functions (no React) so they can be unit-tested with `node --test`.
 * Contract with data/schema/verse_schema.json: `verified` is true only after
 * scholar sign-off; `englishMeta` / `yazhi_uraiMeta` / `uraiMeta` mark an
 * AI-drafted field.
 */

// Badge labels are "<Tamil> · <English>" and must contain exactly one ' · ' (the UI splits on it).
// Tamil wording from Kabilar, pending human scholar review (†).
export const MACHINE_DRAFT_LABEL = 'இயந்திர வரைவு · Machine draft'
export const UNVERIFIED_LABEL = 'வரைவு, அறிஞர் சரிபார்க்கவில்லை · Draft, not scholar-verified'

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
  // Labels: see MACHINE_DRAFT_LABEL / UNVERIFIED_LABEL above (Tamil pending scholar review).
  if (status === 'ai-draft') return MACHINE_DRAFT_LABEL
  if (status === 'unverified') return UNVERIFIED_LABEL
  return null
}

/** Longer tooltip explaining the badge. Tamil († pending scholar review) uses the same verb as the badge, சரிபார்க்கவில்லை. */
export function draftBadgeTitle(verse, field) {
  const { status, model } = layerStatus(verse, field)
  if (status === 'ai-draft') {
    return `இயந்திரத்தால் வரையப்பட்டது${model ? ` (${model})` : ''}; தமிழ் அறிஞர் இன்னும் சரிபார்க்கவில்லை · Machine-drafted${model ? ` (${model})` : ''}; not yet reviewed by a Tamil scholar.`
  }
  if (status === 'unverified') {
    return 'மூலப் பதிப்பிலிருந்து தொகுக்கப்பட்டது; தமிழ் அறிஞர் இன்னும் சரிபார்க்கவில்லை · Collected from the source edition; not yet reviewed by a Tamil scholar.'
  }
  return undefined
}
