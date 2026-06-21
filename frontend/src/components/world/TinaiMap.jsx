/**
 * TinaiMap — visual selector for the five Tiṇai (poetic landscape) zones.
 * Each Tiṇai maps to an emotional context and a geographic landscape.
 */

const TINAI = [
  {
    id: 'kurinji',
    tamil: 'குறிஞ்சி',
    english: 'Mountains',
    theme: 'Union & love in the hills',
    color: 'from-purple-900 to-indigo-950',
    accent: 'text-purple-300',
    border: 'border-purple-800',
    flower: '🌸',
  },
  {
    id: 'mullai',
    tamil: 'முல்லை',
    english: 'Forest',
    theme: 'Patient waiting & fidelity',
    color: 'from-green-900 to-emerald-950',
    accent: 'text-green-300',
    border: 'border-green-800',
    flower: '🌿',
  },
  {
    id: 'marutam',
    tamil: 'மருதம்',
    english: 'Cropland',
    theme: 'Infidelity & lovers\' quarrels',
    color: 'from-yellow-900 to-amber-950',
    accent: 'text-yellow-300',
    border: 'border-yellow-800',
    flower: '🌾',
  },
  {
    id: 'neytal',
    tamil: 'நெய்தல்',
    english: 'Seashore',
    theme: 'Longing & separation',
    color: 'from-blue-900 to-cyan-950',
    accent: 'text-blue-300',
    border: 'border-blue-800',
    flower: '🌊',
  },
  {
    id: 'palai',
    tamil: 'பாலை',
    english: 'Wasteland',
    theme: 'Separation & hardship',
    color: 'from-orange-900 to-red-950',
    accent: 'text-orange-300',
    border: 'border-orange-800',
    flower: '🏜',
  },
]

export default function TinaiMap({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {TINAI.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`rounded-xl border p-4 text-left transition-all bg-gradient-to-br ${t.color} ${t.border}
            ${selected === t.id ? 'ring-2 ring-white/30 scale-105' : 'hover:scale-102 opacity-80 hover:opacity-100'}`}
        >
          <div className="text-2xl mb-2">{t.flower}</div>
          <p className={`tamil font-semibold ${t.accent}`}>{t.tamil}</p>
          <p className="text-white text-sm">{t.english}</p>
          <p className="text-stone-400 text-xs mt-1 leading-snug">{t.theme}</p>
        </button>
      ))}
    </div>
  )
}
