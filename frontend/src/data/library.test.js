import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const catalog = JSON.parse(
  readFileSync(resolve(here, '../../../data/library/catalog.json'), 'utf8')
)
const artifacts = JSON.parse(
  readFileSync(resolve(here, '../../../data/library/artifacts.json'), 'utf8')
)
const corpusArtifacts = JSON.parse(
  readFileSync(resolve(here, '../../../data/library/corpus-artifacts.json'), 'utf8')
)
const research = JSON.parse(
  readFileSync(resolve(here, '../../../data/library/research-campaigns.json'), 'utf8')
)

test('library catalog has unique ids', () => {
  const ids = catalog.works.map((work) => work.id)
  assert.equal(new Set(ids).size, ids.length)
})

test('Pathinenkilkkanakku has all eighteen works', () => {
  const works = catalog.works.filter((work) => work.collection === 'pathinenkilkkanakku')
  assert.equal(works.length, 18)
})

test('every work belongs to a declared collection and declares languages', () => {
  const collections = new Set(catalog.collections.map((collection) => collection.id))
  for (const work of catalog.works) {
    assert.ok(collections.has(work.collection), `${work.id}: unknown collection`)
    assert.ok(Array.isArray(work.languages) && work.languages.length > 0, `${work.id}: no languages`)
    assert.ok(['reader', 'metadata', 'planned'].includes(work.availability), `${work.id}: bad availability`)
  }
})


test('artifact register is internally consistent', () => {
  const classIds = new Set(artifacts.classes.map((item) => item.id))
  const sourceIds = new Set(artifacts.sources.map((item) => item.id))
  const artifactIds = artifacts.artifacts.map((item) => item.id)
  assert.equal(new Set(artifactIds).size, artifactIds.length)
  for (const artifact of artifacts.artifacts) {
    assert.ok(classIds.has(artifact.class), `${artifact.id}: unknown class`)
    assert.ok(sourceIds.has(artifact.sourceId), `${artifact.id}: unknown source`)
    assert.ok(artifact.layers, `${artifact.id}: no layers`)
  }
})

test('every artifact has the seven scholar-reader layer slots', () => {
  const layerIds = ['text', 'transliteration', 'translation', 'glossary', 'notes', 'provenance']
  for (const artifact of artifacts.artifacts) {
    for (const layerId of layerIds) {
      assert.ok(artifact.layers[layerId], `${artifact.id}: missing ${layerId} layer`)
      assert.ok(
        ['available', 'draft', 'pending', 'reference'].includes(artifact.layers[layerId].status),
        `${artifact.id}: bad ${layerId} status`
      )
    }
  }
})


test('corpus artifact index is classified and has citations', () => {
  const classIds = new Set(corpusArtifacts.classes.map((item) => item.id))
  for (const artifact of corpusArtifacts.artifacts) {
    assert.ok(classIds.has(artifact.class), `${artifact.id}: unknown class`)
    assert.ok(artifact.count > 0, `${artifact.id}: zero count`)
    assert.ok(Array.isArray(artifact.samples), `${artifact.id}: no samples`)
  }
})

test('research campaigns name an agent, workflow and prompt', () => {
  for (const campaign of research.campaigns) {
    assert.ok(campaign.id && campaign.ta && campaign.en, 'campaign identity')
    assert.ok(campaign.agent && campaign.workflow, `${campaign.id}: missing agent/workflow`)
    assert.ok(campaign.promptTa && campaign.promptEn, `${campaign.id}: missing prompts`)
  }
})
