import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Search } from 'lucide-react'
import storyData from '@data/library/stories.json'
import useAppStore from '../../store/useAppStore'
import Badge from '../ui/Badge'
import Card from '../ui/Card'

const STORIES = storyData.stories
const STORY_ARCHETYPES = storyData.archetypes

function storyMatchesQuery(story, query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return true
  return [story.titleTa, story.titleEn, story.theme, story.conflict, ...(story.characters || [])]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q))
}

function pick(language, ta, en) {
  return language === 'ta' ? ta : en
}

export default function StoriesSection() {
  const language = useAppStore((s) => s.language)
  const L = (ta, en) => pick(language, ta, en)
  const [kind, setKind] = useState('all')
  const [query, setQuery] = useState('')
  const [archetype, setArchetype] = useState(null)

  const archetypes = useMemo(
    () => STORY_ARCHETYPES.filter((item) => (kind === 'all' ? true : item.id.startsWith(kind === 'akam' ? 'akam-' : 'puram-'))),
    [kind]
  )

  const stories = useMemo(() => {
    return STORIES.filter((story) => {
      if (kind !== 'all' && story.kind !== kind) return false
      if (archetype && story.archetype !== archetype) return false
      return storyMatchesQuery(story, query)
    }).slice(0, 24)
  }, [kind, archetype, query])

  return (
    <section id="stories" className="mb-12">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-line-strong pb-2">
        <div>
          <h2 className={`text-2xl font-bold text-primary ${language === 'ta' ? 'tamil' : ''}`}>
            {L('பாடல்களின் கதைகள்', 'Stories from the songs')}
          </h2>
          <p className="text-sm text-muted">
            {L('அகம்: உணர்வுப் பயணம் · புறம்: நிகழ்வுப் பயணம்', 'Akam: an emotional arc · Puram: an event arc')}
          </p>
        </div>
        <Badge variant="accent" size="sm">
          {L('2,669 கதை விதைகள்', '2,669 story seeds')}
        </Badge>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {[
          ['all', L('அனைத்தும்', 'All')],
          ['akam', L('அகம்', 'Akam')],
          ['puram', L('புறம்', 'Puram')],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => { setKind(id); setArchetype(null) }}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              kind === id ? 'border-primary bg-primary text-page' : 'border-line text-muted hover:border-primary'
            }`}
          >
            {label}
          </button>
        ))}
        <div className="relative ml-auto min-w-[12rem] flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={L('கதையைத் தேடு...', 'Search a story...')}
            className="min-h-[36px] w-full rounded-full border border-line bg-surface-alt/60 pl-8 pr-3 text-xs text-primary placeholder:text-faint focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {archetypes.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setArchetype(archetype === item.id ? null : item.id)}
            className={`rounded-full border px-2.5 py-1 text-[10px] ${
              archetype === item.id
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-line text-muted hover:border-accent'
            }`}
          >
            {L(item.ta, item.en)}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stories.map((story) => {
          const arc = STORY_ARCHETYPES.find((item) => item.id === story.archetype)
          return (
            <Card key={story.id} variant="flat" className="flex flex-col gap-2 p-3">
              <div className="flex items-start justify-between gap-2">
                <Badge variant={story.kind === 'akam' ? 'mullai' : 'puram'} size="sm">
                  {story.kind === 'akam' ? L('அகம்', 'Akam') : L('புறம்', 'Puram')}
                </Badge>
                <span className="text-[10px] font-mono text-faint">{story.poem}</span>
              </div>
              <h3 className={`text-sm font-bold text-primary ${language === 'ta' ? 'tamil' : ''}`}>
                {L(story.titleTa, story.titleEn)}
              </h3>
              <p className={`text-[11px] font-medium text-accent ${language === 'ta' ? 'tamil' : ''}`}>
                {arc ? L(arc.ta, arc.en) : story.archetype}
              </p>
              <p className="line-clamp-2 text-[11px] leading-relaxed text-muted">
                {L(story.conflict, story.conflict)}
              </p>
              <p className="line-clamp-2 text-[11px] leading-relaxed text-faint">
                {L(story.turn, story.turn)}
              </p>
              <div className="mt-auto flex items-center justify-between gap-2 border-t border-line/60 pt-2">
                <span className="truncate text-[10px] text-faint">{story.characters.slice(0, 2).join(' · ')}</span>
                <Link
                  to={`/book/${story.poem}/${story.ordinal}`}
                  className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-accent hover:underline"
                >
                  <BookOpen size={11} /> {L('பாடல்', 'Verse')} <ArrowRight size={10} />
                </Link>
              </div>
            </Card>
          )
        })}
      </div>
      {!stories.length && (
        <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
          {L('இந்த வடிகட்டலுக்கு கதை இல்லை.', 'No stories match this filter.')}
        </p>
      )}
    </section>
  )
}
