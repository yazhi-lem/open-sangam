import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const catalog = JSON.parse(
  readFileSync(resolve(here, '../../../data/library/catalog.json'), 'utf8')
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
