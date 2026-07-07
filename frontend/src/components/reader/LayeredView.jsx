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
                ? 'bg-accent text-on-accent border-accent'
                : 'border-line-strong text-muted hover:border-line-strong hover:text-primary'
              }`}
          >
            {layer.label}
          </button>
        ))}
      </div>

      {/* Verse text */}
      <div className="rounded-xl border border-line bg-surface-alt p-6">
        {activeLayer === 'sangam' && (
          <p className="tamil-verse text-2xl text-primary whitespace-pre-line">
            {verse.sangamTamil}
          </p>
        )}
        {activeLayer === 'urai' && (
          <p className="tamil text-lg text-primary leading-relaxed">
            {verse.urai || <span className="text-muted italic">உரை இல்லை</span>}
          </p>
        )}
        {activeLayer === 'english' && (
          <p className="text-lg text-primary leading-relaxed">
            {verse.english || <span className="text-muted italic">Translation pending</span>}
          </p>
        )}
      </div>
    </div>
  )
}
