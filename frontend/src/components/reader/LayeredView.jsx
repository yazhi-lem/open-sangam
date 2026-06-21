/**
 * LayeredView — the core interlinear reader component.
 * Renders a verse with toggleable layers:
 *   1. Sangam Tamil (original)
 *   2. Modern Tamil prose (Urai)
 *   3. English translation
 */
import { useState } from 'react'

const LAYERS = [
  { id: 'sangam', label: 'சங்கம் தமிழ்', lang: 'ta' },
  { id: 'urai', label: 'உரை', lang: 'ta' },
  { id: 'english', label: 'English', lang: 'en' },
]

export default function LayeredView({ verse }) {
  const [activeLayer, setActiveLayer] = useState('sangam')

  if (!verse) return null

  return (
    <div className="space-y-4">
      {/* Layer toggle */}
      <div className="flex gap-2 flex-wrap">
        {LAYERS.map((layer) => (
          <button
            key={layer.id}
            onClick={() => setActiveLayer(layer.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
              ${activeLayer === layer.id
                ? 'bg-yellow-500 text-stone-900 border-yellow-500'
                : 'border-stone-700 text-stone-400 hover:border-stone-500 hover:text-white'
              }`}
          >
            {layer.label}
          </button>
        ))}
      </div>

      {/* Verse text */}
      <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-6">
        {activeLayer === 'sangam' && (
          <p className="tamil-verse text-2xl text-stone-100 whitespace-pre-line">
            {verse.sangamTamil}
          </p>
        )}
        {activeLayer === 'urai' && (
          <p className="tamil text-lg text-stone-200 leading-relaxed">
            {verse.urai || <span className="text-stone-500 italic">உரை இல்லை</span>}
          </p>
        )}
        {activeLayer === 'english' && (
          <p className="text-lg text-stone-200 leading-relaxed">
            {verse.english || <span className="text-stone-500 italic">Translation pending</span>}
          </p>
        )}
      </div>
    </div>
  )
}
