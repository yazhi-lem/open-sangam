/**
 * Toast — lightweight feedback notification with type-specific colors, progress bar, and
 * auto-dismiss. Positioned bottom-right (safe area aware on mobile).
 */
import { useEffect, useRef } from 'react'

const TYPE_CONFIG = {
  success: {
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    barClass:  'bg-emerald-500',
  },
  error: {
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
      </svg>
    ),
    iconClass: 'text-red-600 dark:text-red-400',
    barClass:  'bg-red-500',
  },
  warning: {
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/>
      </svg>
    ),
    iconClass: 'text-amber-600 dark:text-amber-400',
    barClass:  'bg-amber-500',
  },
  info: {
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
      </svg>
    ),
    iconClass: 'text-blue-600 dark:text-blue-400',
    barClass:  'bg-blue-500',
  },
}

export default function Toast({ message, type = 'info', onClose, duration = 3000 }) {
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    if (!message || !duration) return
    const timer = setTimeout(() => onCloseRef.current?.(), duration)
    return () => clearTimeout(timer)
  }, [message, duration])

  if (!message) return null

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.info

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[60] w-full max-w-sm pointer-events-auto animate-slide-up"
    >
      <div className="rounded-xl border border-line-strong bg-surface shadow-lg overflow-hidden">
        {/* Content */}
        <div className="flex items-start gap-3 px-4 py-3">
          <span className={`shrink-0 mt-0.5 ${config.iconClass}`}>
            {config.icon}
          </span>
          <p className="text-sm font-medium text-primary flex-1 leading-snug">{message}</p>
          <button
            onClick={onClose}
            className="shrink-0 p-0.5 text-faint hover:text-primary rounded-md transition-colors focus-ring -mt-0.5 -mr-0.5"
            aria-label="Dismiss notification"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        {duration > 0 && (
          <div className="h-0.5 bg-line w-full">
            <div
              className={`h-full toast-progress ${config.barClass}`}
              style={{ '--toast-duration': `${duration}ms` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
