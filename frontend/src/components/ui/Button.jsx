/**
 * Button — accessible, reusable button component with variants, sizes, and loading state.
 */
import LoadingSpinner from './LoadingSpinner'

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  icon,
  className = '',
  type = 'button',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 focus-ring disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]'

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  const variants = {
    primary: 'bg-accent text-on-accent hover:bg-accent-strong shadow-sm hover:shadow',
    secondary: 'bg-surface-alt text-primary hover:bg-surface-alt/80 border border-line-strong',
    outline: 'border border-line-strong text-muted hover:text-primary hover:border-accent hover:bg-accent/5',
    ghost: 'text-muted hover:text-primary hover:bg-surface-alt/60',
    danger: 'bg-danger text-white hover:bg-danger/90 shadow-sm',
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <LoadingSpinner size={size === 'lg' ? 'md' : 'sm'} />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  )
}
