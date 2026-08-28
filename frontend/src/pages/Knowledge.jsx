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
          <div className="text-3xl leading-none shrink-0" aria-hidden="true">
            {item.emoji}
          </div>
          <div className="min-w-0">
            <p className="tamil text-lg font-bold text-primary leading-tight">{item.ta}</p>
            <p className="text-xs text-accent font-semibold">{item.en}</p>
          </div>
        </div>
        <p className="text-muted text-xs sm:text-sm leading-relaxed">{item.desc}</p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-line/60">
        {item.tag ? (
          <Badge variant="outline" size="sm">
            {item.tag}
          </Badge>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          {item.graphFocus && (
            <Link to={`/graph?focus=${item.graphFocus}`} className="text-xs text-faint font-semibold hover:underline">
              View in Graph →
            </Link>
          )}
          {item.to && <span className="text-xs text-accent font-semibold hover:underline">Explore →</span>}
        </div>
      </div>
    </div>
  )

  return item.to ? (
    <Link to={item.to} className="h-full block">
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-16">
      {/* Header */}
      <Reveal y={-16}>
        <header className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge variant="accent" size="sm">அறிவுக் களஞ்சியம்</Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-primary leading-tight">
            Sangam Knowledge Base
          </h1>
          <p className="text-muted text-base sm:text-lg leading-relaxed">
            An illustrated guide to the ancient world behind the poems — academies, anthologies, the Akam/Puram duality, Tiṇai landscapes, poets, patron-kings, and daily life in early Tamil country.
          </p>
        </header>
      </Reveal>

      {/* Section jump-nav */}
      <nav className="flex flex-wrap justify-center gap-2 p-3 rounded-2xl border border-line bg-surface-alt/40 backdrop-blur-sm">
        {KNOWLEDGE_SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="text-xs font-medium rounded-xl border border-line bg-surface px-3 py-1.5 text-muted hover:text-accent hover:border-accent/40 transition-colors focus-ring"
          >
            <span aria-hidden="true" className="mr-1.5">{s.icon}</span>
            {s.en.split(' — ')[0]}
          </a>
        ))}
      </nav>

      {/* Sections */}
      {KNOWLEDGE_SECTIONS.map((section) => (
        <section key={section.id} id={section.id} className="space-y-6 scroll-mt-24">
          <div className="space-y-2 border-l-4 border-accent pl-4 py-1">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-2xl" aria-hidden="true">{section.icon}</span>
              <h2 className="tamil text-2xl font-bold text-primary">{section.ta}</h2>
              <span className="text-lg text-muted font-medium">• {section.en}</span>
            </div>
            <p className="text-muted text-sm leading-relaxed max-w-3xl">{section.intro}</p>
          </div>

          <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item) => (
              <KnowledgeCard key={item.en} item={item} />
            ))}
          </RevealGroup>
        </section>
      ))}

      {/* Footer CTA */}
      <Reveal y={20}>
        <Card variant="glass" className="text-center p-8 sm:p-12 space-y-6 border-accent/20">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary">Ready to read the verses themselves?</h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/book">
              <Button size="lg" icon="📖">Open the Library →</Button>
            </Link>
            <Link to="/world">
              <Button size="lg" variant="secondary" icon="🗺️">Enter Sangam World</Button>
            </Link>
            <Link to="/graph">
              <Button size="lg" variant="outline" icon="🕸️">See Connections Graph</Button>
            </Link>
          </div>
        </Card>
      </Reveal>
    </div>
  )
}
