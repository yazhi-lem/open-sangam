/**
 * WordGlossary — "Click-to-Define" pop-up for a single word.
 * Shows root meaning, grammatical class (Urichol), and etymology.
 */
export default function WordGlossary({ word, onClose }) {
  if (!word) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-stone-700 bg-stone-900 p-6 space-y-4 shadow-2xl">
        {/* Word */}
        <div className="flex items-start justify-between">
          <h2 className="tamil-verse text-3xl text-yellow-400">{word.form}</h2>
          <button onClick={onClose} className="text-stone-500 hover:text-white text-xl leading-none">×</button>
        </div>

        {/* Root */}
        {word.root && (
          <div>
            <p className="text-xs text-stone-500 uppercase tracking-widest mb-1">Root (வேர்ச்சொல்)</p>
            <p className="tamil text-lg text-stone-200">{word.root}</p>
          </div>
        )}

        {/* Grammatical class */}
        {word.urichol && (
          <div>
            <p className="text-xs text-stone-500 uppercase tracking-widest mb-1">Class (உரிச்சொல்)</p>
            <p className="text-stone-300">{word.urichol}</p>
          </div>
        )}

        {/* Etymology */}
        {word.etymology && (
          <div>
            <p className="text-xs text-stone-500 uppercase tracking-widest mb-1">Etymology</p>
            <p className="text-stone-400 text-sm leading-relaxed">{word.etymology}</p>
          </div>
        )}

        {/* English gloss */}
        {word.gloss && (
          <div className="pt-2 border-t border-stone-800">
            <p className="text-stone-300 italic">"{word.gloss}"</p>
          </div>
        )}
      </div>
    </div>
  )
}
