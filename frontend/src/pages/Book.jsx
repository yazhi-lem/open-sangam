import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Columns2, Rows2, ChevronLeft, ChevronRight, Copy, Square, Volume2 } from 'lucide-react'
import { POEMS, COLLECTIONS, POEM_BY_ID } from '../data/poems.js'
import WordGlossary from '../components/reader/WordGlossary'
import AudioPlayer from '../components/reader/AudioPlayer'
import VoiceLayer from '../components/reader/VoiceLayer'
import { normalizeLayer, visibleLayers, draftBadgeLabel, draftBadgeTitle, hasGloss } from '../data/readerLayers.js'
import Reveal, { RevealGroup } from '../components/motion/Reveal'
import AnimatedCard from '../components/motion/AnimatedCard'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import Toast from '../components/ui/Toast'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Chip from '../components/ui/Chip'
import { LAYER_CHIPS, FILTER_CHIPS, IDYLL_NOTE, poemMatchesChip, splitLabel } from '../data/chipLabels.js'
import { TINAI_WORLD } from '../data/tinaiWorld.js'
import useAppStore from '../store/useAppStore'
import {
  LIBRARY_COLLECTIONS,
  LIBRARY_WORKS,
  AVAILABILITY_LABELS,
  ARTIFACTS,
  ARTIFACT_CLASSES,
  artifactClassLabel,
  artifactAvailableLayerCount,
  artifactMatchesQuery,
  languageLabel,
  workMatchesQuery,
} from '../data/library.js'

// ── Library (Gallery) ─────────────────────────────────────────────────────

function PoemCard({ poem }) {
  const available = poem.available
  const nav = useNavigate()

  const cardClassName = `group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border p-5 transition-all duration-200
    ${
      available
        ? 'border-line-strong bg-surface hover:border-accent/60 hover:shadow-md cursor-pointer'
        : 'border-line bg-surface-alt/40 cursor-default opacity-85'
    }`

  const collectionLabel = {
    '8thokai': 'Anthology',
    '10paddu': 'Idyll',
    pathinenkilkkanakku: 'Minor Work',
  }[poem.collection] || 'Work'
  const collectionVariant = {
    '8thokai': 'anthology',
    '10paddu': 'idyll',
    pathinenkilkkanakku: 'accent',
  }[poem.collection] || 'default'

  const content = (
    <>
      <div className="flex items-center justify-between gap-2 mb-3">
        <Badge variant={collectionVariant} size="sm">
          {collectionLabel}
        </Badge>
        {available ? (
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" title="Available in reader" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-line-strong" title="Coming soon" />
        )}
      </div>

      <h3
        className={`tamil text-base sm:text-lg font-bold leading-snug mb-1 shrink-0 line-clamp-2 break-words [overflow-wrap:anywhere] min-h-[2.6em]
          ${available ? 'text-primary group-hover:text-accent' : 'text-muted'}`}
      >
        {poem.ta}
      </h3>

      <p
        className={`text-sm mb-4 shrink-0 leading-relaxed break-words [overflow-wrap:anywhere] line-clamp-2 min-h-[2.2em]
          ${available ? 'text-muted' : 'text-faint'}`}
      >
        {poem.en}
      </p>

      <div className="mt-auto pt-3 border-t border-line/60 flex items-center justify-between text-xs font-mono">
        <span className={available ? 'text-muted' : 'text-faint'}>
          {poem.count.toLocaleString()} {poem.unit}
        </span>
        {available && (
          <span className="text-accent font-semibold group-hover:translate-x-1 transition-transform">
            Read →
          </span>
        )}
      </div>
    </>
  )

  if (available) {
    return (
      <AnimatedCard onClick={() => nav(`/book/${poem.id}`)} className={cardClassName}>
        {content}
      </AnimatedCard>
    )
  }

  return <div className={cardClassName}>{content}</div>
}

// ── Wider Tamil Library (catalogued, not yet all readable) ─────────────────

function CatalogWorkCard({ work }) {
  const status = AVAILABILITY_LABELS[work.availability] || AVAILABILITY_LABELS.metadata
  const readable = work.availability === 'reader'
  return (
    <div className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface p-4 transition-all duration-200">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Badge variant={readable ? 'accent' : 'outline'} size="sm">
          {status.ta} · {status.en}
        </Badge>
        <span className="text-[10px] font-mono text-faint">{work.period}</span>
      </div>
      <h3 className="tamil mb-1 line-clamp-2 min-h-[2.6em] shrink-0 text-lg font-bold leading-snug text-primary sm:text-xl">
        {work.ta}
      </h3>
      <p className="mb-2 line-clamp-1 text-sm text-muted">{work.en}</p>
      <p className="mb-4 line-clamp-2 min-h-[2.2em] text-xs leading-relaxed text-faint">
        {work.author}
      </p>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line/60 pt-3 text-xs">
        <span className="flex flex-wrap gap-1">
          {work.languages.map((code) => (
            <span key={code} className="rounded-full bg-surface-alt px-2 py-0.5 font-mono text-[10px] text-muted">
              {languageLabel(code)}
            </span>
          ))}
          {work.translations?.map((code) => (
            <span key={code} className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent">
              {languageLabel(code)}
            </span>
          ))}
        </span>
        <span className="shrink-0 font-mono text-faint">
          {work.count ? `${work.count.toLocaleString()} ${work.unit}` : work.unit}
        </span>
      </div>
    </div>
  )
}

function ArtifactCard({ artifact }) {
  const nav = useNavigate()
  const cls = artifactClassLabel(artifact.class)
  return (
    <button
      type="button"
      onClick={() => nav(`/artifacts/${artifact.id}`)}
      className="group flex h-full min-w-0 flex-col rounded-2xl border border-line bg-surface p-3.5 text-left transition-all duration-200 hover:border-accent/60 hover:shadow-md focus-ring"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <Badge variant="accent" size="sm">{cls.ta} · {cls.en}</Badge>
        <span className="text-[10px] font-mono text-faint">{artifact.period}</span>
      </div>
      <h3 className="tamil mb-1 line-clamp-2 min-h-[2.6em] text-lg font-bold leading-snug text-primary group-hover:text-accent">
        {artifact.ta}
      </h3>
      <p className="mb-2 line-clamp-1 text-sm text-muted">{artifact.en}</p>
      <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-faint">{artifact.summary}</p>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line/60 pt-3 text-[11px]">
        <span className="font-mono text-faint">
          {artifactAvailableLayerCount(artifact)}/7 layers
        </span>
        <span className="truncate text-muted">{artifact.rights}</span>
      </div>
    </button>
  )
}

function ArtifactCollection({ collection, artifacts }) {
  const language = useAppStore((s) => s.language)
  const L = (ta, en) => (language === 'ta' ? ta : en)
  return (
    <div>
      <div className="space-y-8">
        <div className="border-b border-line-strong pb-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className={`min-w-0 break-words text-2xl font-bold text-primary sm:text-3xl ${language === 'ta' ? 'tamil' : ''}`}>{L(collection.ta, collection.en)}</h2>
            <span className="ml-auto text-xs font-mono text-faint">{artifacts.length} records</span>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{collection.description}</p>
        </div>
        {ARTIFACT_CLASSES.map((cls) => {
          const items = artifacts.filter((artifact) => artifact.class === cls.id)
          if (!items.length) return null
          return (
            <section key={cls.id} className="space-y-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className={`text-lg font-bold text-primary ${language === 'ta' ? 'tamil' : ''}`}>{L(cls.ta, cls.en)}</h3>
                <span className="ml-auto text-xs font-mono text-faint">{items.length}</span>
              </div>
              <p className="text-xs text-faint">{cls.description}</p>
              <RevealGroup className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" amount={0.05}>
                {items.map((artifact) => <ArtifactCard key={artifact.id} artifact={artifact} />)}
              </RevealGroup>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function CatalogCollection({ collection, works }) {
  const language = useAppStore((s) => s.language)
  const L = (ta, en) => (language === 'ta' ? ta : en)
  return (
    <div>
      <div className="space-y-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line-strong pb-3">
          <h2 className={`min-w-0 break-words text-2xl font-bold text-primary sm:text-3xl ${language === 'ta' ? 'tamil' : ''}`}>{L(collection.ta, collection.en)}</h2>
          <span className="ml-auto text-xs font-mono text-faint">{works.length} works</span>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">{collection.description}</p>
        {works.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
            No works matching this search.
          </div>
        ) : (
          <RevealGroup className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" amount={0.08}>
            {works.map((work) => (
              <CatalogWorkCard key={work.id} work={work} />
            ))}
          </RevealGroup>
        )}
      </div>
    </div>
  )
}

function Library() {
  const language = useAppStore((s) => s.language)
  const L = (ta, en) => (language === 'ta' ? ta : en)
  const [searchQuery, setSearchQuery] = useState('')
  const [chipFilter, setChipFilter] = useState(null) // null | id from FILTER_CHIPS

  const filteredPoems = POEMS.filter((p) => {
    const matchesCollection = poemMatchesChip(p, chipFilter)
    const matchesSearch =
      !searchQuery.trim() ||
      p.ta.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.en.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCollection && matchesSearch
  })

  const byCollection = Object.entries(COLLECTIONS)
    .map(([key, meta]) => ({
      key,
      meta,
      poems: filteredPoems.filter((p) => p.collection === key),
    }))

  return (
    <div className="min-h-screen bg-page">
      {/* Header: one line of orientation, then search and the akam / puram / tiṇai chips */}
      <Reveal as="div" className="w-full px-4 sm:px-6 pt-6 pb-5" duration={0.6}>
        <div className="space-y-2">
          <h1 className={`text-2xl sm:text-4xl font-extrabold text-primary leading-tight ${language === 'ta' ? 'tamil' : ''}`}>
            {L('தமிழ் நூலகம்', 'Tamil Library')}
          </h1>
          <p className="text-base sm:text-lg text-muted font-light">
            {L('சங்கம் · பதினெண்கீழ்க்கணக்கு · கலைப்பொருட்கள்', 'Sangam · Pathinenkilkkanakku · Artifacts')}
          </p>
          {/* † draft Tamil, needs native review */}
          <p className={`text-sm text-muted pt-1 ${language === 'ta' ? 'tamil' : ''}`}>
            {L('பாடலைத் தேர்ந்தெடு → படி → பொருள் அறி', 'Choose a poem → Read → Understand')}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder={L("தமிழ் அல்லது ஆங்கிலப் பெயரில் தேடுங்கள்...", "Search by Tamil or English name...")}
            icon="🔍"
          />

          {/* Filter chips: outlined pills, selected = filled ink; scroll sideways on phones */}
          <div
            role="group"
            aria-label="Filter by akam, puram or tiṇai"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 sm:flex-wrap"
          >
            {FILTER_CHIPS.map((c) => (
              <Chip
                key={c.id}
                label={c.label}
                selected={chipFilter === c.id}
                onClick={() => setChipFilter(chipFilter === c.id ? null : c.id)}
              />
            ))}
          </div>
          {chipFilter && (
            <p className="text-xs text-faint">
              <span lang="ta" className="tamil">{IDYLL_NOTE.ta}</span>
              <span> · </span>
              <span lang="en">{IDYLL_NOTE.en}</span>
            </p>
          )}
        </div>
      </Reveal>

      {/* Collections Grid */}
      <div className="w-full px-4 sm:px-6 pb-16 space-y-10">
        {byCollection.map(({ key, meta, poems }) => (
          <div key={key}>
            <div className="space-y-6">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pb-3 border-b border-line-strong">
                <h2 className={`text-xl sm:text-2xl font-bold text-primary break-words min-w-0 ${language === 'ta' ? 'tamil' : ''}`}>{L(meta.ta, meta.en)}</h2>
                <span className="ml-auto text-xs font-mono text-faint">{poems.length} works</span>
              </div>
              <p className="text-sm text-muted max-w-2xl leading-relaxed">{meta.desc}</p>

              {poems.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-line rounded-2xl text-muted text-sm">
                  No poems matching "{searchQuery}" in this collection.
                </div>
              ) : (
                <RevealGroup
                  className={`grid auto-rows-fr grid-cols-1 sm:grid-cols-2 gap-3 ${
                    key === '10paddu' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
                  }`}
                  amount={0.08}
                >
                  {poems.map((poem) => (
                    <PoemCard key={poem.id} poem={poem} />
                  ))}
                </RevealGroup>
              )}
            </div>
          </div>
        ))}

        {!chipFilter &&
          LIBRARY_COLLECTIONS.map((collection) => {
            if (collection.id === 'artifacts') {
              const artifacts = ARTIFACTS.filter((artifact) =>
                artifactMatchesQuery(artifact, searchQuery)
              )
              if (!artifacts.length && searchQuery.trim()) return null
              return (
                <ArtifactCollection
                  key={collection.id}
                  collection={collection}
                  artifacts={artifacts}
                />
              )
            }
            const works = LIBRARY_WORKS.filter(
              (work) =>
                work.collection === collection.id &&
                !POEM_BY_ID[work.id] &&
                workMatchesQuery(work, searchQuery)
            )
            if (!works.length && searchQuery.trim()) return null
            return (
              <CatalogCollection
                key={collection.id}
                collection={collection}
                works={works}
              />
            )
          })}
      </div>
    </div>
  )
}

// ── ClickableVerse ────────────────────────────────────────────────────────

function ClickableVerse({ text, onWordClick, fontSize = 'md' }) {
  const words = text.split(/(\s+)/)

  const sizeClasses = {
    sm: 'text-lg sm:text-xl leading-[2]',
    md: 'text-xl sm:text-2xl leading-[2.1]',
    lg: 'text-2xl sm:text-3xl leading-[2.2]',
  }

  return (
    <p className={`tamil-verse text-primary whitespace-pre-wrap ${sizeClasses[fontSize]}`}>
      {words.map((part, i) =>
        /^\s+$/.test(part) ? (
          part
        ) : (
          <button
            key={i}
            onClick={() => onWordClick(part)}
            aria-label={`Look up definition for ${part}`}
            className="hover:text-accent hover:underline decoration-dotted underline-offset-4 cursor-pointer transition-colors focus-ring rounded px-0.5"
          >
            {part}
          </button>
        )
      )}
    </p>
  )
}

// Marks a commentary/translation layer that has not had scholar sign-off.
// The label is "<Tamil> · <English>" (exactly one ' · '), see data/readerLayers.js.
function DraftBadge({ verse, field }) {
  const label = draftBadgeLabel(verse, field)
  if (!label) return null
  return <Chip variant="badge" label={label} title={draftBadgeTitle(verse, field)} />
}

// Layer chips: pick which of the three layers to read. Scrolls sideways on phones.
function LayerToggle({ layer, onChange }) {
  const language = useAppStore((s) => s.language)
  return (
    <div
      role="group"
      aria-label="Reader layers"
      className="flex w-full gap-1 overflow-x-auto pb-1"
    >
      {LAYER_CHIPS.map((l) => {
        const parts = splitLabel(l.label)
        const label = language === 'ta' ? parts.ta : parts.en
        const selected = layer === l.id
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => onChange(l.id)}
            title={l.label}
            aria-pressed={selected}
            className={`min-h-[32px] shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors focus-ring ${
              selected
                ? 'border-primary bg-primary text-page'
                : 'border-line-strong text-muted hover:border-primary hover:text-primary'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

function InlineVoiceButton({ text }) {
  const [speaking, setSpeaking] = useState(false)

  function toggle() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ta-IN'
    utterance.rate = 0.9
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-muted hover:text-accent hover:border-accent transition-colors focus-ring"
      aria-label={speaking ? 'Stop voice' : 'Listen to verse'}
    >
      {speaking ? <Square size={12} /> : <Volume2 size={13} />}
      {speaking ? 'Stop' : 'Voice'}
    </button>
  )
}


// ── Reader ────────────────────────────────────────────────────────────────

function Reader({ poem, sectionId }) {
  const [sections, setSections] = useState([])
  const [active, setActive] = useState(0)
  const [layer, setLayerState] = useState(() => {
    try {
      const stored = localStorage.getItem('open_sangam_reader_layer')
      if (stored) return normalizeLayer(stored)
    } catch {
      // ignore
    }
    // First visit: the original verse alone on phones (read first, then open a layer);
    // all three layers side by side on wide screens.
    return typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches ? 'all' : 'original'
  }) // 'sangam' | 'urai' | 'english' | 'all'
  const [layoutMode, setLayoutMode] = useState(() => {
    try {
      return localStorage.getItem('open_sangam_reader_layout') || 'h'
    } catch {
      return 'h'
    }
  })
  const [sidebarOpen, setSidebar] = useState(false)
  const [fontSize, setFontSize] = useState('md') // 'sm' | 'md' | 'lg'
  const [sectionFilter, setSectionFilter] = useState('')
  const [toastMsg, setToastMsg] = useState(null)
  const contentRef = useRef(null)

  // WordGlossary state
  const [glossaryWord, setGlossaryWord] = useState(null)

  const setLayer = (next) => {
    const l = normalizeLayer(next)
    setLayerState(l)
    try {
      localStorage.setItem('open_sangam_reader_layer', l)
    } catch {
      // ignore
    }
  }

  // Save layout preference
  const handleSetLayout = (mode) => {
    setLayoutMode(mode)
    try {
      localStorage.setItem('open_sangam_reader_layout', mode)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    let cancelled = false
    let cancelWaiting = () => {}
    const indexOfSection = (list) =>
      sectionId
        ? list.findIndex((s) => String(s.number || s.sectionNumber || s.id) === String(sectionId))
        : -1

    poem.loader().then((mod) => {
      if (cancelled) return
      const first = mod.default
      setSections(first)
      const foundIdx = indexOfSection(first)
      setActive(foundIdx >= 0 ? foundIdx : 0)

      // Long poems ship a small launch slice first. The remaining sections are fetched on the
      // first interaction (or after 8 s), so they never compete with the first paint.
      if (!poem.loadRest) return
      const fetchRest = () =>
        poem.loadRest().then((rest) => {
          if (cancelled) return
          const all = first.concat(rest.default)
          setSections(all)
          if (foundIdx < 0) {
            const lateIdx = indexOfSection(all)
            if (lateIdx >= 0) setActive(lateIdx)
          }
        })
      if (sectionId && foundIdx < 0) {
        fetchRest() // deep link beyond the launch slice
        return
      }
      const events = ['pointerdown', 'keydown', 'touchstart', 'wheel']
      const start = () => {
        stopWaiting()
        fetchRest()
      }
      const timer = setTimeout(start, 8000)
      function stopWaiting() {
        clearTimeout(timer)
        events.forEach((ev) => window.removeEventListener(ev, start))
      }
      events.forEach((ev) => window.addEventListener(ev, start, { passive: true, once: true }))
      cancelWaiting = stopWaiting
    })
    return () => {
      cancelled = true
      cancelWaiting()
    }
  }, [poem, sectionId])

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [active])

  // Keyboard Navigation: Left/Right arrows for verse, H/V for layout
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable) {
        return
      }

      if (e.key === 'ArrowLeft' || e.key === 'k') {
        setActive((a) => Math.max(0, a - 1))
      } else if (e.key === 'ArrowRight' || e.key === 'j') {
        setActive((a) => Math.min(sections.length - 1, a + 1))
      } else if (e.key === 'h' || e.key === 'H') {
        handleSetLayout('h')
      } else if (e.key === 'v' || e.key === 'V') {
        handleSetLayout('v')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sections.length])

  const sec = sections[active]

  const wordGlossaryMap = useMemo(() => {
    const map = new Map()
    if (!sec?.lines) return map
    for (const line of sec.lines) {
      if (!line?.words) continue
      for (const w of line.words) {
        if (!w?.form) continue
        const clean = w.form.replace(/[^\u0B80-\u0BFFa-zA-Z]/g, '').trim()
        if (clean && !map.has(clean)) {
          map.set(clean, w)
        }
      }
    }
    return map
  }, [sec])

  // Glossary comes only from the corpus record; no live AI lookup.
  function handleWordClick(wordText) {
    const clean = wordText.replace(/[^\u0B80-\u0BFFa-zA-Z]/g, '').trim()
    if (!clean) return
    const matchedWord = wordGlossaryMap.get(clean)
    setGlossaryWord({ ...(matchedWord || {}), form: wordText })
  }

  function handleCopyVerse(text) {
    if (!text) return
    navigator.clipboard.writeText(text)
    setToastMsg('Verse copied to clipboard!')
  }

  if (!sections.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-muted text-sm animate-pulse">Loading classical verses...</p>
      </div>
    )
  }

  const show = visibleLayers(layer)
  const contextTinai = sec.tinai ? TINAI_WORLD[sec.tinai] : null
  const glossaryEntries = [...wordGlossaryMap.values()].filter(hasGloss).slice(0, 60)
  const isSection = 'sectionNumber' in sec
  const num = isSection ? sec.sectionNumber : sec.number
  const label = sec.title || sec.heading || sec.poemTitle || null

  // Filter sections by search text
  const filteredSections = sections.filter((s) => {
    if (!sectionFilter.trim()) return true
    const q = sectionFilter.toLowerCase()
    const n = isSection ? s.sectionNumber : s.number
    const t = s.title || s.heading || s.poet || ''
    return String(n).includes(q) || t.toLowerCase().includes(q)
  })

  return (
    <div className="relative flex h-[calc(100dvh-64px)] bg-page overflow-hidden">
      {/* Toast Notification */}
      <Toast message={toastMsg} type="success" onClose={() => setToastMsg(null)} />

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      {/* On phones the section list is an overlay drawer (it used to squeeze the verse into
          ~100px); from md up it is a normal column. */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close section list"
          onClick={() => setSidebar(false)}
          className="md:hidden absolute inset-0 z-20 bg-black/40"
        />
      )}
      <aside
        className={`shrink-0 border-r border-line bg-surface flex flex-col transition-all duration-200 z-30
          max-md:absolute max-md:inset-y-0 max-md:left-0
          ${sidebarOpen ? 'w-[85vw] max-w-sm md:w-72' : 'w-0 overflow-hidden'}`}
      >
        {/* Poem meta */}
        <div className="p-4 border-b border-line bg-surface-alt/40 space-y-2">
          <Link
            to="/book"
            className="inline-flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors font-medium"
          >
            ← Back to Library
          </Link>
          <div className="flex items-center gap-2 pt-1">
            <Badge variant={poem.collection === '8thokai' ? 'anthology' : 'idyll'} size="sm">
              {poem.collection === '8thokai' ? 'Anthology' : 'Idyll'}
            </Badge>
            <span className="text-xs text-faint font-mono">{sections.length} verses</span>
          </div>
          <h2 className="tamil text-xl font-bold text-primary leading-tight pt-1">{poem.ta}</h2>
          <p className="text-xs text-muted">{poem.en}</p>

          {/* Section Quick Search */}
          <div className="pt-2">
            <Input
              size="sm"
              type="text"
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              onClear={() => setSectionFilter('')}
              placeholder="Filter section or poet..."
            />
          </div>
        </div>

        {/* Section list */}
        <nav className="flex-1 overflow-y-auto py-1">
          {filteredSections.map((s) => {
            const indexInFull = sections.findIndex((item) => item.id === s.id)
            const n = isSection ? s.sectionNumber : s.number
            const t = s.title || s.heading || s.poemTitle || null
            const isActive = indexInFull === active
            return (
              <button
                key={s.id}
                onClick={() => {
                  setActive(indexInFull)
                  if (window.innerWidth < 768) setSidebar(false)
                }}
                className={`w-full min-h-[44px] text-left px-3.5 py-2.5 flex items-start gap-2.5 transition-colors border-l-2 focus-ring
                  ${
                    isActive
                      ? 'border-accent bg-accent/10 text-primary font-semibold'
                      : 'border-transparent text-muted hover:text-primary hover:bg-surface-alt/60'
                  }`}
              >
                <span className="text-xs font-mono text-faint pt-0.5 w-6 shrink-0 text-right">{n}</span>
                <span className="text-xs leading-relaxed line-clamp-2 tamil">
                  {t || (s.poet ? s.poet : `Verse #${n}`)}
                </span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* ── Content Area ──────────────────────────────────────────────── */}
      <main ref={contentRef} className="flex-1 overflow-y-auto bg-page flex flex-col">
        {/* Reader Top Controls Toolbar */}
        <div className="sticky top-0 z-10 border-b border-line bg-page/90 backdrop-blur-md px-3 sm:px-6 py-2 sm:py-3 shrink-0">
          <div className="w-full flex flex-wrap items-center justify-between gap-3">
            {/* Left controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSidebar((o) => !o)}
                title="Toggle sidebar"
                aria-label="Toggle section sidebar"
              >
                {sidebarOpen ? '← Hide' : '☰ Sections'}
              </Button>

              {/* Quick Verse Stepper */}
              <div className="flex items-center bg-surface-alt/60 border border-line rounded-xl px-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActive((a) => Math.max(0, a - 1))}
                  disabled={active === 0}
                  className="flex h-11 w-11 items-center justify-center hover:text-accent disabled:opacity-30 transition-colors"
                  title="Previous verse (←)"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="font-mono text-xs font-medium px-1 text-primary">
                  {active + 1} / {sections.length}
                </span>
                <button
                  type="button"
                  onClick={() => setActive((a) => Math.min(sections.length - 1, a + 1))}
                  disabled={active === sections.length - 1}
                  className="flex h-11 w-11 items-center justify-center hover:text-accent disabled:opacity-30 transition-colors"
                  title="Next verse (→)"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setFontSize((f) => (f === 'sm' ? 'md' : f === 'md' ? 'lg' : 'sm'))}
                aria-label={`Text size: ${fontSize === 'sm' ? 'small' : fontSize === 'md' ? 'medium' : 'large'} (tap to change)`}
                className="sm:hidden flex h-11 min-w-[44px] items-center justify-center rounded-xl border border-line bg-surface-alt/60 px-2 text-sm font-semibold text-primary focus-ring"
              >
                Aa
              </button>
            </div>

            {/* Right controls: Layout Mode + Font Size + Layer Toggles */}
            <div className="flex w-full sm:w-auto items-center gap-2 sm:gap-3 flex-wrap">
              {/* Layout Switcher (H vs V) */}
              <div className="hidden lg:flex items-center gap-1 border-r border-line pr-3">
                <span className="text-[11px] text-faint mr-1 font-semibold hidden md:inline">Layout:</span>
                <button
                  type="button"
                  onClick={() => handleSetLayout('h')}
                  className={`min-h-[44px] min-w-[44px] justify-center p-1.5 rounded-lg flex items-center gap-1 text-xs font-medium transition-all ${
                    layoutMode === 'h'
                      ? 'bg-accent text-on-accent font-bold shadow-xs'
                      : 'text-muted hover:text-primary hover:bg-surface-alt'
                  }`}
                  title="Horizontal Side-by-Side Split View (Single Screen)"
                >
                  <Columns2 size={13} />
                  <span className="text-[11px] font-bold">H</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetLayout('v')}
                  className={`min-h-[44px] min-w-[44px] justify-center p-1.5 rounded-lg flex items-center gap-1 text-xs font-medium transition-all ${
                    layoutMode === 'v'
                      ? 'bg-accent text-on-accent font-bold shadow-xs'
                      : 'text-muted hover:text-primary hover:bg-surface-alt'
                  }`}
                  title="Vertical Stacked View"
                >
                  <Rows2 size={13} />
                  <span className="text-[11px] font-bold">V</span>
                </button>
              </div>

              {/* Font Size Adjuster */}
              <div className="hidden sm:flex items-center gap-1 border-r border-line pr-3">
                <span className="text-[11px] text-faint mr-1 font-medium hidden sm:inline">Text:</span>
                {[
                  { id: 'sm', label: 'A-' },
                  { id: 'md', label: 'A' },
                  { id: 'lg', label: 'A+' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFontSize(f.id)}
                    className={`min-h-[44px] min-w-[44px] px-2 text-xs font-medium rounded-md transition-colors focus-ring ${
                      fontSize === f.id ? 'bg-primary text-page font-bold' : 'text-muted hover:text-primary'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Layer Toggles */}
              <LayerToggle layer={layer} onChange={setLayer} />
            </div>
          </div>
        </div>

        {/* ── Main Presentation Canvas ─────────────────────────── */}
        <div className="flex-1 px-4 sm:px-6 md:px-8 py-6">
          <div className="w-full space-y-4">
            {/* Verse identity / copy strip */}
            <Card variant="flat" className="flex flex-wrap items-center justify-between gap-3 border-accent/30 p-4 shadow-xs">
              <div className="min-w-0">
                <Badge variant="accent" size="sm">
                  {poem.en} {isSection && sec.lineStart ? `· lines ${sec.lineStart}–${sec.lineEnd}` : `· ${sec.tinai || ''}`}
                </Badge>
                <h1 className={`mt-1 truncate font-bold text-primary ${label || isSection ? 'tamil text-xl sm:text-2xl' : 'text-lg font-mono'}`}>
                  {label || `Verse #${num}`}
                </h1>
                {sec.poet && <p className="tamil text-xs text-muted">புலவர்: {sec.poet}</p>}
              </div>
              <div className="flex items-center gap-2">
                <InlineVoiceButton text={sec.sangamTamil} />
                <Button size="sm" variant="ghost" onClick={() => handleCopyVerse(sec.sangamTamil)} icon={<Copy size={13} />}>
                  Copy
                </Button>
              </div>
            </Card>

            <div className={layoutMode === 'h' ? 'grid gap-4 lg:grid-cols-2' : 'space-y-4'}>
              {show.original && (
                <Card variant="flat" className="space-y-3 border-accent/20 p-4 sm:p-6">
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className="text-xs font-semibold text-accent">Original · மூலம்</span>
                    <InlineVoiceButton text={sec.sangamTamil} />
                  </div>
                  <ClickableVerse text={sec.sangamTamil} onWordClick={handleWordClick} fontSize={fontSize} />
                </Card>
              )}

              {show.transliteration && (
                <Card variant="default" className="space-y-2 p-4 sm:p-6">
                  <p className="text-xs font-semibold text-accent">Transliteration · ஒலிபெயர்ப்பு</p>
                  {sec.transliteration ? (
                    <p className="whitespace-pre-wrap text-base leading-relaxed text-primary">{sec.transliteration}</p>
                  ) : (
                    <p className="text-sm text-faint italic">Transliteration is not yet available for this verse.</p>
                  )}
                </Card>
              )}

              {show.voice && (
                <Card variant="default" className="space-y-2 p-4 sm:p-6">
                  <p className="text-xs font-semibold text-accent">Voice · குரல்</p>
                  <VoiceLayer text={sec.sangamTamil} />
                  {sec.audioUrl && <AudioPlayer audioUrl={sec.audioUrl} label="Scholar recording" />}
                </Card>
              )}

              {show.urai && (
                <Card variant="default" className="space-y-3 p-4 sm:p-6">
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className="text-xs font-bold text-accent">உரை · Modern Tamil</span>
                    <DraftBadge verse={sec} field="urai" />
                  </div>
                  {sec.urai ? (
                    <p className="tamil text-base leading-relaxed text-primary">{sec.urai}</p>
                  ) : (
                    <p className="text-sm text-faint italic">உரை இல்லை (No prose commentary available)</p>
                  )}
                </Card>
              )}

              {show.english && (
                <Card variant="default" className="space-y-3 p-4 sm:p-6">
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className="text-xs font-bold text-accent">English</span>
                    <DraftBadge verse={sec} field="english" />
                  </div>
                  {sec.english ? (
                    <p className="text-base leading-relaxed text-primary">{sec.english}</p>
                  ) : (
                    <p className="text-sm text-faint italic">English translation is being prepared.</p>
                  )}
                </Card>
              )}

              {show.glossary && (
                <Card variant="default" className="space-y-2 p-4 sm:p-6">
                  <p className="text-xs font-semibold text-accent">Glossary · சொற்கள்</p>
                  {glossaryEntries.length ? (
                    <dl className="divide-y divide-line/60">
                      {glossaryEntries.map((word) => (
                        <div key={word.form} className="grid grid-cols-[7rem_1fr] gap-3 py-1.5 text-sm">
                          <dt className="tamil font-semibold text-primary">{word.form}</dt>
                          <dd className="text-muted">{word.gloss || word.etymology || word.root || '—'}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-sm text-faint italic">No word glossary has been attached to this verse yet.</p>
                  )}
                </Card>
              )}

              {show.notes && (
                <Card variant="default" className="space-y-2 p-4 sm:p-6">
                  <p className="text-xs font-semibold text-accent">Notes · குறிப்புகள்</p>
                  {sec.culturalNotes?.length ? (
                    <ul className="list-disc space-y-1.5 pl-5 text-sm text-primary">
                      {sec.culturalNotes.map((note, index) => (
                        <li key={index}><strong>{note.title}</strong>{note.description ? ` — ${note.description}` : ''}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-faint italic">No editorial notes for this verse yet.</p>
                  )}
                </Card>
              )}

              {show.poetics && (
                <Card variant="default" className="space-y-2 p-4 sm:p-6">
                  <p className="text-xs font-semibold text-accent">Poetics · யாப்பு</p>
                  {sec.poetics ? (
                    <p className="text-sm leading-relaxed text-primary">{sec.poetics}</p>
                  ) : contextTinai?.poetry ? (
                    <div className="space-y-2">
                      <p className="tamil text-sm leading-relaxed text-primary">{contextTinai.poetry.classic}</p>
                      <p className="text-xs text-muted">{contextTinai.poetry.poem}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-faint italic">Metre and poetics metadata is not yet attached.</p>
                  )}
                </Card>
              )}

              {show.context && (
                <Card variant="default" className="space-y-2 p-4 sm:p-6">
                  <p className="text-xs font-semibold text-accent">Context · சூழல்</p>
                  {contextTinai ? (
                    <div className="space-y-1.5 text-sm text-primary">
                      <p><strong>{contextTinai.ta}</strong> — {contextTinai.atmosphere.season.desc}</p>
                      <p className="text-muted">Deity: {contextTinai.deity.ta}</p>
                      <p className="text-muted">People: {contextTinai.people.map((p) => p.ta).join(' · ')}</p>
                      <p className="text-muted">Life: {contextTinai.crafts.map((c) => c.ta).join(' · ')}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-faint italic">This verse has no tiṇai context tag.</p>
                  )}
                </Card>
              )}
            </div>
          </div>

          {/* Previous / Next Navigation Footer */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 pt-8 pb-4 border-t border-line mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActive((a) => Math.max(0, a - 1))}
              disabled={active === 0}
            >
              ← Previous Verse
            </Button>

            <span className="text-xs font-mono text-muted">
              {active + 1} / {sections.length}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setActive((a) => Math.min(sections.length - 1, a + 1))}
              disabled={active === sections.length - 1}
            >
              Next Verse →
            </Button>
          </div>
        </div>
      </main>

      {/* WordGlossary Overlay */}
      {glossaryWord && (
        <WordGlossary
          word={glossaryWord}
          verse={sec}
          onClose={() => setGlossaryWord(null)}
        />
      )}
    </div>
  )
}

// ── Route entry ───────────────────────────────────────────────────────────

export default function Book() {
  const { poemId, sectionId } = useParams()

  if (!poemId) return <Library />

  const poem = POEM_BY_ID[poemId]
  if (!poem || !poem.available)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center px-4">
        <p className="text-xl font-semibold text-primary">
          {poem ? `${poem.en} — Coming Soon` : 'Poem Not Found'}
        </p>
        <p className="text-muted text-sm">The classical work you requested is being digitized into the corpus.</p>
        <Link to="/book">
          <Button variant="outline" size="sm">← Return to Library</Button>
        </Link>
      </div>
    )

  return <Reader poem={poem} sectionId={sectionId} />
}
