import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Guards the honesty contract of the corpus (data/schema/verse_schema.json):
//  - `verified` is a boolean and only a scholar sets it to true;
//  - every machine-drafted field is marked by its own provenance block, and a block never
//    exists without its field. The reader turns these blocks into the "Machine draft" badge,
//    so a machine field without its block would be shown as plain unverified text.
const textsDir = resolve(fileURLToPath(import.meta.url), '../../../../data/texts')

const has = (v) => v != null && String(v).trim() !== ''
const wordFields = ['root', 'urichol', 'etymology', 'gloss']
const hasWordGloss = (rec) =>
  (rec.lines || []).some((l) => (l.words || []).some((w) => wordFields.some((k) => has(w[k]))))

function* records() {
  for (const poem of readdirSync(textsDir)) {
    const dir = resolve(textsDir, poem, 'normalized')
    if (!existsSync(dir)) continue
    for (const f of readdirSync(dir).filter((n) => n.endsWith('.json'))) {
      const data = JSON.parse(readFileSync(resolve(dir, f), 'utf8'))
      for (const rec of Array.isArray(data) ? data : [data]) yield { file: `${poem}/${f}`, rec }
    }
  }
}

test('every machine-drafted field has its provenance block, and no block is orphaned', () => {
  const problems = []
  let n = 0
  for (const { file, rec } of records()) {
    n++
    if (typeof rec.verified !== 'boolean') problems.push(`${file} ${rec.id}: verified is not a boolean`)
    if (hasWordGloss(rec) && !rec.etymologyMeta) problems.push(`${file} ${rec.id}: word glosses without etymologyMeta`)
    if (rec.etymologyMeta && !hasWordGloss(rec)) problems.push(`${file} ${rec.id}: etymologyMeta without word glosses`)
    for (const field of ['english', 'yazhi_urai', 'urai']) {
      const meta = rec[`${field}Meta`]
      if (meta && !has(rec[field])) problems.push(`${file} ${rec.id}: ${field}Meta without ${field}`)
      if (meta && !meta.model) problems.push(`${file} ${rec.id}: ${field}Meta has no model`)
    }
    if (rec.etymologyMeta && !rec.etymologyMeta.model) problems.push(`${file} ${rec.id}: etymologyMeta has no model`)
  }
  assert.ok(n > 2000, `expected the full corpus, found ${n} records`)
  assert.deepEqual(problems.slice(0, 10), [])
})

test('no record with machine-drafted fields is marked verified without a scholar', () => {
  // Today nothing is scholar-verified. When the sign-off workflow exists, replace this
  // with a check on its sign-off field.
  const bad = []
  for (const { file, rec } of records()) {
    const machine = rec.englishMeta || rec.yazhi_uraiMeta || rec.uraiMeta || rec.etymologyMeta
    if (machine && rec.verified === true) bad.push(`${file} ${rec.id}`)
  }
  assert.deepEqual(bad.slice(0, 10), [])
})
