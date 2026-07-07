/**
 * WordGlossary — "Click-to-Define" pop-up for a single word.
 * Shows root meaning, grammatical class (Urichol), and etymology.
 */
export default function WordGlossary({ word, loading = false, onClose }) {
  if (!word) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-line-strong bg-surface p-6 space-y-4 shadow-2xl">
        {/* Word */}
        <div className="flex items-start justify-between">
          <h2 className="tamil-verse text-3xl text-accent">{word.form}</h2>
          <button onClick={onClose} className="text-faint hover:text-primary text-xl leading-none">×</button>
        </div>

        {loading && (
          <p className="text-faint text-sm animate-pulse">Analyzing…</p>
        )}

        {/* Root */}
        {!loading && word.root && (
          <div>
            <p className="text-xs text-faint uppercase tracking-widest mb-1">Root (வேர்ச்சொல்)</p>
            <p className="tamil text-lg text-primary">{word.root}</p>
          </div>
        )}

        {/* Grammatical class */}
        {!loading && word.urichol && (
          <div>
            <p className="text-xs text-faint uppercase tracking-widest mb-1">Class (உரிச்சொல்)</p>
            <p className="text-muted">{word.urichol}</p>
          </div>
        )}

        {/* Etymology */}
        {!loading && word.etymology && (
          <div>
            <p className="text-xs text-faint uppercase tracking-widest mb-1">Etymology</p>
            <p className="text-muted text-sm leading-relaxed">{word.etymology}</p>
          </div>
        )}

        {/* English gloss */}
        {!loading && word.gloss && (
          <div className="pt-2 border-t border-line">
            <p className="text-muted italic">"{word.gloss}"</p>
          </div>
        )}
      </div>
    </div>
  )
}
