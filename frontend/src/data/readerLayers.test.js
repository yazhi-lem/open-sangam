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
  MACHINE_DRAFT_LABEL,
  UNVERIFIED_LABEL,
} from './readerLayers.js'

test('legacy "both" maps to "all"; unknown ids fall back to "all"', () => {
  assert.equal(normalizeLayer('both'), 'all')
  assert.equal(normalizeLayer('nonsense'), 'all')
  assert.equal(normalizeLayer('urai'), 'urai')
})

test('each toggle shows exactly its layer', () => {
  assert.deepEqual(visibleLayers('sangam'), { sangam: true, urai: false, english: false })
  assert.deepEqual(visibleLayers('urai'), { sangam: false, urai: true, english: false })
  assert.deepEqual(visibleLayers('english'), { sangam: false, urai: false, english: true })
  assert.deepEqual(visibleLayers('all'), { sangam: true, urai: true, english: true })
})

test('source text is never labelled draft', () => {
  assert.equal(layerStatus({ sangamTamil: 'x', verified: false }, 'sangam').status, 'source')
  assert.equal(draftBadgeLabel({ sangamTamil: 'x', verified: false }, 'sangam'), null)
})

test('unverified scraped urai is labelled not yet verified', () => {
  const v = { urai: 'உரை', verified: false }
  assert.equal(layerStatus(v, 'urai').status, 'unverified')
  assert.equal(draftBadgeLabel(v, 'urai'), UNVERIFIED_LABEL)
})

test('AI-drafted English is labelled AI draft with its model', () => {
  const v = { english: 'text', verified: false, englishMeta: { model: 'some/model' } }
  assert.deepEqual(layerStatus(v, 'english'), { status: 'ai-draft', model: 'some/model' })
  assert.equal(draftBadgeLabel(v, 'english'), MACHINE_DRAFT_LABEL)
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
  assert.equal(glossaryBadgeLabel(verse, word), MACHINE_DRAFT_LABEL)
})

test('glossary: unverified record without meta still labelled; verified is not', () => {
  const word = { form: 'x', gloss: 'z' }
  assert.equal(glossaryBadgeLabel({ verified: false }, word), UNVERIFIED_LABEL)
  assert.equal(glossaryBadgeLabel({ verified: true, etymologyMeta: { model: 'm' } }, word), null)
})

test('badge labels have exactly one " · " separator (the UI splits on it)', () => {
  for (const label of [MACHINE_DRAFT_LABEL, UNVERIFIED_LABEL]) {
    assert.equal(label.split(' · ').length, 2, label)
  }
  assert.equal(MACHINE_DRAFT_LABEL, 'இயந்திர வரைவு · Machine draft')
  assert.equal(UNVERIFIED_LABEL, 'வரைவு, அறிஞர் சரிபார்க்கவில்லை · Draft, not scholar-verified')
})

test('machine-drafted text is never shown as verified unless a scholar set verified: true', () => {
  const machine = { english: 'x', urai: 'y', verified: false, englishMeta: { model: 'm' }, uraiMeta: { model: 'm' } }
  assert.equal(draftBadgeLabel(machine, 'english'), MACHINE_DRAFT_LABEL)
  assert.equal(draftBadgeLabel(machine, 'urai'), MACHINE_DRAFT_LABEL)
  // a record without an explicit flag counts as unverified, never verified
  assert.equal(draftBadgeLabel({ urai: 'y' }, 'urai'), UNVERIFIED_LABEL)
})
