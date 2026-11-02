import Reveal, { RevealGroup } from '../motion/Reveal'
import useAppStore from '../../store/useAppStore'
import { ARTIFACT_CLASSES } from '../../data/library.js'
import ArtifactCard from './ArtifactCard'

export default function ArtifactCollection({ collection, artifacts }) {
  const language = useAppStore((s) => s.language)
  const L = (ta, en) => (language === 'ta' ? ta : en)
  return (
    <div>
      <div className="space-y-8">
        <div className="border-b border-line-strong pb-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className={`min-w-0 break-words text-2xl font-bold text-primary sm:text-3xl ${language === 'ta' ? 'tamil' : ''}`}>{L(collection.ta, collection.en)}</h2>
            <span className="ml-auto text-xs font-mono text-faint">{artifacts.length} records</span>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{collection.description}</p>
        </div>
        {ARTIFACT_CLASSES.map((cls) => {
          const items = artifacts.filter((artifact) => artifact.class === cls.id)
          if (!items.length) return null
          return (
            <section key={cls.id} className="space-y-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className={`text-lg font-bold text-primary ${language === 'ta' ? 'tamil' : ''}`}>{L(cls.ta, cls.en)}</h3>
                <span className="ml-auto text-xs font-mono text-faint">{items.length}</span>
              </div>
              <p className="text-xs text-faint">{cls.description}</p>
              <RevealGroup className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" amount={0.05}>
                {items.map((artifact) => <ArtifactCard key={artifact.id} artifact={artifact} />)}
              </RevealGroup>
            </section>
          )
        })}
      </div>
    </div>
  )
}
