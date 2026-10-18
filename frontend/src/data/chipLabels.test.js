import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LAYER_CHIPS, FILTER_CHIPS, poemMatchesChip, splitLabel } from './chipLabels.js'
import { POEMS } from './poems.js'

const TAMIL = /[\u0B80-\u0BFF]/

test('every chip label is "<Tamil> · <English>" with exactly one separator', () => {
  for (const c of [...LAYER_CHIPS, ...FILTER_CHIPS]) {
    assert.equal(c.label.split(' · ').length, 2, c.label)
    const { ta, en } = splitLabel(c.label)
    assert.match(ta, TAMIL, `Tamil first: ${c.label}`)
    assert.doesNotMatch(en, TAMIL, `English second: ${c.label}`)
  }
})

test('layer chips: full forms carry the long Tamil names, one separator each', () => {
  const full = Object.fromEntries(LAYER_CHIPS.map((c) => [c.id, c.full]))
  assert.equal(full.all, 'அனைத்தும் (அனைத்து அடுக்குகளும்) · All (all layers)')
  // Label-in-name: every full form contains the visible Tamil and English chip text.
  for (const c of LAYER_CHIPS) {
    const [ta, en] = c.label.split(' · ')
    assert.ok(c.full.includes(ta) && c.full.includes(en), c.full)
  }
  assert.match(full.sangam, /^சங்கத் தமிழ் மூலம் · /)
  assert.match(full.urai, /^தமிழ் உரை \(இன்றைய தமிழில் உரை\) · /)
  assert.match(full.english, /^ஆங்கிலம் \(ஆங்கில மொழிபெயர்ப்பு\) · /)
  for (const c of LAYER_CHIPS) assert.equal(c.full.split(' · ').length, 2, c.full)
})

test('layer chips cover exactly the reader layers, "all" first', () => {
  assert.deepEqual(LAYER_CHIPS.map((c) => c.id), ['all', 'sangam', 'urai', 'english'])
})

test('filter chips are exactly akam, puram and the five tiṇai, with மருதம் spelled with ம', () => {
  assert.deepEqual(
    FILTER_CHIPS.map((c) => splitLabel(c.label).ta),
    ['அகம்', 'புறம்', 'குறிஞ்சி', 'முல்லை', 'மருதம்', 'நெய்தல்', 'பாலை']
  )
  for (const c of FILTER_CHIPS) assert.doesNotMatch(c.label, /மருதம்\s*·.*[Mm]arutham/)
})

test('chip filters use the poem registry tiṇai tags', () => {
  const byId = Object.fromEntries(POEMS.map((p) => [p.id, p]))
  assert.equal(poemMatchesChip(byId.kurunthokai, 'akam'), true)
  assert.equal(poemMatchesChip(byId.kurunthokai, 'puram'), false)
  assert.equal(poemMatchesChip(byId.purananooru, 'puram'), true)
  assert.equal(poemMatchesChip(byId.purananooru, 'akam'), false)
  assert.equal(poemMatchesChip(byId.paripadal, 'kurinji'), true)
  assert.equal(poemMatchesChip(byId.paripadal, 'palai'), false)
  assert.equal(poemMatchesChip(byId.maduraikanchi, 'akam'), false) // idylls carry no tiṇai tag
  assert.equal(poemMatchesChip(byId.maduraikanchi, null), true)
})
