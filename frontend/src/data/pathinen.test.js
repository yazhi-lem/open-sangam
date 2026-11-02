import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const here = fileURLToPath(new URL('.', import.meta.url))
const root = resolve(here, '../../../')

// The three Pathinen works that were ingested and cleared the parser audit.
const PUBLISHED = [
  { id: 'inna-narpathu', file: 'inna-narpathu', count: 40 },
  { id: 'kalavazhi-narpathu', file: 'kalavazhi-narpathu', count: 40 },
  { id: 'elathi', file: 'elathi', count: 80 },
]

const BAD = /(இதுவுமது|முற்றிற்று|----|^\(|^@|நூல் ஆசிரியர்|உரையாசிரியர்)/

test('published minor works have contiguous verses', () => {
  for (const work of PUBLISHED) {
    const data = JSON.parse(
      readFileSync(resolve(root, `data/texts/${work.file}/${work.file}.json`), 'utf8')
    )
    assert.equal(data.length, work.count, `${work.id}: count`)
    assert.deepEqual(
      data.map((v) => v.number),
      Array.from({ length: work.count }, (_, i) => i + 1),
      `${work.id}: numbering must be contiguous 1..n`
    )
  }
})

test('published records satisfy the v2 schema essentials', () => {
  for (const work of PUBLISHED) {
    const data = JSON.parse(
      readFileSync(resolve(root, `data/texts/${work.file}/${work.file}.json`), 'utf8')
    )
    for (const rec of data) {
      assert.ok(/^[a-z]+_\d{2,4}$/.test(rec.id), `${rec.id}: bad id pattern`)
      assert.ok(rec.poem && rec.sangamTamil && rec.source, `${rec.id}: missing required field`)
      assert.ok(Array.isArray(rec.lines) && rec.lines[0].lineNumber === 1, `${rec.id}: bad lines`)
      assert.equal(typeof rec.verified, 'boolean')
      assert.ok(['kurinji', 'mullai', 'marutam', 'neytal', 'palai', 'unknown'].includes(rec.tinai))
    }
  }
})

test('published text carries no header or colophon contamination', () => {
  for (const work of PUBLISHED) {
    const data = JSON.parse(
      readFileSync(resolve(root, `data/texts/${work.file}/${work.file}.json`), 'utf8')
    )
    for (const rec of data) {
      assert.ok(!BAD.test(rec.sangamTamil), `${rec.id}: contaminated text`)
    }
  }
})

test('published works are marked readable in the catalog', () => {
  const catalog = JSON.parse(readFileSync(resolve(root, 'data/library/catalog.json'), 'utf8'))
  for (const work of PUBLISHED) {
    const entry = catalog.works.find((w) => w.id === work.id)
    assert.ok(entry, `${work.id}: not in catalog`)
    assert.equal(entry.availability, 'reader', `${work.id}: should be reader`)
  }
})
