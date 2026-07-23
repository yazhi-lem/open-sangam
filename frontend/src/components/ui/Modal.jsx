/**
 * Modal — accessible overlay popup with backdrop blur, keyboard ESC trap, and focus management.
 * On mobile, renders as a bottom-sheet. On sm+, renders as a centered dialog.
 */
import { useEffect, useRef } from 'react'

export default function Modal({ title, children, onClose, maxWidth = 'max-w-lg' }) {
  const panelRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'

    // Move focus into the panel on mount
    const first = panelRef.current?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    first?.focus()

    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={panelRef}
        className={[
          'w-full sm:max-w-none bg-surface overflow-hidden',
          // Mobile: full-width bottom-sheet
          'rounded-t-2xl sm:rounded-2xl',
          // Desktop: centered panel
          `sm:${maxWidth}`,
          // Border & shadow
          'border border-line-strong shadow-xl',
          // Entrance animation
          'animate-slide-up sm:animate-scale-in',
        ].join(' ')}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-surface-alt/50">
            {/* Drag handle — visible on mobile only */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-line-strong sm:hidden" />
            <h2 id="modal-title" className="text-base font-semibold text-primary">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-faint hover:text-primary hover:bg-surface-alt transition-colors focus-ring"
              aria-label="Close modal"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-5 py-5 max-h-[80vh] overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  )
}
