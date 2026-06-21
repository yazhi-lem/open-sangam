/**
 * SangamWorld — immersive landscape explorer for the five Tiṇai zones.
 */
import { useState } from 'react'
import TinaiMap from './TinaiMap'
import CulturalContextCard from './CulturalContextCard'

export default function SangamWorld() {
  const [selectedTinai, setSelectedTinai] = useState(null)
  const [activeContext, setActiveContext] = useState(null)

  return (
    <section className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="tamil text-4xl font-bold text-yellow-400">சங்க உலகம்</h1>
        <p className="text-stone-400 text-lg">Explore the five poetic landscapes of the Sangam era</p>
      </div>

      <TinaiMap selected={selectedTinai} onSelect={setSelectedTinai} />

      {selectedTinai && (
        <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-6 space-y-4">
          <p className="text-stone-400 text-sm">
            Select a verse in the <strong className="text-white">{selectedTinai}</strong> landscape to begin exploring.
          </p>
          {/* Verse list will be populated from Firestore */}
          <p className="text-stone-600 text-sm italic">Verses coming soon…</p>
        </div>
      )}

      {activeContext && (
        <CulturalContextCard context={activeContext} onClose={() => setActiveContext(null)} />
      )}
    </section>
  )
}
