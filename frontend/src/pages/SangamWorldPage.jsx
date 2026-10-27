import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Compass, GitBranch, Sparkles } from 'lucide-react'
import { TINAI_LIST } from '../data/tinaiWorld'
import { KNOWLEDGE_BY_ID } from '../data/knowledge'
import { POEMS } from '../data/poems'
import useAppStore from '../store/useAppStore'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Reveal from '../components/motion/Reveal'
import GraphExplorer from './GraphExplorer'
import ResearchDesk from '../components/world/ResearchDesk'
import ResearchNotes from '../components/world/ResearchNotes'
import AvaiBriefs from '../components/world/AvaiBriefs'

const StoriesSection = lazy(() => import('../components/world/StoriesSection'))

const TABS = [
  { id: 'overview', ta: 'மேலோட்டம்', en: 'Overview' },
  { id: 'tinai', ta: 'திணைகள்', en: 'Tiṇai' },
  { id: 'stories', ta: 'கதைகள்', en: 'Stories' },
  { id: 'graph', ta: 'வரைபடம்', en: 'Graph' },
  { id: 'people', ta: 'மக்கள்', en: 'People' },
  { id: 'research', ta: 'ஆய்வு', en: 'Research' },
  { id: 'articles', ta: 'கட்டுரைகள்', en: 'Articles' },
]

const HASH_TAB = {
  '#connections': 'graph',
  '#graph': 'graph',
  '#tinai': 'tinai',
  '#stories': 'stories',
  '#people': 'people',
  '#research': 'research',
  '#avai-briefs': 'research',
  '#katturai': 'articles',
}

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

function DetailSection({ title, children }) {
  return (
    <section className="space-y-2 border-t border-line pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-bold text-accent">{title}</h3>
      {children}
    </section>
  )
}

function TinaiDetail({ tinai, language }) {
  const L = (ta, en) => pick(language, ta, en)
  const poems = POEMS.filter((p) => p.tinai?.includes(tinai.id)).slice(0, 6)
  return (
    <div className="space-y-4 text-sm">
      <div className={`rounded-xl bg-gradient-to-br ${tinai.colors.primary} p-4 text-white`}>
        <p className="text-2xl" aria-hidden="true">{tinai.emoji}</p>
        <h3 className={`mt-1 text-2xl font-bold ${language === 'ta' ? 'tamil' : ''}`}>{L(tinai.ta, tinai.en)}</h3>
        <p className="text-sm text-white/80">{tinai.atmosphere.season.desc}</p>
      </div>

      <DetailSection title={L('பொழுதும் சூழலும்', 'Time and atmosphere')}>
        <p className="text-muted">
          {L(tinai.atmosphere.timeOfDay.ta, tinai.atmosphere.timeOfDay.en)} — {tinai.atmosphere.timeOfDay.desc}
        </p>
        <p className="text-muted">{tinai.atmosphere.weather}</p>
      </DetailSection>

      <DetailSection title={L('கடவுளும் உரிப்பொருளும்', 'Deity and mood')}>
        <p><strong>{L(tinai.deity.ta, tinai.deity.en)}</strong> — {tinai.deity.desc}</p>
        <p className="text-muted">{L(tinai.emotion.akam.ta, tinai.emotion.akam.en)} — {tinai.emotion.akam.desc}</p>
      </DetailSection>

      <DetailSection title={L('மக்கள்', 'People')}>
        <div className="grid gap-2 sm:grid-cols-2">
          {tinai.people.map((person) => (
            <div key={person.en} className="rounded-lg border border-line bg-surface-alt/40 p-2">
              <p className={`font-semibold text-primary ${language === 'ta' ? 'tamil' : ''}`}>{L(person.ta, person.en)}</p>
              <p className="text-xs text-muted">{person.desc}</p>
            </div>
          ))}
        </div>
      </DetailSection>

      <DetailSection title={L('வாழ்க்கையும் தொழிலும்', 'Life and crafts')}>
        <div className="grid gap-2 sm:grid-cols-2">
          {[...tinai.crafts, ...tinai.architecture].map((item) => (
            <div key={item.en} className="rounded-lg border border-line bg-surface-alt/40 p-2">
              <p className={`font-semibold text-primary ${language === 'ta' ? 'tamil' : ''}`}>{L(item.ta, item.en)}</p>
              <p className="text-xs text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </DetailSection>

      <DetailSection title={L('தாவரங்கள்', 'Flora')}>
        <p className="text-muted">{tinai.flora.map((item) => L(item.ta, item.en)).join(' · ')}</p>
      </DetailSection>

      <DetailSection title={L('விலங்குகள்', 'Fauna')}>
        <p className="text-muted">{tinai.fauna.map((item) => L(item.ta, item.en)).join(' · ')}</p>
      </DetailSection>

      <DetailSection title={L('இசை', 'Music')}>
        <div className="space-y-1">
          {tinai.music.map((item) => (
            <p key={item.en}><strong>{L(item.ta, item.en)}</strong> — <span className="text-muted">{item.desc}</span></p>
          ))}
        </div>
      </DetailSection>

      {poems.length > 0 && (
        <DetailSection title={L('இந்தத் திணையின் பாடல்கள்', 'Poems in this tiṇai')}>
          <div className="flex flex-wrap gap-2">
            {poems.map((poem) => (
              <Link key={poem.id} to={`/book/${poem.id}`} className="rounded-full border border-line px-3 py-1 text-xs text-accent hover:border-accent">
                {L(poem.ta, poem.en)}
              </Link>
            ))}
          </div>
        </DetailSection>
      )}
    </div>
  )
}

function TinaiCard({ tinai, language, onOpen }) {
  const L = (ta, en) => pick(language, ta, en)
  const sample = tinai.poetry?.verified === false ? null : tinai.poetry
  const poems = POEMS.filter((p) => p.tinai?.includes(tinai.id)).slice(0, 3)

  return (
    <Card variant="flat" className="overflow-hidden p-0">
      <div className={`bg-gradient-to-br ${tinai.colors.primary} p-4 text-white`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-2xl" aria-hidden="true">{tinai.emoji}</p>
            <h3 className={`mt-1 text-2xl font-bold ${language === 'ta' ? 'tamil' : ''}`}>{L(tinai.ta, tinai.en)}</h3>
            <p className="text-sm text-white/80">{L(tinai.en, tinai.ta)}</p>
          </div>
          <Badge variant="outline" size="sm">{tinai.atmosphere.season.en}</Badge>
        </div>
      </div>

      <div className="p-4">
        <CondensedRow label={L('பொழுது', 'Time')}>{L(tinai.atmosphere.timeOfDay.ta, tinai.atmosphere.timeOfDay.en)}</CondensedRow>
        <CondensedRow label={L('கடவுள்', 'Deity')}>{L(tinai.deity.ta, tinai.deity.en)}</CondensedRow>
        <CondensedRow label={L('உரிப்பொருள்', 'Mood')}>{L(tinai.emotion.akam.ta, tinai.emotion.akam.en)}</CondensedRow>
        <CondensedRow label={L('மக்கள்', 'People')}>{tinai.people.map((p) => L(p.ta, p.en)).join(' · ')}</CondensedRow>
        <CondensedRow label={L('இசை', 'Music')}>{tinai.music.slice(0, 2).map((m) => L(m.ta, m.en)).join(' · ')}</CondensedRow>

        {sample && (
          <div className="mt-3 rounded-xl border border-accent/20 bg-accent/5 p-3">
            <p className={`tamil text-sm leading-relaxed text-primary ${language === 'ta' ? 'tamil' : ''}`}>{sample.classic}</p>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onOpen(tinai)}
            className="inline-flex min-h-[36px] items-center gap-1 rounded-full bg-accent px-3 text-xs font-semibold text-on-accent"
          >
            {L('முழு விவரம்', 'Read full detail')} <ArrowRight size={12} />
          </button>
          {poems.map((poem) => (
            <Link key={poem.id} to={`/book/${poem.id}`} className="rounded-full border border-line px-3 py-1 text-xs font-medium text-accent hover:border-accent">
              {L(poem.ta, poem.en)}
            </Link>
          ))}
        </div>
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
        <span className={`text-base font-bold text-primary ${language === 'ta' ? 'tamil' : ''}`}>{L(section.ta, section.en)}</span>
        <span className="ml-auto text-xs text-faint group-open:hidden">{section.items.length}</span>
      </summary>
      <p className={`mt-2 text-sm leading-relaxed text-muted ${language === 'ta' ? 'tamil' : ''}`}>{section.intro}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {section.items.map((item) => (
          <div key={`${section.id}-${item.en}`} className="rounded-xl border border-line/70 bg-surface-alt/40 p-3">
            <p className={`text-sm font-semibold text-primary ${language === 'ta' ? 'tamil' : ''}`}>{item.emoji} {L(item.ta, item.en)}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{item.desc}</p>
          </div>
        ))}
      </div>
    </details>
  )
}

export default function SangamWorldPage() {
  const language = useAppStore((s) => s.language)
  const L = (ta, en) => pick(language, ta, en)
  const [tab, setTab] = useState(() => HASH_TAB[window.location.hash] || 'overview')
  const [detailTinai, setDetailTinai] = useState(null)

  const peopleSections = ['age', 'akam-puram', 'tinai-porul', 'puram-tinai', 'poets', 'patrons', 'music', 'life']
    .map((id) => KNOWLEDGE_BY_ID[id])
    .filter(Boolean)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Reveal>
        <header className="mx-auto mb-6 max-w-3xl text-center">
          <Badge variant="accent" size="sm">{L('சங்க உலகம்', 'Sangam World')}</Badge>
          <h1 className={`mt-2 text-3xl font-extrabold text-primary sm:text-4xl ${language === 'ta' ? 'tamil' : ''}`}>
            {L('ஐந்து திணைகள் · ஒரே உலகம்', 'Five landscapes · one world')}
          </h1>
          <p className={`mt-2 text-sm leading-relaxed text-muted sm:text-base ${language === 'ta' ? 'tamil' : ''}`}>
            {L('திணை, மக்கள், கதைகள், வரைபடம், ஆய்வு — தேவையான பகுதியை மட்டும் திறந்து படியுங்கள்.', 'Open only the section you need: tiṇai, people, stories, graph or research.')}
          </p>
        </header>
      </Reveal>

      <nav className="sticky top-16 z-20 mb-6 -mx-4 overflow-x-auto border-y border-line bg-page/95 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-2">
        <div className="flex min-w-max gap-1">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`min-h-[36px] rounded-full px-3 text-xs font-semibold transition-colors ${
                tab === item.id ? 'bg-primary text-page' : 'text-muted hover:bg-surface-alt hover:text-primary'
              }`}
            >
              {L(item.ta, item.en)}
            </button>
          ))}
        </div>
      </nav>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            {[
              ['5', L('திணைகள்', 'Tiṇai')],
              ['2,669', L('கதை விதைகள்', 'Story seeds')],
              ['256', L('வரைபட முனைகள்', 'Graph nodes')],
              ['24', L('ஆய்வுக் கட்டுரைகள்', 'Research articles')],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl border border-line bg-surface p-3">
                <p className="text-xl font-bold text-accent">{value}</p>
                <p className={`text-xs text-muted ${language === 'ta' ? 'tamil' : ''}`}>{label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { id: 'tinai', icon: <Compass size={18} />, ta: 'ஐந்து திணைகள்', en: 'Five tiṇai', desc: L('நிலம், மக்கள், வாழ்க்கை, இசை', 'Land, people, life, music') },
              { id: 'stories', icon: <BookOpen size={18} />, ta: 'பாடல்களின் கதைகள்', en: 'Stories', desc: L('அகம் மற்றும் புறக் கதை விதைகள்', 'Akam and puram story seeds') },
              { id: 'graph', icon: <GitBranch size={18} />, ta: 'பிணைப்பு வரைபடம்', en: 'Connections map', desc: L('திணை · பாடல் · புலவர் · பொருள்', 'Tiṇai · poem · poet · object') },
              { id: 'research', icon: <Sparkles size={18} />, ta: 'ஆய்வுப் பலகை', en: 'Research desk', desc: L('அவைப் புலவர்கள், ஆய்வுக் குறிப்புகள்', 'Avai agents, research briefs') },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className="group flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 text-left transition-colors hover:border-accent/60"
              >
                <span className="mt-0.5 text-accent">{item.icon}</span>
                <span>
                  <span className={`block text-sm font-bold text-primary group-hover:text-accent ${language === 'ta' ? 'tamil' : ''}`}>{L(item.ta, item.en)}</span>
                  <span className="mt-0.5 block text-xs text-muted">{item.desc}</span>
                </span>
                <ArrowRight size={14} className="ml-auto mt-1 shrink-0 text-faint group-hover:text-accent" />
              </button>
            ))}
          </div>

          <Card variant="flat" className="p-4">
            <h2 className={`text-base font-bold text-primary ${language === 'ta' ? 'tamil' : ''}`}>{L('இங்கே என்ன இருக்கிறது?', 'What is inside?')}</h2>
            <ul className="mt-2 grid gap-1 text-sm text-muted sm:grid-cols-2">
              <li>• {L('ஐந்து திணை விவரங்கள்', 'Full details for five tiṇai')}</li>
              <li>• {L('1,892 அகம் + 777 புறக் கதை விதைகள்', '1,892 akam + 777 puram story seeds')}</li>
              <li>• {L('256 முனைகள் · 1,303 இணைப்புகள்', '256 nodes · 1,303 graph edges')}</li>
              <li>• {L('6 அவை ஆய்வுக் குறிப்புகள்', '6 Avai research briefs')}</li>
              <li>• {L('98 களச் சொற்கள்', '98 corpus entity terms')}</li>
              <li>• {L('24 ஆய்வுக் கட்டுரைகள்', '24 research articles')}</li>
            </ul>
          </Card>
        </div>
      )}

      {tab === 'tinai' && (
        <section>
          <div className="mb-4 border-b border-line-strong pb-2">
            <h2 className={`text-2xl font-bold text-primary ${language === 'ta' ? 'tamil' : ''}`}>{L('ஐந்து திணைகள்', 'The five Tiṇai')}</h2>
            <p className="text-sm text-muted">{L('சுருக்கமான அட்டையிலிருந்து முழு விவரத்தைத் திறக்கலாம்.', 'Open the full detail from each card.')}</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {TINAI_LIST.map((tinai) => (
              <TinaiCard key={tinai.id} tinai={tinai} language={language} onOpen={setDetailTinai} />
            ))}
          </div>
        </section>
      )}

      {tab === 'stories' && (
        <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl border border-line bg-surface" />}>
          <StoriesSection />
        </Suspense>
      )}

      {tab === 'graph' && (
        <section id="connections">
          <div className="mb-4 border-b border-line-strong pb-2">
            <h2 className={`text-2xl font-bold text-primary ${language === 'ta' ? 'tamil' : ''}`}>{L('பிணைப்பு வரைபடம்', 'Connections map')}</h2>
            <p className="text-sm text-muted">{L('திணை · பாடல் · புலவர் · கருப்பொருள் · கலைப்பொருள்.', 'Tiṇai · poem · poet · karu · artifact.')}</p>
          </div>
          <GraphExplorer embedded />
        </section>
      )}

      {tab === 'people' && (
        <section id="people">
          <div className="mb-4 border-b border-line-strong pb-2">
            <h2 className={`text-2xl font-bold text-primary ${language === 'ta' ? 'tamil' : ''}`}>{L('மக்களும் வாழ்க்கையும்', 'People & life')}</h2>
            <p className="text-sm text-muted">{L('புலவர், மன்னர், இசை, அன்றாட வாழ்வு.', 'Poets, patrons, music, daily life.')}</p>
          </div>
          <div className="space-y-3">
            {peopleSections.map((section) => (
              <KnowledgeBlock key={section.id} section={section} language={language} />
            ))}
          </div>
        </section>
      )}

      {tab === 'research' && (
        <section id="research">
          <ResearchDesk />
          <AvaiBriefs />
        </section>
      )}

      {tab === 'articles' && (
        <section id="katturai">
          <ResearchNotes />
        </section>
      )}

      <Modal
        open={Boolean(detailTinai)}
        onClose={() => setDetailTinai(null)}
        title={detailTinai ? L(detailTinai.ta, detailTinai.en) : ''}
      >
        {detailTinai && <TinaiDetail tinai={detailTinai} language={language} />}
      </Modal>
    </div>
  )
}
