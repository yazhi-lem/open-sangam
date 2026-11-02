import { X, Users } from 'lucide-react'
import Button from '../ui/Button'
import useAppStore from '../../store/useAppStore'

export default function ContributeModal({ open, onClose }) {
  const language = useAppStore((s) => s.language)
  const L = (ta, en) => (language === 'ta' ? ta : en)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg rounded-2xl border border-line-strong bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-muted hover:bg-surface-alt hover:text-primary transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <div className="mb-4 flex items-center gap-2">
          <Users size={20} className="text-accent" />
          <h2 className={`text-xl font-bold text-primary ${language === 'ta' ? 'tamil' : ''}`}>
            {L('நூலகத்தை வளர்க்க உதவு', 'Contribute to the Library')}
          </h2>
        </div>
        <div className="space-y-4 text-sm text-muted">
          <p className={language === 'ta' ? 'tamil' : ''}>
            {L(
              'ஓப்பன் சங்கம் ஒரு திறந்த மூலத் திட்டம். ஒவ்வொரு நூலையும் Sangam Tamil · Modern Tamil · English என்ற மூன்று அடுக்குகளில் உருவாக்குகிறோம்.',
              'Open Sangam is an open-source project. Every work is built in three layers: Sangam Tamil · Modern Tamil · English.'
            )}
          </p>
          <div className="space-y-3 rounded-xl border border-line bg-surface-alt/50 p-4">
            <h3 className="font-semibold text-primary">{L('மூன்று வழிகளில் பங்களிக்கலாம்', 'Three ways to contribute')}</h3>
            <ol className="list-decimal space-y-2 pl-4">
              <li>
                <strong>{L('அட்டவணையில் புதிய நூலைச் சேர்', 'Add a new work to the catalog')}</strong>
                <p className="mt-0.5 text-xs text-faint">
                  {L(
                    'data/library/catalog.json இல் collection, author, period, count ஆகியவற்றைச் சேர்க்கவும்.',
                    'Add collection, author, period, and count to data/library/catalog.json.'
                  )}
                </p>
              </li>
              <li>
                <strong>{L('பாடல் JSON தரவை உருவாக்கு', 'Produce verse JSON data')}</strong>
                <p className="mt-0.5 text-xs text-faint">
                  {L(
                    'scripts/scraper/ இல் Project Madurai அல்லது Tamil Virtual Academy இலிருந்து பாடலை இறக்கி, python -m normalizer.normalize_all இல் சுத்திகரிக்கவும்.',
                    'Scrape from Project Madurai or Tamil Virtual Academy under scripts/scraper/, then normalise with python -m normalizer.normalize_all.'
                  )}
                </p>
              </li>
              <li>
                <strong>{L('மொழிபெயர்ப்பு அல்லது உரை எழுது', 'Write a translation or urai')}</strong>
                <p className="mt-0.5 text-xs text-faint">
                  {L(
                    'ஒவ்வொரு வரிக்கும் நவீனத் தமிழ் உரை ஆங்கில மொழிபெயர்ப்பு தேவை.',
                    'Every line needs modern Tamil urai and English translation.'
                  )}
                </p>
              </li>
            </ol>
          </div>
          <p className="text-xs text-faint">
            {L(
              'வழிகாட்டிக்கு docs/CONTRIBUTING_LIBRARY.md ஐப் படியுங்கள். தமிழ் அறிஞர் ஆய்வு மிகவும் வரவேற்கப்படுகிறது.',
              'Read docs/CONTRIBUTING_LIBRARY.md for the full guide. Scholar review is especially welcome.'
            )}
          </p>
        </div>
        <div className="mt-5 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            {L('மூடு', 'Close')}
          </Button>
        </div>
      </div>
    </div>
  )
}
