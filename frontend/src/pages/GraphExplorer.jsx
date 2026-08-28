import { useMemo, useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import GRAPH from '@data/knowledge/graph.json'
import { POEM_BY_ID } from '../data/poems'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Reveal from '../components/motion/Reveal'

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

  const [searchParams] = useSearchParams()
  const initialFocusId = searchParams.get('focus') || 'tinai:kurinji'
  const [focusId, setFocusId] = useState(initialFocusId)
  const [typeFilter, setTypeFilter] = useState(null)
  const [hover, setHover] = useState(null)

  // Sync URL param with internal state for deep linking
  useEffect(() => {
    const urlFocus = searchParams.get('focus')
    if (urlFocus && urlFocus !== focusId) {
      setFocusId(urlFocus)
    }
  }, [searchParams, focusId])

  const focus = nodeById[focusId]

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

  const W = 820, H = 620, CX = W / 2, CY = H / 2
  const R = Math.min(W, H) / 2 - 90
  const maxW = Math.max(1, ...neighbours.map((n) => n.weight))
  const rad = (w, base) => base + Math.sqrt(w / maxW) * 14

  const placed = neighbours.map((nb, i) => {
    const a = (i / neighbours.length) * Math.PI * 2 - Math.PI / 2
    return { ...nb, x: CX + Math.cos(a) * R, y: CY + Math.sin(a) * R }
  })

  const grouped = useMemo(() => {
    const g = { tinai: [], poem: [], poet: [], karu: [] }
    for (const nb of neighbours) g[nb.node.type]?.push(nb)
    return g
  }, [neighbours])

  const focusMeta = TYPE_META[focus?.type] || TYPE_META.tinai

  function deepLink(node) {
    if (!node) return null
    if (node.type === 'poem') return `/book/${node.id.replace('poem:', '')}`
    if (node.type === 'tinai') return `/world?tinai=${node.id.replace('tinai:', '')}`
    if (node.type === 'poet') return `/knowledge#poets` // Link to poets section in knowledge base
    if (node.type === 'karu') return `/knowledge#tinai-porul` // Link to tinai-porul section in knowledge base
    return null
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-8">
      <Reveal y={-16}>
        <header className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge variant="accent" size="sm">பிணைப்பு வரைபடம்</Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-primary">Connections Graph</h1>
          <p className="text-muted text-base sm:text-lg leading-relaxed">
            The Sangam corpus as an interlinked knowledge network — <strong className="text-primary">{GRAPH.meta.nodes}</strong> nodes and{' '}
            <strong className="text-primary">{GRAPH.meta.edges}</strong> relationships mined from {GRAPH.meta.records.toLocaleString()} classical verses.
            Click any node to explore its connections.
          </p>
        </header>
      </Reveal>

      {/* Legend & Filter Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => setTypeFilter(null)}
          className={`text-xs rounded-full border px-3.5 py-1.5 font-medium transition-all focus-ring ${
            !typeFilter
              ? 'border-accent bg-accent text-on-accent shadow-xs'
              : 'border-line text-muted hover:text-primary hover:bg-surface-alt'
          }`}
        >
          All Types
        </button>
        {Object.entries(TYPE_META).map(([type, m]) => (
          <button
            key={type}
            onClick={() => setTypeFilter((t) => (t === type ? null : type))}
            className={`text-xs rounded-full border px-3.5 py-1.5 font-medium flex items-center gap-1.5 transition-all focus-ring ${
              typeFilter === type
                ? 'border-line-strong text-primary bg-surface-alt font-semibold shadow-xs'
                : 'border-line text-muted hover:text-primary hover:bg-surface-alt'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Graph Canvas Card */}
        <Card variant="flat" className="p-2 overflow-hidden border-line">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Knowledge graph visualization">
            {/* Edges */}
            {placed.map((nb) => (
              <line
                key={`e-${nb.node.id}`}
                x1={CX} y1={CY} x2={nb.x} y2={nb.y}
                stroke={TYPE_META[nb.node.type]?.color || '#999'}
                strokeOpacity={hover && hover !== nb.node.id ? 0.12 : 0.4}
                strokeWidth={1.5 + Math.sqrt(nb.weight / maxW) * 3}
              />
            ))}
            {/* Neighbour Nodes */}
            {placed.map((nb) => {
              const m = TYPE_META[nb.node.type] || TYPE_META.karu
              const r = rad(nb.weight, 9)
              const dim = hover && hover !== nb.node.id
              return (
                <g
                  key={nb.node.id}
                  transform={`translate(${nb.x},${nb.y})`}
                  className="cursor-pointer transition-opacity duration-150"
                  opacity={dim ? 0.35 : 1}
                  onClick={() => setFocusId(nb.node.id)}
                  onMouseEnter={() => setHover(nb.node.id)}
                  onMouseLeave={() => setHover(null)}
                >
                  <circle r={r} fill={m.color} stroke={m.ring} strokeWidth="2" />
                  <text
                    y={r + 13} textAnchor="middle"
                    className="tamil pointer-events-none font-medium"
                    fontSize="11" fill="currentColor"
                  >
                    {shortLabel(nb.node).slice(0, 16)}
                  </text>
                  <text y={r + 25} textAnchor="middle" fontSize="9" fillOpacity="0.65" fill="currentColor" className="pointer-events-none font-mono">
                    {REL_LABEL[nb.rel]} · {nb.weight}
                  </text>
                </g>
              )
            })}
            {/* Focus Central Node */}
            <g transform={`translate(${CX},${CY})`}>
              <circle r={rad(focus?.weight || maxW, 24)} fill={focusMeta.color} stroke={focusMeta.ring} strokeWidth="3" />
              <text textAnchor="middle" y="4" fontSize="13" fontWeight="700" fill="#fff" className="tamil pointer-events-none">
                {shortLabel(focus || {}).slice(0, 14)}
              </text>
            </g>
          </svg>
        </Card>

        {/* Focus Details Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-20">
          <Card variant="glass" className="p-5 space-y-3 border-accent/25">
            <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-faint font-semibold">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: focusMeta.color }} />
              {focusMeta.label}
            </span>
            <h2 className="tamil text-xl font-bold text-primary leading-snug">{nodeLabel(focus || {})}</h2>
            <p className="text-xs text-muted font-mono">
              {(adjacency[focusId] || []).length} connections · Weight {focus?.weight}
            </p>
            {focus && deepLink(focus) && (
              <Link to={deepLink(focus)}>
                <Button size="sm" variant="outline" className="w-full mt-1">
                  Open in {focus.type === 'poem' ? 'Library' : focus.type === 'tinai' ? 'Sangam World' : 'Knowledge'} →
                </Button>
              </Link>
            )}
          </Card>

          {Object.entries(grouped).map(([type, list]) =>
            list.length ? (
              <div key={type} className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-faint flex items-center gap-1.5 px-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: TYPE_META[type].color }} />
                  {TYPE_META[type].label} ({list.length})
                </h3>
                <Card variant="default" className="p-1 space-y-0.5">
                  {list.map((nb) => (
                    <button
                      key={nb.node.id}
                      onClick={() => setFocusId(nb.node.id)}
                      onMouseEnter={() => setHover(nb.node.id)}
                      onMouseLeave={() => setHover(null)}
                      className="w-full text-left flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs text-muted hover:text-primary hover:bg-surface-alt transition-colors focus-ring"
                    >
                      <span className="tamil font-medium truncate">{shortLabel(nb.node)}</span>
                      <span className="text-[10px] font-mono text-faint shrink-0">{REL_LABEL[nb.rel]} {nb.weight}</span>
                    </button>
                  ))}
                </Card>
              </div>
            ) : null
          )}
        </aside>
      </div>

      <p className="text-center text-xs text-faint">
        Graph regenerated from corpus via <code>backend/python/knowledge/build_graph.py</code>
      </p>
    </div>
  )
}
