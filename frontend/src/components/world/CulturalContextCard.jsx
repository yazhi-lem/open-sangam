/**
 * CulturalContextCard — pop-up card explaining a historical/cultural reference.
 */
export default function CulturalContextCard({ context, onClose }) {
  if (!context) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-accent/30 bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-accent/15 to-surface px-6 py-4 flex items-start justify-between">
          <div>
            <p className="text-xs text-accent uppercase tracking-widest mb-1">{context.category}</p>
            <h2 className="text-xl font-semibold text-primary">{context.title}</h2>
          </div>
          <button onClick={onClose} className="text-faint hover:text-primary text-2xl leading-none mt-1">×</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-muted leading-relaxed">{context.description}</p>

          {context.sourceVerse && (
            <blockquote className="border-l-2 border-accent-strong pl-4">
              <p className="tamil text-faint text-sm italic">{context.sourceVerse}</p>
            </blockquote>
          )}

          {context.references && (
            <div className="pt-2 border-t border-line">
              <p className="text-xs text-faint uppercase tracking-widest mb-1">References</p>
              <ul className="text-xs text-faint list-disc list-inside space-y-1">
                {context.references.map((ref, i) => <li key={i}>{ref}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
