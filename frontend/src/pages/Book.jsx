import { useParams, Link } from 'react-router-dom'
import { POEM_BY_ID } from '../data/poems.js'
import Button from '../components/ui/Button'
import useAppStore from '../store/useAppStore'
import Library from '../components/library/Library'
import Reader from '../components/reader/Reader'

export default function Book() {
  const { poemId, sectionId } = useParams()
  const language = useAppStore((s) => s.language)
  const L = (ta, en) => (language === 'ta' ? ta : en)

  if (!poemId) return <Library />

  const poem = POEM_BY_ID[poemId]
  if (!poem || !poem.available)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center px-4">
        <p className={`text-xl font-semibold text-primary ${language === 'ta' ? 'tamil' : ''}`}>
          {poem
            ? `${L(poem.ta, poem.en)} — ${L('விரைவில்', 'Coming Soon')}`
            : L('நூல் கிடைக்கவில்லை', 'Poem Not Found')}
        </p>
        <p className={`text-muted text-sm ${language === 'ta' ? 'tamil' : ''}`}>
          {L(
            'நீங்கள் கேட்ட செவ்வியல் நூல் இன்னும் தொகுப்பில் சேர்க்கப்படுகிறது.',
            'The classical work you requested is being added to the corpus.'
          )}
        </p>
        <Link to="/book">
          <Button variant="outline" size="sm">← {L('நூலகத்திற்குத் திரும்பு', 'Return to Library')}</Button>
        </Link>
      </div>
    )

  return <Reader poem={poem} sectionId={sectionId} />
}
