/**
 * Toast — lightweight feedback notification popup.
 */
import { useEffect } from 'react'

export default function Toast({ message, type = 'info', onClose, duration = 3000 }) {
  useEffect(() => {
    if (!duration) return
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  if (!message) return null

  const icons = {
    info: 'ℹ️',
    success: '✓',
    warning: '⚠️',
    error: '✕',
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border border-line-strong bg-surface text-primary shadow-lg backdrop-blur animate-in fade-in slide-in-from-bottom-4">
      <span className="text-accent text-sm font-semibold">{icons[type] || 'ℹ️'}</span>
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="ml-2 text-faint hover:text-primary text-xs focus-ring rounded p-1"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  )
}
