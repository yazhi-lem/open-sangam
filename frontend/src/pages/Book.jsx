import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { POEMS, COLLECTIONS, POEM_BY_ID } from '../data/poems.js'
import WordGlossary from '../components/reader/WordGlossary'
import AudioPlayer from '../components/reader/AudioPlayer'
import { analyzeWord, translateVerse } from '../services/geminiApi'
import Reveal, { RevealGroup } from '../components/motion/Reveal'
import ScrollTilt from '../components/motion/ScrollTilt'
import AnimatedCard from '../components/motion/AnimatedCard'

// ── Library (Gallery) ─────────────────────────────────────────────────────

function PoemCard({ poem }) {
  const available = poem.available
  const nav = useNavigate()

  // `h-full` + `min-w-0` are what make this work inside a CSS grid:
  // grid cells stretch to a uniform row height by default, but a card
  // only *fills* that height if it opts in with h-full, and a child only
  // *wraps* instead of forcing the column wider if it opts out of the
  // default min-width:auto with min-w-0. `overflow-hidden` is a last-line
  // guard so nothing (long unbroken Tamil strings included) can ever
  // visually escape the card's rounded border.
  const cardClassName = `group relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border p-5
    ${available
      ? 'border-line-strong bg-surface hover:border-accent/50 cursor-pointer'
      : 'border-line bg-surface-alt/60 cursor-default'
    }`

  const content = (
    <>
      {/* Collection badge */}
      <span className={`inline-block shrink-0 w-fit text-[10px] font-medium uppercase tracking-widest px-2 py-0.5 rounded mb-3
        ${poem.collection === '8thokai' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-600'}`}>
        {poem.collection === '8thokai' ? 'Anthology' : 'Idyll'}
      </span>

      {/* Tamil name — clamped to 2 lines with a reserved min-height so
          every card's title block is the same size whether the name is
          short (மலைபடுகடாம்) or long (திருமுருகாற்றுப்படை). break-words +
          overflow-wrap:anywhere let a single long Tamil word (which has
          no spaces to break on) wrap mid-syllable instead of overflowing. */}
      <h3
        className={`tamil text-lg sm:text-xl font-semibold leading-[1.3] mb-1 shrink-0
          line-clamp-2 break-words [overflow-wrap:anywhere] min-h-[2.6em]
          ${available ? 'text-primary group-hover:text-accent' : 'text-muted'}`}
      >
        {poem.ta}
      </h3>

      {/* English name — same clamp treatment, smaller reserved height */}
      <p
        className={`text-sm mb-3 shrink-0 leading-snug break-words [overflow-wrap:anywhere]
          line-clamp-2 min-h-[2.2em] ${available ? 'text-muted' : 'text-faint'}`}
      >
        {poem.en}
      </p>

      {/* Count — pinned to the bottom of the card so metadata always
          lines up across a row regardless of how many title lines
          preceded it */}
      <p className={`text-xs font-mono mt-auto pt-1 truncate ${available ? 'text-muted' : 'text-faint'}`}>
        {poem.count.toLocaleString()} {poem.unit}
      </p>

      {/* Status dot */}
      <div className="absolute top-4 right-4 shrink-0">
        {available
          ? <span className="w-2 h-2 rounded-full bg-emerald-400 block" title="Available" />
          : <span className="w-2 h-2 rounded-full bg-line-strong block" title="Coming soon" />
        }
      </div>
    </>
  )

  // Only available poems get the hover-lift treatment — a "coming soon"
  // card lifting on hover would be a false affordance since it's not
  // actually clickable.
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
  const byCollection = Object.entries(COLLECTIONS).map(([key, meta]) => ({
    key, meta,
    poems: POEMS.filter(p => p.collection === key),
  }))

  return (
    <div className="min-h-screen bg-page">

      {/* Hero */}
      <Reveal as="div" className="max-w-4xl mx-auto px-8 pt-16 pb-10" duration={0.7}>
        <p className="text-xs uppercase tracking-[0.2em] text-muted font-medium mb-3">
          Open Sangam
        </p>
        <h1 className="tamil text-5xl font-bold text-primary leading-tight mb-2">
          சங்க நூலகம்
        </h1>
        <p className="text-xl text-muted font-light tracking-wide mb-1">
          Library of Sangam
        </p>
        <p className="text-sm text-muted mt-3 max-w-xl leading-relaxed">
          Classical Tamil literature from the Sangam period (c.&thinsp;300&thinsp;BCE – 300&thinsp;CE).
          Original verse, modern prose rendering, and English translation.
        </p>
      </Reveal>

      {/* Collections */}
      <div className="max-w-4xl mx-auto px-8 pb-24 space-y-14">
        {byCollection.map(({ key, meta, poems }) => (
          <ScrollTilt key={key} intensity={10}>
            <div className="flex items-baseline gap-3 mb-6 pb-3 border-b border-line-strong">
              <h2 className="tamil text-2xl font-semibold text-primary">{meta.ta}</h2>
              <span className="text-muted text-sm">{meta.en}</span>
            </div>
            <p className="text-sm text-muted mb-6 max-w-xl">{meta.desc}</p>
            <RevealGroup className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" amount={0.1}>
              {poems.map(poem => <PoemCard key={poem.id} poem={poem} />)}
            </RevealGroup>
          </ScrollTilt>
        ))}
      </div>

      {/* Footer note */}
      <div className="border-t border-line py-6 text-center text-xs text-faint">
        <span className="tamil">தமிழ் தமிழரின் உயிர்</span>
        {' · '}
        Source: sangathamizh.com · License: CC0
      </div>
    </div>
  )
}

// ── ClickableVerse ────────────────────────────────────────────────────────

function ClickableVerse({ text, onWordClick }) {
  const words = text.split(/(\s+)/)
  return (
    <p className="tamil text-[1.35rem] leading-[2.1] text-primary whitespace-pre-wrap">
      {words.map((part, i) =>
        /^\s+$/.test(part) ? part : (
          <button
            key={i}
            onClick={() => onWordClick(part)}
            className="hover:text-accent hover:underline decoration-dotted underline-offset-4 cursor-pointer transition-colors"
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
  const [sections, setSections]   = useState([])
  const [active, setActive]       = useState(0)
  const [layer, setLayer]         = useState('both')
  const [sidebarOpen, setSidebar] = useState(true)
  const contentRef = useRef(null)

  // WordGlossary state
  const [glossaryWord, setGlossaryWord]     = useState(null)
  const [glossaryLoading, setGlossaryLoading] = useState(false)

  // AI translation state
  const [aiTranslation, setAiTranslation]   = useState(null)
  const [aiLoading, setAiLoading]           = useState(false)
  const [aiError, setAiError]               = useState(null)

  useEffect(() => {
    poem.loader().then(mod => {
      setSections(mod.default)
      setActive(0)
    })
  }, [poem])

  // Reset AI translation when section changes
  useEffect(() => {
    return () => {
      setAiTranslation(null)
      setAiError(null)
    }
  }, [active])

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 })
  }, [active])

  async function handleWordClick(wordText) {
    // Strip punctuation, keep only Tamil (\u0B80-\u0BFF) and Latin characters
    const clean = wordText.replace(/[^\u0B80-\u0BFFa-zA-Z]/g, '').trim()
    if (!clean) return
    setGlossaryWord({ form: wordText })
    setGlossaryLoading(true)
    try {
      const result = await analyzeWord(clean)
      setGlossaryWord({ form: wordText, ...result })
    } catch (err) {
      console.error('Word analysis failed:', err)
      // Keep showing the word form even if analysis fails
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

  if (!sections.length) {
    return (
      <div className="flex items-center justify-center h-full text-muted text-sm">
        Loading…
      </div>
    )
  }

  const sec = sections[active]
  const isSection = 'sectionNumber' in sec
  const num = isSection ? sec.sectionNumber : sec.number
  const label = isSection ? sec.title : null

  return (
    <div className="flex h-[calc(100vh-56px)] bg-page overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className={`shrink-0 border-r border-line-strong flex flex-col overflow-hidden transition-all duration-200
        ${sidebarOpen ? 'w-60' : 'w-0'}`}>

        {/* Poem meta */}
        <div className="px-4 py-4 border-b border-line-strong bg-surface">
          <Link to="/book" className="flex items-center gap-1.5 text-[11px] text-muted hover:text-muted mb-3 transition-colors">
            ← Library
          </Link>
          <span className={`text-[10px] font-medium uppercase tracking-widest px-1.5 py-0.5 rounded
            ${poem.collection === '8thokai' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-600'}`}>
            {poem.collection === '8thokai' ? 'Anthology' : 'Idyll'}
          </span>
          <h2 className="tamil text-lg font-semibold text-primary mt-2 leading-tight">{poem.ta}</h2>
          <p className="text-xs text-muted">{poem.en}</p>
          <p className="text-xs text-faint mt-1 font-mono">{sections.length} {isSection ? 'sections' : 'poems'}</p>
        </div>

        {/* Section list */}
        <nav className="flex-1 overflow-y-auto bg-surface py-1">
          {sections.map((s, i) => {
            const n = isSection ? s.sectionNumber : s.number
            const t = isSection ? s.title : null
            const isActive = i === active
            return (
              <button
                key={s.id}
                onClick={() => setActive(i)}
                className={`w-full text-left px-3 py-2 flex items-start gap-2 transition-colors border-l-2
                  ${isActive
                    ? 'border-accent bg-accent/10 text-primary'
                    : 'border-transparent text-muted hover:text-primary hover:bg-surface-alt'
                  }`}
              >
                <span className="text-[10px] font-mono text-faint pt-0.5 w-5 shrink-0 text-right">{n}</span>
                <span className="text-xs leading-snug line-clamp-2 tamil">
                  {t || (sec.poet ? sec.poet : `—`)}
                </span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* ── Content ──────────────────────────────────────────────── */}
      <main ref={contentRef} className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-10 py-10">

          {/* Topbar: sidebar toggle + layer toggle */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setSidebar(o => !o)}
              className="text-faint hover:text-muted text-sm transition-colors"
              title="Toggle sidebar"
            >
              {sidebarOpen ? '← Hide' : '☰ Sections'}
            </button>

            <div className="flex gap-1">
              {[
                { id: 'sangam',  label: 'Tamil' },
                { id: 'urai',    label: 'உரை' },
                { id: 'english', label: 'English' },
                { id: 'both',    label: 'Both' },
              ].map(l => (
                <button
                  key={l.id}
                  onClick={() => setLayer(l.id)}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition-colors
                    ${layer === l.id
                      ? 'bg-primary text-page'
                      : 'text-muted hover:text-primary hover:bg-surface-alt'
                    }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section header */}
          <header className="mb-8">
            <p className="text-[11px] uppercase tracking-widest text-muted font-medium mb-2">
              {poem.en}
              {isSection && sec.lineStart ? ` · lines ${sec.lineStart}–${sec.lineEnd}` : ` · ${sec.tinai || ''}`}
              {!isSection && sec.poet ? ` · ${sec.poet}` : ''}
            </p>
            <h2 className={`leading-tight font-semibold text-primary ${isSection ? 'tamil text-3xl' : 'text-muted text-lg font-mono'}`}>
              {label || `#${num}`}
            </h2>
          </header>

          {/* Original Tamil — words are clickable for glossary */}
          {(layer === 'sangam' || layer === 'both') && (
            <div className="mb-6">
              {layer === 'both' && (
                <p className="text-[10px] uppercase tracking-[0.15em] text-faint mb-3 font-medium">
                  Original
                  <span className="normal-case ml-2 text-muted font-normal">(click any word to define)</span>
                </p>
              )}
              {layer === 'sangam' && (
                <p className="text-[10px] uppercase tracking-[0.15em] text-faint mb-3 font-medium">
                  Click any word to define
                </p>
              )}
              <ClickableVerse text={sec.sangamTamil} onWordClick={handleWordClick} />
            </div>
          )}

          {layer === 'both' && sec.urai && (
            <div className="border-t border-line my-8" />
          )}

          {/* Urai */}
          {(layer === 'urai' || layer === 'both') && (
            <div className="mb-10">
              {layer === 'both' && (
                <p className="text-[10px] uppercase tracking-[0.15em] text-faint mb-3 font-medium">உரை</p>
              )}
              {sec.urai
                ? <p className="tamil text-base leading-[1.9] text-muted">{sec.urai}</p>
                : <p className="text-sm text-faint italic">உரை இல்லை</p>
              }
            </div>
          )}

          {/* English translation */}
          {layer === 'english' && (
            <div className="mb-10">
              {sec.english
                ? <p className="text-base leading-relaxed text-muted">{sec.english}</p>
                : aiTranslation
                  ? (
                    <div className="space-y-3">
                      <p className="text-base leading-relaxed text-muted">{aiTranslation}</p>
                      <p className="text-[10px] text-muted italic">AI translation · Gemini 2.5 Flash · not scholar-verified</p>
                    </div>
                  )
                  : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted italic">No English translation available yet.</p>
                      {aiError && <p className="text-sm text-red-400">{aiError}</p>}
                      <button
                        onClick={() => handleAiTranslate(sec.sangamTamil)}
                        disabled={aiLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-page text-sm font-medium hover:bg-primary/85 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <span>{aiLoading ? '…' : '🤖'}</span>
                        <span>{aiLoading ? 'Translating…' : 'Translate with AI →'}</span>
                      </button>
                    </div>
                  )
              }
            </div>
          )}

          {/* Audio playback */}
          {sec.audioUrl && (
            <div className="mb-6">
              <AudioPlayer audioUrl={sec.audioUrl} label="Listen to verse" />
            </div>
          )}

          {/* Prev / Next */}
          <div className="flex items-center justify-between pt-8 border-t border-line mt-4">
            <button
              onClick={() => setActive(a => Math.max(0, a - 1))}
              disabled={active === 0}
              className="text-xs text-muted hover:text-primary disabled:opacity-20 transition-colors flex items-center gap-1"
            >
              ← Previous
            </button>
            <span className="text-xs text-faint font-mono tabular-nums">
              {active + 1} / {sections.length}
            </span>
            <button
              onClick={() => setActive(a => Math.min(sections.length - 1, a + 1))}
              disabled={active === sections.length - 1}
              className="text-xs text-muted hover:text-primary disabled:opacity-20 transition-colors flex items-center gap-1"
            >
              Next →
            </button>
          </div>

        </div>
      </main>

      {/* WordGlossary overlay */}
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
  if (!poem || !poem.available) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <p className="text-muted text-sm">
        {poem ? `${poem.en} — coming soon` : 'Poem not found'}
      </p>
      <Link to="/book" className="text-xs text-accent hover:underline">← Back to Library</Link>
    </div>
  )

  return <Reader poem={poem} />
}
