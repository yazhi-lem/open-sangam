/**
 * Chip — the one reusable chip for the reader and library.
 *
 * Two families that must not be confused:
 *   variant="filter"  Outlined pill on the page background; selected = filled ink
 *                     (Mai) with page-colour text. A button with aria-pressed. Used for
 *                     the layer chips and the akam / puram / tiṇai quick-picks.
 *   variant="badge"   Small filled pill in Kal stone grey. Not interactive. Marks draft
 *                     and machine-drafted text. Never terracotta / Kumkumam.
 *
 * Labels are Tamil first, English second. Pass `label="<Tamil> · <English>"`
 * (exactly one ' · ') or `ta` and `en` separately. Never letter-space the Tamil.
 */

import { splitLabel } from '../../data/chipLabels.js'

// Brand tokens (brand kit v0.3): Kal #6B6258 for badges. Declared in index.css as --kal.
const BASE = 'inline-flex shrink-0 items-center justify-center rounded-full font-medium'

export default function Chip({
  variant = 'filter', // 'filter' | 'badge'
  label,
  ta,
  en,
  selected = false,
  onClick,
  title,
  className = '',
  ...props
}) {
  const parts = label != null ? splitLabel(label) : { ta, en }

  if (variant === 'badge') {
    return (
      <span
        title={title}
        className={`inline-flex min-w-0 max-w-full flex-wrap items-center justify-center gap-x-1.5 rounded-2xl bg-[var(--kal)] px-2.5 py-1 text-center text-xs font-medium leading-snug text-white ${className}`}
        {...props}
      >
        {/* Long badges wrap onto a second line instead of overflowing a 360px card. */}
        <span lang="ta" className="tamil whitespace-nowrap">{parts.ta}{parts.en && <span aria-hidden="true"> ·</span>}</span>
        {parts.en && <span lang="en" className="whitespace-nowrap">{parts.en}</span>}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      title={title}
      className={`${BASE} min-h-[44px] min-w-[44px] flex-col border px-4 py-1 leading-tight transition-colors focus-ring ${
        selected
          ? 'border-primary bg-primary text-page'
          : 'border-line-strong bg-transparent text-primary hover:border-primary'
      } ${className}`}
      {...props}
    >
      <span lang="ta" className="tamil whitespace-nowrap text-sm font-semibold">{parts.ta}</span>
      {parts.en && (
        <span lang="en" className="whitespace-nowrap text-xs font-normal opacity-80">{parts.en}</span>
      )}
    </button>
  )
}
