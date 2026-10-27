import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const graph = JSON.parse(
  readFileSync(resolve(here, '../../../data/knowledge/graph.json'), 'utf8')
)

test('graph metadata matches node and edge arrays', () => {
  assert.equal(graph.meta.nodes, graph.nodes.length)
  assert.equal(graph.meta.edges, graph.edges.length)
  assert.ok(graph.nodes.length > 200)
  assert.ok(graph.edges.length > 1000)
})

test('graph includes artifacts and corpus entities', () => {
  const types = new Set(graph.nodes.map((node) => node.type))
  assert.ok(types.has('artifact'))
  assert.ok(types.has('entity'))
  for (const node of graph.nodes) {
    assert.ok(node.id && node.type && node.label, `${node.id}: incomplete node`)
  }
  for (const edge of graph.edges) {
    assert.ok(edge.source && edge.target && edge.rel, `${edge.source}: incomplete edge`)
  }
})
