import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Columns2, Rows2, ChevronLeft, ChevronRight, Copy } from 'lucide-react'
import { normalizeLayer, visibleLayers, hasGloss } from '../../data/readerLayers.js'
import { TINAI_WORLD } from '../../data/tinaiWorld.js'
import useAppStore from '../../store/useAppStore'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import Toast from '../ui/Toast'
import LoadingSpinner from '../ui/LoadingSpinner'
import WordGlossary from './WordGlossary'
import AudioPlayer from './AudioPlayer'
import VoiceLayer from './VoiceLayer'
import ClickableVerse from './ClickableVerse'
import DraftBadge from './DraftBadge'
import LayerToggle from './LayerToggle'
import InlineVoiceButton from './InlineVoiceButton'

export default function Reader({ poem, sectionId }) {
  const language = useAppStore((s) => s.language)
  const L = (ta, en) => (language === 'ta' ? ta : en)
  const [sections, setSections] = useState([])
  const [active, setActive] = useState(0)
  const [layer, setLayerState] = useState(() => {
    try {
      const stored = localStorage.getItem('open_sangam_reader_layer')
      if (stored) return normalizeLayer(stored)
    } catch {
      // ignore
    }
    return typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches ? 'all' : 'original'
  })
  const [layoutMode, setLayoutMode] = useState(() => {
    try {
      return localStorage.getItem('open_sangam_reader_layout') || 'h'
    } catch {
      return 'h'
    }
  })
  const [sidebarOpen, setSidebar] = useState(false)
  const [fontSize, setFontSize] = useState('md')
  const [sectionFilter, setSectionFilter] = useState('')
  const [toastMsg, setToastMsg] = useState(null)
  const contentRef = useRef(null)
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
        fetchRest()
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable) return
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
        if (clean && !map.has(clean)) map.set(clean, w)
      }
    }
    return map
  }, [sec])

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
        <p className={`text-muted text-sm animate-pulse ${language === 'ta' ? 'tamil' : ''}`}>
          {L('செவ்வியல் பாடல்கள் ஏற்றப்படுகின்றன...', 'Loading classical verses...')}
        </p>
      </div>
    )
  }

  const show = visibleLayers(layer)
  const contextTinai = sec.tinai ? TINAI_WORLD[sec.tinai] : null
  const glossaryEntries = [...wordGlossaryMap.values()].filter(hasGloss).slice(0, 60)
  const isSection = 'sectionNumber' in sec
  const num = isSection ? sec.sectionNumber : sec.number
  const label = sec.title || sec.heading || sec.poemTitle || null

  const filteredSections = sections.filter((s) => {
    if (!sectionFilter.trim()) return true
    const q = sectionFilter.toLowerCase()
    const n = isSection ? s.sectionNumber : s.number
    const t = s.title || s.heading || s.poet || ''
    return String(n).includes(q) || t.toLowerCase().includes(q)
  })

  return (
    <div className="relative flex h-[calc(100dvh-64px)] bg-page overflow-hidden">
      <Toast message={toastMsg} type="success" onClose={() => setToastMsg(null)} />

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
        <div className="p-4 border-b border-line bg-surface-alt/40 space-y-2">
          <Link
            to="/book"
            className="inline-flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors font-medium"
          >
            ← {L('நூலகத்திற்குத் திரும்பு', 'Back to Library')}
          </Link>
          <div className="flex items-center gap-2 pt-1">
            <Badge variant={poem.collection === '8thokai' ? 'anthology' : 'idyll'} size="sm">
              {poem.collection === '8thokai' ? L('தொகை', 'Anthology') : L('பாட்டு', 'Idyll')}
            </Badge>
            <span className="text-xs text-faint font-mono">{sections.length} verses</span>
          </div>
          <h2 className="tamil text-xl font-bold text-primary leading-tight pt-1">{poem.ta}</h2>
          <p className="text-xs text-muted">{poem.en}</p>
          <div className="pt-2">
            <Input
              size="sm"
              type="text"
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              onClear={() => setSectionFilter('')}
              placeholder={L("பகுதி அல்லது புலவரைத் தேடு...", "Filter section or poet...")}
            />
          </div>
        </div>

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

      <main ref={contentRef} className="flex-1 overflow-y-auto bg-page flex flex-col">
        <div className="sticky top-0 z-10 border-b border-line bg-page/90 backdrop-blur-md px-3 sm:px-6 py-2 sm:py-3 shrink-0">
          <div className="w-full flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSidebar((o) => !o)}
                title="Toggle sidebar"
                aria-label="Toggle section sidebar"
              >
                {sidebarOpen ? L('← மறை', '← Hide') : L('☰ பகுதிகள்', '☰ Sections')}
              </Button>
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
                aria-label={`Text size: ${fontSize === 'sm' ? 'small' : fontSize === 'md' ? 'medium' : 'large'}`}
                className="sm:hidden flex h-11 min-w-[44px] items-center justify-center rounded-xl border border-line bg-surface-alt/60 px-2 text-sm font-semibold text-primary focus-ring"
              >
                Aa
              </button>
            </div>

            <div className="flex w-full sm:w-auto items-center gap-2 sm:gap-3 flex-wrap">
              <div className="hidden lg:flex items-center gap-1 border-r border-line pr-3">
                <span className="text-[11px] text-faint mr-1 font-semibold hidden md:inline">{L('அமைப்பு', 'Layout')}:</span>
                <button
                  type="button"
                  onClick={() => handleSetLayout('h')}
                  className={`min-h-[44px] min-w-[44px] justify-center p-1.5 rounded-lg flex items-center gap-1 text-xs font-medium transition-all ${
                    layoutMode === 'h'
                      ? 'bg-accent text-on-accent font-bold shadow-xs'
                      : 'text-muted hover:text-primary hover:bg-surface-alt'
                  }`}
                  title="Horizontal Side-by-Side Split View"
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

              <div className="hidden sm:flex items-center gap-1 border-r border-line pr-3">
                <span className="text-[11px] text-faint mr-1 font-medium hidden sm:inline">{L('எழுத்து', 'Text')}:</span>
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

              <LayerToggle layer={layer} onChange={setLayer} />
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 sm:px-6 md:px-8 py-6">
          <div className="w-full space-y-4">
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
                  {L('நகல்', 'Copy')}
                </Button>
              </div>
            </Card>

            <div className={layoutMode === 'h' ? 'grid gap-4 lg:grid-cols-2' : 'space-y-4'}>
              {show.original && (
                <Card variant="flat" className="space-y-3 border-accent/20 p-4 sm:p-6">
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className={`text-xs font-semibold text-accent ${language === 'ta' ? 'tamil' : ''}`}>{L('மூலம்', 'Original')}</span>
                    <InlineVoiceButton text={sec.sangamTamil} />
                  </div>
                  <ClickableVerse text={sec.sangamTamil} onWordClick={handleWordClick} fontSize={fontSize} />
                </Card>
              )}

              {show.transliteration && (
                <Card variant="default" className="space-y-2 p-4 sm:p-6">
                  <p className={`text-xs font-semibold text-accent ${language === 'ta' ? 'tamil' : ''}`}>{L('ஒலிபெயர்ப்பு', 'Transliteration')}</p>
                  {sec.transliteration ? (
                    <p className="whitespace-pre-wrap text-base leading-relaxed text-primary">{sec.transliteration}</p>
                  ) : (
                    <p className="text-sm text-faint italic">{L('இந்தப் பாடலுக்கு ஒலிபெயர்ப்பு இன்னும் இல்லை.', 'Transliteration is not yet available for this verse.')}</p>
                  )}
                </Card>
              )}

              {show.voice && (
                <Card variant="default" className="space-y-2 p-4 sm:p-6">
                  <p className={`text-xs font-semibold text-accent ${language === 'ta' ? 'tamil' : ''}`}>{L('ஒலிவாசிப்பு', 'Voice')}</p>
                  <VoiceLayer text={sec.sangamTamil} />
                  {sec.audioUrl && <AudioPlayer audioUrl={sec.audioUrl} label="Scholar recording" />}
                </Card>
              )}

              {show.urai && (
                <Card variant="default" className="space-y-3 p-4 sm:p-6">
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className={`text-xs font-bold text-accent ${language === 'ta' ? 'tamil' : ''}`}>{L('உரை', 'Modern Tamil')}</span>
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
                    <span className={`text-xs font-bold text-accent ${language === 'ta' ? 'tamil' : ''}`}>{L('ஆங்கிலம்', 'English')}</span>
                    <DraftBadge verse={sec} field="english" />
                  </div>
                  {sec.english ? (
                    <p className="text-base leading-relaxed text-primary">{sec.english}</p>
                  ) : (
                    <p className="text-sm text-faint italic">{L('ஆங்கில மொழிபெயர்ப்பு தயாராகிறது.', 'English translation is being prepared.')}</p>
                  )}
                </Card>
              )}

              {show.glossary && (
                <Card variant="default" className="space-y-2 p-4 sm:p-6">
                  <p className={`text-xs font-semibold text-accent ${language === 'ta' ? 'tamil' : ''}`}>{L('சொல்லகராதி', 'Glossary')}</p>
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
                    <p className="text-sm text-faint italic">{L('இந்தப் பாடலுக்கு சொல்லகராதி இன்னும் இணைக்கப்படவில்லை.', 'No word glossary has been attached to this verse yet.')}</p>
                  )}
                </Card>
              )}

              {show.notes && (
                <Card variant="default" className="space-y-2 p-4 sm:p-6">
                  <p className={`text-xs font-semibold text-accent ${language === 'ta' ? 'tamil' : ''}`}>{L('குறிப்புகள்', 'Notes')}</p>
                  {sec.culturalNotes?.length ? (
                    <ul className="list-disc space-y-1.5 pl-5 text-sm text-primary">
                      {sec.culturalNotes.map((note, index) => (
                        <li key={index}><strong>{note.title}</strong>{note.description ? ` — ${note.description}` : ''}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-faint italic">{L('இந்தப் பாடலுக்கு குறிப்புகள் இன்னும் இல்லை.', 'No editorial notes for this verse yet.')}</p>
                  )}
                </Card>
              )}

              {show.poetics && (
                <Card variant="default" className="space-y-2 p-4 sm:p-6">
                  <p className={`text-xs font-semibold text-accent ${language === 'ta' ? 'tamil' : ''}`}>{L('யாப்பியல்', 'Poetics')}</p>
                  {sec.poetics ? (
                    <p className="text-sm leading-relaxed text-primary">{sec.poetics}</p>
                  ) : contextTinai?.poetry ? (
                    <div className="space-y-2">
                      <p className="tamil text-sm leading-relaxed text-primary">{contextTinai.poetry.classic}</p>
                      <p className="text-xs text-muted">{contextTinai.poetry.poem}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-faint italic">{L('யாப்பியல் விவரங்கள் இன்னும் இணைக்கப்படவில்லை.', 'Metre and poetics metadata is not yet attached.')}</p>
                  )}
                </Card>
              )}

              {show.context && (
                <Card variant="default" className="space-y-2 p-4 sm:p-6">
                  <p className={`text-xs font-semibold text-accent ${language === 'ta' ? 'tamil' : ''}`}>{L('சூழல்', 'Context')}</p>
                  {contextTinai ? (
                    <div className="space-y-1.5 text-sm text-primary">
                      <p><strong>{contextTinai.ta}</strong> — {contextTinai.atmosphere.season.desc}</p>
                      <p className="text-muted">{L('கடவுள்', 'Deity')}: {L(contextTinai.deity.ta, contextTinai.deity.en)}</p>
                      <p className="text-muted">{L('மக்கள்', 'People')}: {contextTinai.people.map((p) => L(p.ta, p.en)).join(' · ')}</p>
                      <p className="text-muted">{L('வாழ்க்கை', 'Life')}: {contextTinai.crafts.map((c) => L(c.ta, c.en)).join(' · ')}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-faint italic">{L('இந்தப் பாடலுக்கு திணைச் சூழல் குறிச்சொல் இல்லை.', 'This verse has no tiṇai context tag.')}</p>
                  )}
                </Card>
              )}
            </div>
          </div>

          <div className="w-full flex flex-wrap items-center justify-between gap-2 pt-8 pb-4 border-t border-line mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActive((a) => Math.max(0, a - 1))}
              disabled={active === 0}
            >
              ← {L('முந்தைய பாடல்', 'Previous Verse')}
            </Button>
            <span className="text-xs font-mono text-muted">{active + 1} / {sections.length}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActive((a) => Math.min(sections.length - 1, a + 1))}
              disabled={active === sections.length - 1}
            >
              {L('அடுத்த பாடல்', 'Next Verse')} →
            </Button>
          </div>
        </div>
      </main>

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
