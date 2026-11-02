import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normaliseVerse,
  validateRecord,
  processPoemData,
  buildGlossaryMap,
  extractGlossaryEntries,
  verseSummary,
  VERB_STATUS,
} from './processedContent.js'

const flatRecord = {
  id: 'kural-001',
  poem: 'thirukkural',
  number: 1,
  tinai: 'puram',
  sangamTamil: 'அகர முதல எழுத்தெல்லாம்',
  urai: 'எழுத்துக்கள் அனைத்திற்கும் முதல் எழுத்து அகரம்',
  english: 'A is the first of all letters',
  lines: [
    { number: 1, text: 'அகர முதல', words: [{ form: 'அகர', gloss: 'the letter A' }] },
  ],
  source: 'Project Madurai',
  verified: true,
}

test('normaliseVerse keeps the flat v2 fields the schema requires', () => {
  const v = normaliseVerse(flatRecord)
  assert.equal(v.id, 'kural-001')
  assert.equal(v.poem, 'thirukkural')
  assert.equal(v.source, 'Project Madurai')
  assert.equal(v.sangamTamil, flatRecord.sangamTamil)
  assert.equal(v.verified, true)
  assert.equal(v.lines.length, 1)
})

test('normaliseVerse adapts nested layers.*.text from imported data', () => {
  const nested = {
    id: 'x-1',
    poem: 'maduraikanchi',
    layers: {
      original: { text: 'மதுரை' },
      urai: { text: 'உரை' },
      english: { text: 'Madurai' },
    },
  }
  const v = normaliseVerse(nested)
  assert.equal(v.sangamTamil, 'மதுரை')
  assert.equal(v.urai, 'உரை')
  assert.equal(v.english, 'Madurai')
})

test('validateRecord flags a missing id and a missing original', () => {
  assert.equal(validateRecord({ poem: 'x', sangamTamil: 'a' }).status, VERB_STATUS.MISSING_ID)
  assert.equal(validateRecord({ id: 'a', poem: 'x', sangamTamil: '' }).status, VERB_STATUS.MISSING_ORIGINAL)
  assert.equal(validateRecord({ id: 'a', poem: 'x', sangamTamil: 'y', urai: 'z' }).status, VERB_STATUS.VALID)
})

test('processPoemData normalises and reports errors without dropping records', () => {
  const { sections, errors, stats } = processPoemData([flatRecord, { id: 'bad', poem: 'x' }])
  assert.equal(sections.length, 2)
  assert.equal(errors.length, 1)
  assert.equal(stats.total, 2)
})

test('glossary index is akshara-safe and only returns real glosses', () => {
  const map = buildGlossaryMap(normaliseVerse(flatRecord))
  assert.ok(map.has('அகர'))
  assert.equal(extractGlossaryEntries(normaliseVerse(flatRecord)).length, 1)
})

test('verseSummary reports layer availability', () => {
  const s = verseSummary(normaliseVerse(flatRecord))
  assert.equal(s.hasUrai, true)
  assert.equal(s.hasEnglish, true)
  assert.equal(s.hasGlossary, true)
  assert.equal(s.verified, true)
  assert.ok(s.wordCount > 0)
})
