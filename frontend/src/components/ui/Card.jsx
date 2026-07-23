/**
 * Card — polymorphic container with clean borders, elevation, and glassmorphism options.
 */
export default function Card({
  children,
  variant = 'default', // 'default' | 'flat' | 'glass' | 'interactive' | 'elevated' | 'highlight'
  className = '',
  as: Component = 'div',
  ...props
}) {
  const base = 'rounded-2xl transition-all duration-200 min-w-0'

  const variants = {
    default:
      'border border-line bg-surface shadow-sm',
    flat:
      'border border-line bg-surface-alt/50',
    glass:
      'glass-panel shadow-md',
    elevated:
      'border border-line bg-surface shadow-md hover:shadow-lg',
    interactive:
      'border border-line bg-surface cursor-pointer ' +
      'hover:border-accent/40 hover:shadow-md hover:-translate-y-0.5 ' +
      'hover:ring-1 hover:ring-accent/15 focus-ring',
    highlight:
      'border border-line bg-surface shadow-sm border-l-2 border-l-accent',
  }

  return (
    <Component className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </Component>
  )
}
