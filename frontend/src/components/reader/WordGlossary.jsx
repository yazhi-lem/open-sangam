/**
 * WordGlossary — "Click-to-Define" bottom-sheet pop-up for a single word.
 * Shows root meaning, grammatical class (Urichol), and etymology.
 * Mobile: full-width bottom-sheet. Desktop: centered dialog.
 */
import { useEffect } from 'react'
import Skeleton from '../ui/Skeleton'

const FieldLabel = ({ children }) => (
  <p className="text-[10px] font-bold uppercase tracking-widest text-faint mb-1">
    {children}
  </p>
)

export default function WordGlossary({ word, loading = false, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  if (!word) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/55 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={`Word glossary: ${word.form}`}
    >
      <div className="w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-2xl border border-line-strong shadow-xl overflow-hidden animate-slide-up sm:animate-scale-in">

        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-0 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-line-strong" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-line">
          <div>
            <h2 className="tamil-verse text-3xl text-accent font-semibold leading-tight">
              {word.form}
            </h2>
            {!loading && word.root && (
              <p className="tamil text-sm text-muted mt-0.5">
                root: <span className="font-semibold text-primary">{word.root}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 p-1.5 text-faint hover:text-primary hover:bg-surface-alt rounded-lg transition-colors focus-ring"
            aria-label="Close word glossary"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Skeleton variant="text" width="60px" className="h-2.5" />
                <Skeleton variant="text" width="140px" className="h-5" />
              </div>
              <div className="space-y-2">
                <Skeleton variant="text" width="80px" className="h-2.5" />
                <Skeleton variant="text" width="200px" />
              </div>
              <div className="space-y-2">
                <Skeleton variant="text" width="70px" className="h-2.5" />
                <Skeleton variant="text" />
                <Skeleton variant="text" width="80%" />
              </div>
              <p className="text-faint text-xs text-center italic animate-pulse pt-2">
                Analyzing word etymology…
              </p>
            </div>
          ) : (
            <>
              {/* Grammatical class */}
              {word.urichol && (
                <div>
                  <FieldLabel>Class (உரிச்சொல்)</FieldLabel>
                  <p className="text-sm text-muted">{word.urichol}</p>
                </div>
              )}

              {/* Etymology */}
              {word.etymology && (
                <div>
                  <FieldLabel>Etymology</FieldLabel>
                  <p className="text-sm text-muted leading-relaxed">{word.etymology}</p>
                </div>
              )}

              {/* English gloss */}
              {word.gloss && (
                <div className="pt-3 border-t border-line">
                  <FieldLabel>English Gloss</FieldLabel>
                  <p className="text-sm text-primary italic leading-relaxed">
                    "{word.gloss}"
                  </p>
                </div>
              )}

              {/* Fallback if no data loaded */}
              {!word.urichol && !word.etymology && !word.gloss && (
                <p className="text-sm text-faint italic text-center py-4">
                  No etymology data available for this word.
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-line bg-surface-alt/40 flex items-center justify-between">
          <p className="text-[10px] text-faint">
            Powered by Gemini 2.5 Flash · Classical Tamil NLP
          </p>
          <button
            onClick={onClose}
            className="text-xs font-medium text-muted hover:text-accent transition-colors focus-ring rounded px-2 py-1"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
