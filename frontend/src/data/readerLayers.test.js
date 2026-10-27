import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeLayer,
  visibleLayers,
  layerStatus,
  draftBadgeLabel,
  draftBadgeTitle,
  hasGloss,
  glossaryStatus,
  glossaryBadgeLabel,
} from './readerLayers.js'

test('legacy "both" maps to "all"; unknown ids fall back to "all"', () => {
  assert.equal(normalizeLayer('both'), 'all')
  assert.equal(normalizeLayer('nonsense'), 'all')
  assert.equal(normalizeLayer('urai'), 'urai')
})

test('each toggle shows exactly its layer', () => {
  assert.deepEqual(visibleLayers('original'), { original: true, transliteration: false, urai: false, english: false, glossary: false, notes: false, poetics: false, context: false, voice: false })
  assert.equal(visibleLayers('urai').urai, true)
  assert.equal(visibleLayers('urai').original, false)
  assert.equal(visibleLayers('english').english, true)
  assert.equal(visibleLayers('english').original, false)
  for (const value of Object.values(visibleLayers('all'))) assert.equal(value, true)
})

test('source text is never labelled draft', () => {
  assert.equal(layerStatus({ sangamTamil: 'x', verified: false }, 'original').status, 'source')
  assert.equal(draftBadgeLabel({ sangamTamil: 'x', verified: false }, 'original'), null)
})

test('unverified scraped urai is labelled not yet verified', () => {
  const v = { urai: 'உரை', verified: false }
  assert.equal(layerStatus(v, 'urai').status, 'unverified')
  assert.match(draftBadgeLabel(v, 'urai'), /Not yet verified/)
})

test('AI-drafted English is labelled AI draft with its model', () => {
  const v = { english: 'text', verified: false, englishMeta: { model: 'some/model' } }
  assert.deepEqual(layerStatus(v, 'english'), { status: 'ai-draft', model: 'some/model' })
  assert.match(draftBadgeLabel(v, 'english'), /AI draft/)
  assert.match(draftBadgeTitle(v, 'english'), /some\/model/)
})

test('scholar-verified layers carry no badge', () => {
  const v = { english: 'text', verified: true, englishMeta: { model: 'm' } }
  assert.equal(layerStatus(v, 'english').status, 'verified')
  assert.equal(draftBadgeLabel(v, 'english'), null)
})

test('missing layer has no badge', () => {
  assert.equal(layerStatus({ english: null, verified: false }, 'english').status, 'missing')
  assert.equal(draftBadgeLabel({ english: '  ', verified: false }, 'english'), null)
  assert.equal(layerStatus(null, 'urai').status, 'missing')
})

test('glossary: empty corpus word has no gloss', () => {
  assert.equal(hasGloss({ form: 'x', root: null, urichol: null, etymology: null, gloss: null }), false)
  assert.equal(hasGloss({ form: 'x', gloss: '   ' }), false)
  assert.equal(hasGloss(undefined), false)
  assert.equal(glossaryStatus({ verified: false }, { form: 'x' }).status, 'missing')
  assert.equal(glossaryBadgeLabel({ verified: false }, { form: 'x' }), null)
})

test('glossary: AI-annotated record is labelled draft with model', () => {
  const verse = { verified: false, etymologyMeta: { model: 'some/model' } }
  const word = { form: 'x', root: 'y' }
  assert.deepEqual(glossaryStatus(verse, word), { status: 'ai-draft', model: 'some/model' })
  assert.match(glossaryBadgeLabel(verse, word), /AI draft/)
})

test('glossary: unverified record without meta still labelled; verified is not', () => {
  const word = { form: 'x', gloss: 'z' }
  assert.match(glossaryBadgeLabel({ verified: false }, word), /Not yet verified/)
  assert.equal(glossaryBadgeLabel({ verified: true, etymologyMeta: { model: 'm' } }, word), null)
})
