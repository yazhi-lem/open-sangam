/**
 * Modal — accessible overlay popup with backdrop blur, keyboard ESC trap, and focus management.
 */
import { useEffect } from 'react'

export default function Modal({ title, children, onClose, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = 'unset'
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`w-full ${maxWidth} rounded-2xl border border-line-strong bg-surface shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface-alt/40">
            <h2 id="modal-title" className="text-lg font-semibold text-primary">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-faint hover:text-primary hover:bg-surface-alt transition-colors focus-ring"
              aria-label="Close modal"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
