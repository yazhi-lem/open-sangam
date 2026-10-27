import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Quote, Send, Sparkles } from 'lucide-react'
import { askAvaiAgent } from '../services/avaiService'
import { AVAI_ENABLED } from '../config/features'
import useAppStore from '../store/useAppStore'
import Card from '../components/ui/Card'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { PULAVAR_AGENTS } from '../data/pulavars'

const REPO_URL = 'https://github.com/yazhi-lem/open-sangam'

export default function Home() {
  const language = useAppStore((s) => s.language)
  const L = (ta, en) => (language === 'ta' ? ta : en)
  const nakkirar = PULAVAR_AGENTS.find((agent) => agent.id === 'nakkirar')
  const suggested = nakkirar?.suggestedPrompts || []
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [citations, setCitations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function ask(event) {
    event.preventDefault()
    const message = question.trim()
    if (!message || loading) return
    if (!AVAI_ENABLED) {
      setError(L('அவை பொதுப் பீட்டா தொடங்கிய பின் இயங்கும்.', 'Avai will open with the public beta.'))
      return
    }
    setLoading(true)
    setError('')
    setAnswer('')
    try {
      const response = await askAvaiAgent({ message, pulavar: 'nakkirar', workflow: 'general' })
      setAnswer(response?.response_text || response?.answer || '')
      setCitations(response?.citations || [])
    } catch (err) {
      setError(err?.message || L('அவையை அணுக முடியவில்லை.', 'Could not reach Avai.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8 sm:px-6 sm:py-14">
      <section className="space-y-4 text-center">
        <p className={`text-xs font-semibold text-accent ${language === 'ta' ? 'tamil' : ''}`}>
          {L('சங்க இலக்கியம் · தமிழ் நூலகம்', 'Sangam literature · Tamil Library')}
        </p>
        <h1 className={`text-3xl font-extrabold leading-tight text-primary sm:text-5xl ${language === 'ta' ? 'tamil' : ''}`}>
          {L('சங்க காலத்தை ஒரே இடத்தில் படியுங்கள்', 'Read the Sangam world in one place')}
        </h1>
        <p className={`mx-auto max-w-2xl text-sm leading-relaxed text-muted sm:text-base ${language === 'ta' ? 'tamil' : ''}`}>
          {L(
            'அஞ்சு திணைகள், மக்கள், வாழ்க்கை முறை, இசை, இலக்கியம் — அனைத்தும் ஒரே அனுபவத்தில். பாடல்களை ஒன்பது அடுக்குகளில் படியுங்கள்.',
            'Five landscapes, people, daily life, music and literature — in one experience. Read every poem in nine layers.'
          )}
        </p>
      </section>

      <Card variant="default" className="space-y-3 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-xl" aria-hidden="true">
            {nakkirar?.avatarEmoji || '👑'}
          </span>
          <div>
            <h2 className={`text-base font-bold text-primary ${language === 'ta' ? 'tamil' : ''}`}>
              {L('நக்கீரரைக் கேளுங்கள்', 'Ask Nakkirar')}
            </h2>
            <p className="text-xs text-faint">
              {L('சங்க அவைத் தலைமைப் புலவர் · Chief Critic & Convener', 'Chief Critic & Convener · Sangam Avai')}
            </p>
          </div>
          <Sparkles size={18} className="ml-auto text-accent" aria-hidden="true" />
        </div>
        <p className={`text-sm text-muted ${language === 'ta' ? 'tamil' : ''}`}>
          {L(
            'புலவர், பாடல், திணை, சொற்பொருள், சான்று — நக்கீரர் சான்றுகளுடன் விடையளிப்பார்.',
            'Ask about poets, poems, tiṇai, word meaning or evidence — Nakkirar answers with citations.'
          )}
        </p>
        {suggested.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {suggested.slice(0, 3).map((prompt) => (
              <button
                key={prompt.en}
                type="button"
                onClick={() => setQuestion(L(prompt.ta, prompt.en))}
                className={`rounded-full border border-line px-2.5 py-1 text-left text-[11px] text-muted hover:border-accent hover:text-accent ${language === 'ta' ? 'tamil' : ''}`}
              >
                {L(prompt.ta, prompt.en).slice(0, 90)}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={ask} className="flex flex-col gap-2 sm:flex-row">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={L('எடுத்துக்காட்டு: குறிஞ்சி மக்களின் வாழ்க்கை எப்படி?', 'Example: How did hill people live?')}
            className={`min-h-[48px] flex-1 rounded-xl border border-line bg-surface-alt/60 px-4 text-sm text-primary placeholder:text-faint focus:border-accent focus:outline-none ${language === 'ta' ? 'tamil' : ''}`}
            aria-label={L('அவைக்கு கேள்வி', 'Ask Avai')}
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-strong disabled:opacity-50"
          >
            {loading ? <LoadingSpinner size="sm" /> : <Send size={16} aria-hidden="true" />}
            {L('கேள்', 'Ask')}
          </button>
        </form>
        {error && <p className="text-sm text-danger">{error}</p>}
        {answer && (
          <div className="rounded-xl border border-accent/25 bg-surface-alt/40 p-4">
            <div className="mb-2 flex items-center gap-2 border-b border-line/60 pb-2">
              <span className="text-lg" aria-hidden="true">{nakkirar?.avatarEmoji || '👑'}</span>
              <div>
                <p className={`text-xs font-bold text-primary ${language === 'ta' ? 'tamil' : ''}`}>
                  {L('நக்கீரர்', 'Nakkirar')}
                </p>
                <p className="text-[10px] text-faint">{L('சங்க அவைத் தலைவர்', 'Convener, Sangam Avai')}</p>
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-primary">
              {answer}
            </div>
            {citations.length > 0 && (
              <div className="mt-3 border-t border-line/60 pt-2">
                <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-faint">
                  <Quote size={11} /> {L('சான்றுகள்', 'Citations')}
                </p>
                <ul className="space-y-1 text-[11px] text-muted">
                  {citations.slice(0, 5).map((cite, index) => (
                    <li key={index}>
                      {typeof cite === 'string' ? cite : cite.text || cite.verse || JSON.stringify(cite)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link to="/world" className="group rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-accent/60 focus-ring">
          <p className={`text-xs font-semibold text-accent ${language === 'ta' ? 'tamil' : ''}`}>
            {L('ஒரே பக்கம்', 'One page')}
          </p>
          <h2 className={`mt-1 text-xl font-bold text-primary group-hover:text-accent ${language === 'ta' ? 'tamil' : ''}`}>
            {L('சங்க உலகம்', 'Sangam World')}
          </h2>
          <p className={`mt-1 text-sm text-muted ${language === 'ta' ? 'tamil' : ''}`}>
            {L('ஐந்து திணைகள், மக்கள், வாழ்க்கை, இசை — சுருக்கமான ஒரே பார்வை.', 'Five landscapes, people, life and music — one condensed view.')}
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent">
            {L('படிக்க', 'Read')} <ArrowRight size={14} />
          </span>
        </Link>
        <Link to="/book" className="group rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-accent/60 focus-ring">
          <p className={`text-xs font-semibold text-accent ${language === 'ta' ? 'tamil' : ''}`}>
            {L('பாடல்கள்', 'Poems')}
          </p>
          <h2 className={`mt-1 text-xl font-bold text-primary group-hover:text-accent ${language === 'ta' ? 'tamil' : ''}`}>
            {L('தமிழ் நூலகம்', 'Tamil Library')}
          </h2>
          <p className={`mt-1 text-sm text-muted ${language === 'ta' ? 'tamil' : ''}`}>
            {L('சங்கம், பதினெண்கீழ்க்கணக்கு, கலைப்பொருட்கள் — ஒன்பது அடுக்குகள்.', 'Sangam, Pathinenkilkkanakku and artifacts — nine reading layers.')}
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent">
            {L('திறக்க', 'Open')} <ArrowRight size={14} />
          </span>
        </Link>
      </section>

      <p className="text-center text-xs text-faint">
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
          GitHub · Open Sangam
        </a>
      </p>
    </div>
  )
}
