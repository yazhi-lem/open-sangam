/**
 * VerseCard — displays a single verse with metadata and navigation.
 */
import LayeredView from './LayeredView'

export default function VerseCard({ verse, onPrev, onNext }) {
  if (!verse) return null

  return (
    <article className="max-w-3xl mx-auto space-y-6">
      {/* Verse header */}
      <div className="flex items-center justify-between text-sm text-stone-500">
        <span>{verse.poem} · {verse.tinai}</span>
        <span>verse {verse.number}</span>
      </div>

      <LayeredView verse={verse} />

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onPrev}
          disabled={!onPrev}
          className="px-4 py-2 rounded-lg border border-stone-700 text-stone-400 hover:text-white hover:border-stone-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>
        <button
          onClick={onNext}
          disabled={!onNext}
          className="px-4 py-2 rounded-lg border border-stone-700 text-stone-400 hover:text-white hover:border-stone-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>
    </article>
  )
}
