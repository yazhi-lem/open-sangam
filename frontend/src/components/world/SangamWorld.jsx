/**
 * SangamWorld — immersive landscape explorer for the five Tiṇai zones.
 */
import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import TinaiMap from './TinaiMap'
import TinaiWorldDetail from './TinaiWorldDetail'
import CulturalContextCard from './CulturalContextCard'
import { POEMS } from '../../data/poems'
import Badge from '../ui/Badge'
import Card from '../ui/Card'
import Reveal from '../motion/Reveal'

import useAppStore from '../../store/useAppStore'
import audioManager from '../../services/AudioManager'
import VideoManager from './VideoManager'

export default function SangamWorld() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tinaiParam = searchParams.get('tinai')

  const activeTinai = useAppStore((s) => s.activeTinai)
  const setActiveTinai = useAppStore((s) => s.setActiveTinai)

  const selectedTinai = tinaiParam || activeTinai
  const [activeContext, setActiveContext] = useState(null)
  const [sampleVerse, setSampleVerse] = useState(null)
  const [introFinished, setIntroFinished] = useState(false)
  
  const detailsRef = useRef(null)

  // Sync parameters with global store state
  useEffect(() => {
    if (tinaiParam && tinaiParam !== activeTinai) {
      setActiveTinai(tinaiParam)
    }
  }, [tinaiParam, activeTinai, setActiveTinai])

  // Reset introPlayed state when activeTinai changes
  useEffect(() => {
    if (selectedTinai) {
      setIntroFinished(false)
    }
  }, [selectedTinai])

  // Coordinate ambient nature audio playback
  useEffect(() => {
    if (selectedTinai) {
      audioManager.play(selectedTinai)
    } else {
      audioManager.stopAll()
    }
  }, [selectedTinai])

  // Reset active state & stop audio when unmounting
  useEffect(() => {
    return () => {
      setActiveTinai(null)
      audioManager.stopAll()
    }
  }, [setActiveTinai])

  function handleTinaiSelect(t) {
    const next = selectedTinai === t ? null : t
    setActiveTinai(next)
    if (next) {
      setSearchParams({ tinai: next })
    } else {
      setSearchParams({})
    }
  }

  const scrollToDetails = () => {
    setTimeout(() => {
      if (detailsRef.current) {
        detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 150)
  }

  // Load sample verse when tinai is selected
  useEffect(() => {
    if (!selectedTinai) return () => setSampleVerse(null)
    const poem = POEMS.find(
      (p) => p.available && p.loader && Array.isArray(p.tinai) && p.tinai.includes(selectedTinai)
    )
    if (!poem) return () => setSampleVerse(null)
    poem
      .loader()
      .then((mod) => {
        const verses = mod.default
        const matches = verses.filter((v) => v.tinai === selectedTinai)
        const pool = matches.length ? matches.slice(0, 10) : verses.slice(0, 1)
        const pick = pool[Math.floor(Math.random() * pool.length)]
        setSampleVerse({ ...pick, poemId: poem.id, poemTa: poem.ta, poemEn: poem.en })
      })
      .catch((err) => {
        console.error('Failed to load sample verse:', err)
      })
    return () => setSampleVerse(null)
  }, [selectedTinai])

  const matchingPoems = selectedTinai
    ? POEMS.filter((p) => Array.isArray(p.tinai) && p.tinai.includes(selectedTinai))
    : []

  return (
    <section className="space-y-10">
      {selectedTinai && !introFinished && (
        <VideoManager
          tinaiId={selectedTinai}
          onComplete={() => {
            setIntroFinished(true)
            scrollToDetails()
          }}
          onSkip={() => {
            setIntroFinished(true)
            scrollToDetails()
          }}
        />
      )}

      <Reveal y={-16}>
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge variant="accent" size="sm">சங்க உலகம்</Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-primary">Sangam World Explorer</h1>
          <p className="text-muted text-base sm:text-lg leading-relaxed">
            Select a landscape zone (திணை) to discover its presiding deity, flora & fauna, ancient music ragas (பண்), social communities, and authentic corpus attestations.
          </p>
        </div>
      </Reveal>

      {/* Interactive Landscape Selector */}
      <TinaiMap selected={selectedTinai} onSelect={handleTinaiSelect} />

      {selectedTinai ? (
        <div ref={detailsRef} className="space-y-12">
          {/* Open-world detail view */}
          <TinaiWorldDetail tinaiId={selectedTinai} />

          {/* Sample verse from the corpus */}
          <Card variant="flat" className="p-6 sm:p-8 space-y-4 border-accent/30">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <Badge variant="accent" size="sm">
                Sample Verse • {sampleVerse ? sampleVerse.poemEn : 'Corpus Extract'}
              </Badge>
              {sampleVerse?.poet && <span className="text-xs text-faint font-medium">Poet: {sampleVerse.poet}</span>}
            </div>

            {sampleVerse ? (
              <div className="space-y-4">
                <p className="tamil-verse text-xl sm:text-2xl text-primary font-semibold leading-relaxed">
                  {sampleVerse.sangamTamil}
                </p>
                {sampleVerse.urai && (
                  <p className="tamil text-sm sm:text-base text-muted leading-relaxed border-t border-line pt-3">
                    {sampleVerse.urai}
                  </p>
                )}
                <div className="pt-2">
                  <Link
                    to={`/book/${sampleVerse.poemId}`}
                    className="inline-flex items-center gap-1.5 text-xs text-accent font-bold hover:underline"
                  >
                    Read full poem ({sampleVerse.poemTa}) →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-4 text-sm text-faint italic animate-pulse">
                Loading authentic verse extract from corpus...
              </div>
            )}
          </Card>

          {/* Poems featuring this tinai */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
                Classical Works set in this Landscape ({matchingPoems.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchingPoems.map((poem) => {
                return (
                  <Card key={poem.id} variant={poem.available ? 'interactive' : 'flat'} className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant={selectedTinai} size="sm">
                        {poem.collection === '8thokai' ? 'Anthology' : 'Idyll'}
                      </Badge>
                      <span className="text-xs font-mono text-faint">
                        {poem.count.toLocaleString()} {poem.unit}
                      </span>
                    </div>

                    <div>
                      <p className="tamil text-lg font-bold text-primary">{poem.ta}</p>
                      <p className="text-xs text-muted">{poem.en}</p>
                    </div>

                    {poem.available ? (
                      <Link to={`/book/${poem.id}`} className="block text-xs font-bold text-accent hover:underline pt-1">
                        Read Collection →
                      </Link>
                    ) : (
                      <span className="text-xs text-faint">Digitization in progress</span>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <Card variant="flat" className="p-8 text-center text-muted space-y-2">
          <p className="text-2xl">☝️</p>
          <p className="text-base font-semibold text-primary">Select a Landscape above to explore</p>
          <p className="text-xs text-faint">Choose from Kurinji (Mountains), Mullai (Forests), Marutam (Cropland), Neytal (Seashore), or Palai (Wasteland)</p>
        </Card>
      )}

      {activeContext && (
        <CulturalContextCard context={activeContext} onClose={() => setActiveContext(null)} />
      )}
    </section>
  )
}
