/**
 * Badge — semantic status tags, collection tags, and Tiṇai landscape indicators.
 */
export default function Badge({
  children,
  variant = 'default', // 'default' | 'accent' | 'anthology' | 'idyll' | 'kurinji' | 'mullai' | 'marutam' | 'neytal' | 'palai' | 'puram' | 'outline' | 'success' | 'danger' | 'dot'
  size = 'md',         // 'sm' | 'md'
  icon,
  dot,                 // dot color string e.g. 'emerald' | 'red' | 'amber'
  className = '',
  ...props
}) {
  const base = 'inline-flex items-center gap-1.5 font-medium rounded-full transition-colors whitespace-nowrap'

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 tracking-wide uppercase',
    md: 'text-xs px-2.5 py-1 tracking-wide',
  }

  const variants = {
    default:    'bg-surface-alt text-muted border border-line',
    accent:     'bg-accent/12 text-accent border border-accent/20',
    anthology:  'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',
    idyll:      'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20',
    kurinji:    'bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20',
    mullai:     'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
    marutam:    'bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20',
    neytal:     'bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20',
    palai:      'bg-amber-600/10 text-amber-800 dark:text-amber-400 border border-amber-600/20',
    puram:      'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20',
    outline:    'border border-line-strong text-muted',
    success:    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
    danger:     'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20',
  }

  const dotColors = {
    emerald: 'bg-emerald-500',
    red:     'bg-red-500',
    amber:   'bg-amber-500',
    blue:    'bg-blue-500',
    gray:    'bg-stone-400',
  }

  return (
    <span className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[dot] || 'bg-current'}`}
          aria-hidden="true"
        />
      )}
      {icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </span>
  )
}
