import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const catalog = JSON.parse(
  readFileSync(resolve(here, '../../../data/library/catalog.json'), 'utf8')
)

const AVAILABILITY = new Set(['reader', 'metadata', 'planned'])

test('every work declares a known collection and availability', () => {
  const collectionIds = new Set(catalog.collections.map((c) => c.id))
  for (const work of catalog.works) {
    assert.ok(collectionIds.has(work.collection), `${work.id}: unknown collection`)
    assert.ok(AVAILABILITY.has(work.availability), `${work.id}: bad availability`)
  }
})

test('count is a positive integer or explicitly null (never 0)', () => {
  for (const work of catalog.works) {
    if (work.count === null) continue
    assert.equal(typeof work.count, 'number', `${work.id}: count must be number|null`)
    assert.ok(Number.isInteger(work.count) && work.count > 0, `${work.id}: count must be > 0`)
  }
})

test('every work declares a unit', () => {
  for (const work of catalog.works) {
    assert.ok(typeof work.unit === 'string' && work.unit.length > 0, `${work.id}: missing unit`)
  }
})

test('The Five Great Epics collection actually holds five epics', () => {
  const epics = catalog.works.filter((w) => w.collection === 'aimperumkappiyam')
  assert.equal(epics.length, 5, 'Aimperumkappiyam must contain five works')
  const names = new Set(epics.map((w) => w.en))
  for (const expected of ['Silappathikaram', 'Manimekalai', 'Civaka Cintamani', 'Valayapathi', 'Kundalakesi']) {
    assert.ok(names.has(expected), `missing epic: ${expected}`)
  }
})

test('lost epics are planned, have null count and a fragments unit', () => {
  for (const id of ['valayapathi', 'kundalakesi']) {
    const work = catalog.works.find((w) => w.id === id)
    assert.ok(work, `${id} missing`)
    assert.equal(work.availability, 'planned', `${id}: should be planned`)
    assert.equal(work.count, null, `${id}: lost text must have null count`)
    assert.equal(work.unit, 'fragments', `${id}: should be fragments`)
  }
})

test('known counts match the received figures', () => {
  const byId = Object.fromEntries(catalog.works.map((w) => [w.id, w]))
  assert.equal(byId['thiruvasagam'].count, 51)
  assert.equal(byId['tevaram'].count, 3)
  assert.equal(byId['iraiyanar-akapporul'].count, 60)
  assert.equal(byId['tholkappiyam'].count, 1610)
  assert.equal(byId['silappatikaram'].count, 30)
  assert.equal(byId['silappatikaram'].unit, 'cantos')
})

test('romanisation follows one scheme (no stray g/d for க/ட)', () => {
  const byId = Object.fromEntries(catalog.works.map((w) => [w.id, w]))
  assert.equal(byId['silappatikaram'].en, 'Silappathikaram')
  assert.equal(byId['tevaram'].en, 'Thevaram')
  assert.equal(byId['nanmanikkadikai'].en, 'Nanmanikkadikai')
  assert.equal(byId['sirupanjamulam'].en, 'Sirupanchamulam')
  assert.equal(byId['thirikadugam'].en, 'Thirikadukam')
})

test('Pathinenkilkkanakku still holds all eighteen works', () => {
  const works = catalog.works.filter((w) => w.collection === 'pathinenkilkkanakku')
  assert.equal(works.length, 18)
})
