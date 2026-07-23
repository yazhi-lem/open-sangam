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
    size = 'md',     // 'sm' | 'md' | 'lg'
    className = '',
    label,
    hint,
    error,
    disabled = false,
    id,
    ...props
  },
  ref
) {
  const inputId = id || (label ? `input-${Math.random().toString(36).slice(2, 9)}` : undefined)

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-3.5 text-sm',
    lg: 'h-12 px-4 text-base',
  }

  const iconSizes = {
    sm: { left: 'left-2.5', width: 14 },
    md: { left: 'left-3',   width: 16 },
    lg: { left: 'left-3.5', width: 18 },
  }

  const iconPadding  = icon ? (size === 'sm' ? 'pl-8' : size === 'lg' ? 'pl-11' : 'pl-10') : ''
  const clearPadding = onClear && value ? 'pr-9' : ''
  const { left: iconLeft, width: iconW } = iconSizes[size]

  return (
    <div className="relative w-full space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-muted uppercase tracking-wider"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div
            className={`absolute ${iconLeft} top-1/2 -translate-y-1/2 text-faint pointer-events-none flex items-center justify-center`}
            aria-hidden="true"
          >
            {typeof icon === 'string' ? (
              <span style={{ fontSize: iconW }}>{icon}</span>
            ) : (
              icon
            )}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={
            [error && `${inputId}-error`, hint && `${inputId}-hint`]
              .filter(Boolean)
              .join(' ') || undefined
          }
          className={[
            'w-full rounded-xl border bg-surface-alt/60 text-primary placeholder:text-faint',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-0',
            'focus:border-accent focus:bg-surface',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
            error  ? 'border-danger focus:ring-danger/40 focus:border-danger' : 'border-line hover:border-line-strong',
            sizes[size],
            iconPadding,
            clearPadding,
            className,
          ].filter(Boolean).join(' ')}
          {...props}
        />

        {onClear && value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-faint hover:text-primary rounded-full hover:bg-surface-alt focus-ring transition-colors text-xs"
            aria-label="Clear input"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-faint leading-relaxed">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-danger flex items-center gap-1">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  )
})

export default Input
