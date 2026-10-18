import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeLayer, visibleLayers, layerStatus, draftBadgeLabel, draftBadgeTitle } from './readerLayers.js'

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
