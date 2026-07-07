/**
 * TinaiWorldDetail — detailed open-world asset browser for a selected Tiṇai zone.
 * Organized into tabs: Landscape · Flora & Fauna · People & Life · Music & Arts · Poetry
 */
import { useState } from 'react'
import { TINAI_WORLD } from '../../data/tinaiWorld'
import WorldStage from './WorldStage'

const TABS = [
  { id: 'world',   label: 'World',          icon: '🗺' },
  { id: 'life',    label: 'Flora & Fauna',   icon: '🌿' },
  { id: 'people',  label: 'People & Life',   icon: '👥' },
  { id: 'arts',    label: 'Music & Crafts',  icon: '🎵' },
  { id: 'poetry',  label: 'Poetry',          icon: '📜' },
]

// ── Small reusable card ──────────────────────────────────────────────────────
function AssetCard({ emoji, ta, en, species, role, desc, badge, borderColor }) {
  const [open, setOpen] = useState(false)
  return (
    <button
      onClick={() => setOpen(o => !o)}
      className={`text-left rounded-xl border ${borderColor} bg-surface-alt/60 p-4 space-y-2 transition-all hover:bg-surface/60 focus:outline-none focus:ring-1 focus:ring-line-strong w-full`}
    >
      <div className="flex items-start gap-3">
        {emoji && <span className="text-2xl shrink-0 mt-0.5" aria-hidden="true">{emoji}</span>}
        <div className="min-w-0">
          <p className="tamil font-semibold text-primary leading-tight">{ta}</p>
          <p className="text-xs text-muted mt-0.5">{en}</p>
          {(species || role) && (
            <p className={`inline-block text-[9px] font-medium uppercase tracking-widest px-1.5 py-0.5 rounded mt-1 ${badge}`}>
              {species || role}
            </p>
          )}
        </div>
      </div>
      {open && desc && (
        <p className="text-xs text-muted leading-relaxed border-t border-line pt-2">{desc}</p>
      )}
      {!open && (
        <p className="text-[10px] text-faint">Tap for details</p>
      )}
    </button>
  )
}

// ── Section heading ──────────────────────────────────────────────────────────
function SectionHead({ title }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-faint pt-2 pb-1 border-b border-line">
      {title}
    </h3>
  )
}

// ── World tab ────────────────────────────────────────────────────────────────
function WorldTab({ data }) {
  const { atmosphere, deity, emotion, colors } = data
  return (
    <div className="space-y-6">
      {/* Deity panel */}
      <div className={`rounded-xl border ${colors.border} bg-surface-alt/60 p-5 space-y-3`}>
        <p className={`text-[10px] uppercase tracking-widest font-semibold ${colors.accent}`}>Presiding Deity</p>
        <div>
          <p className="tamil text-xl font-bold text-primary">{deity.ta}</p>
          <p className="text-sm text-muted mt-0.5">{deity.en}</p>
        </div>
        <p className="text-sm text-muted leading-relaxed">{deity.desc}</p>
        <div>
          <p className="text-[10px] text-faint uppercase tracking-widest mb-1">Symbol</p>
          <p className="text-xs text-muted">{deity.symbol}</p>
        </div>
        <div>
          <p className="text-[10px] text-faint uppercase tracking-widest mb-1">Epithets</p>
          <div className="flex flex-wrap gap-1.5">
            {deity.epithets.map(e => (
              <span key={e} className={`text-[10px] px-2 py-0.5 rounded-full ${colors.badge}`}>{e}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Atmosphere */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-line bg-surface-alt/40 p-4 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-faint">Season</p>
          <p className="tamil text-sm font-semibold text-primary">{atmosphere.season.ta}</p>
          <p className="text-xs text-muted">{atmosphere.season.en}</p>
          <p className="text-xs text-faint leading-relaxed">{atmosphere.season.desc}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface-alt/40 p-4 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-faint">Time of Day</p>
          <p className="tamil text-sm font-semibold text-primary">{atmosphere.timeOfDay.ta}</p>
          <p className="text-xs text-muted">{atmosphere.timeOfDay.en}</p>
          <p className="text-xs text-faint leading-relaxed">{atmosphere.timeOfDay.desc}</p>
        </div>
      </div>

      {/* Emotions */}
      <div className="grid sm:grid-cols-2 gap-3">
        {[
          { key: 'akam', label: 'அகம் · Akam (Inner)', color: 'text-amber-400' },
          { key: 'puram', label: 'புறம் · Puram (Outer)', color: 'text-rose-400' },
        ].map(({ key, label, color }) => (
          <div key={key} className="rounded-xl border border-line bg-surface-alt/40 p-4 space-y-2">
            <p className={`text-[10px] uppercase tracking-widest font-semibold ${color}`}>{label}</p>
            <p className="tamil text-sm font-semibold text-primary">{emotion[key].ta}</p>
            <p className="text-xs text-muted">{emotion[key].en}</p>
            <p className="text-xs text-faint leading-relaxed">{emotion[key].desc}</p>
          </div>
        ))}
      </div>

      {/* Ambience */}
      <div className="space-y-2">
        <SectionHead title="Ambient Sounds" />
        <div className="flex flex-wrap gap-2 pt-1">
          {atmosphere.ambience.map(a => (
            <span key={a} className="text-xs px-3 py-1 rounded-full border border-line-strong bg-surface-alt/40 text-muted">
              🔊 {a}
            </span>
          ))}
        </div>
      </div>

      {/* Landscape features */}
      <div className="space-y-3">
        <SectionHead title="Landscape Features" />
        <div className="grid sm:grid-cols-2 gap-3">
          {(data.landscape || []).map(l => (
            <div key={l.ta} className="rounded-xl border border-line bg-surface-alt/40 p-4 space-y-1">
              <p className="tamil text-sm font-semibold text-primary">{l.ta}</p>
              <p className="text-xs text-faint">{l.en}</p>
              <p className="text-xs text-faint leading-relaxed">{l.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Flora & Fauna tab ────────────────────────────────────────────────────────
function LifeTab({ data }) {
  const { flora, fauna, colors } = data
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <SectionHead title={`Flora — ${flora.length} characteristic plants`} />
        <div className="grid sm:grid-cols-2 gap-3">
          {flora.map(f => (
            <AssetCard key={f.ta} {...f} badge={colors.badge} borderColor={colors.border} />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <SectionHead title={`Fauna — ${fauna.length} characteristic animals`} />
        <div className="grid sm:grid-cols-2 gap-3">
          {fauna.map(f => (
            <AssetCard key={f.ta} {...f} badge={colors.badge} borderColor={colors.border} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── People & Life tab ────────────────────────────────────────────────────────
function PeopleTab({ data }) {
  const { people, crafts, architecture, colors } = data
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <SectionHead title="Communities & Social Roles" />
        <div className="grid sm:grid-cols-2 gap-3">
          {people.map(p => (
            <AssetCard key={p.ta} ta={p.ta} en={p.en} role={p.role} desc={p.desc} badge={colors.badge} borderColor={colors.border} />
          ))}
        </div>
      </div>

      {crafts && crafts.length > 0 && (
        <div className="space-y-3">
          <SectionHead title="Crafts & Livelihoods" />
          <div className="grid sm:grid-cols-2 gap-3">
            {crafts.map(c => (
              <div key={c.ta} className={`rounded-xl border ${colors.border} bg-surface-alt/60 p-4 space-y-1`}>
                <p className="tamil font-semibold text-primary">{c.ta}</p>
                <p className="text-xs text-faint">{c.en}</p>
                <p className="text-xs text-muted leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {architecture && architecture.length > 0 && (
        <div className="space-y-3">
          <SectionHead title="Architecture & Landmarks" />
          <div className="grid sm:grid-cols-2 gap-3">
            {architecture.map(a => (
              <div key={a.ta} className="rounded-xl border border-line bg-surface-alt/40 p-4 space-y-1">
                <p className="tamil font-semibold text-primary">{a.ta}</p>
                <p className="text-xs text-faint">{a.en}</p>
                <p className="text-xs text-muted leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Music & Arts tab ─────────────────────────────────────────────────────────
function ArtsTab({ data }) {
  const { music, colors } = data
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <SectionHead title={`Music, Instruments & Song — ${music.length} traditions`} />
        <div className="grid sm:grid-cols-2 gap-3">
          {music.map(m => (
            <div key={m.ta} className={`rounded-xl border ${colors.border} bg-surface-alt/60 p-4 space-y-2`}>
              <p className="text-xl" aria-hidden="true">🎵</p>
              <p className="tamil font-semibold text-primary">{m.ta}</p>
              <p className="text-xs text-faint">{m.en}</p>
              <p className="text-xs text-muted leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pann (melody mode) callout */}
      {music.find(m => m.ta.includes('பண்')) && (() => {
        const pann = music.find(m => m.ta.includes('பண்'))
        return (
          <div className={`rounded-xl border ${colors.border} bg-gradient-to-br ${data.colors.primary} p-5 space-y-2`}>
            <p className={`text-[10px] uppercase tracking-widest font-semibold ${colors.accent}`}>Pann · Classical Melody Mode</p>
            <p className="tamil text-lg font-bold text-primary">{pann.ta}</p>
            <p className="text-xs text-muted leading-relaxed">{pann.desc}</p>
            <p className="text-xs text-faint italic">Each Tiṇai had its own pann (raga) — the ancient precursors of modern Carnatic ragas.</p>
          </div>
        )
      })()}
    </div>
  )
}

// ── Poetry tab ───────────────────────────────────────────────────────────────
function PoetryTab({ data }) {
  const { poetry, colors, ta, en, subEn } = data
  return (
    <div className="space-y-6">
      <div className={`rounded-xl border ${colors.border} bg-surface-alt/60 p-6 space-y-4`}>
        <p className={`text-[10px] uppercase tracking-widest font-semibold ${colors.accent}`}>Sample Verse</p>
        <blockquote>
          <p className="tamil-verse text-lg text-primary leading-[2.2] whitespace-pre-line">{poetry.classic}</p>
        </blockquote>
        <p className="text-xs text-faint italic border-t border-line pt-3 leading-relaxed">
          {poetry.poem}
        </p>
      </div>

      {/* Tiṇai explanation */}
      <div className="rounded-xl border border-line bg-surface-alt/40 p-5 space-y-3">
        <p className="text-[10px] uppercase tracking-widest text-faint">About this Tiṇai</p>
        <p className="tamil text-2xl font-bold text-primary">{ta}</p>
        <p className="text-muted text-sm">{en} · {subEn}</p>
        <p className="text-xs text-faint leading-relaxed">
          In classical Tamil poetics (as codified in the Tolkāppiyam), every love poem was set in one of the five Tiṇai landscapes.
          The landscape itself — its flowers, birds, time of day, and season — conveyed the emotional register of the verse
          without ever naming the emotion directly. This is called <em className="text-muted">Akapporul</em> — the inner meaning.
        </p>
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function TinaiWorldDetail({ tinaiId }) {
  const [activeTab, setActiveTab] = useState('world')
  const data = TINAI_WORLD[tinaiId]
  if (!data) return null

  return (
    <div className="space-y-5">
      {/* Landscape hero — 3D when the device can handle it, 2D otherwise */}
      <WorldStage tinaiId={tinaiId} />

      {/* Zone title bar */}
      <div className="flex items-center gap-4">
        <div>
          <p className="tamil text-3xl font-bold text-primary">{data.ta}</p>
          <p className="text-sm text-muted">{data.en} · <span className="text-faint italic">{data.subEn}</span></p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-surface-alt/60 border border-line overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-fit px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap
              ${activeTab === tab.id
                ? `bg-surface text-primary shadow`
                : 'text-faint hover:text-muted'
              }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'world'  && <WorldTab  data={data} />}
        {activeTab === 'life'   && <LifeTab   data={data} />}
        {activeTab === 'people' && <PeopleTab data={data} />}
        {activeTab === 'arts'   && <ArtsTab   data={data} />}
        {activeTab === 'poetry' && <PoetryTab data={data} />}
      </div>
    </div>
  )
}
