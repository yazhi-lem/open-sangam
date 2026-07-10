import { Link } from 'react-router-dom'
import { KNOWLEDGE_SECTIONS } from '../data/knowledge'

function KnowledgeCard({ item }) {
  const inner = (
    <>
      <div className="flex items-start gap-3">
        <div className="text-3xl leading-none shrink-0" aria-hidden>{item.emoji}</div>
        <div className="min-w-0">
          <p className="tamil text-base font-semibold text-primary leading-snug">{item.ta}</p>
          <p className="text-sm text-accent font-medium">{item.en}</p>
        </div>
      </div>
      <p className="text-muted text-sm leading-relaxed">{item.desc}</p>
      {item.tag && (
        <span className="inline-block text-[11px] uppercase tracking-wide text-faint border border-line rounded-full px-2 py-0.5">
          {item.tag}
        </span>
      )}
      {item.to && (
        <span className="text-xs text-accent font-medium">Explore →</span>
      )}
    </>
  )

  const cardClass =
    'flex flex-col gap-3 rounded-xl border border-line bg-surface-alt/40 p-5 h-full transition-colors'

  return item.to ? (
    <Link to={item.to} className={`${cardClass} hover:border-line-strong hover:bg-surface-alt`}>
      {inner}
    </Link>
  ) : (
    <div className={cardClass}>{inner}</div>
  )
}

export default function Knowledge() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-16">
      {/* Header */}
      <header className="text-center space-y-4 max-w-3xl mx-auto">
        <p className="tamil text-accent text-lg tracking-widest">அறிவுக் களஞ்சியம்</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-primary leading-tight">
          Sangam Knowledge
        </h1>
        <p className="text-muted text-lg leading-relaxed">
          An illustrated guide to the world behind the poems — its academies and anthologies,
          the akam/puṟam divide, the tiṇai landscapes, the poets and patron-kings, its music,
          and the daily life of the early Tamil country.
        </p>
      </header>

      {/* Section jump-nav */}
      <nav className="flex flex-wrap justify-center gap-2">
        {KNOWLEDGE_SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="text-sm rounded-full border border-line bg-surface-alt/40 px-3 py-1.5 text-muted hover:text-primary hover:border-line-strong transition-colors"
          >
            <span aria-hidden className="mr-1">{s.icon}</span>
            {s.en.split(' — ')[0]}
          </a>
        ))}
      </nav>

      {/* Sections */}
      {KNOWLEDGE_SECTIONS.map((section) => (
        <section key={section.id} id={section.id} className="space-y-6 scroll-mt-20">
          <div className="space-y-2 border-l-2 border-accent pl-4">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-2xl" aria-hidden>{section.icon}</span>
              <h2 className="tamil text-xl font-semibold text-primary">{section.ta}</h2>
              <span className="text-lg text-muted">{section.en}</span>
            </div>
            <p className="text-muted text-sm leading-relaxed max-w-3xl">{section.intro}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item) => (
              <KnowledgeCard key={item.en} item={item} />
            ))}
          </div>
        </section>
      ))}

      {/* Footer CTA */}
      <section className="text-center space-y-4 border-t border-line pt-12">
        <p className="text-muted">Ready to read the verses themselves?</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/book"
            className="px-6 py-3 rounded-xl bg-accent text-on-accent font-semibold hover:bg-accent-strong transition-colors"
          >
            Open the Library →
          </Link>
          <Link
            to="/world"
            className="px-6 py-3 rounded-xl border border-line-strong text-muted hover:text-primary transition-colors"
          >
            Enter Sangam World
          </Link>
          <Link
            to="/graph"
            className="px-6 py-3 rounded-xl border border-line-strong text-muted hover:text-primary transition-colors"
          >
            See the Connections Graph
          </Link>
        </div>
      </section>
    </div>
  )
}
