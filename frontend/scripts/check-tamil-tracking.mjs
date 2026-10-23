#!/usr/bin/env node
/**
 * check-tamil-tracking.mjs — fail the lint if Tamil text is letter-spaced.
 *
 * Flags any JSX element whose className has a Tailwind `tracking-*` utility
 * (other than tracking-normal) when either
 *   - the className also has `tamil` / `tamil-verse`, or
 *   - the element's text (up to its first closing tag) contains Tamil script.
 * The CSS rule in index.css already neutralises tracking on `.tamil`, but this
 * keeps new code honest. Add `tamil-tracking-ok` in a comment on the line to
 * silence a deliberate exception.
 *
 * Usage: node scripts/check-tamil-tracking.mjs [dir ...]   (default: src)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const TAMIL = /[\u0B80-\u0BFF]/
const TRACKING = /(?:^|\s)(?:[a-z-]+:)*tracking-(?!normal\b)[\w[\].-]+/
const CLASS_ATTR = /className=(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/g
const SKIP_DIRS = new Set(['node_modules', 'dist', 'texts'])

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p, { throwIfNoEntry: false })
    if (!st) continue
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(name)) walk(p, out)
    } else if (/\.(jsx?|tsx?)$/.test(name) && !/\.test\./.test(name)) {
      out.push(p)
    }
  }
  return out
}

export function findViolations(source) {
  const hits = []
  let m
  CLASS_ATTR.lastIndex = 0
  while ((m = CLASS_ATTR.exec(source))) {
    const cls = m[1] ?? m[2] ?? m[3] ?? ''
    if (!TRACKING.test(cls)) continue
    const lineStart = source.lastIndexOf('\n', m.index) + 1
    const lineEnd = source.indexOf('\n', m.index)
    const line = source.slice(lineStart, lineEnd === -1 ? undefined : lineEnd)
    if (line.includes('tamil-tracking-ok')) continue
    const tamilClass = /(?:^|\s)tamil(?:-verse)?(?:\s|$)/.test(cls)
    // Text content: from the end of the opening tag to the first closing tag,
    // so inline children (icons, spans) are included, since tracking inherits.
    const tagEnd = source.indexOf('>', m.index + m[0].length)
    const close = tagEnd === -1 ? -1 : source.indexOf('</', tagEnd + 1)
    const text = tagEnd === -1 ? '' : source.slice(tagEnd + 1, close === -1 ? undefined : close)
    if (tamilClass || TAMIL.test(text)) {
      const lineNo = source.slice(0, m.index).split('\n').length
      hits.push({ line: lineNo, className: cls.trim() })
    }
  }
  return hits
}

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  const roots = process.argv.slice(2).length ? process.argv.slice(2) : ['src']
  let total = 0
  for (const root of roots) {
    for (const file of walk(root)) {
      for (const h of findViolations(readFileSync(file, 'utf8'))) {
        total++
        console.error(`${relative(process.cwd(), file)}:${h.line}  tracking on Tamil text: "${h.className}"`)
      }
    }
  }
  if (total) {
    console.error(`\n${total} place(s) letter-space Tamil. Remove the tracking-* class (see index.css).`)
    process.exit(1)
  }
  console.log('check-tamil-tracking: no letter-spaced Tamil found.')
}
