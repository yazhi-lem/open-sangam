import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import Reveal, { RevealGroup } from '../components/motion/Reveal'
import useAppStore from '../store/useAppStore'

const TINAI_HIGHLIGHTS = [
  { id: 'kurinji', tamil: 'குறிஞ்சி', english: 'Mountains', mood: 'Union & Passion', icon: '🏔️', variant: 'kurinji' },
  { id: 'mullai', tamil: 'முல்லை', english: 'Forest', mood: 'Patient Waiting', icon: '🌿', variant: 'mullai' },
  { id: 'marutam', tamil: 'மருதம்', english: 'Cropland', mood: 'Quarrel & Domestic', icon: '🌾', variant: 'marutam' },
  { id: 'neytal', tamil: 'நெய்தல்', english: 'Seashore', mood: 'Longing & Grief', icon: '🌊', variant: 'neytal' },
  { id: 'palai', tamil: 'பாலை', english: 'Wasteland', mood: 'Separation & Journey', icon: '🏜️', variant: 'palai' },
]

const STATS = [
  { value: '18', label: 'Classical Collections', sub: '8 Anthologies & 10 Idylls' },
  { value: '2,381', label: 'Classical Poems', sub: 'Preserved in digital JSON' },
  { value: '473', label: 'Sangam Poets', sub: 'Men & women of antiquity' },
  { value: '2,000+', label: 'Years of Tradition', sub: 'c. 300 BCE – 300 CE' },
]

export default function Home() {
  const navigate = useNavigate()
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen)
  const setActiveTinai = useAppStore((s) => s.setActiveTinai)
  const [transitioningTinai, setTransitioningTinai] = useState(null)

  const handleCardClick = (e, tinaiId) => {
    e.preventDefault()
    setTransitioningTinai(tinaiId)
    setActiveTinai(tinaiId) // Update background state immediately

    // Navigate to world explorer page after transition animation completes
    setTimeout(() => {
      navigate(`/world?tinai=${tinaiId}`)
    }, 850)
  }

  return (
    <>
      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20 space-y-24 transition-all duration-[800ms] ease-out
          ${transitioningTinai ? 'blur-md scale-95 opacity-20 pointer-events-none' : ''}`}
      >
      {/* Hero Section */}
      <section className="text-center space-y-8 max-w-4xl mx-auto pt-4">
        <Reveal y={-16} duration={0.5}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-semibold uppercase tracking-widest mb-2">
            <span>✨ Classical Tamil Digital Anthology</span>
          </div>
        </Reveal>

        <Reveal delay={0.1} duration={0.6}>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-primary leading-[1.1]">
            Explore 2,000 Years of<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 dark:from-amber-400 dark:via-amber-300 dark:to-amber-500">
              Classical Tamil Poetry
            </span>
          </h1>
        </Reveal>

        <Reveal delay={0.2} duration={0.6}>
          <p className="text-muted text-base sm:text-xl max-w-2xl mx-auto leading-relaxed">
            An interactive scholar-verified reader for the Sangam corpus — interlinear translations,
            click-to-define root etymologies, and immersive 3D landscape navigation.
          </p>
        </Reveal>

        {/* Hero CTAs & Quick Search Input */}
        <Reveal delay={0.3} duration={0.6}>
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/book">
                <Button size="lg" icon="📖">
                  Open Reader & Library →
                </Button>
              </Link>
              <Link to="/world">
                <Button size="lg" variant="secondary" icon="🗺️">
                  Enter Sangam World
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                icon="🔍"
                onClick={() => setCommandPaletteOpen(true)}
              >
                Search Corpus (⌘K)
              </Button>
            </div>

            <p className="text-xs text-faint">
              Press <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-surface border border-line rounded">⌘K</kbd> anywhere to search poems, verses, or root words.
            </p>
          </div>
        </Reveal>

        {/* Daily Verse Spotlight Card */}
        <Reveal delay={0.4} duration={0.7}>
          <Card variant="glass" className="p-6 sm:p-8 text-left space-y-4 max-w-3xl mx-auto border-accent/25">
            <div className="flex items-center justify-between">
              <Badge variant="accent" size="sm">Verse Spotlight • குறுந்தொகை 40</Badge>
              <span className="text-xs font-mono text-faint">Kurunthokai 40 · Chembulappeyaneer</span>
            </div>

            <blockquote className="space-y-2">
              <p className="tamil-verse text-xl sm:text-2xl text-primary font-semibold leading-relaxed">
                "யாயும் ஞாயும் யாராகியரோ,<br />
                எந்தையும் நுந்தையும் எம்முறைக் கேளிர்..."
              </p>
              <p className="text-sm text-muted italic pt-2 border-t border-line leading-relaxed">
                "My mother and your mother, how are they related? My father and your father, how are they kin? Yet like red earth and pouring rain, our loving hearts have mingled into one."
              </p>
            </blockquote>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-faint font-medium">Poet: Cempulappeyanīrār (செம்புலப்பெயல்நீரார்)</span>
              <Link to="/book/kurunthokai" className="text-accent font-semibold hover:underline flex items-center gap-1">
                Read full poem →
              </Link>
            </div>
          </Card>
        </Reveal>
      </section>

      {/* Corpus Metrics Stats Bar */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.1} y={16}>
            <Card variant="flat" className="p-5 text-center space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-accent">{s.value}</p>
              <p className="text-sm font-semibold text-primary">{s.label}</p>
              <p className="text-xs text-faint">{s.sub}</p>
            </Card>
          </Reveal>
        ))}
      </section>

      {/* Tiṇai Landscapes Quick-Nav */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <Badge variant="outline" size="sm">Landscape Poetics</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-primary">Five Landscapes · ஐந்திணை</h2>
          <p className="text-muted text-sm max-w-xl mx-auto">
            In Sangam poetry, love and nature are inseparable. Every emotional state is mapped to a distinct landscape geography.
          </p>
        </div>

        <RevealGroup className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {TINAI_HIGHLIGHTS.map((t) => (
            <Link
              key={t.id}
              to={`/world?tinai=${t.id}`}
              onClick={(e) => handleCardClick(e, t.id)}
              className="group"
            >
              <Card variant="interactive" className="p-5 text-center space-y-3 h-full flex flex-col justify-between">
                <div className="text-4xl transform group-hover:scale-110 transition-transform duration-200" aria-hidden="true">
                  {t.icon}
                </div>
                <div>
                  <Badge variant={t.variant} size="sm" className="mb-2">
                    {t.tamil}
                  </Badge>
                  <p className="text-sm font-semibold text-primary">{t.english}</p>
                  <p className="text-xs text-faint mt-1">{t.mood}</p>
                </div>
                <span className="text-xs font-semibold text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore →
                </span>
              </Card>
            </Link>
          ))}
        </RevealGroup>
      </section>

      {/* Feature Highlights */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <Badge variant="outline" size="sm">Core Architecture</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-primary">Built for Readers & Scholars</h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: '📖',
              title: 'Layered Interlinear View',
              desc: 'Seamlessly toggle between original classical Tamil, modern Urai prose commentaries, and English translations for every verse.',
              badge: 'Multi-layer',
            },
            {
              icon: '🔍',
              title: 'Click-to-Define Etymology',
              desc: 'Tap any word in a verse to unveil its root verb, grammatical class (Urichol), and 2,000-year-old etymology.',
              badge: 'Grammar AI',
            },
            {
              icon: '🤖',
              title: 'Gemini Scholar Translation',
              desc: 'Leverage Gemini 2.5 Flash for contextual translation assistance, verified against classical commentaries.',
              badge: 'Scholar AI',
            },
          ].map((f, i) => (
            <Reveal key={f.title} delay={i * 0.15} y={20}>
              <Card variant="default" className="p-6 space-y-3 h-full flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl" aria-hidden="true">{f.icon}</span>
                    <Badge variant="default" size="sm">{f.badge}</Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-primary">{f.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <Reveal y={24} duration={0.6}>
        <Card variant="glass" className="p-8 sm:p-12 text-center space-y-6 border-accent/30 bg-gradient-to-r from-accent/5 via-transparent to-accent/5">
          <h2 className="tamil text-3xl sm:text-4xl font-bold text-primary">
            இன்றே சங்கத் தமிழைச் சுவைப்பீர்
          </h2>
          <p className="text-muted text-base max-w-xl mx-auto">
            Immerse yourself in classical Tamil heritage. Access the entire corpus anytime, anywhere.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/book">
              <Button size="lg">Explore Library →</Button>
            </Link>
            <Link to="/graph">
              <Button size="lg" variant="secondary">View Connections Graph</Button>
            </Link>
          </div>
        </Card>
      </Reveal>
      </div>

      {transitioningTinai && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black pointer-events-none animate-[fadeIn_0.5s_ease-out]">
          <div className="absolute w-[200vw] h-[200vh] rounded-full bg-black scale-0 animate-[expandCircle_0.9s_cubic-bezier(0.22,1,0.36,1)_forwards]" />
        </div>
      )}
    </>
  )
}
