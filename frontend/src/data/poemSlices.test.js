import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import poemSlices from '../../scripts/poem-slices.js'

const dataDir = resolve(fileURLToPath(import.meta.url), '../../../../data')
const plugin = poemSlices({ dataDir })
const ctx = { addWatchFile() {} }

function slice(name) {
  const code = plugin.load.call(ctx, plugin.resolveId(`virtual:poem-slice/${name}`))
  const json = code.replace(/^export default JSON\.parse\(/, '').replace(/\)$/, '')
  return JSON.parse(JSON.parse(json))
}

test('maduraikanchi launch + rest is exactly the source file, nothing dropped', () => {
  const source = JSON.parse(readFileSync(resolve(dataDir, 'texts/maduraikanchi/maduraikanchi.json'), 'utf8'))
  const launch = slice('maduraikanchi-launch')
  const rest = slice('maduraikanchi-rest')
  assert.deepEqual([...launch, ...rest], source)
})

test('launch slice covers lines 1-100 and no section starts after line 100', () => {
  const launch = slice('maduraikanchi-launch')
  assert.equal(Number(launch[0].lineStart), 1)
  assert.ok(Number(launch.at(-1).lineEnd) >= 100)
  assert.ok(launch.every((s) => Number(s.lineStart) <= 100))
  assert.ok(slice('maduraikanchi-rest').every((s) => Number(s.lineStart) > 100))
})

test('unknown ids are left to other plugins', () => {
  assert.equal(plugin.resolveId('./foo.json'), null)
  assert.equal(plugin.load.call(ctx, 'some/other/id'), null)
})
