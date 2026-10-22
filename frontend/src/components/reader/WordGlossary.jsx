import { useEffect, useId } from 'react'
import { glossaryBadgeLabel, glossaryStatus } from '../../data/readerLayers.js'
import { MEANING_SOON } from '../../data/readerStrings.js'
import ComingSoon from './ComingSoon'
import Chip from '../ui/Chip'

/**
 * WordGlossary — "Click-to-Define" sheet for a single word.
 *
 * Reads only the glossary fields stored in the corpus record (root, urichol,
 * etymology, gloss). There is no live AI fallback: words without a stored
 * entry show a clear "no gloss yet" state. Entries on unverified or
 * AI-annotated records carry a draft label until a scholar signs off.
 *
 * Tamil labels below are drafts pending native-reviewer sign-off.
 */
export default function WordGlossary({ word, verse, onClose }) {
  const titleId = useId()

  useEffect(() => {
    if (!word) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [word, onClose])

  if (!word) return null

  const { status, model } = glossaryStatus(verse, word)
  const badge = glossaryBadgeLabel(verse, word)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-line-strong bg-surface p-4 sm:p-6 space-y-4 shadow-2xl"
      >
        {/* Word */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <h2 id={titleId} lang="ta" className="tamil-verse text-2xl sm:text-3xl text-accent break-words">
              {word.form}
            </h2>
            {/* Kal-grey draft chip (same as the reader badges), not amber; wraps on phones. */}
            {badge && (
              <Chip
                variant="badge"
                label={badge}
                title={
                  status === 'ai-draft'
                    ? `Machine-drafted${model ? ` (${model})` : ''}; not yet reviewed by a Tamil scholar.`
                    : 'Not yet reviewed by a Tamil scholar.'
                }
              />
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close glossary"
            className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center text-faint hover:text-primary text-2xl leading-none focus-ring rounded-lg"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        {status === 'missing' && (
          <p className="text-sm text-muted leading-relaxed">
            No glossary entry for this word yet. Entries are added from the corpus and reviewed by Tamil scholars.
          </p>
        )}

        {/* Root */}
        {word.root && (
          <div>
            <p className="text-xs text-faint mb-1">
              <span lang="ta" className="tamil">வேர்ச்சொல்</span> (Root)
            </p>
            <p lang="ta" className="tamil text-lg text-primary break-words">{word.root}</p>
          </div>
        )}

        {/* Grammatical class */}
        {word.urichol && (
          <div>
            <p className="text-xs text-faint mb-1">
              <span lang="ta" className="tamil">சொல்வகை</span> (Class)
            </p>
            <p lang="ta" className="text-muted tamil break-words">{word.urichol}</p>
          </div>
        )}

        {/* Etymology */}
        {word.etymology && (
          <div>
            <p className="text-xs text-faint mb-1">Etymology</p>
            <p lang="ta" className="text-muted text-sm leading-relaxed tamil break-words">{word.etymology}</p>
          </div>
        )}

        {/* English gloss, or a bilingual placeholder when the corpus has none */}
        <div className="pt-2 border-t border-line">
          {word.gloss ? (
            <p className="text-muted italic break-words">"{word.gloss}"</p>
          ) : (
            <ComingSoon {...MEANING_SOON} />
          )}
        </div>
      </div>
    </div>
  )
}
