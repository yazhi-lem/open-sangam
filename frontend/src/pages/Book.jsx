import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { POEMS, COLLECTIONS, POEM_BY_ID } from '../data/poems.js'
import WordGlossary from '../components/reader/WordGlossary'
import AudioPlayer from '../components/reader/AudioPlayer'
import { analyzeWord, translateVerse } from '../services/geminiApi'
import Reveal, { RevealGroup } from '../components/motion/Reveal'
import ScrollTilt from '../components/motion/ScrollTilt'
import AnimatedCard from '../components/motion/AnimatedCard'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import Toast from '../components/ui/Toast'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Skeleton from '../components/ui/Skeleton'

// ── Library (Gallery) ─────────────────────────────────────────────────────

function PoemCard({ poem }) {
  const available = poem.available
  const nav = useNavigate()

  const cardClassName = [
    'group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border p-5 transition-all duration-200',
    available
      ? 'border-line bg-surface hover:border-accent/50 hover:shadow-md hover:-translate-y-0.5 hover:ring-1 hover:ring-accent/15 cursor-pointer'
      : 'border-line bg-surface-alt/30 cursor-default',
  ].join(' ')

  const content = (
    <>
      <div className="flex items-center justify-between gap-2 mb-3">
        <Badge variant={poem.collection === '8thokai' ? 'anthology' : 'idyll'} size="sm">
          {poem.collection === '8thokai' ? 'Anthology' : 'Idyll'}
        </Badge>
        {available ? (
          <Badge variant="success" size="sm" dot="emerald">
            Available
          </Badge>
        ) : (
          <Badge variant="default" size="sm" dot="gray">
            Soon
          </Badge>
        )}
      </div>

      <h3
        className={[
          'tamil text-lg sm:text-xl font-bold leading-snug mb-1 shrink-0 line-clamp-2 break-words [overflow-wrap:anywhere] min-h-[2.6em]',
          available ? 'text-primary group-hover:text-accent transition-colors' : 'text-muted',
        ].join(' ')}
      >
        {poem.ta}
      </h3>

      <p
        className={[
          'text-sm mb-4 shrink-0 leading-relaxed break-words [overflow-wrap:anywhere] line-clamp-2 min-h-[2.2em]',
          available ? 'text-muted' : 'text-faint',
        ].join(' ')}
      >
        {poem.en}
      </p>

      <div className="mt-auto pt-3 border-t border-line/60 flex items-center justify-between text-xs">
        <span className={`font-mono ${available ? 'text-muted' : 'text-faint'}`}>
          {poem.count.toLocaleString()} {poem.unit}
        </span>
        {available && (
          <span className="text-accent font-semibold flex items-center gap-1 group-hover:gap-1.5 transition-all duration-150">
            Read
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
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

function Library() {
  const [searchQuery, setSearchQuery] = useState('')
  const [collectionFilter, setCollectionFilter] = useState('all')

  const filteredPoems = POEMS.filter((p) => {
    const matchesCollection = collectionFilter === 'all' || p.collection === collectionFilter
    const matchesSearch =
      !searchQuery.trim() ||
      p.ta.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.en.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCollection && matchesSearch
  })

  const byCollection = Object.entries(COLLECTIONS)
    .filter(([key]) => collectionFilter === 'all' || collectionFilter === key)
    .map(([key, meta]) => ({
      key,
      meta,
      poems: filteredPoems.filter((p) => p.collection === key),
    }))

  const totalVisible = filteredPoems.length

  return (
    <div className="min-h-screen bg-page">
      {/* Hero Header */}
      <Reveal as="div" className="max-w-6xl mx-auto px-4 sm:px-8 pt-12 pb-8" duration={0.6}>
        <div className="space-y-3">
          <Badge variant="accent" size="sm">Scholar Archive</Badge>
          <h1 className="tamil text-4xl sm:text-6xl font-extrabold text-primary leading-tight">
            சங்க நூலகம்
          </h1>
          <p className="text-xl sm:text-2xl text-muted font-light tracking-wide">
            Library of Sangam Classical Works
          </p>
          <p className="text-sm text-muted max-w-2xl leading-relaxed">
            Classical Tamil literature from the Sangam period (c. 300 BCE – 300 CE).
            Original verses, modern commentary (Urai), and English translations.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 p-4 rounded-2xl border border-line bg-surface/80 backdrop-blur-sm shadow-xs">
          <div className="w-full sm:w-80">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Search by poem name..."
              icon={
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
              }
            />
          </div>

          <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
            {[
              { id: 'all',       label: `All Works (18)` },
              { id: '8thokai',   label: 'Anthologies (8)' },
              { id: '10paddu',   label: 'Idylls (10)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCollectionFilter(tab.id)}
                className={[
                  'px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap focus-ring',
                  collectionFilter === tab.id
                    ? 'bg-accent text-on-accent shadow-xs'
                    : 'text-muted hover:text-primary hover:bg-surface-alt',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {searchQuery && (
            <p className="text-xs text-faint shrink-0 sm:ml-auto">
              {totalVisible} result{totalVisible !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </Reveal>

      {/* Collections Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-24 space-y-16">
        {byCollection.map(({ key, meta, poems }) => (
          <ScrollTilt key={key} intensity={4}>
            <div className="space-y-6">
              <div className="flex items-baseline gap-3 pb-3 border-b border-line">
                <h2 className="tamil text-2xl sm:text-3xl font-bold text-primary">{meta.ta}</h2>
                <span className="text-muted text-sm sm:text-base font-medium">{meta.en}</span>
                <span className="ml-auto text-xs font-mono text-faint">{poems.length} works</span>
              </div>
              <p className="text-sm text-muted max-w-2xl leading-relaxed">{meta.desc}</p>

              {poems.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <p className="text-4xl" aria-hidden="true">📭</p>
                  <p className="text-muted font-medium text-sm">
                    No poems match your search in this collection.
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-accent text-xs hover:underline focus-ring rounded"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <RevealGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" amount={0.06}>
                  {poems.map((poem) => (
                    <PoemCard key={poem.id} poem={poem} />
                  ))}
                </RevealGroup>
              )}
            </div>
          </ScrollTilt>
        ))}
      </div>
    </div>
  )
}

// ── ClickableVerse ────────────────────────────────────────────────────────

function ClickableVerse({ text, onWordClick, fontSize = 'md' }) {
  const words = text.split(/(\s+)/)

  const sizeClasses = {
    sm: 'text-xl leading-[2]',
    md: 'text-2xl leading-[2.1]',
    lg: 'text-3xl leading-[2.2]',
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
            className="hover:text-accent hover:underline decoration-dotted underline-offset-4 cursor-pointer transition-colors focus-ring rounded px-0.5 active:scale-95"
          >
            {part}
          </button>
        )
      )}
    </p>
  )
}

// ── Reader ────────────────────────────────────────────────────────────────

function Reader({ poem }) {
  const [sections, setSections] = useState([])
  const [active, setActive] = useState(0)
  const [layer, setLayer] = useState('both')
  const [sidebarOpen, setSidebar] = useState(true)
  const [fontSize, setFontSize] = useState('md')
  const [sectionFilter, setSectionFilter] = useState('')
  const [toastMsg, setToastMsg] = useState(null)
  const contentRef = useRef(null)

  // WordGlossary state
  const [glossaryWord, setGlossaryWord] = useState(null)
  const [glossaryLoading, setGlossaryLoading] = useState(false)

  // AI translation state
  const [aiTranslation, setAiTranslation] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)

  useEffect(() => {
    poem.loader().then((mod) => {
      setSections(mod.default)
      setActive(0)
    })
  }, [poem])

  useEffect(() => {
    return () => {
      setAiTranslation(null)
      setAiError(null)
    }
  }, [active])

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [active])

  async function handleWordClick(wordText) {
    const clean = wordText.replace(/[^\u0B80-\u0BFFa-zA-Z]/g, '').trim()
    if (!clean) return
    setGlossaryWord({ form: wordText })
    setGlossaryLoading(true)
    try {
      const result = await analyzeWord(clean)
      setGlossaryWord({ form: wordText, ...result })
    } catch (err) {
      console.error('Word analysis failed:', err)
    } finally {
      setGlossaryLoading(false)
    }
  }

  async function handleAiTranslate(sangamText) {
    setAiLoading(true)
    setAiError(null)
    try {
      const result = await translateVerse(sangamText, 'english')
      setAiTranslation(result.text)
    } catch (err) {
      setAiError(err.message || 'Translation failed')
    } finally {
      setAiLoading(false)
    }
  }

  function handleCopyVerse(text) {
    if (!text) return
    navigator.clipboard.writeText(text)
    setToastMsg('Verse copied to clipboard!')
  }

  if (!sections.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <LoadingSpinner size="lg" />
        <div className="text-center space-y-1">
          <p className="text-muted text-sm font-medium">Loading verses…</p>
          <p className="text-faint text-xs">Preparing interlinear translations</p>
        </div>
      </div>
    )
  }

  const sec = sections[active]
  const isSection = 'sectionNumber' in sec
  const num = isSection ? sec.sectionNumber : sec.number
  const label = isSection ? sec.title : null

  const filteredSections = sections.filter((s) => {
    if (!sectionFilter.trim()) return true
    const q = sectionFilter.toLowerCase()
    const n = isSection ? s.sectionNumber : s.number
    const t = isSection ? s.title : s.poet || ''
    return String(n).includes(q) || t.toLowerCase().includes(q)
  })

  const LAYER_TABS = [
    { id: 'sangam',  label: 'Tamil',   labelShort: 'Ta' },
    { id: 'urai',    label: 'உரை',     labelShort: 'உ' },
    { id: 'english', label: 'English', labelShort: 'En' },
    { id: 'both',    label: 'All',     labelShort: 'All' },
  ]

  return (
    <div className="flex h-[calc(100vh-56px)] bg-page overflow-hidden">
      <Toast message={toastMsg} type="success" onClose={() => setToastMsg(null)} />

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        aria-hidden={!sidebarOpen}
        inert={!sidebarOpen}
        className={[
          'shrink-0 border-r border-line bg-surface flex flex-col transition-all duration-250 ease-out z-20',
          sidebarOpen ? 'w-64 md:w-72' : 'w-0 overflow-hidden',
        ].join(' ')}
      >
        {/* Poem meta header */}
        <div className="p-4 border-b border-line bg-surface-alt/40 space-y-3">
          <Link
            to="/book"
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors font-medium focus-ring rounded"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Library
          </Link>

          <div className="flex items-center gap-2">
            <Badge variant={poem.collection === '8thokai' ? 'anthology' : 'idyll'} size="sm">
              {poem.collection === '8thokai' ? 'Anthology' : 'Idyll'}
            </Badge>
            <span className="text-[10px] text-faint font-mono ml-auto">{sections.length} verses</span>
          </div>

          <div>
            <h2 className="tamil text-lg font-bold text-primary leading-tight">{poem.ta}</h2>
            <p className="text-xs text-muted mt-0.5">{poem.en}</p>
          </div>

          <Input
            size="sm"
            type="text"
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            onClear={() => setSectionFilter('')}
            placeholder="Filter verses..."
            icon={
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
            }
          />
        </div>

        {/* Section list */}
        <nav className="flex-1 overflow-y-auto py-1" aria-label="Verse navigation">
          {filteredSections.length === 0 ? (
            <p className="text-center text-faint text-xs py-8 px-4">
              No verses match "{sectionFilter}"
            </p>
          ) : (
            filteredSections.map((s) => {
              const indexInFull = sections.findIndex((item) => item.id === s.id)
              const n = isSection ? s.sectionNumber : s.number
              const t = isSection ? s.title : null
              const isActive = indexInFull === active
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setActive(indexInFull)
                    if (window.innerWidth < 768) setSidebar(false)
                  }}
                  className={[
                    'w-full text-left px-4 py-3 flex items-start gap-3 transition-all border-l-2 focus-ring min-h-[52px]',
                    isActive
                      ? 'border-accent bg-accent/8 text-primary font-semibold'
                      : 'border-transparent text-muted hover:text-primary hover:bg-surface-alt/60',
                  ].join(' ')}
                >
                  <span className="text-[10px] font-mono text-faint pt-0.5 w-6 shrink-0 text-right tabular-nums">
                    {n}
                  </span>
                  <span className="text-xs leading-relaxed line-clamp-2 tamil">
                    {t || (s.poet ? s.poet : `Verse #${n}`)}
                  </span>
                </button>
              )
            })
          )}
        </nav>
      </aside>

      {/* ── Content Area ─────────────────────────────────────────────── */}
      <main ref={contentRef} className="flex-1 overflow-y-auto bg-page">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 space-y-6">

          {/* Reader Toolbar */}
          <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl border border-line bg-surface/80 backdrop-blur-sm shadow-xs">
            {/* Sidebar toggle */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSidebar((o) => !o)}
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              aria-label="Toggle section sidebar"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>
              </svg>
              <span className="hidden sm:inline">{sidebarOpen ? 'Hide' : 'Sections'}</span>
            </Button>

            <span className="w-px h-5 bg-line shrink-0" aria-hidden="true" />

            {/* Font size */}
            <div className="flex items-center gap-0.5" role="group" aria-label="Font size">
              <span className="text-[10px] font-medium text-faint mr-1 hidden sm:inline">Size:</span>
              {[
                { id: 'sm', label: 'A⁻' },
                { id: 'md', label: 'A' },
                { id: 'lg', label: 'A⁺' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFontSize(f.id)}
                  className={[
                    'w-7 h-7 text-xs font-semibold rounded-lg transition-all focus-ring',
                    fontSize === f.id
                      ? 'bg-surface-alt text-primary shadow-xs'
                      : 'text-faint hover:text-primary hover:bg-surface-alt/60',
                  ].join(' ')}
                  aria-pressed={fontSize === f.id}
                  aria-label={`Font size ${f.id}`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <span className="w-px h-5 bg-line shrink-0" aria-hidden="true" />

            {/* Layer toggles */}
            <div className="flex items-center gap-0.5" role="group" aria-label="View layer">
              {LAYER_TABS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLayer(l.id)}
                  className={[
                    'px-2.5 h-7 text-xs rounded-lg font-medium transition-all focus-ring',
                    layer === l.id
                      ? 'bg-accent text-on-accent shadow-xs'
                      : 'text-muted hover:text-primary hover:bg-surface-alt',
                  ].join(' ')}
                  aria-pressed={layer === l.id}
                >
                  <span className="hidden sm:inline">{l.label}</span>
                  <span className="sm:hidden">{l.labelShort}</span>
                </button>
              ))}
            </div>

            {/* Copy button pushed to the right */}
            <div className="ml-auto">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopyVerse(sec.sangamTamil)}
                title="Copy verse text"
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
                <span className="hidden sm:inline">Copy</span>
              </Button>
            </div>
          </div>

          {/* Section Header */}
          <header className="space-y-3 border-b border-line pb-5">
            <Badge variant="accent" size="sm">
              {poem.en}
              {isSection && sec.lineStart ? ` · lines ${sec.lineStart}–${sec.lineEnd}` : sec.tinai ? ` · ${sec.tinai}` : ''}
            </Badge>
            <h1
              className={[
                'leading-tight font-bold text-primary',
                isSection ? 'tamil text-3xl sm:text-4xl' : 'text-muted text-xl font-mono',
              ].join(' ')}
            >
              {label || `Verse #${num}`}
            </h1>
            {sec.poet && (
              <p className="text-xs text-muted font-medium flex items-center gap-1.5">
                <span className="text-faint">Poet:</span>
                <span className="tamil">{sec.poet}</span>
              </p>
            )}
          </header>

          {/* Original Tamil Verse */}
          {(layer === 'sangam' || layer === 'both') && (
            <Card variant="flat" className="p-6 sm:p-8 space-y-4 border-accent/15">
              <div className="flex items-center justify-between border-b border-line/60 pb-2.5">
                <span className="text-[10px] font-bold text-accent uppercase tracking-widest">
                  Original Classical Tamil
                </span>
                <span className="text-[10px] text-faint italic">
                  Tap any word for etymology
                </span>
              </div>
              <ClickableVerse
                text={sec.sangamTamil}
                onWordClick={handleWordClick}
                fontSize={fontSize}
              />
            </Card>
          )}

          {/* Modern Commentary (Urai) */}
          {(layer === 'urai' || layer === 'both') && (
            <Card variant="default" className="p-6 space-y-3">
              <span className="text-[10px] font-bold text-faint uppercase tracking-widest">
                உரை (Prose Commentary)
              </span>
              {sec.urai ? (
                <p className="tamil text-base sm:text-lg leading-relaxed text-muted">{sec.urai}</p>
              ) : (
                <p className="text-sm text-faint italic">உரை இல்லை — No prose commentary available.</p>
              )}
            </Card>
          )}

          {/* English Translation */}
          {(layer === 'english' || layer === 'both') && (
            <Card variant="default" className="p-6 space-y-4">
              <span className="text-[10px] font-bold text-faint uppercase tracking-widest">
                English Translation
              </span>
              {sec.english ? (
                <p className="text-base sm:text-lg leading-relaxed text-muted">{sec.english}</p>
              ) : aiTranslation ? (
                <div className="space-y-3">
                  <p className="text-base sm:text-lg leading-relaxed text-muted">{aiTranslation}</p>
                  <p className="text-[10px] text-faint italic flex items-center gap-1.5">
                    <span>🤖</span>
                    AI translation · Gemini 2.5 Flash
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-faint italic">
                    No English translation is currently available for this verse.
                  </p>
                  {aiError && (
                    <p className="text-xs text-danger flex items-center gap-1">
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                      </svg>
                      {aiError}
                    </p>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAiTranslate(sec.sangamTamil)}
                    loading={aiLoading}
                    icon="🤖"
                  >
                    Translate with AI
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* Audio Recitation */}
          {sec.audioUrl && (
            <Card variant="flat" className="p-4">
              <AudioPlayer audioUrl={sec.audioUrl} label="Listen to verse recitation" />
            </Card>
          )}

          {/* Previous / Next Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-line gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActive((a) => Math.max(0, a - 1))}
              disabled={active === 0}
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Previous
            </Button>

            <span className="text-xs font-mono text-muted tabular-nums">
              {active + 1} / {sections.length}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setActive((a) => Math.min(sections.length - 1, a + 1))}
              disabled={active === sections.length - 1}
            >
              Next
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Button>
          </div>

          {/* Bottom padding */}
          <div className="h-8" />
        </div>
      </main>

      {/* WordGlossary Overlay */}
      {glossaryWord && (
        <WordGlossary
          word={glossaryWord}
          loading={glossaryLoading}
          onClose={() => setGlossaryWord(null)}
        />
      )}
    </div>
  )
}

// ── Route entry ───────────────────────────────────────────────────────────

export default function Book() {
  const { poemId } = useParams()

  if (!poemId) return <Library />

  const poem = POEM_BY_ID[poemId]
  if (!poem || !poem.available)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-5 text-center px-4">
        <div className="text-5xl" aria-hidden="true">{poem ? '⏳' : '❓'}</div>
        <div className="space-y-2 max-w-sm">
          <p className="text-xl font-semibold text-primary">
            {poem ? `${poem.en} — Coming Soon` : 'Work Not Found'}
          </p>
          <p className="text-muted text-sm leading-relaxed">
            {poem
              ? 'This classical work is being digitized and added to the corpus.'
              : 'The requested classical work is not currently available in the library.'}
          </p>
        </div>
        <Link to="/book">
          <Button variant="outline" size="md" icon="📚">
            Return to Library
          </Button>
        </Link>
      </div>
    )

  return <Reader poem={poem} />
}
