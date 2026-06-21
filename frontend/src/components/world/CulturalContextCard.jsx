/**
 * CulturalContextCard — pop-up card explaining a historical/cultural reference.
 */
export default function CulturalContextCard({ context, onClose }) {
  if (!context) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-amber-800/50 bg-stone-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900/60 to-stone-900 px-6 py-4 flex items-start justify-between">
          <div>
            <p className="text-xs text-amber-400 uppercase tracking-widest mb-1">{context.category}</p>
            <h2 className="text-xl font-semibold text-white">{context.title}</h2>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-white text-2xl leading-none mt-1">×</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-stone-300 leading-relaxed">{context.description}</p>

          {context.sourceVerse && (
            <blockquote className="border-l-2 border-amber-600 pl-4">
              <p className="tamil text-stone-400 text-sm italic">{context.sourceVerse}</p>
            </blockquote>
          )}

          {context.references && (
            <div className="pt-2 border-t border-stone-800">
              <p className="text-xs text-stone-500 uppercase tracking-widest mb-1">References</p>
              <ul className="text-xs text-stone-500 list-disc list-inside space-y-1">
                {context.references.map((ref, i) => <li key={i}>{ref}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
