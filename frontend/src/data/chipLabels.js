/**
 * chipLabels.js — every label shown on a chip, in one place so Tamil reviewers can edit it.
 *
 * Tamil first, English second. Combined labels are "<Tamil> · <English>" with exactly one
 * ' · ' (the Chip splits on it). All Tamil here is a DRAFT pending native-reviewer sign-off (†).
 * Spell மருதம் with 'ம'; the data ids ('marutam') are left as they are.
 */

/** Reader layer chips. `id` matches readerLayers.js (normalizeLayer / visibleLayers). */
export const LAYER_CHIPS = [
  { id: 'all', label: 'அனைத்தும் · All' },
  { id: 'sangam', label: 'சங்கத் தமிழ் மூலம் · Original' },
  { id: 'urai', label: 'இன்றைய தமிழில் உரை · Modern Tamil commentary' },
  { id: 'english', label: 'ஆங்கில மொழிபெயர்ப்பு · English translation' },
]

/** Library quick-pick chips. `match` runs against a poem's `tinai` array in data/poems.js. */
const TINAI_IDS = ['kurinji', 'mullai', 'marutam', 'neytal', 'palai']

export const FILTER_CHIPS = [
  { id: 'akam', label: 'அகம் · Akam', match: (t) => t.some((x) => TINAI_IDS.includes(x)) },
  { id: 'puram', label: 'புறம் · Puram', match: (t) => t.includes('puram') },
  { id: 'kurinji', label: 'குறிஞ்சி · Kurinji', match: (t) => t.includes('kurinji') },
  { id: 'mullai', label: 'முல்லை · Mullai', match: (t) => t.includes('mullai') },
  { id: 'marutam', label: 'மருதம் · Marutam', match: (t) => t.includes('marutam') },
  { id: 'neytal', label: 'நெய்தல் · Neytal', match: (t) => t.includes('neytal') },
  { id: 'palai', label: 'பாலை · Palai', match: (t) => t.includes('palai') },
]

/** Does a poem (from POEMS) pass the selected chip? No chip selected shows everything. */
export function poemMatchesChip(poem, chipId) {
  if (!chipId) return true
  const chip = FILTER_CHIPS.find((c) => c.id === chipId)
  if (!chip) return true
  return chip.match(poem.tinai || [])
}

export const IDYLL_NOTE = {
  ta: 'பத்துப்பாட்டு நூல்களுக்குத் திணைக் குறிப்பு இல்லை',
  en: 'The ten idylls carry no tiṇai tag, so a filter hides them',
}

/** Split a "<Tamil> · <English>" label into its two parts (English may be empty). */
export function splitLabel(label) {
  const parts = String(label).split(' · ')
  return { ta: parts[0], en: parts.length > 1 ? parts.slice(1).join(' · ') : '' }
}
