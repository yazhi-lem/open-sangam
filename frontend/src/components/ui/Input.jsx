/**
 * Input — accessible form input field with icon slots, focus states, and clear button.
 */
import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  {
    type = 'text',
    value,
    onChange,
    onClear,
    placeholder = '',
    icon,
    size = 'md', // 'sm' | 'md' | 'lg'
    className = '',
    error,
    disabled = false,
    ...props
  },
  ref
) {
  const sizes = {
    sm: 'h-11 px-3 text-base sm:h-8 sm:text-xs',
    md: 'h-11 px-3.5 text-base sm:h-10 sm:text-sm',
    lg: 'h-12 px-4 text-base',
  }

  const iconPadding = icon ? (size === 'sm' ? 'pl-8' : size === 'lg' ? 'pl-11' : 'pl-9.5') : ''
  const clearPadding = onClear && value ? 'pr-9' : ''

  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none flex items-center justify-center">
          {icon}
        </div>
      )}

      <input
        ref={ref}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-xl border bg-surface-alt/60 text-primary placeholder:text-faint
          transition-colors focus-ring focus:bg-surface focus:border-accent
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${error ? 'border-danger focus:border-danger' : 'border-line'}
          ${sizes[size]} ${iconPadding} ${clearPadding} ${className}`}
        {...props}
      />

      {onClear && value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-0.5 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center sm:right-2 sm:h-7 sm:w-7 text-faint hover:text-primary rounded-full focus-ring transition-colors"
          aria-label="உள்ளீட்டை அழிக்க"
        >
          ✕
        </button>
      )}

      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  )
})

export default Input
