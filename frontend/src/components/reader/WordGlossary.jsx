import { useEffect, useId } from 'react'
import { glossaryBadgeLabel, glossaryStatus } from '../../data/readerLayers.js'
import useAppStore from '../../store/useAppStore'

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
  const language = useAppStore((s) => s.language)
  const L = (ta, en) => (language === 'ta' ? ta : en)
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
  const [badgeTa, badgeEn] = badge ? badge.split(' · ') : []
  const badgeText = language === 'ta' ? badgeTa : badgeEn

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
            {badge && (
              <span
                title={
                  status === 'ai-draft'
                    ? `Machine-drafted${model ? ` (${model})` : ''}; not yet reviewed by a Tamil scholar.`
                    : 'Not yet reviewed by a Tamil scholar.'
                }
                className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300"
              >
                <span lang={language} className={language === 'ta' ? 'tamil' : ''}>{badgeText}</span>
              </span>
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
            {L('இந்தச் சொல்லுக்கு இன்னும் சொற்பொருள் பதிவு இல்லை. பதிவுகள் அறிஞர் சரிபார்ப்புக்குப் பின் சேர்க்கப்படும்.', 'No glossary entry for this word yet. Entries are added from the corpus and reviewed by Tamil scholars.')}
          </p>
        )}

        {/* Root */}
        {word.root && (
          <div>
            <p className="text-xs text-faint mb-1">
              {L('வேர்ச்சொல்', 'Root')}
            </p>
            <p lang="ta" className="tamil text-lg text-primary break-words">{word.root}</p>
          </div>
        )}

        {/* Grammatical class */}
        {word.urichol && (
          <div>
            <p className="text-xs text-faint mb-1">
              {L('உரிச்சொல்', 'Class')}
            </p>
            <p lang="ta" className="text-muted tamil break-words">{word.urichol}</p>
          </div>
        )}

        {/* Etymology */}
        {word.etymology && (
          <div>
            <p className="text-xs text-faint mb-1">{L('சொற்பிறப்பு', 'Etymology')}</p>
            <p lang="ta" className="text-muted text-sm leading-relaxed tamil break-words">{word.etymology}</p>
          </div>
        )}

        {/* English gloss — only in English mode */}
        {language === 'en' && word.gloss && (
          <div className="pt-2 border-t border-line">
            <p className="text-muted italic break-words">"{word.gloss}"</p>
          </div>
        )}
      </div>
    </div>
  )
}
