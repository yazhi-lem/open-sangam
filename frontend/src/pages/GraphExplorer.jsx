import { useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Minus, Plus, RotateCcw, Search } from 'lucide-react'
import GRAPH from '@data/knowledge/graph.json'
import { POEM_BY_ID } from '../data/poems'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Reveal from '../components/motion/Reveal'

const TYPE_META = {
  tinai: { color: '#b45309', ring: '#f59e0b', label: 'Tiṇai' },
  poem: { color: '#4f46e5', ring: '#818cf8', label: 'Poem' },
  poet: { color: '#059669', ring: '#34d399', label: 'Poet' },
  karu: { color: '#e11d48', ring: '#fb7185', label: 'Karu-poruḷ' },
  artifact: { color: '#0d9488', ring: '#5eead4', label: 'Artifact term' },
  entity: { color: '#7c3aed', ring: '#c4b5fd', label: 'Entity' },
}

const GRAPH_W = 900
const GRAPH_H = 700
const GRAPH_CX = GRAPH_W / 2
const GRAPH_CY = GRAPH_H / 2

const REL_LABEL = {
  HAS_TINAI: 'is set in',
  WROTE_IN: 'wrote in',
  COMPOSED: 'composed',
  ATTESTS: 'attests',
  MENTIONS: 'mentions',
}

function nodeLabel(node) {
  if (!node) return ''
  if (node.type === 'poem') {
    const p = POEM_BY_ID[node.id.replace('poem:', '')]
    return p ? `${p.ta} · ${p.en}` : node.label
  }
  return node.label
}

function shortLabel(node) {
  if (!node) return ''
  if (node.type === 'poem') {
    const p = POEM_BY_ID[node.id.replace('poem:', '')]
    return p ? p.en : node.label
  }
  return node.label
}

export default function GraphExplorer({ embedded = false }) {
  const { nodeById, adjacency } = useMemo(() => {
    const nodeById = Object.fromEntries(GRAPH.nodes.map((n) => [n.id, n]))
    const adjacency = Object.fromEntries(GRAPH.nodes.map((n) => [n.id, []]))
    for (const e of GRAPH.edges) {
      if (adjacency[e.source]) adjacency[e.source].push({ ...e, other: e.target })
      if (adjacency[e.target]) adjacency[e.target].push({ ...e, other: e.source })
    }
    return { nodeById, adjacency }
  }, [])

  const [searchParams, setSearchParams] = useSearchParams()
  const focusId = searchParams.get('focus') || 'tinai:kurinji'
  const [typeFilter, setTypeFilter] = useState(null)
  const [depth, setDepth] = useState(1)
  const [hover, setHover] = useState(null)
  const [search, setSearch] = useState('')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const drag = useRef(null)

  function setFocusId(nextFocusId) {
    const next = new URLSearchParams(searchParams)
    next.set('focus', nextFocusId)
    setSearchParams(next, { replace: true })
    setHover(null)
  }

  const focus = nodeById[focusId]

  const neighbours = useMemo(() => {
    const seen = new Map()
    const queue = [{ id: focusId, level: 0, parent: null, rel: null, weight: 0 }]
    while (queue.length) {
      const current = queue.shift()
      if (current.level >= depth) continue
      for (const edge of adjacency[current.id] || []) {
        const node = nodeById[edge.other]
        if (!node) continue
        if (typeFilter && node.type !== typeFilter && node.id !== focusId) continue
        const key = node.id
        const candidate = {
          node,
          level: current.level + 1,
          parent: current.id,
          rel: edge.rel,
          weight: edge.weight,
        }
        const prev = seen.get(key)
        if (!prev || candidate.weight > prev.weight) seen.set(key, candidate)
        if (!prev) queue.push({ id: node.id, level: candidate.level, parent: node.id })
      }
    }
    return [...seen.values()]
      .sort((a, b) => a.level - b.level || b.weight - a.weight)
      .slice(0, depth === 1 ? 32 : 70)
  }, [focusId, typeFilter, depth, adjacency, nodeById])

  const maxW = Math.max(1, ...neighbours.map((n) => n.weight))
  const rad = (w, base) => base + Math.sqrt(w / maxW) * 13

  const placed = useMemo(() => {
    const levels = new Map()
    for (const item of neighbours) {
      if (!levels.has(item.level)) levels.set(item.level, [])
      levels.get(item.level).push(item)
    }
    const out = []
    for (const [level, list] of [...levels.entries()].sort((a, b) => a[0] - b[0])) {
      const radius = level === 1 ? 190 : 285
      list.forEach((item, index) => {
        const angle = (index / Math.max(1, list.length)) * Math.PI * 2 - Math.PI / 2
        out.push({
          ...item,
          x: GRAPH_CX + Math.cos(angle) * radius,
          y: GRAPH_CY + Math.sin(angle) * radius,
        })
      })
    }
    return out
  }, [neighbours])

  const placedById = useMemo(
    () => Object.fromEntries(placed.map((item) => [item.node.id, item])),
    [placed]
  )

  const grouped = useMemo(() => {
    const groups = {}
    for (const item of neighbours) {
      if (!groups[item.node.type]) groups[item.node.type] = []
      groups[item.node.type].push(item)
    }
    return groups
  }, [neighbours])

  const focusMeta = TYPE_META[focus?.type] || TYPE_META.tinai
  const types = GRAPH.meta.nodeTypes || Object.keys(TYPE_META)
  const tinaiNodes = GRAPH.nodes.filter((node) => node.type === 'tinai' && node.tinai !== 'unknown')

  function deepLink(node) {
    if (!node) return null
    if (node.type === 'poem') return `/book/${node.id.replace('poem:', '')}`
    if (node.type === 'tinai') return `/world?tinai=${node.id.replace('tinai:', '')}`
    if (node.type === 'artifact') return `/artifacts/${node.id.replace('artifact:', '')}`
    if (node.type === 'poet' || node.type === 'karu' || node.type === 'entity') return '/world#research'
    return null
  }

  function submitSearch(event) {
    event.preventDefault()
    const q = search.trim().toLowerCase()
    if (!q) return
    const found = GRAPH.nodes.find((node) =>
      nodeLabel(node).toLowerCase().includes(q) || shortLabel(node).toLowerCase().includes(q)
    )
    if (found) setFocusId(found.id)
  }

  function onPointerDown(event) {
    drag.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function onPointerMove(event) {
    if (!drag.current) return
    setPan({
      x: drag.current.panX + (event.clientX - drag.current.x),
      y: drag.current.panY + (event.clientY - drag.current.y),
    })
  }

  function endDrag() {
    drag.current = null
  }

  return (
    <div className={embedded ? 'w-full space-y-4' : 'mx-auto max-w-6xl space-y-8 px-4 py-12 sm:px-6 md:py-16'}>
      {!embedded && (
        <Reveal y={-16}>
          <header className="mx-auto max-w-3xl space-y-3 text-center">
            <Badge variant="accent" size="sm">பிணைப்பு வரைபடம்</Badge>
            <h1 className="text-4xl font-extrabold text-primary sm:text-6xl">Connections Graph</h1>
            <p className="text-base leading-relaxed text-muted sm:text-lg">
              <strong className="text-primary">{GRAPH.meta.nodes}</strong> nodes and{' '}
              <strong className="text-primary">{GRAPH.meta.edges}</strong> relationships mined from{' '}
              {GRAPH.meta.records.toLocaleString()} records. Explore tiṇai, poems, poets, karu,
              artifact terms and corpus entities.
            </p>
          </header>
        </Reveal>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-2">
        <span className="px-1 text-[10px] font-semibold uppercase tracking-wide text-faint">Tiṇai</span>
        {tinaiNodes.map((node) => {
          const active = focusId === node.id
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => setFocusId(node.id)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                active ? 'border-accent bg-accent/15 text-accent' : 'border-line text-muted hover:border-accent'
              }`}
              title={node.label}
            >
              {node.label.split(' · ')[0]}
              <span className="ml-1 font-mono text-[9px] opacity-70">{node.weight}</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setTypeFilter(null)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            !typeFilter ? 'border-accent bg-accent text-on-accent' : 'border-line text-muted hover:border-accent'
          }`}
        >
          All
        </button>
        {types.map((type) => {
          const meta = TYPE_META[type] || TYPE_META.karu
          return (
            <button
              key={type}
              onClick={() => setTypeFilter((current) => (current === type ? null : type))}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                typeFilter === type
                  ? 'border-line-strong bg-surface-alt text-primary'
                  : 'border-line text-muted hover:border-accent'
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
              {meta.label}
            </button>
          )
        })}
        <div className="ml-auto flex items-center gap-1 rounded-full border border-line p-0.5">
          {[1, 2].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDepth(value)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                depth === value ? 'bg-primary text-page' : 'text-muted hover:text-primary'
              }`}
            >
              {value}-hop
            </button>
          ))}
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_300px]">
        <Card variant="flat" className="overflow-hidden border-line p-2">
          <div className="mb-2 flex flex-wrap items-center gap-2 px-1">
            <form onSubmit={submitSearch} className="relative min-w-[12rem] flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search a node…"
                className="min-h-[36px] w-full rounded-full border border-line bg-surface-alt/60 pl-8 pr-3 text-xs text-primary placeholder:text-faint focus:border-accent focus:outline-none"
              />
            </form>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))} className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted hover:text-primary" aria-label="Zoom out"><Minus size={13} /></button>
              <button type="button" onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))} className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted hover:text-primary" aria-label="Zoom in"><Plus size={13} /></button>
              <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }} className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted hover:text-primary" aria-label="Reset view"><RotateCcw size={13} /></button>
            </div>
          </div>

          <svg
            viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`}
            className="h-auto w-full touch-none select-none"
            role="img"
            aria-label="Knowledge graph visualization"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
            onWheel={(event) => {
              event.preventDefault()
              setZoom((z) => Math.max(0.5, Math.min(2.5, z + (event.deltaY > 0 ? -0.08 : 0.08))))
            }}
          >
            <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
              {placed.map((item) => {
                const parent = item.parent === focusId ? null : placedById[item.parent]
                const x1 = parent ? parent.x : GRAPH_CX
                const y1 = parent ? parent.y : GRAPH_CY
                const active = !hover || hover === item.node.id || item.node.id === focusId
                return (
                  <line
                    key={`e-${item.node.id}`}
                    x1={x1}
                    y1={y1}
                    x2={item.x}
                    y2={item.y}
                    stroke={TYPE_META[item.node.type]?.color || '#999'}
                    strokeOpacity={active ? 0.42 : 0.1}
                    strokeWidth={1 + Math.sqrt(item.weight / maxW) * 3}
                  />
                )
              })}

              {placed.map((item) => {
                const meta = TYPE_META[item.node.type] || TYPE_META.karu
                const r = rad(item.weight, item.level === 1 ? 8 : 5)
                const dim = hover && hover !== item.node.id
                return (
                  <g
                    key={item.node.id}
                    transform={`translate(${item.x},${item.y})`}
                    className="cursor-pointer transition-opacity"
                    opacity={dim ? 0.28 : 1}
                    onClick={(event) => {
                      event.stopPropagation()
                      setFocusId(item.node.id)
                    }}
                    onPointerDown={(event) => event.stopPropagation()}
                    onMouseEnter={() => setHover(item.node.id)}
                    onMouseLeave={() => setHover(null)}
                  >
                    <title>{nodeLabel(item.node)}</title>
                    <circle r={r} fill={meta.color} stroke={meta.ring} strokeWidth="2" />
                    {item.level === 1 && (
                      <>
                        <text y={r + 12} textAnchor="middle" fontSize="10" fill="currentColor" className="tamil pointer-events-none">
                          {shortLabel(item.node).slice(0, 18)}
                        </text>
                        <text y={r + 22} textAnchor="middle" fontSize="8" fill="currentColor" fillOpacity="0.6" className="pointer-events-none font-mono">
                          {REL_LABEL[item.rel]} · {item.weight}
                        </text>
                      </>
                    )}
                  </g>
                )
              })}

              <g transform={`translate(${GRAPH_CX},${GRAPH_CY})`}>
                <circle r={rad(focus?.weight || maxW, 22)} fill={focusMeta.color} stroke={focusMeta.ring} strokeWidth="3" />
                <text textAnchor="middle" y="4" fontSize="12" fontWeight="700" fill="#fff" className="tamil pointer-events-none">
                  {shortLabel(focus).slice(0, 16)}
                </text>
              </g>
            </g>
          </svg>
          <p className="px-1 text-[10px] text-faint">
            Drag to pan · scroll to zoom · click a node to focus · {neighbours.length} visible connections
          </p>
        </Card>

        <aside className="space-y-4 lg:sticky lg:top-20">
          <Card variant="glass" className="space-y-2 border-accent/25 p-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-faint">
              <span className="h-2 w-2 rounded-full" style={{ background: focusMeta.color }} />
              {focusMeta.label}
            </span>
            <h2 className="tamil text-lg font-bold leading-snug text-primary">{nodeLabel(focus)}</h2>
            <p className="text-[10px] font-mono text-muted">
              {(adjacency[focusId] || []).length} direct links · weight {focus?.weight || 0}
            </p>
            {deepLink(focus) && (
              <Link to={deepLink(focus)}>
                <Button size="sm" variant="outline" className="mt-1 w-full">
                  Open {focus?.type === 'poem' ? 'in Library' : focus?.type === 'artifact' ? 'in Artifact Reader' : 'in Sangam World'} →
                </Button>
              </Link>
            )}
          </Card>

          {Object.entries(grouped).map(([type, list]) => (
            <div key={type} className="space-y-1">
              <h3 className="flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-faint">
                <span className="h-2 w-2 rounded-full" style={{ background: TYPE_META[type]?.color || '#999' }} />
                {TYPE_META[type]?.label || type} ({list.length})
              </h3>
              <Card variant="default" className="max-h-60 space-y-0.5 overflow-y-auto p-1">
                {list.map((item) => (
                  <button
                    key={item.node.id}
                    type="button"
                    onClick={() => setFocusId(item.node.id)}
                    onMouseEnter={() => setHover(item.node.id)}
                    onMouseLeave={() => setHover(null)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] text-muted transition-colors hover:bg-surface-alt hover:text-primary"
                  >
                    <span className="tamil truncate font-medium">{shortLabel(item.node)}</span>
                    <span className="shrink-0 font-mono text-[9px] text-faint">{REL_LABEL[item.rel]} {item.weight}</span>
                  </button>
                ))}
              </Card>
            </div>
          ))}
        </aside>
      </div>

      <p className="text-center text-[10px] text-faint">
        {GRAPH.meta.nodes} nodes · {GRAPH.meta.edges} edges · {GRAPH.meta.records.toLocaleString()} records ·
        regenerated by <code>backend/python/knowledge/build_graph.py</code>
      </p>
    </div>
  )
}
