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

  const content = (
    <>
      <div className="flex items-center justify-between gap-2 mb-3">
        <Badge variant={poem.collection === '8thokai' ? 'anthology' : 'idyll'} size="sm">
          {poem.collection === '8thokai' ? 'Anthology' : 'Idyll'}
        </Badge>
        {available ? (
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" title="Available in reader" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-line-strong" title="Coming soon" />
        )}
      </div>

      <h3
        className={`tamil text-lg sm:text-xl font-bold leading-snug mb-1 shrink-0 line-clamp-2 break-words [overflow-wrap:anywhere] min-h-[2.6em]
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

function Library() {
  const [searchQuery, setSearchQuery] = useState('')
  const [collectionFilter, setCollectionFilter] = useState('all') // 'all' | '8thokai' | '10paddu'

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
          <p className="text-sm text-muted max-w-2xl leading-relaxed pt-1">
            Classical Tamil literature from the Sangam period (c. 300 BCE – 300 CE). Original verses, modern commentary (Urai), and English translations.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-line bg-surface-alt/50 backdrop-blur-sm">
          <div className="w-full sm:w-72">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Search by poem name in Tamil or English..."
              icon="🔍"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Works (18)' },
              { id: '8thokai', label: 'Anthologies (8)' },
              { id: '10paddu', label: 'Idylls (10)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCollectionFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap focus-ring ${
                  collectionFilter === tab.id
                    ? 'bg-accent text-on-accent shadow-xs'
                    : 'text-muted hover:text-primary hover:bg-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Collections Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-24 space-y-16">
        {byCollection.map(({ key, meta, poems }) => (
          <ScrollTilt key={key} intensity={6}>
            <div className="space-y-6">
              <div className="flex items-baseline gap-3 pb-3 border-b border-line-strong">
                <h2 className="tamil text-2xl sm:text-3xl font-bold text-primary">{meta.ta}</h2>
                <span className="text-muted text-sm sm:text-base font-medium">{meta.en}</span>
                <span className="ml-auto text-xs font-mono text-faint">{poems.length} works</span>
              </div>
              <p className="text-sm text-muted max-w-2xl leading-relaxed">{meta.desc}</p>

              {poems.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-line rounded-2xl text-muted text-sm">
                  No poems matching "{searchQuery}" in this collection.
                </div>
              ) : (
                <RevealGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" amount={0.08}>
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
            className="hover:text-accent hover:underline decoration-dotted underline-offset-4 cursor-pointer transition-colors focus-ring rounded px-0.5"
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
  const [fontSize, setFontSize] = useState('md') // 'sm' | 'md' | 'lg'
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
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-muted text-sm animate-pulse">Loading classical verses...</p>
      </div>
    )
  }

  const sec = sections[active]
  const isSection = 'sectionNumber' in sec
  const num = isSection ? sec.sectionNumber : sec.number
  const label = isSection ? sec.title : null

  // Filter sections by search text
  const filteredSections = sections.filter((s) => {
    if (!sectionFilter.trim()) return true
    const q = sectionFilter.toLowerCase()
    const n = isSection ? s.sectionNumber : s.number
    const t = isSection ? s.title : s.poet || ''
    return String(n).includes(q) || t.toLowerCase().includes(q)
  })

  return (
    <div className="flex h-[calc(100vh-64px)] bg-page overflow-hidden">
      {/* Toast Notification */}
      <Toast message={toastMsg} type="success" onClose={() => setToastMsg(null)} />

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside
        className={`shrink-0 border-r border-line bg-surface flex flex-col transition-all duration-200 z-20
          ${sidebarOpen ? 'w-64 md:w-72' : 'w-0 overflow-hidden'}`}
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
            const t = isSection ? s.title : null
            const isActive = indexInFull === active
            return (
              <button
                key={s.id}
                onClick={() => {
                  setActive(indexInFull)
                  if (window.innerWidth < 768) setSidebar(false)
                }}
                className={`w-full text-left px-3.5 py-2.5 flex items-start gap-2.5 transition-colors border-l-2 focus-ring
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
      <main ref={contentRef} className="flex-1 overflow-y-auto bg-page">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-8">
          {/* Reader Top Controls Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-line bg-surface-alt/40 backdrop-blur-sm shadow-xs">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSidebar((o) => !o)}
                title="Toggle sidebar"
                aria-label="Toggle section sidebar"
              >
                {sidebarOpen ? '← Hide Sidebar' : '☰ Sections'}
              </Button>
            </div>

            {/* Font Size Adjuster */}
            <div className="flex items-center gap-1 border-r border-line pr-3">
              <span className="text-xs text-faint mr-1 font-medium hidden sm:inline">Text:</span>
              {[
                { id: 'sm', label: 'A-' },
                { id: 'md', label: 'A' },
                { id: 'lg', label: 'A+' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFontSize(f.id)}
                  className={`px-2 py-0.5 text-xs font-medium rounded-md transition-colors ${
                    fontSize === f.id ? 'bg-primary text-page font-bold' : 'text-muted hover:text-primary'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Layer Toggles */}
            <div className="flex items-center gap-1">
              {[
                { id: 'sangam', label: 'Tamil' },
                { id: 'urai', label: 'உரை' },
                { id: 'english', label: 'English' },
                { id: 'both', label: 'Both' },
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLayer(l.id)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors focus-ring ${
                    layer === l.id
                      ? 'bg-accent text-on-accent font-semibold shadow-xs'
                      : 'text-muted hover:text-primary hover:bg-surface-alt'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section Header */}
          <header className="space-y-2 border-b border-line pb-6">
            <div className="flex items-center justify-between">
              <Badge variant="accent" size="sm">
                {poem.en} {isSection && sec.lineStart ? `· lines ${sec.lineStart}–${sec.lineEnd}` : `· ${sec.tinai || ''}`}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopyVerse(sec.sangamTamil)}
                title="Copy verse text"
                icon="📋"
              >
                Copy
              </Button>
            </div>

            <h1 className={`leading-tight font-bold text-primary ${isSection ? 'tamil text-3xl sm:text-4xl' : 'text-muted text-xl font-mono'}`}>
              {label || `Verse #${num}`}
            </h1>
            {sec.poet && <p className="text-xs text-muted font-medium tamil">Poet: {sec.poet}</p>}
          </header>

          {/* Original Tamil Verse — Clickable for word etymology glossary */}
          {(layer === 'sangam' || layer === 'both') && (
            <Card variant="flat" className="p-6 sm:p-8 space-y-4 border-accent/20">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                  Original Classical Tamil
                </span>
                <span className="text-[11px] text-faint">Tap any word for etymology</span>
              </div>
              <ClickableVerse text={sec.sangamTamil} onWordClick={handleWordClick} fontSize={fontSize} />
            </Card>
          )}

          {/* Modern Commentary (Urai) */}
          {(layer === 'urai' || layer === 'both') && (
            <Card variant="default" className="p-6 space-y-3">
              <span className="text-xs font-semibold text-faint uppercase tracking-wider">உரை (Prose Commentary)</span>
              {sec.urai ? (
                <p className="tamil text-base sm:text-lg leading-relaxed text-muted">{sec.urai}</p>
              ) : (
                <p className="text-sm text-faint italic">உரை இல்லை (No prose commentary available)</p>
              )}
            </Card>
          )}

          {/* English Translation */}
          {(layer === 'english' || layer === 'both') && (
            <Card variant="default" className="p-6 space-y-4">
              <span className="text-xs font-semibold text-faint uppercase tracking-wider">English Translation</span>
              {sec.english ? (
                <p className="text-base sm:text-lg leading-relaxed text-muted">{sec.english}</p>
              ) : aiTranslation ? (
                <div className="space-y-2">
                  <p className="text-base sm:text-lg leading-relaxed text-muted">{aiTranslation}</p>
                  <p className="text-[10px] text-faint italic">AI translation powered by Gemini 2.5 Flash</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-faint italic">No English translation recorded for this section yet.</p>
                  {aiError && <p className="text-xs text-danger">{aiError}</p>}
                  <Button size="sm" onClick={() => handleAiTranslate(sec.sangamTamil)} loading={aiLoading} icon="🤖">
                    Translate with Gemini AI
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

          {/* Previous / Next Navigation Bar */}
          <div className="flex items-center justify-between pt-8 border-t border-line">
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

  return <Reader poem={poem} />
}
