/**
 * Badge — semantic status tags, collection tags, and Tiṇai landscape indicators.
 */
export default function Badge({
  children,
  variant = 'default', // 'default' | 'accent' | 'anthology' | 'idyll' | 'kurinji' | 'mullai' | 'marutam' | 'neytal' | 'palai' | 'puram' | 'outline'
  size = 'md', // 'sm' | 'md'
  icon,
  className = '',
  ...props
}) {
  const base = 'inline-flex items-center gap-1.5 font-medium rounded-full transition-colors whitespace-nowrap'

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 tracking-wider uppercase',
    md: 'text-xs px-2.5 py-1 tracking-wide',
  }

  const variants = {
    default: 'bg-surface-alt text-muted border border-line',
    accent: 'bg-accent/15 text-accent border border-accent/25',
    anthology: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',
    idyll: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20',
    kurinji: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20',
    mullai: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
    marutam: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20',
    neytal: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20',
    palai: 'bg-amber-600/10 text-amber-800 dark:text-amber-400 border border-amber-600/20',
    puram: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20',
    outline: 'border border-line-strong text-muted',
  }

  return (
    <span className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  )
}
