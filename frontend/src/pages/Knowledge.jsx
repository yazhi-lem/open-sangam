import { Link } from 'react-router-dom'
import { KNOWLEDGE_SECTIONS } from '../data/knowledge'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Reveal, { RevealGroup } from '../components/motion/Reveal'

function KnowledgeCard({ item }) {
  const content = (
    <div className="flex flex-col justify-between h-full space-y-3">
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-xl shrink-0"
            aria-hidden="true"
          >
            {item.emoji}
          </div>
          <div className="min-w-0 pt-0.5">
            <p className="tamil text-base font-bold text-primary leading-tight">{item.ta}</p>
            <p className="text-xs text-accent font-semibold mt-0.5">{item.en}</p>
          </div>
        </div>
        <p className="text-muted text-xs sm:text-sm leading-relaxed">{item.desc}</p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-line/60">
        {item.tag ? (
          <Badge variant="outline" size="sm">{item.tag}</Badge>
        ) : (
          <span />
        )}
        {item.to && (
          <span className="text-xs text-accent font-semibold flex items-center gap-1 group-hover:gap-1.5 transition-all">
            Explore
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </span>
        )}
      </div>
    </div>
  )

  return item.to ? (
    <Link to={item.to} className="h-full block group">
      <Card variant="interactive" className="p-5 h-full">
        {content}
      </Card>
    </Link>
  ) : (
    <Card variant="flat" className="p-5 h-full">
      {content}
    </Card>
  )
}

export default function Knowledge() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-12">

      {/* Header */}
      <Reveal y={-16}>
        <header className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge variant="accent" size="sm">அறிவுக் களஞ்சியம்</Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-primary leading-tight">
            Sangam Knowledge Base
          </h1>
          <p className="text-muted text-base sm:text-lg leading-relaxed">
            An illustrated guide to the ancient world behind the poems — academies,
            anthologies, the Akam/Puram duality, Tiṇai landscapes, poets, patron-kings,
            and daily life in early Tamil country.
          </p>
        </header>
      </Reveal>

      {/* Section jump-nav — sticky on scroll */}
      <div className="sticky top-14 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-page/90 backdrop-blur-md border-b border-line">
        <nav
          className="flex flex-wrap gap-1.5 justify-center"
          aria-label="Jump to section"
        >
          {KNOWLEDGE_SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium rounded-lg border border-line bg-surface px-2.5 py-1.5 text-muted hover:text-accent hover:border-accent/40 hover:bg-accent/5 transition-all focus-ring"
            >
              <span aria-hidden="true" className="text-sm">{s.icon}</span>
              <span>{s.en.split(' — ')[0]}</span>
            </a>
          ))}
        </nav>
      </div>

      {/* Sections */}
      <div className="space-y-16">
        {KNOWLEDGE_SECTIONS.map((section, sectionIdx) => (
          <section key={section.id} id={section.id} className="space-y-6">
            <Reveal y={12} delay={0.05}>
              <div className="flex items-start gap-4">
                {/* Icon bubble */}
                <div
                  className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/15 flex items-center justify-center text-2xl shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  {section.icon}
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h2 className="tamil text-2xl font-bold text-primary">{section.ta}</h2>
                    <span className="text-base text-muted font-medium">— {section.en}</span>
                  </div>
                  <p className="text-muted text-sm leading-relaxed max-w-3xl">
                    {section.intro}
                  </p>
                </div>
              </div>
            </Reveal>

            <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" amount={0.08}>
              {section.items.map((item) => (
                <KnowledgeCard key={item.en} item={item} />
              ))}
            </RevealGroup>
          </section>
        ))}
      </div>

      {/* Footer CTA */}
      <Reveal y={20}>
        <div className="relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/8 via-transparent to-accent/5 p-8 sm:p-12 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary">
            Ready to read the verses themselves?
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/book">
              <Button size="lg" icon="📖">Explore the Library</Button>
            </Link>
            <Link to="/world">
              <Button size="lg" variant="secondary" icon="🗺️">Explore Sangam World</Button>
            </Link>
            <Link to="/graph">
              <Button size="lg" variant="outline" icon="🕸️">Explore Connections Graph</Button>
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  )
}
