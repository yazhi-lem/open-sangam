/**
 * TinaiMap — visual selector for the five Tiṇai (poetic landscape) zones.
 * Each Tiṇai maps to an emotional context and a geographic landscape.
 *
 * Zone list and styling come from TINAI_WORLD (data/tinaiWorld.js) — adding a
 * new zone there makes it appear here automatically, with no changes needed
 * to this component.
 */
import { TINAI_LIST } from '../../data/tinaiWorld'

export default function TinaiMap({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {TINAI_LIST.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`rounded-xl border p-4 text-left transition-all bg-gradient-to-br ${t.colors.primary} ${t.colors.border}
            ${selected === t.id ? 'ring-2 ring-white/30 scale-105' : 'hover:scale-102 opacity-80 hover:opacity-100'}`}
        >
          <div className="text-2xl mb-2">{t.emoji}</div>
          <p className={`tamil font-semibold ${t.colors.accent}`}>{t.ta}</p>
          <p className="text-white text-sm">{t.en}</p>
          <p className="text-stone-400 text-xs mt-1 leading-snug">{t.subEn}</p>
        </button>
      ))}
    </div>
  )
}
