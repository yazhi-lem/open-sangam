// Vite plugin: splits a long poem's JSON into a small "launch" slice and the rest,
// so the first screen of the reader does not download the whole poem.
//
//   import launch from 'virtual:poem-slice/maduraikanchi-launch'  // sections starting at lines 1-100
//   import rest   from 'virtual:poem-slice/maduraikanchi-rest'    // every other section
//
// `launch` followed by `rest` is exactly the source file: nothing is dropped or edited, every
// field (including machine-drafted glosses) is kept. The source JSON stays the single source of truth.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PREFIX = 'virtual:poem-slice/'
const LAUNCH_LAST_LINE = 100

export default function poemSlices({ dataDir }) {
  return {
    name: 'poem-slices',
    resolveId(id) {
      return id.startsWith(PREFIX) ? `\0${id}` : null
    },
    load(id) {
      if (!id.startsWith(`\0${PREFIX}`)) return null
      const match = /^([a-z0-9_-]+)-(launch|rest)$/.exec(id.slice(PREFIX.length + 1))
      if (!match) throw new Error(`poem-slices: bad id ${id}`)
      const [, poem, part] = match
      const file = resolve(dataDir, 'texts', poem, `${poem}.json`)
      this.addWatchFile(file)
      const sections = JSON.parse(readFileSync(file, 'utf8'))
      const inLaunch = (s) => Number(s.lineStart) <= LAUNCH_LAST_LINE
      const picked = sections.filter((s) => (part === 'launch' ? inLaunch(s) : !inLaunch(s)))
      // JSON.parse of a string literal is faster for the browser than a huge object literal.
      return `export default JSON.parse(${JSON.stringify(JSON.stringify(picked))})`
    },
  }
}
