import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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

  const [focusId, setFocusId] = useState('tinai:kurinji')
  const [typeFilter, setTypeFilter] = useState(null)
  const [hover, setHover] = useState(null)

  const focus = nodeById[focusId]

  /**
   * Fix #2 — Node/connection count mismatch:
   * The previous `.slice(0, 26)` hard-cap silently discarded edges for
   * high-degree nodes (e.g. Kurinji had 47 connections but only 26 rendered
   * while the sidebar showed the true unfiltered count of 47).
   * All neighbours are now included; the canvas scales to fit them (fix #3).
   */
  const neighbours = useMemo(() => {
    const seen = new Map()
    for (const e of adjacency[focusId] || []) {
      const n = nodeById[e.other]
      if (!n) continue
      if (typeFilter && n.type !== typeFilter) continue
      const prev = seen.get(n.id)
      if (!prev || e.weight > prev.weight) seen.set(n.id, { node: n, rel: e.rel, weight: e.weight })
    }
    return [...seen.values()].sort((a, b) => b.weight - a.weight)
  }, [focusId, typeFilter, adjacency, nodeById])

  const grouped = useMemo(() => {
    const g = { tinai: [], poem: [], poet: [], karu: [] }
    for (const nb of neighbours) g[nb.node.type]?.push(nb)
    return g
  }, [neighbours])

  const focusMeta = TYPE_META[focus?.type] || TYPE_META.tinai

  /**
   * Fix #3 — Dynamic canvas sizing:
   * R, and the overall SVG dimensions (DIM×DIM), are now computed from the
   * actual node count so that:
   *   • Adjacent nodes are separated by at least MIN_ARC_PX circumference px,
   *     preventing the label packing that caused collisions at high node counts.
   *   • The viewBox grows to contain all nodes; no nodes are clipped outside
   *     a too-small fixed viewport.
   *
   * With 26 nodes: R≈224, DIM≈632 (similar to the old fixed 820×620).
   * With 47 nodes: R≈404, DIM≈992 — all nodes fit with clear spacing.
   * The SVG renders with `w-full h-auto` so it scales responsively.
   */
  const nodeCount = neighbours.length
  const MIN_ARC_PX = 54    // minimum circumference arc between adjacent nodes
  const LABEL_MARGIN = 92  // radial clearance beyond node circles for text labels
  const R = nodeCount > 1
    ? Math.max(210, Math.ceil((nodeCount * MIN_ARC_PX) / (2 * Math.PI)))
    : 210
  const DIM = (R + LABEL_MARGIN) * 2
  const CX = DIM / 2
  const CY = DIM / 2

  const maxW = Math.max(1, ...neighbours.map((n) => n.weight))
  const nodeRad = (w, base) => base + Math.sqrt(w / maxW) * 14

  /**
   * Fix #1 + #3 — Label collision avoidance:
   * Pre-compute per-node cosine/sine and text-anchor so that labels are
   * offset in the RADIAL direction (outward from center) rather than always
   * "below" the node in SVG screen space. The old approach collided badly:
   *   • Top-half nodes: label pushed toward canvas center (into other labels)
   *   • Left/right nodes: label extends sideways, overlapping adjacent nodes
   *
   * text-anchor strategy: right half → 'start', left half → 'end',
   * top/bottom → 'middle'. This ensures text extends away from center for
   * every sector of the circle without needing SVG text rotation.
   */
  const placed = neighbours.map((nb, i) => {
    const a = (i / neighbours.length) * Math.PI * 2 - Math.PI / 2
    const cos = Math.cos(a)
    const sin = Math.sin(a)
    const anchor = cos > 0.15 ? 'start' : cos < -0.15 ? 'end' : 'middle'
    return { ...nb, x: CX + cos * R, y: CY + sin * R, cos, sin, anchor }
  })

  function deepLink(node) {
    if (node.type === 'poem') return `/book/${node.id.replace('poem:', '')}`
    if (node.type === 'tinai') return `/world?tinai=${node.tinai}`
    return null
  }

  // Raw (unfiltered) connection count — always matches the true degree of the node
  const totalConnections = (adjacency[focusId] || []).length

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-8">
      <Reveal y={-16}>
        <header className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge variant="accent" size="sm">பிணைப்பு வரைபடம்</Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-primary">Connections Graph</h1>
          <p className="text-muted text-base sm:text-lg leading-relaxed">
            The Sangam corpus as an interlinked knowledge network —{' '}
            <strong className="text-primary">{GRAPH.meta.nodes}</strong> nodes and{' '}
            <strong className="text-primary">{GRAPH.meta.edges}</strong> relationships mined from{' '}
            {GRAPH.meta.records.toLocaleString()} classical verses.
            Click any node to explore its connections.
          </p>
        </header>
      </Reveal>

      {/* Legend & Filter Controls */}
      <div className="flex flex-wrap items-center justify-center gap-1.5" role="group" aria-label="Filter by type">
        <button
          onClick={() => setTypeFilter(null)}
          className={[
            'text-xs rounded-full border px-3.5 py-1.5 font-medium transition-all focus-ring',
            !typeFilter
              ? 'border-accent bg-accent text-on-accent shadow-xs'
              : 'border-line text-muted hover:text-primary hover:bg-surface-alt hover:border-line-strong',
          ].join(' ')}
          aria-pressed={!typeFilter}
        >
          All Types
        </button>
        {Object.entries(TYPE_META).map(([type, m]) => (
          <button
            key={type}
            onClick={() => setTypeFilter((t) => (t === type ? null : type))}
            className={[
              'text-xs rounded-full border px-3.5 py-1.5 font-medium flex items-center gap-1.5 transition-all focus-ring',
              typeFilter === type
                ? 'border-line-strong text-primary bg-surface-alt shadow-xs'
                : 'border-line text-muted hover:text-primary hover:bg-surface-alt hover:border-line-strong',
            ].join(' ')}
            aria-pressed={typeFilter === type}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: m.color }} />
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">

        {/* Fix #3: viewBox is now `DIM × DIM` — scales with node count */}
        <Card variant="flat" className="p-2 overflow-hidden border-line min-h-[320px] sm:min-h-[400px]">
          <svg
            viewBox={`0 0 ${DIM} ${DIM}`}
            className="w-full h-auto"
            role="img"
            aria-label="Knowledge graph visualization"
          >
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
              const r = nodeRad(nb.weight, 9)
              const dim = hover && hover !== nb.node.id

              /**
               * Fix #1 — Radial label placement:
               * l1x/l1y: label line 1 offset from node center in the outward
               * radial direction (cos/sin of the node's angle × baseOffset).
               *
               * Label line 2 (rel + weight) placement:
               *   • Top-half nodes (sin < -0.15): push further outward along the
               *     same radial direction so the weight text doesn't intrude back
               *     toward center or overlap the node circle.
               *   • Bottom/left/right (sin ≥ -0.15): offset 13px downward in SVG
               *     screen space, which is approximately outward or sideways and
               *     reads naturally as a second line of text.
               */
              const baseOffset = r + 14
              const l1x = nb.cos * baseOffset
              const l1y = nb.sin * baseOffset
              const l2x = nb.sin < -0.15 ? nb.cos * (baseOffset + 13) : l1x
              const l2y = nb.sin < -0.15 ? nb.sin * (baseOffset + 13) : l1y + 13

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
                    x={l1x} y={l1y}
                    textAnchor={nb.anchor}
                    dominantBaseline="middle"
                    className="tamil pointer-events-none font-medium"
                    fontSize="11"
                    fill="currentColor"
                  >
                    {shortLabel(nb.node).slice(0, 16)}
                  </text>
                  <text
                    x={l2x} y={l2y}
                    textAnchor={nb.anchor}
                    dominantBaseline="middle"
                    fontSize="9"
                    fillOpacity="0.65"
                    fill="currentColor"
                    className="pointer-events-none font-mono"
                  >
                    {REL_LABEL[nb.rel]} · {nb.weight}
                  </text>
                </g>
              )
            })}

            {/* Focus Central Node */}
            <g transform={`translate(${CX},${CY})`}>
              <circle
                r={nodeRad(focus?.weight || maxW, 24)}
                fill={focusMeta.color}
                stroke={focusMeta.ring}
                strokeWidth="3"
              />
              <text
                textAnchor="middle" y="4"
                fontSize="13" fontWeight="700"
                fill="#fff"
                className="tamil pointer-events-none"
              >
                {shortLabel(focus || {}).slice(0, 14)}
              </text>
            </g>
          </svg>
        </Card>

        {/**
         * Fix #4 — Sidebar overflow:
         * The focus-node summary card is always visible (not scrolled).
         * All grouped connection lists live in a single overflow-y-auto
         * container with a max-h cap so they never push the sidebar beyond
         * the viewport. `divide-y divide-line` provides clear visual section
         * separators between type groups without extra spacing hacks.
         * Section headers are `sticky top-0` within the scroll container so
         * you always know which type group you're browsing.
         */}
        <aside className="space-y-3 lg:sticky lg:top-20">
          {/* Focus node summary */}
          <Card variant="glass" className="p-5 space-y-3 border-accent/20">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-surface"
                style={{ background: focusMeta.color, ringColor: focusMeta.ring }}
              />
              <span className="text-[10px] font-bold uppercase tracking-widest text-faint">
                {focusMeta.label}
              </span>
            </div>
            <h2 className="tamil text-lg font-bold text-primary leading-snug">
              {nodeLabel(focus || {})}
            </h2>
            <p className="text-xs text-muted font-mono">
              {typeFilter
                ? `${neighbours.length} / ${totalConnections} Connections`
                : `${totalConnections} Connection${totalConnections !== 1 ? 's' : ''}`}
              {focus?.weight != null && (
                <span className="text-faint"> · weight {focus.weight}</span>
              )}
            </p>
            {focus && deepLink(focus) && (
              <Link to={deepLink(focus)} className="block">
                <Button size="sm" variant="outline" className="w-full">
                  Explore in {focus.type === 'poem' ? 'Library' : 'Sangam World'}
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Button>
              </Link>
            )}
          </Card>

          {/* Grouped connection lists — scoped scroll with type dividers */}
          {neighbours.length > 0 && (
            <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-sm">
              <div className="divide-y divide-line max-h-[60vh] overflow-y-auto">
                {Object.entries(grouped).map(([type, list]) =>
                  list.length ? (
                    <div key={type} className="p-3 space-y-0.5">
                      {/* Sticky section header within the scroll container */}
                      <h3 className="sticky top-0 z-10 bg-surface text-[10px] font-semibold uppercase tracking-wider text-faint flex items-center gap-1.5 px-2 py-1.5 rounded-lg">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: TYPE_META[type].color }}
                        />
                        {TYPE_META[type].label} ({list.length})
                      </h3>
                      {list.map((nb) => (
                        <button
                          key={nb.node.id}
                          onClick={() => setFocusId(nb.node.id)}
                          onMouseEnter={() => setHover(nb.node.id)}
                          onMouseLeave={() => setHover(null)}
                          className={[
                            'w-full text-left flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs transition-all focus-ring',
                            hover === nb.node.id
                              ? 'bg-accent/8 text-primary'
                              : 'text-muted hover:text-primary hover:bg-surface-alt',
                          ].join(' ')}
                        >
                          <span className="tamil font-medium truncate">{shortLabel(nb.node)}</span>
                          <span className="text-[10px] font-mono text-faint shrink-0 tabular-nums">
                            {nb.weight}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      <p className="text-center text-xs text-faint font-mono">
        Graph generated from corpus via{' '}
        <code className="text-[10px] bg-surface-alt px-1.5 py-0.5 rounded border border-line">
          backend/python/knowledge/build_graph.py
        </code>
      </p>
    </div>
  )
}
