import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import useAppStore from '../store/useAppStore'

const REPO_URL = 'https://github.com/yazhi-lem/open-sangam'

export default function Home() {
  const language = useAppStore((s) => s.language)
  const L = (ta, en) => (language === 'ta' ? ta : en)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8 sm:px-6 sm:py-14">
      <section className="space-y-4 text-center">
        <p className={`text-xs font-semibold text-accent ${language === 'ta' ? 'tamil' : ''}`}>
          {L('சங்க இலக்கியம்', 'Sangam literature')}
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
