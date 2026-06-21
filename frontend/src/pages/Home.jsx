import { Link } from 'react-router-dom'

const TINAI_HIGHLIGHTS = [
  { id: 'kurinji', tamil: 'குறிஞ்சி', english: 'Mountains', icon: '🏔' },
  { id: 'mullai', tamil: 'முல்லை', english: 'Forest', icon: '🌿' },
  { id: 'marutam', tamil: 'மருதம்', english: 'Cropland', icon: '🌾' },
  { id: 'neytal', tamil: 'நெய்தல்', english: 'Seashore', icon: '🌊' },
  { id: 'palai', tamil: 'பாலை', english: 'Wasteland', icon: '🏜' },
]

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 space-y-20">
      {/* Hero */}
      <section className="text-center space-y-6">
        <p className="tamil text-amber-400 text-lg tracking-widest">திறந்த சங்கம்</p>
        <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight">
          Explore 2,000 Years of<br />
          <span className="text-yellow-400">Classical Tamil Poetry</span>
        </h1>
        <p className="text-stone-400 text-xl max-w-2xl mx-auto leading-relaxed">
          An interactive reader for the Sangam corpus — layered translations, click-to-define
          glossaries, and immersive landscape navigation.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            to="/reader"
            className="px-6 py-3 rounded-xl bg-yellow-500 text-stone-900 font-semibold hover:bg-yellow-400 transition-colors"
          >
            Open Reader →
          </Link>
          <Link
            to="/world"
            className="px-6 py-3 rounded-xl border border-stone-700 text-stone-300 hover:text-white hover:border-stone-500 transition-colors"
          >
            Enter Sangam World
          </Link>
        </div>
      </section>

      {/* Tiṇai quick-nav */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white text-center">Five Landscapes · ஐந்திணை</h2>
        <div className="grid grid-cols-5 gap-3">
          {TINAI_HIGHLIGHTS.map((t) => (
            <Link
              key={t.id}
              to={`/world?tinai=${t.id}`}
              className="rounded-xl border border-stone-800 bg-stone-900/50 p-4 text-center hover:border-stone-600 hover:bg-stone-800/50 transition-colors group"
            >
              <div className="text-3xl mb-2">{t.icon}</div>
              <p className="tamil text-sm font-medium text-stone-300 group-hover:text-white">{t.tamil}</p>
              <p className="text-xs text-stone-600">{t.english}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Feature highlights */}
      <section className="grid sm:grid-cols-3 gap-6">
        {[
          {
            icon: '📖',
            title: 'Layered View',
            desc: 'Toggle between Sangam Tamil, Modern Tamil prose (Urai), and English for every verse.',
          },
          {
            icon: '🔍',
            title: 'Click-to-Define',
            desc: 'Tap any word for its root, grammatical class, and 2,000-year-old etymology.',
          },
          {
            icon: '🤖',
            title: 'AI Translation',
            desc: 'Gemini 2.5 Flash powers contemporary prose translations, verified by scholars.',
          },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-stone-800 bg-stone-900/40 p-6 space-y-2">
            <div className="text-3xl">{f.icon}</div>
            <h3 className="font-semibold text-white">{f.title}</h3>
            <p className="text-stone-400 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
