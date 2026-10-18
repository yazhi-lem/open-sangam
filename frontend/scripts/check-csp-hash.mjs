// Checks that every inline <script> in dist/index.html has its sha256 listed in dist/_headers.
// Run after `npm run build`: node scripts/check-csp-hash.mjs
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8')
const headers = readFileSync(new URL('../dist/_headers', import.meta.url), 'utf8')
const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1])
let bad = 0
for (const body of inline) {
  const hash = `sha256-${createHash('sha256').update(body).digest('base64')}`
  const ok = headers.includes(`'${hash}'`)
  console.log(`${ok ? 'ok     ' : 'MISSING'} ${hash}`)
  if (!ok) bad++
}
if (bad) {
  console.error(`${bad} inline script(s) are not allowed by the CSP in public/_headers`)
  process.exit(1)
}
console.log(`CSP hash check: ${inline.length} inline script(s) covered`)
