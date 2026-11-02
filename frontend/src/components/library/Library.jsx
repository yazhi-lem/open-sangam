import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import Reveal, { RevealGroup } from '../motion/Reveal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Chip from '../ui/Chip'
import useAppStore from '../../store/useAppStore'
import { POEMS, COLLECTIONS, POEM_BY_ID } from '../../data/poems.js'
import {
  LIBRARY_COLLECTIONS,
  LIBRARY_WORKS,
  ARTIFACTS,
  artifactMatchesQuery,
  workMatchesQuery,
} from '../../data/library.js'
import { FILTER_CHIPS, IDYLL_NOTE, poemMatchesChip } from '../../data/chipLabels.js'
import PoemCard from './PoemCard'
import ArtifactCollection from './ArtifactCollection'
import CatalogCollection from './CatalogCollection'
import ContributeModal from './ContributeModal'

export default function Library() {
  const language = useAppStore((s) => s.language)
  const L = (ta, en) => (language === 'ta' ? ta : en)
  const [searchQuery, setSearchQuery] = useState('')
  const [chipFilter, setChipFilter] = useState(null) // null | id from FILTER_CHIPS
  const [showContribute, setShowContribute] = useState(false)

  const filteredPoems = POEMS.filter((p) => {
    const matchesCollection = poemMatchesChip(p, chipFilter)
    const matchesSearch =
      !searchQuery.trim() ||
      p.ta.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.en.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCollection && matchesSearch
  })

  const byCollection = Object.entries(COLLECTIONS)
    .map(([key, meta]) => ({
      key,
      meta,
      poems: filteredPoems.filter((p) => p.collection === key),
    }))

  return (
    <div className="min-h-screen bg-page">
      <Reveal as="div" className="w-full px-4 sm:px-6 pt-6 pb-5" duration={0.6}>
        <div className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h1 className={`text-2xl sm:text-4xl font-extrabold text-primary leading-tight ${language === 'ta' ? 'tamil' : ''}`}>
              {L('தமிழ் நூலகம்', 'Tamil Library')}
            </h1>
            <Button variant="outline" size="sm" onClick={() => setShowContribute(true)}>
              <BookOpen size={14} className="mr-1.5" />
              {L('பங்களி!', 'Contribute')}
            </Button>
          </div>
          <p className="text-base sm:text-lg text-muted font-light">
            {L('சங்கம் · பதினெண்கீழ்க்கணக்கு · ஐம்பெருங்காப்பியங்கள் · பக்தி · இலக்கணம்', 'Sangam · Pathinenkilkkanakku · Great Epics · Bhakti · Grammar')}
          </p>
          <p className={`text-sm text-muted pt-1 ${language === 'ta' ? 'tamil' : ''}`}>
            {L('நூலைத் தேர்ந்தெடு → படி → பொருள் அறி', 'Choose a work → Read → Understand')}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder={L("தமிழ் அல்லது ஆங்கிலப் பெயரில் தேடுங்கள்...", "Search by Tamil or English name...")}
            icon="🔍"
          />
          <div
            role="group"
            aria-label="Filter by akam, puram or tiṇai"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 sm:flex-wrap"
          >
            {FILTER_CHIPS.map((c) => (
              <Chip
                key={c.id}
                label={c.label}
                selected={chipFilter === c.id}
                onClick={() => setChipFilter(chipFilter === c.id ? null : c.id)}
              />
            ))}
          </div>
          {chipFilter && (
            <p className={`text-xs text-faint ${language === 'ta' ? 'tamil' : ''}`}>
              {language === 'ta' ? IDYLL_NOTE.ta : IDYLL_NOTE.en}
            </p>
          )}
        </div>
      </Reveal>

      <div className="w-full px-4 sm:px-6 pb-16 space-y-10">
        {byCollection.map(({ key, meta, poems }) => (
          <div key={key}>
            <div className="space-y-6">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pb-3 border-b border-line-strong">
                <h2 className={`text-xl sm:text-2xl font-bold text-primary break-words min-w-0 ${language === 'ta' ? 'tamil' : ''}`}>{L(meta.ta, meta.en)}</h2>
                <span className="ml-auto text-xs font-mono text-faint">{poems.length} works</span>
              </div>
              <p className="text-sm text-muted max-w-2xl leading-relaxed">{meta.desc}</p>

              {poems.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-line rounded-2xl text-muted text-sm">
                  {L(
                    `இந்தத் தொகுப்பில் "${searchQuery}" என்பதற்குப் பொருந்தும் நூல்கள் இல்லை.`,
                    `No poems matching "${searchQuery}" in this collection.`
                  )}
                </div>
              ) : (
                <RevealGroup
                  className={`grid auto-rows-fr grid-cols-1 sm:grid-cols-2 gap-3 ${
                    key === '10paddu' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
                  }`}
                  amount={0.08}
                >
                  {poems.map((poem) => (
                    <PoemCard key={poem.id} poem={poem} />
                  ))}
                </RevealGroup>
              )}
            </div>
          </div>
        ))}

        <ContributeModal open={showContribute} onClose={() => setShowContribute(false)} />

        {!chipFilter &&
          LIBRARY_COLLECTIONS.map((collection) => {
            if (collection.id === 'artifacts') {
              const artifacts = ARTIFACTS.filter((artifact) =>
                artifactMatchesQuery(artifact, searchQuery)
              )
              if (!artifacts.length && searchQuery.trim()) return null
              return (
                <ArtifactCollection
                  key={collection.id}
                  collection={collection}
                  artifacts={artifacts}
                />
              )
            }
            const works = LIBRARY_WORKS.filter(
              (work) =>
                work.collection === collection.id &&
                !POEM_BY_ID[work.id] &&
                workMatchesQuery(work, searchQuery)
            )
            if (!works.length && searchQuery.trim()) return null
            return (
              <CatalogCollection
                key={collection.id}
                collection={collection}
                works={works}
              />
            )
          })}
      </div>
    </div>
  )
}
