import { useParams, Link } from 'react-router-dom'
import { POEMS, COLLECTIONS, POEM_BY_ID } from '../data/poems.js'
import Button from '../components/ui/Button'
import Library from '../components/library/Library'
import Reader from '../components/reader/Reader'

export default function Book() {
  const { poemId, sectionId } = useParams()

  if (!poemId) return <Library />

  const poem = POEM_BY_ID[poemId]
  if (!poem || !poem.available)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center px-4">
        <p className="text-xl font-semibold text-primary">
          {poem ? `${poem.en} — Coming Soon` : 'Poem Not Found'}
        </p>
        <p className="text-muted text-sm">The classical work you requested is being digitized into the corpus.</p>
        <Link to="/book">
          <Button variant="outline" size="sm">← Return to Library</Button>
        </Link>
      </div>
    )

  return <Reader poem={poem} sectionId={sectionId} />
}
