import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const POEMS = {
  maduraikanchi: {
    title: 'மதுரைக்காஞ்சி',
    subtitle: 'Maduraikanchi',
    author: 'மாங்குடி மருதனார்',
    collection: 'பத்துப்பாட்டு',
    loader: () => import('@data/texts/maduraikanchi/maduraikanchi.json'),
  },
}

export default function Book() {
  const { poemId = 'maduraikanchi', sectionId } = useParams()
  const navigate = useNavigate()
  const poem = POEMS[poemId]

  const [sections, setSections] = useState([])
  const [active, setActive] = useState(0)
  const [layer, setLayer] = useState('sangam')
  const contentRef = useRef(null)

  useEffect(() => {
    if (!poem) return
    poem.loader().then(mod => {
      setSections(mod.default)
      const idx = sectionId ? parseInt(sectionId, 10) - 1 : 0
      setActive(Math.max(0, idx))
    })
  }, [poemId])

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 })
  }, [active])

  if (!poem) return <div className="p-8 text-stone-500">Poem not found.</div>
  if (!sections.length) return <div className="p-8 text-stone-400 text-sm">Loading…</div>

  const sec = sections[active]
  const isSection = 'sectionNumber' in sec

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-white text-stone-900">

      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 border-r border-stone-200 flex flex-col overflow-hidden">
        {/* Poem header */}
        <div className="px-4 py-4 border-b border-stone-200">
          <p className="text-[11px] uppercase tracking-widest text-stone-400 font-medium">{poem.collection}</p>
          <h1 className="tamil text-lg font-semibold text-stone-800 leading-tight mt-0.5">{poem.title}</h1>
          <p className="text-xs text-stone-400 mt-0.5">{poem.subtitle}</p>
        </div>

        {/* Section list */}
        <nav className="flex-1 overflow-y-auto py-2">
          {sections.map((s, i) => {
            const num = isSection ? s.sectionNumber : s.number
            const label = isSection ? s.title : `${num}`
            const isActive = i === active
            return (
              <button
                key={s.id}
                onClick={() => setActive(i)}
                className={`w-full text-left px-4 py-1.5 flex items-start gap-2 transition-colors
                  ${isActive
                    ? 'bg-amber-50 border-l-2 border-amber-500 text-stone-900'
                    : 'border-l-2 border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                  }`}
              >
                <span className="text-[10px] font-mono text-stone-400 pt-px w-6 shrink-0">{String(num).padStart(2, '0')}</span>
                <span className="text-xs leading-snug line-clamp-2 tamil">{label || `§ ${num}`}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* ── Main content ──────────────────────────────────────── */}
      <main ref={contentRef} className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-10 py-10">

          {/* Section header */}
          <div className="mb-6 pb-4 border-b border-stone-100">
            {isSection ? (
              <>
                <p className="text-[11px] uppercase tracking-widest text-stone-400 font-medium mb-1">
                  {poem.subtitle} · §{sec.sectionNumber}
                  {sec.lineStart ? ` · lines ${sec.lineStart}–${sec.lineEnd}` : ''}
                </p>
                <h2 className="tamil text-2xl font-semibold text-stone-800">{sec.title}</h2>
              </>
            ) : (
              <p className="text-[11px] uppercase tracking-widest text-stone-400 font-medium">
                {poem.subtitle} · poem {sec.number}
                {sec.tinai && sec.tinai !== 'unknown' ? ` · ${sec.tinai}` : ''}
                {sec.poet ? ` · ${sec.poet}` : ''}
              </p>
            )}
          </div>

          {/* Layer toggle */}
          <div className="flex gap-1 mb-6">
            {[
              { id: 'sangam', label: 'சங்கம் தமிழ்' },
              { id: 'urai',   label: 'உரை' },
              { id: 'both',   label: 'Both' },
            ].map(l => (
              <button
                key={l.id}
                onClick={() => setLayer(l.id)}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors
                  ${layer === l.id
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                  }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Original Tamil */}
          {(layer === 'sangam' || layer === 'both') && (
            <div className="mb-6">
              {layer === 'both' && (
                <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2 font-medium">Original</p>
              )}
              <p className="tamil text-xl leading-[2] text-stone-900 whitespace-pre-line">
                {sec.sangamTamil}
              </p>
            </div>
          )}

          {/* Separator */}
          {layer === 'both' && sec.urai && (
            <hr className="border-stone-100 my-6" />
          )}

          {/* Urai */}
          {(layer === 'urai' || layer === 'both') && (
            <div className="mb-8">
              {layer === 'both' && (
                <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2 font-medium">உரை</p>
              )}
              {sec.urai
                ? <p className="tamil text-base leading-relaxed text-stone-700">{sec.urai}</p>
                : <p className="text-sm text-stone-400 italic">உரை இல்லை</p>
              }
            </div>
          )}

          {/* Prev / Next */}
          <div className="flex justify-between pt-6 border-t border-stone-100 mt-8">
            <button
              onClick={() => setActive(a => Math.max(0, a - 1))}
              disabled={active === 0}
              className="text-xs text-stone-400 hover:text-stone-700 disabled:opacity-30 transition-colors"
            >
              ← Previous
            </button>
            <span className="text-xs text-stone-300 font-mono">
              {active + 1} / {sections.length}
            </span>
            <button
              onClick={() => setActive(a => Math.min(sections.length - 1, a + 1))}
              disabled={active === sections.length - 1}
              className="text-xs text-stone-400 hover:text-stone-700 disabled:opacity-30 transition-colors"
            >
              Next →
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}
