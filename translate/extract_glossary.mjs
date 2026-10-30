/**
 * Extract en→ta pairs from the data modules that are plain ESM.
 * Output: translate/generated-glossary.json
 */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const modules = [
  './frontend/src/data/tinaiWorld.js',
  './frontend/src/data/knowledge.js',
  './frontend/src/data/pulavars.js',
]

const pairs = new Map()
const TAMIL = /[\u0B80-\u0BFF]/
const LATIN = /[A-Za-z]/

function walk(value) {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) {
    value.forEach(walk)
    return
  }
  const ta = value.ta || value.nameTa || value.titleTa || value.labelTa
  const en = value.en || value.nameEn || value.titleEn || value.labelEn
  if (typeof ta === 'string' && typeof en === 'string' && TAMIL.test(ta) && LATIN.test(en)) {
    const cleanEn = en.trim()
    if (cleanEn.length <= 100) pairs.set(cleanEn, ta.trim())
  }
  Object.values(value).forEach(walk)
}

for (const file of modules) {
  const mod = await import(resolve(process.cwd(), file))
  Object.values(mod).forEach(walk)
}

const out = Object.fromEntries([...pairs.entries()].sort((a, b) => a[0].localeCompare(b[0])))
writeFileSync(resolve(process.cwd(), 'translate/generated-glossary.json'), JSON.stringify(out, null, 2) + '\n')
console.log(`Extracted ${Object.keys(out).length} en→ta glossary pairs`)
