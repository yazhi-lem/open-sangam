export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-yellow-500 text-stone-900 hover:bg-yellow-400',
    secondary: 'border border-stone-700 text-stone-300 hover:text-white hover:border-stone-500',
    ghost: 'text-stone-400 hover:text-white',
  }

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
