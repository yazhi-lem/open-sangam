/**
 * Button — accessible, reusable button component with variants, sizes, and loading state.
 */
import LoadingSpinner from './LoadingSpinner'

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link'
  size = 'md',         // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  icon,
  className = '',
  type = 'button',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all focus-ring ' +
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none ' +
    'active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-page'

  const sizes = {
    sm: 'px-3 py-1.5 text-xs h-8',
    md: 'px-4 py-2 text-sm h-9',
    lg: 'px-6 py-2.5 text-base h-11',
  }

  const variants = {
    primary:
      'bg-accent text-on-accent hover:bg-accent-strong shadow-sm hover:shadow-md',
    secondary:
      'bg-surface-alt text-primary hover:bg-surface-alt/80 border border-line-strong shadow-xs hover:shadow-sm',
    outline:
      'border border-line-strong text-muted hover:text-primary hover:border-accent/60 hover:bg-accent/5',
    ghost:
      'text-muted hover:text-primary hover:bg-surface-alt/70',
    danger:
      'bg-danger text-white hover:bg-red-700 shadow-sm hover:shadow',
    link:
      'text-accent hover:text-accent-strong underline-offset-4 hover:underline p-0 h-auto rounded-none',
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <LoadingSpinner size={size === 'lg' ? 'md' : 'sm'} />
      ) : (
        icon && <span className="shrink-0 leading-none" aria-hidden="true">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  )
}
