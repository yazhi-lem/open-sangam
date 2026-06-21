import { useParams } from 'react-router-dom'
import VerseCard from '../components/reader/VerseCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useVerse } from '../hooks/useVerse'

export default function Reader() {
  const { poemId = 'maduraikanchi' } = useParams()
  const { verses, currentIndex, setCurrentIndex, loading, error } = useVerse(poemId)

  if (loading) return <div className="py-32"><LoadingSpinner size="lg" /></div>

  if (error) return (
    <div className="max-w-xl mx-auto px-4 py-32 text-center space-y-4">
      <p className="text-4xl">⚠️</p>
      <p className="text-stone-400">{error}</p>
    </div>
  )

  const verse = verses[currentIndex]

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Poem selector / breadcrumb */}
      <div className="text-sm text-stone-500">
        <span>Maduraikanchi</span>
        <span className="mx-2">·</span>
        <span>{currentIndex + 1} / {verses.length}</span>
      </div>

      <VerseCard
        verse={verse}
        onPrev={currentIndex > 0 ? () => setCurrentIndex(currentIndex - 1) : undefined}
        onNext={currentIndex < verses.length - 1 ? () => setCurrentIndex(currentIndex + 1) : undefined}
      />
    </div>
  )
}
