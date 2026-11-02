import test from 'node:test'
import assert from 'node:assert/strict'
import {
  SECTION_KINDS,
  sectionKindLabel,
  isStructural,
  groupSections,
  structureBreadcrumb,
  locateSection,
} from './structure.js'

const sections = [
  { id: 's1', number: 1, structure: { level: 'sutra', book: 'எழுத்ததிகாரம்', chapter: 'நூன்மரபு', number: 1 } },
  { id: 's2', number: 2, structure: { level: 'sutra', book: 'எழுத்ததிகாரம்', chapter: 'நூன்மரபு', number: 2 } },
  { id: 's3', number: 3, structure: { level: 'sutra', book: 'எழுத்ததிகாரம்', chapter: 'மொழிமரபு', number: 3 } },
  { id: 's4', number: 4, structure: { level: 'sutra', book: 'சொல்லதிகாரம்', chapter: 'வேற்றுமை', number: 1 } },
]

test('section kind labels are bilingual', () => {
  assert.equal(sectionKindLabel('sutra', 'ta'), 'சூத்திரம்')
  assert.equal(sectionKindLabel('canto', 'en'), 'Canto')
  assert.equal(sectionKindLabel('unknown', 'en'), SECTION_KINDS.verse.en)
})

test('only non-verse works are structural', () => {
  assert.equal(isStructural('verse'), false)
  assert.equal(isStructural('sutra'), true)
  assert.equal(isStructural(undefined), false)
})

test('groupSections builds book → chapter → items in order', () => {
  const tree = groupSections(sections)
  assert.equal(tree.length, 2)
  assert.equal(tree[0].book, 'எழுத்ததிகாரம்')
  assert.equal(tree[0].chapters.length, 2)
  assert.equal(tree[0].chapters[0].title, 'நூன்மரபு')
  assert.equal(tree[0].chapters[0].items.length, 2)
  assert.equal(tree[0].count, 3)
  assert.equal(tree[1].count, 1)
})

test('breadcrumb includes book and chapter without duplication', () => {
  assert.equal(
    structureBreadcrumb(sections[0], 'en', 'sutra'),
    'எழுத்ததிகாரம் · நூன்மரபு · Sutra 1'
  )
})

test('locateSection finds the book and chapter of a record', () => {
  assert.deepEqual(locateSection(sections, 's3'), { book: 'எழுத்ததிகாரம்', chapter: 'மொழிமரபு' })
  assert.equal(locateSection(sections, 'missing'), null)
})
