/**
 * SangamWorld — immersive landscape explorer for the five Tiṇai zones.
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import TinaiMap from './TinaiMap'
import TinaiWorldDetail from './TinaiWorldDetail'
import CulturalContextCard from './CulturalContextCard'
import { POEMS, TINAI_COLORS } from '../../data/poems'

export default function SangamWorld() {
  const [selectedTinai, setSelectedTinai] = useState(null)
  const [activeContext, setActiveContext] = useState(null)
  const [sampleVerse, setSampleVerse]     = useState(null)

  function handleTinaiSelect(t) {
    setSelectedTinai(prev => prev === t ? null : t)
    setSampleVerse(null)
  }

  // When a tinai is selected, load one sample verse from the first matching anthology poem
  useEffect(() => {
    if (!selectedTinai) { setSampleVerse(null); return }
    const poem = POEMS.find(
      p => p.available && p.loader && Array.isArray(p.tinai) && p.tinai.includes(selectedTinai)
    )
    if (!poem) { setSampleVerse(null); return }
    poem.loader().then(mod => {
      const verses = mod.default
      const matches = verses.filter(v => v.tinai === selectedTinai)
      // Select a random verse from the first 10 matches to ensure variety without loading the full corpus
      const pool = matches.length ? matches.slice(0, 10) : verses.slice(0, 1)
      const pick = pool[Math.floor(Math.random() * pool.length)]
      setSampleVerse({ ...pick, poemId: poem.id, poemTa: poem.ta, poemEn: poem.en })
    }).catch((err) => {
      console.error('Failed to load sample verse:', err)
      setSampleVerse(null)
    })
  }, [selectedTinai])

  const matchingPoems = selectedTinai
    ? POEMS.filter(p => Array.isArray(p.tinai) && p.tinai.includes(selectedTinai))
    : []

  return (
    <section className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="tamil text-4xl font-bold text-accent">சங்க உலகம்</h1>
        <p className="text-muted text-lg">Explore the five poetic landscapes of the Sangam era</p>
      </div>

      <TinaiMap selected={selectedTinai} onSelect={handleTinaiSelect} />

      {selectedTinai && (
        <div className="space-y-10">
          {/* Open-world detail view */}
          <TinaiWorldDetail tinaiId={selectedTinai} />

          {/* Sample verse from the corpus */}
          <div className="space-y-3">
            <h2 className="text-xs font-medium text-faint uppercase tracking-widest">
              From the Corpus
            </h2>
            {sampleVerse ? (
              <div className="rounded-xl border border-line bg-surface-alt/50 p-6 space-y-4">
                <p className="text-[10px] uppercase tracking-[0.15em] text-faint font-medium">
                  Sample verse · {sampleVerse.poemEn}
                  {sampleVerse.poet ? ` · ${sampleVerse.poet}` : ''}
                </p>
                <p className="tamil text-xl text-primary leading-[2] whitespace-pre-line">
                  {sampleVerse.sangamTamil}
                </p>
                {sampleVerse.urai && (
                  <p className="tamil text-sm text-muted leading-relaxed border-t border-line pt-3">
                    {sampleVerse.urai}
                  </p>
                )}
                <Link
                  to={`/book/${sampleVerse.poemId}`}
                  className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent-strong transition-colors"
                >
                  Read {sampleVerse.poemTa} →
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border border-line bg-surface-alt/30 p-4 text-sm text-faint italic">
                Loading sample verse…
              </div>
            )}
          </div>

          {/* Poems featuring this tinai */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted uppercase tracking-widest">
              Poems in this landscape — {matchingPoems.length} works
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {matchingPoems.map(poem => {
                const colorCls = TINAI_COLORS[selectedTinai] || 'text-faint bg-surface-alt'
                return (
                  <div key={poem.id} className={`rounded-xl border p-4 space-y-2 transition-colors
                    ${poem.available
                      ? 'border-line-strong bg-surface-alt/50 hover:border-line-strong'
                      : 'border-line bg-surface-alt/20 opacity-50'
                    }`}
                  >
                    <span className={`inline-block text-[9px] font-medium uppercase tracking-widest px-1.5 py-0.5 rounded ${colorCls}`}>
                      {poem.collection === '8thokai' ? 'Anthology' : 'Idyll'}
                    </span>
                    <p className="tamil text-base font-semibold text-primary leading-tight">{poem.ta}</p>
                    <p className="text-xs text-faint">{poem.en}</p>
                    <p className="text-xs font-mono text-faint">{poem.count.toLocaleString()} {poem.unit}</p>
                    {poem.available
                      ? <Link to={`/book/${poem.id}`} className="block text-xs text-accent hover:text-accent-strong transition-colors">Read →</Link>
                      : <span className="text-xs text-faint">Coming soon</span>
                    }
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {activeContext && (
        <CulturalContextCard context={activeContext} onClose={() => setActiveContext(null)} />
      )}
    </section>
  )
}
