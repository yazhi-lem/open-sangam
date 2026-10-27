import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { TINAI_LIST } from '../data/tinaiWorld'
import { KNOWLEDGE_BY_ID } from '../data/knowledge'
import { POEMS } from '../data/poems'
import useAppStore from '../store/useAppStore'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import Reveal from '../components/motion/Reveal'
import GraphExplorer from './GraphExplorer'
import ResearchDesk from '../components/world/ResearchDesk'
import ResearchNotes from '../components/world/ResearchNotes'
import AvaiBriefs from '../components/world/AvaiBriefs'
const StoriesSection = lazy(() => import('../components/world/StoriesSection'))

function pick(language, ta, en) {
  return language === 'ta' ? ta : en
}

function CondensedRow({ label, children }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-2 border-t border-line/60 py-1.5 text-sm first:border-t-0">
      <span className="text-xs font-semibold text-faint">{label}</span>
      <div className="min-w-0 text-primary">{children}</div>
    </div>
  )
}

function TinaiCard({ tinai, language }) {
  const L = (ta, en) => pick(language, ta, en)
  const sample = tinai.poetry?.verified === false ? null : tinai.poetry
  const poems = POEMS.filter((p) => p.tinai?.includes(tinai.id)).slice(0, 3)

  return (
    <Card variant="flat" className="overflow-hidden p-0">
      <div className={`bg-gradient-to-br ${tinai.colors.primary} p-5 text-white`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-2xl" aria-hidden="true">{tinai.emoji}</p>
            <h3 className={`mt-1 text-2xl font-bold ${language === 'ta' ? 'tamil' : ''}`}>
              {L(tinai.ta, tinai.en)}
            </h3>
            <p className="text-sm text-white/80">{L(tinai.en, tinai.ta)}</p>
          </div>
          <Badge variant="outline" size="sm">{tinai.atmosphere.season.en}</Badge>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-white/85">{tinai.atmosphere.season.desc}</p>
      </div>

      <div className="p-4">
        <CondensedRow label={L('பொழுது', 'Time')}>
          {L(tinai.atmosphere.timeOfDay.ta, tinai.atmosphere.timeOfDay.en)} — {tinai.atmosphere.timeOfDay.desc}
        </CondensedRow>
        <CondensedRow label={L('கடவுள்', 'Deity')}>
          {L(tinai.deity.ta, tinai.deity.en)}
        </CondensedRow>
        <CondensedRow label={L('உரிப்பொருள்', 'Mood')}>
          {L(tinai.emotion.akam.ta, tinai.emotion.akam.en)}
        </CondensedRow>
        <CondensedRow label={L('மக்கள்', 'People')}>
          {tinai.people.map((person) => L(person.ta, person.en)).join(' · ')}
        </CondensedRow>
        <CondensedRow label={L('வாழ்க்கை', 'Life')}>
          {tinai.crafts.slice(0, 2).map((craft) => L(craft.ta, craft.en)).join(' · ')}
        </CondensedRow>
        <CondensedRow label={L('இசை', 'Music')}>
          {tinai.music.slice(0, 2).map((item) => L(item.ta, item.en)).join(' · ')}
        </CondensedRow>
        <CondensedRow label={L('தாவரங்கள்', 'Flora')}>
          {tinai.flora.slice(0, 4).map((item) => L(item.ta, item.en)).join(' · ')}
        </CondensedRow>
        <CondensedRow label={L('விலங்குகள்', 'Fauna')}>
          {tinai.fauna.slice(0, 4).map((item) => L(item.ta, item.en)).join(' · ')}
        </CondensedRow>

        {sample && (
          <div className="mt-3 rounded-xl border border-accent/20 bg-accent/5 p-3">
            <p className={`tamil text-sm leading-relaxed text-primary ${language === 'ta' ? 'tamil' : ''}`}>
              {sample.classic}
            </p>
            {sample.poem && <p className="mt-1 text-xs text-muted">{sample.poem}</p>}
          </div>
        )}

        {poems.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {poems.map((poem) => (
              <Link
                key={poem.id}
                to={`/book/${poem.id}`}
                className="rounded-full border border-line px-3 py-1 text-xs font-medium text-accent hover:border-accent"
              >
                {L(poem.ta, poem.en)}
              </Link>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

function KnowledgeBlock({ section, language }) {
  const L = (ta, en) => pick(language, ta, en)
  return (
    <details className="group rounded-2xl border border-line bg-surface p-4 open:border-accent/40">
      <summary className="flex cursor-pointer list-none items-center gap-2">
        <span className="text-xl" aria-hidden="true">{section.icon}</span>
        <span className={`text-base font-bold text-primary ${language === 'ta' ? 'tamil' : ''}`}>
          {L(section.ta, section.en)}
        </span>
        <span className="ml-auto text-xs text-faint group-open:hidden">{section.items.length}</span>
      </summary>
      <p className={`mt-2 text-sm leading-relaxed text-muted ${language === 'ta' ? 'tamil' : ''}`}>
        {section.intro}
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {section.items.map((item) => (
          <div key={`${section.id}-${item.en}`} className="rounded-xl border border-line/70 bg-surface-alt/40 p-3">
            <p className={`text-sm font-semibold text-primary ${language === 'ta' ? 'tamil' : ''}`}>
              {item.emoji} {L(item.ta, item.en)}
            </p>
            <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted">{item.desc}</p>
          </div>
        ))}
      </div>
    </details>
  )
}

export default function SangamWorldPage() {
  const language = useAppStore((s) => s.language)
  const L = (ta, en) => pick(language, ta, en)
  const peopleSections = ['age', 'akam-puram', 'tinai-porul', 'puram-tinai', 'poets', 'patrons', 'music', 'life']
    .map((id) => KNOWLEDGE_BY_ID[id])
    .filter(Boolean)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <Reveal>
        <header className="mx-auto mb-10 max-w-3xl text-center">
          <Badge variant="accent" size="sm">{L('சங்க உலகம்', 'Sangam World')}</Badge>
          <h1 className={`mt-3 text-3xl font-extrabold text-primary sm:text-5xl ${language === 'ta' ? 'tamil' : ''}`}>
            {L('ஐந்து திணைகள் · ஒரே உலகம்', 'Five landscapes · one world')}
          </h1>
          <p className={`mt-3 text-sm leading-relaxed text-muted sm:text-base ${language === 'ta' ? 'tamil' : ''}`}>
            {L(
              'திணை, மக்கள், வாழ்க்கை, இசை, இலக்கியம் — அனைத்தும் சுருக்கமாக ஒரே பக்கத்தில்.',
              'Landscape, people, daily life, music and literature — condensed into one page.'
            )}
          </p>
        </header>
      </Reveal>

      <div className="mb-10 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        {[
          [L('5', '5'), L('திணைகள்', 'Tiṇai')],
          [L('473', '473'), L('புலவர்கள்', 'Poets')],
          [L('18', '18'), L('சங்க நூல்கள்', 'Sangam works')],
          [L('3', '3'), L('மூவேந்தர்', 'Dynasties')],
        ].map(([value, label]) => (
          <div key={label} className="rounded-xl border border-line bg-surface p-3">
            <p className="text-xl font-bold text-accent">{value}</p>
            <p className={`text-xs text-muted ${language === 'ta' ? 'tamil' : ''}`}>{label}</p>
          </div>
        ))}
      </div>

      <section id="connections" className="mb-12">
        <div className="mb-4 border-b border-line-strong pb-2">
          <h2 className={`text-2xl font-bold text-primary ${language === 'ta' ? 'tamil' : ''}`}>
            {L('பிணைப்பு வரைபடம்', 'Connections map')}
          </h2>
          <p className="text-sm text-muted">
            {L('திணை · பாடல் · புலவர் · கருப்பொருள் — ஒரே வலைப்பின்னல்.', 'Tiṇai · poem · poet · karu-poruḷ — one network.')}
          </p>
        </div>
        <GraphExplorer embedded />
      </section>

      <section className="mb-12">
        <div className="mb-4 flex items-end justify-between gap-3 border-b border-line-strong pb-2">
          <div>
            <h2 className={`text-2xl font-bold text-primary ${language === 'ta' ? 'tamil' : ''}`}>
              {L('ஐந்து திணைகள்', 'The five Tiṇai')}
            </h2>
            <p className="text-sm text-muted">{L('நிலம், மக்கள், வாழ்க்கை', 'Land, people, life')}</p>
          </div>
          <span className="text-xs font-mono text-faint">5</span>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {TINAI_LIST.map((tinai) => (
            <TinaiCard key={tinai.id} tinai={tinai} language={language} />
          ))}
        </div>
      </section>

      <Suspense fallback={<div className="mb-12 h-40 animate-pulse rounded-2xl border border-line bg-surface" />}>
        <StoriesSection />
      </Suspense>

      <section id="people">
        <div className="mb-4 border-b border-line-strong pb-2">
          <h2 className={`text-2xl font-bold text-primary ${language === 'ta' ? 'tamil' : ''}`}>
            {L('மக்களும் வாழ்க்கையும்', 'People & life')}
          </h2>
          <p className="text-sm text-muted">
            {L('புலவர், மன்னர், இசை, அன்றாட வாழ்வு', 'Poets, patrons, music, daily life')}
          </p>
        </div>
        <div className="space-y-3">
          {peopleSections.map((section) => (
            <KnowledgeBlock key={section.id} section={section} language={language} />
          ))}
        </div>
      </section>

      <section id="research" className="mt-12 border-t border-line-strong pt-8">
        <ResearchDesk />
      </section>

      <AvaiBriefs />

      <ResearchNotes />
    </div>
  )
}
