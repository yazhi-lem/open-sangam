/**
 * readerLayers.js — nine-layer scholarly reader model.
 *
 * Layer ids are stable. `sangam` and `both` are legacy ids mapped forward.
 */

export const LAYER_OPTIONS = [
  { id: 'original', label: 'மூலம்', hint: 'Original Sangam Tamil' },
  { id: 'transliteration', label: 'ஒலிபெயர்ப்பு', hint: 'Roman transliteration' },
  { id: 'urai', label: 'உரை', hint: 'Modern Tamil prose commentary' },
  { id: 'english', label: 'English', hint: 'English translation' },
  { id: 'glossary', label: 'சொல்லகராதி', hint: 'Word glossary and etymology' },
  { id: 'notes', label: 'குறிப்புகள்', hint: 'Editorial and cultural notes' },
  { id: 'poetics', label: 'யாப்பியல்', hint: 'Metre, tiṇai and poetics' },
  { id: 'context', label: 'சூழல்', hint: 'Landscape, people and daily life' },
  { id: 'voice', label: 'ஒலிவாசிப்பு', hint: 'Spoken recitation' },
  { id: 'all', label: 'அனைத்தும்', hint: 'All nine layers' },
]

const TEXT_LAYERS = ['original', 'transliteration', 'urai', 'english', 'glossary', 'notes', 'poetics', 'context', 'voice']
const LAYER_IDS = new Set(LAYER_OPTIONS.map((l) => l.id))

export function normalizeLayer(layer) {
  if (layer === 'both') return 'all'
  if (layer === 'sangam') return 'original'
  return LAYER_IDS.has(layer) ? layer : 'all'
}

export function visibleLayers(layer) {
  const l = normalizeLayer(layer)
  return Object.fromEntries(
    TEXT_LAYERS.map((id) => [id, l === 'all' || l === id])
  )
}

const META_KEY = { urai: 'uraiMeta', yazhi_urai: 'yazhi_uraiMeta', english: 'englishMeta' }

export function layerStatus(verse, field) {
  if (!verse) return { status: 'missing' }
  if (field === 'original' || field === 'sangam') return { status: 'source' }
  const text = verse[field]
  if (!text || !String(text).trim()) return { status: 'missing' }
  if (verse.verified === true) return { status: 'verified' }
  const meta = verse[META_KEY[field]]
  if (meta) return { status: 'ai-draft', model: meta.model || undefined }
  return { status: 'unverified' }
}

export function draftBadgeLabel(verse, field) {
  const { status } = layerStatus(verse, field)
  if (status === 'ai-draft') return 'வரைவு · AI draft'
  if (status === 'unverified') return 'வரைவு · Not yet verified'
  return null
}

export function draftBadgeTitle(verse, field) {
  const { status, model } = layerStatus(verse, field)
  if (status === 'ai-draft') {
    return `Machine-drafted${model ? ` (${model})` : ''}; not yet reviewed by a Tamil scholar.`
  }
  if (status === 'unverified') return 'Collected from the source edition; not yet reviewed by a Tamil scholar.'
  return undefined
}

const GLOSS_FIELDS = ['root', 'urichol', 'etymology', 'gloss']

export function hasGloss(word) {
  return Boolean(word) && GLOSS_FIELDS.some((k) => word[k] != null && String(word[k]).trim() !== '')
}

export function glossaryStatus(verse, word) {
  if (!hasGloss(word)) return { status: 'missing' }
  if (verse?.verified === true) return { status: 'verified' }
  if (verse?.etymologyMeta) return { status: 'ai-draft', model: verse.etymologyMeta.model || undefined }
  return { status: 'unverified' }
}

export function glossaryBadgeLabel(verse, word) {
  const { status } = glossaryStatus(verse, word)
  if (status === 'ai-draft') return 'வரைவு · AI draft'
  if (status === 'unverified') return 'வரைவு · Not yet verified'
  return null
}
