import useAppStore from '../../store/useAppStore'
import { LAYER_CHIPS, splitLabel } from '../../data/chipLabels.js'

// Layer chips: pick which of the three layers to read. Scrolls sideways on phones.
export default function LayerToggle({ layer, onChange }) {
  const language = useAppStore((s) => s.language)
  return (
    <div
      role="group"
      aria-label="Reader layers"
      className="flex w-full gap-1 overflow-x-auto pb-1"
    >
      {LAYER_CHIPS.map((l) => {
        const parts = splitLabel(l.label)
        const label = language === 'ta' ? parts.ta : parts.en
        const selected = layer === l.id
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => onChange(l.id)}
            title={l.label}
            aria-pressed={selected}
            className={`min-h-[32px] shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors focus-ring ${
              selected
                ? 'border-primary bg-primary text-page'
                : 'border-line-strong text-muted hover:border-primary hover:text-primary'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
