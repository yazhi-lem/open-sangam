/**
 * Card — polymorphic container with clean borders, elevation, and glassmorphism options.
 */
export default function Card({
  children,
  variant = 'default', // 'default' | 'flat' | 'glass' | 'interactive'
  className = '',
  as: Component = 'div',
  ...props
}) {
  const base = 'rounded-2xl transition-all duration-200 min-w-0'
  const variants = {
    default: 'border border-line bg-surface shadow-sm hover:shadow-md',
    flat: 'border border-line bg-surface-alt/50',
    glass: 'glass-panel shadow-sm',
    interactive: 'border border-line-strong bg-surface hover:border-accent/50 hover:shadow-md hover:-translate-y-0.5 cursor-pointer focus-ring',
  }

  return (
    <Component className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </Component>
  )
}
