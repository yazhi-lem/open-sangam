import { useState } from 'react'
import { Bot, Play, Sparkles } from 'lucide-react'
import { PULAVAR_AGENTS } from '../../data/pulavars'
import {
  RESEARCH_CAMPAIGNS,
  CORPUS_ARTIFACTS,
  CORPUS_ARTIFACT_CLASSES,
  CORPUS_ENTITY_CATEGORIES,
  CORPUS_ENTITIES,
  corpusArtifactMatchesQuery,
} from '../../data/library'
import { askAvaiAgent } from '../../services/avaiService'
import { AVAI_ENABLED } from '../../config/features'
import useAppStore from '../../store/useAppStore'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'

function pick(language, ta, en) {
  return language === 'ta' ? ta : en
}

export default function ResearchDesk() {
  const language = useAppStore((s) => s.language)
  const L = (ta, en) => pick(language, ta, en)
  const [campaignId, setCampaignId] = useState(RESEARCH_CAMPAIGNS[0]?.id || null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [artifactQuery, setArtifactQuery] = useState('')
  const [entityCategory, setEntityCategory] = useState(CORPUS_ENTITY_CATEGORIES[0]?.id || 'flora')

  const campaign = RESEARCH_CAMPAIGNS.find((item) => item.id === campaignId)
  const visibleArtifacts = CORPUS_ARTIFACTS.filter((item) =>
    corpusArtifactMatchesQuery(item, artifactQuery)
  ).slice(0, 18)

  async function runCampaign() {
    if (!campaign || loading) return
    setLoading(true)
    setError('')
    setAnswer('')
    if (!AVAI_ENABLED) {
      setError(L('அவை பொதுப் பீட்டா தொடங்கிய பின் இயங்கும்.', 'Avai will run after the public beta opens.'))
      setLoading(false)
      return
    }
    try {
      const response = await askAvaiAgent({
        pulavar: campaign.agent,
        workflow: campaign.workflow,
        message: language === 'ta' ? campaign.promptTa : campaign.promptEn,
      })
      setAnswer(response?.response_text || response?.answer || '')
    } catch (err) {
      setError(err?.message || L('அவையை அணுக முடியவில்லை.', 'Could not reach Avai.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-line-strong pb-2">
          <div>
            <h2 className={`text-2xl font-bold text-primary ${language === 'ta' ? 'tamil' : ''}`}>
              {L('ஆய்வுப் புலவர்கள்', 'Research agents')}
            </h2>
            <p className="text-sm text-muted">
              {L('அவைப் புலவர்களைத் தொட்டு அவர்களின் பங்கை அறியுங்கள்.', 'Hover a Pulavar to see their research role and prompts.')}
            </p>
          </div>
          <Badge variant="accent" size="sm">{PULAVAR_AGENTS.length} agents</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PULAVAR_AGENTS.map((agent) => (
            <div
              key={agent.id}
              className="group relative min-h-[9.5rem] overflow-hidden rounded-2xl border border-line bg-surface p-3 transition-all hover:border-accent/60 hover:shadow-md"
              tabIndex={0}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden="true">{agent.avatarEmoji}</span>
                <div className="min-w-0">
                  <p className={`truncate text-sm font-bold text-primary ${language === 'ta' ? 'tamil' : ''}`}>
                    {L(agent.nameTa, agent.nameEn)}
                  </p>
                  <p className="truncate text-[10px] text-faint">{L(agent.titleTa, agent.titleEn)}</p>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-muted">
                {L(agent.bioTa, agent.bioEn)}
              </p>
              <p className="mt-2 text-[10px] font-mono text-accent">{L(agent.tinai, agent.tinaiEn)}</p>
              <div className="absolute inset-x-3 bottom-3 hidden rounded-lg border border-line bg-surface-alt p-2 text-[10px] text-muted shadow-sm group-hover:block">
                {agent.suggestedPrompts?.[0] ? L(agent.suggestedPrompts[0].ta, agent.suggestedPrompts[0].en) : agent.tag}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-line-strong pb-2">
          <div>
            <h2 className={`text-2xl font-bold text-primary ${language === 'ta' ? 'tamil' : ''}`}>
              {L('ஆய்வுப் பயணங்கள்', 'Research campaigns')}
            </h2>
            <p className="text-sm text-muted">
              {L('ஒரு பயணத்தைத் தேர்ந்தெடுத்து அவைப் புலவரிடம் இயக்குங்கள்.', 'Pick a campaign and run it through the Avai agents.')}
            </p>
          </div>
          <Sparkles size={18} className="text-accent" aria-hidden="true" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RESEARCH_CAMPAIGNS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCampaignId(item.id)}
              className={`rounded-2xl border p-3 text-left transition-all focus-ring ${
                campaignId === item.id
                  ? 'border-accent bg-accent/10'
                  : 'border-line bg-surface hover:border-accent/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm font-bold text-primary ${language === 'ta' ? 'tamil' : ''}`}>
                  {L(item.ta, item.en)}
                </p>
                <Badge variant="outline" size="sm">{item.agent}</Badge>
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted">
                {L(item.promptTa, item.promptEn)}
              </p>
            </button>
          ))}
        </div>

        {campaign && (
          <div className="mt-4 rounded-2xl border border-accent/25 bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={`text-sm font-semibold text-primary ${language === 'ta' ? 'tamil' : ''}`}>
                {L(campaign.ta, campaign.en)}
              </p>
              <Button size="sm" variant="primary" icon={<Play size={14} />} onClick={runCampaign} loading={loading}>
                {L('இயக்கு', 'Run campaign')}
              </Button>
            </div>
            {error && <p className="mt-2 text-sm text-danger">{error}</p>}
            {answer && (
              <div className="mt-3 max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl border border-line bg-surface-alt/40 p-3 text-sm leading-relaxed text-primary">
                {answer}
              </div>
            )}
            {!answer && !error && (
              <p className="mt-2 flex items-center gap-2 text-xs text-faint">
                <Bot size={14} /> {L('முடிவுகள் ஆய்வுக் குறிப்புகள்; சரிபார்ப்பு தேவை.', 'Results are research leads, not verified scholarship.')}
              </p>
            )}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-line-strong pb-2">
          <div>
            <h2 className={`text-2xl font-bold text-primary ${language === 'ta' ? 'tamil' : ''}`}>
              {L('கவிதையில் கலைப்பொருட்கள்', 'Artifacts in the corpus')}
            </h2>
            <p className="text-sm text-muted">
              {L('சொற்களால் அடையாளம் காணப்பட்ட பொருட்கள், பாடல் சான்றுகளுடன்.', 'Material-culture terms extracted from the corpus, linked to lines.')}
            </p>
          </div>
          <input
            value={artifactQuery}
            onChange={(event) => setArtifactQuery(event.target.value)}
            placeholder={L('பொருளைத் தேடு...', 'Search an object...')}
            className="min-h-[40px] w-full max-w-xs rounded-xl border border-line bg-surface-alt/60 px-3 text-sm text-primary placeholder:text-faint focus:border-accent focus:outline-none"
          />
        </div>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {CORPUS_ARTIFACT_CLASSES.map((cls) => (
            <span key={cls.id} className="rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">
              {L(cls.ta, cls.en)}
            </span>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {visibleArtifacts.map((artifact) => (
            <Card key={artifact.id} variant="flat" className="p-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className={`text-sm font-bold text-primary ${language === 'ta' ? 'tamil' : ''}`}>
                  {L(artifact.ta, artifact.en)}
                </p>
                <span className="text-[10px] font-mono text-accent">{artifact.count}</span>
              </div>
              <p className="text-[10px] text-faint">{artifact.roman} · {artifact.en}</p>
              {artifact.samples?.[0] && (
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted">
                  {artifact.samples[0].text}
                </p>
              )}
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-line-strong pb-2">
          <div>
            <h2 className={`text-2xl font-bold text-primary ${language === 'ta' ? 'tamil' : ''}`}>
              {L('களச் சொற்கள்', 'Corpus entity index')}
            </h2>
            <p className="text-sm text-muted">
              {L('தாவரம், விலங்கு, உணவு, தொழில், உறவு, இடம், உணர்வு — சான்றுகளுடன்.', 'Flora, fauna, food, work, kinship, place and emotion — with citations.')}
            </p>
          </div>
          <span className="text-xs font-mono text-faint">{CORPUS_ENTITIES.length} terms</span>
        </div>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {CORPUS_ENTITY_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setEntityCategory(category.id)}
              className={`rounded-full border px-2.5 py-1 text-[10px] ${
                entityCategory === category.id
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-line text-muted hover:border-accent'
              }`}
            >
              {L(category.ta, category.en)}
            </button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {CORPUS_ENTITIES.filter((entity) => entity.category === entityCategory)
            .sort((a, b) => b.count - a.count)
            .slice(0, 18)
            .map((entity) => (
              <Card key={entity.id} variant="flat" className="p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={`text-sm font-bold text-primary ${language === 'ta' ? 'tamil' : ''}`}>
                    {L(entity.ta, entity.en)}
                  </p>
                  <span className="text-[10px] font-mono text-accent">{entity.count}</span>
                </div>
                <p className="text-[10px] text-faint">{entity.roman} · {entity.en}</p>
                {entity.samples?.[0] && (
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted">
                    {entity.samples[0].text}
                  </p>
                )}
              </Card>
            ))}
        </div>
      </section>
    </div>
  )
}
