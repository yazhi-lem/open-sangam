import { RevealGroup } from '../motion/Reveal'
import useAppStore from '../../store/useAppStore'
import CatalogWorkCard from './CatalogWorkCard'

export default function CatalogCollection({ collection, works }) {
  const language = useAppStore((s) => s.language)
  const L = (ta, en) => (language === 'ta' ? ta : en)
  return (
    <div>
      <div className="space-y-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line-strong pb-3">
          <h2 className={`min-w-0 break-words text-2xl font-bold text-primary sm:text-3xl ${language === 'ta' ? 'tamil' : ''}`}>{L(collection.ta, collection.en)}</h2>
          <span className="ml-auto text-xs font-mono text-faint">{works.length} works</span>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">{collection.description}</p>
        {works.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
            {L('இந்தத் தேடலுக்குப் பொருந்தும் நூல்கள் இல்லை.', 'No works matching this search.')}
          </div>
        ) : (
          <RevealGroup className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" amount={0.08}>
            {works.map((work) => (
              <CatalogWorkCard key={work.id} work={work} />
            ))}
          </RevealGroup>
        )}
      </div>
    </div>
  )
}
