import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import GRAPH from '@data/knowledge/graph.json'
import { POEM_BY_ID } from '../data/poems'

/**
 * GraphExplorer — an interactive ego-network over the corpus knowledge graph.
 *
 * Every node (tiṇai · poem · poet · karu-poruḷ) is reachable from every other
 * through the relationships the poems themselves assert. Click any node to
 * re-centre the graph on it and reveal its connections. This is the "base
 * world graph" the reader, the Sangam World, and downstream models share.
 */

const TYPE_META = {
  tinai: { color: '#b45309', ring: '#f59e0b', label: 'Tiṇai (landscape)' },
  poem:  { color: '#4f46e5', ring: '#818cf8', label: 'Poem' },
  poet:  { color: '#059669', ring: '#34d399', label: 'Poet' },
  karu:  { color: '#e11d48', ring: '#fb7185', label: 'Karu-poruḷ (native thing)' },
}

const REL_LABEL = {
  HAS_TINAI: 'is set in',
  WROTE_IN:  'wrote in',
  COMPOSED:  'composed',
  ATTESTS:   'attests',
}

// Pretty label: poems get their Tamil/English name from the registry.
function nodeLabel(node) {
  if (node.type === 'poem') {
    const p = POEM_BY_ID[node.id.replace('poem:', '')]
    return p ? `${p.ta} · ${p.en}` : node.label
  }
  return node.label
}
function shortLabel(node) {
  if (node.type === 'poem') {
    const p = POEM_BY_ID[node.id.replace('poem:', '')]
    return p ? p.en : node.label
  }
  if (node.type === 'karu') return node.label.split(' · ')[0]
  return node.label
}

export default function GraphExplorer() {
  const { nodeById, adjacency } = useMemo(() => {
    const nodeById = Object.fromEntries(GRAPH.nodes.map((n) => [n.id, n]))
    const adjacency = Object.fromEntries(GRAPH.nodes.map((n) => [n.id, []]))
    for (const e of GRAPH.edges) {
      if (adjacency[e.source]) adjacency[e.source].push({ ...e, other: e.target })
      if (adjacency[e.target]) adjacency[e.target].push({ ...e, other: e.source })
    }
    return { nodeById, adjacency }
  }, [])

  const [focusId, setFocusId] = useState('tinai:kurinji')
  const [typeFilter, setTypeFilter] = useState(null) // null = all
  const [hover, setHover] = useState(null)

  const focus = nodeById[focusId]

  // Ego network: neighbours of focus, filtered + ranked by edge weight.
  const neighbours = useMemo(() => {
    const seen = new Map()
    for (const e of adjacency[focusId] || []) {
      const n = nodeById[e.other]
      if (!n) continue
      if (typeFilter && n.type !== typeFilter) continue
      const prev = seen.get(n.id)
      if (!prev || e.weight > prev.weight) seen.set(n.id, { node: n, rel: e.rel, weight: e.weight })
    }
    return [...seen.values()].sort((a, b) => b.weight - a.weight).slice(0, 26)
  }, [focusId, typeFilter, adjacency, nodeById])

  // Radial layout around a fixed centre.
  const W = 820, H = 620, CX = W / 2, CY = H / 2
  const R = Math.min(W, H) / 2 - 90
  const maxW = Math.max(1, ...neighbours.map((n) => n.weight))
  const rad = (w, base) => base + Math.sqrt(w / maxW) * 14

  const placed = neighbours.map((nb, i) => {
    const a = (i / neighbours.length) * Math.PI * 2 - Math.PI / 2
    return { ...nb, x: CX + Math.cos(a) * R, y: CY + Math.sin(a) * R }
  })

  // Group neighbours for the side panel.
  const grouped = useMemo(() => {
    const g = { tinai: [], poem: [], poet: [], karu: [] }
    for (const nb of neighbours) g[nb.node.type]?.push(nb)
    return g
  }, [neighbours])

  const focusMeta = TYPE_META[focus?.type] || TYPE_META.tinai

  function deepLink(node) {
    if (node.type === 'poem') return `/book/${node.id.replace('poem:', '')}`
    if (node.type === 'tinai') return `/world?tinai=${node.tinai}`
    return null
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <header className="text-center space-y-3 max-w-3xl mx-auto">
        <p className="tamil text-accent text-lg tracking-widest">பிணைப்பு வரைபடம்</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-primary">Connections Graph</h1>
        <p className="text-muted leading-relaxed">
          The Sangam corpus as one interlinked world — {GRAPH.meta.nodes} nodes and{' '}
          {GRAPH.meta.edges} relationships mined from {GRAPH.meta.records.toLocaleString()} verses.
          Click any node to travel its connections.
        </p>
      </header>

      {/* Legend + filters */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => setTypeFilter(null)}
          className={`text-xs rounded-full border px-3 py-1.5 transition-colors ${
            !typeFilter ? 'border-line-strong text-primary bg-surface-alt' : 'border-line text-muted hover:text-primary'
          }`}
        >
          All
        </button>
        {Object.entries(TYPE_META).map(([type, m]) => (
          <button
            key={type}
            onClick={() => setTypeFilter((t) => (t === type ? null : type))}
            className={`text-xs rounded-full border px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
              typeFilter === type ? 'border-line-strong text-primary bg-surface-alt' : 'border-line text-muted hover:text-primary'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Graph canvas */}
        <div className="rounded-2xl border border-line bg-surface-alt/30 overflow-hidden">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Knowledge graph">
            {/* edges */}
            {placed.map((nb) => (
              <line
                key={`e-${nb.node.id}`}
                x1={CX} y1={CY} x2={nb.x} y2={nb.y}
                stroke={TYPE_META[nb.node.type]?.color || '#999'}
                strokeOpacity={hover && hover !== nb.node.id ? 0.12 : 0.35}
                strokeWidth={1 + Math.sqrt(nb.weight / maxW) * 3}
              />
            ))}
            {/* neighbour nodes */}
            {placed.map((nb) => {
              const m = TYPE_META[nb.node.type] || TYPE_META.karu
              const r = rad(nb.weight, 9)
              const dim = hover && hover !== nb.node.id
              return (
                <g
                  key={nb.node.id}
                  transform={`translate(${nb.x},${nb.y})`}
                  className="cursor-pointer"
                  opacity={dim ? 0.4 : 1}
                  onClick={() => setFocusId(nb.node.id)}
                  onMouseEnter={() => setHover(nb.node.id)}
                  onMouseLeave={() => setHover(null)}
                >
                  <circle r={r} fill={m.color} stroke={m.ring} strokeWidth="1.5" />
                  <text
                    y={r + 12} textAnchor="middle"
                    className="tamil pointer-events-none"
                    fontSize="11" fill="currentColor"
                  >
                    {shortLabel(nb.node).slice(0, 16)}
                  </text>
                  <text y={r + 24} textAnchor="middle" fontSize="9" fillOpacity="0.6" fill="currentColor" className="pointer-events-none">
                    {REL_LABEL[nb.rel]} · {nb.weight}
                  </text>
                </g>
              )
            })}
            {/* focus node */}
            <g transform={`translate(${CX},${CY})`}>
              <circle r={rad(focus?.weight || maxW, 22)} fill={focusMeta.color} stroke={focusMeta.ring} strokeWidth="3" />
              <text textAnchor="middle" y="4" fontSize="13" fontWeight="700" fill="#fff" className="tamil pointer-events-none">
                {shortLabel(focus || {}).slice(0, 14)}
              </text>
            </g>
          </svg>
        </div>

        {/* Focus panel */}
        <aside className="space-y-5 lg:sticky lg:top-20">
          <div className="rounded-xl border border-line bg-surface-alt/40 p-5 space-y-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-faint">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: focusMeta.color }} />
              {focusMeta.label}
            </span>
            <h2 className="tamil text-lg font-semibold text-primary leading-snug">{nodeLabel(focus || {})}</h2>
            <p className="text-xs text-muted">
              {(adjacency[focusId] || []).length} connections · weight {focus?.weight}
            </p>
            {focus && deepLink(focus) && (
              <Link to={deepLink(focus)} className="inline-block text-xs text-accent hover:text-accent-strong">
                Open in {focus.type === 'poem' ? 'Library' : 'Sangam World'} →
              </Link>
            )}
          </div>

          {Object.entries(grouped).map(([type, list]) =>
            list.length ? (
              <div key={type} className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-faint flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: TYPE_META[type].color }} />
                  {TYPE_META[type].label} · {list.length}
                </h3>
                <ul className="space-y-1">
                  {list.map((nb) => (
                    <li key={nb.node.id}>
                      <button
                        onClick={() => setFocusId(nb.node.id)}
                        onMouseEnter={() => setHover(nb.node.id)}
                        onMouseLeave={() => setHover(null)}
                        className="w-full text-left flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted hover:text-primary hover:bg-surface-alt transition-colors"
                      >
                        <span className="tamil truncate">{shortLabel(nb.node)}</span>
                        <span className="text-[10px] font-mono text-faint shrink-0">{REL_LABEL[nb.rel]} {nb.weight}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          )}
        </aside>
      </div>

      <p className="text-center text-xs text-faint">
        Graph regenerated from the corpus via{' '}
        <code className="text-muted">backend/python/knowledge/build_graph.py</code>
      </p>
    </div>
  )
}
