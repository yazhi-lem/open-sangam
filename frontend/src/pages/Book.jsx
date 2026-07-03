import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { POEMS, COLLECTIONS, POEM_BY_ID } from '../data/poems.js'
import WordGlossary from '../components/reader/WordGlossary'
import AudioPlayer from '../components/reader/AudioPlayer'
import { analyzeWord, translateVerse } from '../services/geminiApi'

// ── Library (Gallery) ─────────────────────────────────────────────────────

function PoemCard({ poem }) {
  const available = poem.available
  const nav = useNavigate()
  return (
    <div
      onClick={() => available && nav(`/book/${poem.id}`)}
      className={`group relative rounded-xl border p-5 transition-all duration-150
        ${available
          ? 'border-stone-200 bg-white hover:border-stone-400 hover:shadow-md cursor-pointer'
          : 'border-stone-100 bg-stone-50/60 cursor-default'
        }`}
    >
      {/* Collection badge */}
      <span className={`inline-block text-[10px] font-medium uppercase tracking-widest px-2 py-0.5 rounded mb-3
        ${poem.collection === '8thokai' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-600'}`}>
        {poem.collection === '8thokai' ? 'Anthology' : 'Idyll'}
      </span>

      {/* Tamil name */}
      <h3 className={`tamil text-xl font-semibold leading-tight mb-0.5
        ${available ? 'text-stone-900 group-hover:text-amber-700' : 'text-stone-400'}`}>
        {poem.ta}
      </h3>

      {/* English name */}
      <p className={`text-sm mb-3 ${available ? 'text-stone-500' : 'text-stone-300'}`}>
        {poem.en}
      </p>

      {/* Count */}
      <p className={`text-xs font-mono ${available ? 'text-stone-400' : 'text-stone-300'}`}>
        {poem.count.toLocaleString()} {poem.unit}
      </p>

      {/* Status dot */}
      <div className="absolute top-4 right-4">
        {available
          ? <span className="w-2 h-2 rounded-full bg-emerald-400 block" title="Available" />
          : <span className="w-2 h-2 rounded-full bg-stone-200 block" title="Coming soon" />
        }
      </div>
    </div>
  )
}

function Library() {
  const byCollection = Object.entries(COLLECTIONS).map(([key, meta]) => ({
    key, meta,
    poems: POEMS.filter(p => p.collection === key),
  }))

  return (
    <div className="min-h-screen bg-[#faf9f7]">

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-8 pt-16 pb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-400 font-medium mb-3">
          Open Sangam
        </p>
        <h1 className="tamil text-5xl font-bold text-stone-900 leading-tight mb-2">
          சங்க நூலகம்
        </h1>
        <p className="text-xl text-stone-500 font-light tracking-wide mb-1">
          Library of Sangam
        </p>
        <p className="text-sm text-stone-400 mt-3 max-w-xl leading-relaxed">
          Classical Tamil literature from the Sangam period (c.&thinsp;300&thinsp;BCE – 300&thinsp;CE).
          Original verse, modern prose rendering, and English translation.
        </p>
      </div>

      {/* Collections */}
      <div className="max-w-4xl mx-auto px-8 pb-24 space-y-14">
        {byCollection.map(({ key, meta, poems }) => (
          <section key={key}>
            <div className="flex items-baseline gap-3 mb-6 pb-3 border-b border-stone-200">
              <h2 className="tamil text-2xl font-semibold text-stone-800">{meta.ta}</h2>
              <span className="text-stone-400 text-sm">{meta.en}</span>
            </div>
            <p className="text-sm text-stone-400 mb-6 max-w-xl">{meta.desc}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {poems.map(poem => <PoemCard key={poem.id} poem={poem} />)}
            </div>
          </section>
        ))}
      </div>

      {/* Footer note */}
      <div className="border-t border-stone-100 py-6 text-center text-xs text-stone-300">
        <span className="tamil">தமிழ் தமிழரின் உயிர்</span>
        {' · '}
        Source: sangathamizh.com · License: CC0
      </div>
    </div>
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
  }, [poem.id])

  // Reset AI translation when section changes
  useEffect(() => {
    setAiTranslation(null)
    setAiError(null)
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
      <div className="flex items-center justify-center h-full text-stone-400 text-sm">
        Loading…
      </div>
    )
  }

  const sec = sections[active]
  const isSection = 'sectionNumber' in sec
  const num = isSection ? sec.sectionNumber : sec.number
  const label = isSection ? sec.title : null

  // Split sangamTamil into clickable words
  function ClickableVerse({ text }) {
    const words = text.split(/(\s+)/)
    return (
      <p className="tamil text-[1.35rem] leading-[2.1] text-stone-900 whitespace-pre-wrap">
        {words.map((part, i) =>
          /^\s+$/.test(part) ? part : (
            <button
              key={i}
              onClick={() => handleWordClick(part)}
              className="hover:text-amber-700 hover:underline decoration-dotted underline-offset-4 cursor-pointer transition-colors"
            >
              {part}
            </button>
          )
        )}
      </p>
    )
  }

  return (
    <div className="flex h-[calc(100vh-56px)] bg-[#faf9f7] overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className={`shrink-0 border-r border-stone-200 flex flex-col overflow-hidden transition-all duration-200
        ${sidebarOpen ? 'w-60' : 'w-0'}`}>

        {/* Poem meta */}
        <div className="px-4 py-4 border-b border-stone-200 bg-white">
          <Link to="/book" className="flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-stone-600 mb-3 transition-colors">
            ← Library
          </Link>
          <span className={`text-[10px] font-medium uppercase tracking-widest px-1.5 py-0.5 rounded
            ${poem.collection === '8thokai' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-600'}`}>
            {poem.collection === '8thokai' ? 'Anthology' : 'Idyll'}
          </span>
          <h2 className="tamil text-lg font-semibold text-stone-900 mt-2 leading-tight">{poem.ta}</h2>
          <p className="text-xs text-stone-400">{poem.en}</p>
          <p className="text-xs text-stone-300 mt-1 font-mono">{sections.length} {isSection ? 'sections' : 'poems'}</p>
        </div>

        {/* Section list */}
        <nav className="flex-1 overflow-y-auto bg-white py-1">
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
                    ? 'border-amber-500 bg-amber-50/70 text-stone-900'
                    : 'border-transparent text-stone-400 hover:text-stone-700 hover:bg-stone-50'
                  }`}
              >
                <span className="text-[10px] font-mono text-stone-300 pt-0.5 w-5 shrink-0 text-right">{n}</span>
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
              className="text-stone-300 hover:text-stone-600 text-sm transition-colors"
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
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
                    }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section header */}
          <header className="mb-8">
            <p className="text-[11px] uppercase tracking-widest text-stone-400 font-medium mb-2">
              {poem.en}
              {isSection && sec.lineStart ? ` · lines ${sec.lineStart}–${sec.lineEnd}` : ` · ${sec.tinai || ''}`}
              {!isSection && sec.poet ? ` · ${sec.poet}` : ''}
            </p>
            <h2 className={`leading-tight font-semibold text-stone-900 ${isSection ? 'tamil text-3xl' : 'text-stone-400 text-lg font-mono'}`}>
              {label || `#${num}`}
            </h2>
          </header>

          {/* Original Tamil — words are clickable for glossary */}
          {(layer === 'sangam' || layer === 'both') && (
            <div className="mb-6">
              {layer === 'both' && (
                <p className="text-[10px] uppercase tracking-[0.15em] text-stone-300 mb-3 font-medium">
                  Original
                  <span className="normal-case ml-2 text-stone-400 font-normal">(click any word to define)</span>
                </p>
              )}
              {layer === 'sangam' && (
                <p className="text-[10px] uppercase tracking-[0.15em] text-stone-300 mb-3 font-medium">
                  Click any word to define
                </p>
              )}
              <ClickableVerse text={sec.sangamTamil} />
            </div>
          )}

          {layer === 'both' && sec.urai && (
            <div className="border-t border-stone-100 my-8" />
          )}

          {/* Urai */}
          {(layer === 'urai' || layer === 'both') && (
            <div className="mb-10">
              {layer === 'both' && (
                <p className="text-[10px] uppercase tracking-[0.15em] text-stone-300 mb-3 font-medium">உரை</p>
              )}
              {sec.urai
                ? <p className="tamil text-base leading-[1.9] text-stone-600">{sec.urai}</p>
                : <p className="text-sm text-stone-300 italic">உரை இல்லை</p>
              }
            </div>
          )}

          {/* English translation */}
          {layer === 'english' && (
            <div className="mb-10">
              {sec.english
                ? <p className="text-base leading-relaxed text-stone-700">{sec.english}</p>
                : aiTranslation
                  ? (
                    <div className="space-y-3">
                      <p className="text-base leading-relaxed text-stone-700">{aiTranslation}</p>
                      <p className="text-[10px] text-stone-400 italic">AI translation · Gemini 2.5 Flash · not scholar-verified</p>
                    </div>
                  )
                  : (
                    <div className="space-y-4">
                      <p className="text-sm text-stone-400 italic">No English translation available yet.</p>
                      {aiError && <p className="text-sm text-red-400">{aiError}</p>}
                      <button
                        onClick={() => handleAiTranslate(sec.sangamTamil)}
                        disabled={aiLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          <div className="flex items-center justify-between pt-8 border-t border-stone-100 mt-4">
            <button
              onClick={() => setActive(a => Math.max(0, a - 1))}
              disabled={active === 0}
              className="text-xs text-stone-400 hover:text-stone-700 disabled:opacity-20 transition-colors flex items-center gap-1"
            >
              ← Previous
            </button>
            <span className="text-xs text-stone-300 font-mono tabular-nums">
              {active + 1} / {sections.length}
            </span>
            <button
              onClick={() => setActive(a => Math.min(sections.length - 1, a + 1))}
              disabled={active === sections.length - 1}
              className="text-xs text-stone-400 hover:text-stone-700 disabled:opacity-20 transition-colors flex items-center gap-1"
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
      <p className="text-stone-400 text-sm">
        {poem ? `${poem.en} — coming soon` : 'Poem not found'}
      </p>
      <Link to="/book" className="text-xs text-amber-600 hover:underline">← Back to Library</Link>
    </div>
  )

  return <Reader poem={poem} />
}
