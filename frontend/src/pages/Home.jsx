import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import Reveal, { RevealGroup } from '../components/motion/Reveal'
import useAppStore from '../store/useAppStore'

const TINAI_HIGHLIGHTS = [
  { id: 'kurinji', tamil: 'குறிஞ்சி', english: 'Kurinji',  desc: 'Mountain Landscape',      variant: 'kurinji', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop' },
  { id: 'mullai',  tamil: 'முல்லை',  english: 'Mullai',   desc: 'Forest Landscape',        variant: 'mullai', img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1000&auto=format&fit=crop' },
  { id: 'marutam', tamil: 'மருதம்',  english: 'Marutham', desc: 'Agricultural Farmland',   variant: 'marutam', img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1000&auto=format&fit=crop' },
  { id: 'neytal',  tamil: 'நெய்தல்', english: 'Neithal',  desc: 'Coastal Seashore',        variant: 'neytal', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop' },
  { id: 'palai',   tamil: 'பாலை',   english: 'Palai',    desc: 'Arid Wasteland',          variant: 'palai', img: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=1000&auto=format&fit=crop' },
]

const STATS = [
  { 
    value: '18',    
    label: 'Collections',   
    sub: '8 Anthologies & 10 Idylls',   
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
      </svg>
    ) 
  },
  { 
    value: '2,381', 
    label: 'Classical Poems', 
    sub: 'Digitally preserved',  
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ) 
  },
  { 
    value: '473',   
    label: 'Sangam Poets',   
    sub: 'Men & women of antiquity',   
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ) 
  },
  { 
    value: '2,000+', 
    label: 'Years of Tradition', 
    sub: 'c. 300 BCE – 300 CE',   
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V2"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>
      </svg>
    ) 
  },
]

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
        <polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/>
      </svg>
    ),
    title: 'Layered Interlinear View',
    desc: 'Seamlessly toggle between original classical Tamil, modern Urai prose commentaries, and English translations for every verse.',
    badge: 'Multi-layer',
    color: 'text-amber-600 dark:text-amber-400',
    bg:    'bg-amber-500/10',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    title: 'Click-to-Define Etymology',
    desc: 'Tap any word in a verse to unveil its root verb, grammatical class (Urichol), and 2,000-year-old etymology.',
    badge: 'Grammar AI',
    color: 'text-violet-600 dark:text-violet-400',
    bg:    'bg-violet-500/10',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>
      </svg>
    ),
    title: 'Gemini Scholar Translation',
    desc: 'Leverage Gemini 2.5 Flash for contextual translation assistance, verified against classical commentaries.',
    badge: 'Scholar AI',
    color: 'text-sky-600 dark:text-sky-400',
    bg:    'bg-sky-500/10',
  },
]

export default function Home() {
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20 space-y-28">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative text-center space-y-8 max-w-4xl mx-auto pt-4">
        {/* Subtle radial glow behind the hero */}
        <div
          className="absolute inset-0 -top-24 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 0%, color-mix(in srgb, var(--accent) 8%, transparent), transparent)',
          }}
        />

        <Reveal y={-16} duration={0.5}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold uppercase tracking-widest">
            <span aria-hidden="true">✦</span>
            Classical Tamil Digital Anthology
          </div>
        </Reveal>

        <Reveal delay={0.1} duration={0.65}>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-primary leading-[1.08]">
            Explore 2,000 Years of
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, #b45309 0%, #f59e0b 45%, #d97706 100%)',
              }}
            >
              Classical Tamil Poetry
            </span>
          </h1>
        </Reveal>

        <Reveal delay={0.2} duration={0.6}>
          <p className="text-muted text-base sm:text-xl max-w-2xl mx-auto leading-relaxed">
            An interactive, scholar-verified reader for the Sangam corpus — interlinear
            translations, click-to-define root etymologies, and immersive 3D landscape
            navigation.
          </p>
        </Reveal>

        {/* CTAs */}
        <Reveal delay={0.3} duration={0.6}>
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/book">
                <Button 
                  size="lg" 
                  icon={
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                    </svg>
                  }
                >
                  Open the Library
                </Button>
              </Link>
              <Link to="/world">
                <Button 
                  size="lg" 
                  variant="secondary"
                  icon={
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                  }
                >
                  Explore Sangam World
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setCommandPaletteOpen(true)}
                icon={
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                }
              >
                Search Corpus
                <kbd className="ml-1.5 px-1.5 py-0.5 text-[9px] font-mono bg-surface border border-line rounded opacity-70">
                  ⌘K
                </kbd>
              </Button>
            </div>
            <p className="text-xs text-faint">
              Press{' '}
              <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-surface border border-line rounded">⌘K</kbd>
              {' '}anywhere to search poems, verses, or root words.
            </p>
          </div>
        </Reveal>

        {/* Verse Spotlight Card */}
        <Reveal delay={0.4} duration={0.7}>
          <Card
            variant="glass"
            className="p-6 sm:p-8 text-left space-y-4 max-w-2xl mx-auto border-accent/20"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Badge variant="accent" size="sm">Verse Spotlight • குறுந்தொகை 40</Badge>
              <span className="text-[11px] font-mono text-faint">
                Kurunthokai 40 · Chembulappeyaneer
              </span>
            </div>

            {/* Decorative quote mark */}
            <div className="relative">
              <span
                className="absolute -top-2 -left-1 text-5xl text-accent/20 font-serif leading-none select-none pointer-events-none"
                aria-hidden="true"
              >
                ❝
              </span>
              <blockquote className="space-y-3 pl-2">
                <p className="tamil-verse text-xl sm:text-2xl text-primary font-semibold leading-relaxed">
                  யாயும் ஞாயும் யாராகியரோ,
                  <br />
                  எந்தையும் நுந்தையும் எம்முறைக் கேளிர்...
                </p>
                <p className="text-sm text-muted italic pt-3 border-t border-line leading-relaxed">
                  "My mother and your mother, how are they related? My father and
                  your father, how are they kin? Yet like red earth and pouring
                  rain, our loving hearts have mingled into one."
                </p>
              </blockquote>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-faint">
                Poet: <span className="tamil">செம்புலப்பெயல்நீரார்</span>
              </span>
              <Link
                to="/book/kurunthokai"
                className="text-accent font-semibold hover:text-accent-strong transition-colors flex items-center gap-1 group"
              >
                Read full poem
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true" className="group-hover:translate-x-0.5 transition-transform">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          </Card>
        </Reveal>
      </section>

      {/* ── Corpus Stats Bar ──────────────────────────────────────────── */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">Corpus statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08} y={16}>
              <Card
                variant="default"
                className="p-6 text-center space-y-2.5 group hover:border-accent/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 h-full flex flex-col justify-center"
              >
                <div className="mx-auto text-accent/80" aria-hidden="true">
                  {s.icon}
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-extrabold text-accent tabular-nums leading-none">
                    {s.value}
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-primary mt-1.5">{s.label}</p>
                  <p className="text-[10px] sm:text-xs text-faint mt-0.5">{s.sub}</p>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Tiṇai Landscapes ──────────────────────────────────────────── */}
      <section className="space-y-8" aria-labelledby="tinai-heading">
        <div className="text-center space-y-2.5">
          <Badge variant="outline" size="sm">Landscape Poetics</Badge>
          <h2 id="tinai-heading" className="text-3xl sm:text-4xl font-bold text-primary">
            Five Landscapes ·{' '}
            <span className="tamil">ஐந்திணை</span>
          </h2>
          <p className="text-muted text-sm max-w-xl mx-auto leading-relaxed">
            In Sangam poetry, love and nature are inseparable. Every emotional
            state is mapped to a distinct landscape geography.
          </p>
        </div>

        <RevealGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {TINAI_HIGHLIGHTS.map((t) => (
            <Link key={t.id} to={`/world?tinai=${t.id}`} className="group block h-[240px]">
              <Card variant="outline" className="h-full hover:border-accent/30 transition-all flex flex-col justify-end relative overflow-hidden border-none group">
                {/* Background Image filling container */}
                <img 
                  src={t.img} 
                  alt={`${t.english} landscape`}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                {/* Cinematic Bottom Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10 p-6 space-y-1">
                  <h3 className="tamil text-3xl font-extrabold text-white drop-shadow-lg tracking-tight group-hover:text-accent transition-colors duration-300">
                    {t.tamil}
                  </h3>
                  <p className="text-sm font-medium text-white/80 drop-shadow-md tracking-wide uppercase">
                    {t.english}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </RevealGroup>
      </section>

      {/* ── Feature Highlights ────────────────────────────────────────── */}
      <section className="space-y-8" aria-labelledby="features-heading">
        <div className="text-center space-y-2.5">
          <Badge variant="outline" size="sm">Core Architecture</Badge>
          <h2 id="features-heading" className="text-3xl sm:text-4xl font-bold text-primary">
            Built for Readers & Scholars
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.12} y={20} className="h-full">
              <Card variant="default" className="p-6 space-y-4 h-full flex flex-col hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-xl ${f.bg} ${f.color} flex items-center justify-center`} aria-hidden="true">
                    {f.icon}
                  </div>
                  <Badge variant="default" size="sm">{f.badge}</Badge>
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-base font-semibold text-primary">{f.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────── */}
      <Reveal y={24} duration={0.6}>
        <div className="relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/8 via-transparent to-accent/5">
          {/* Decorative background text */}
          <div
            className="absolute right-6 top-1/2 -translate-y-1/2 text-[120px] leading-none select-none pointer-events-none opacity-[0.04] font-bold tamil hidden lg:block"
            aria-hidden="true"
          >
            சங்கம்
          </div>

          <div className="relative px-8 sm:px-12 py-12 text-center space-y-6">
            <h2 className="tamil text-3xl sm:text-4xl font-bold text-primary">
              இன்றே சங்கத் தமிழைச் சுவைப்பீர்
            </h2>
            <p className="text-muted text-base max-w-xl mx-auto">
              Immerse yourself in classical Tamil heritage. Access the entire corpus
              anytime, anywhere.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/book">
                <Button 
                  size="lg" 
                  icon={
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                    </svg>
                  }
                >
                  Explore the Library
                </Button>
              </Link>
              <Link to="/graph">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  icon={
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
                    </svg>
                  }
                >
                  Explore Connections Graph
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  )
}
