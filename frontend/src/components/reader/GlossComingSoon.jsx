/**
 * Bilingual empty state (Tamil first, English second) shown where an English
 * gloss or translation has not been written yet. The Gemini drafts that used to
 * fill these slots were removed; see data/reports/gemini-removed-fields.json.
 *
 * DRAFT STRING: the Tamil text is pending native-speaker review.
 */
const GLOSS_COMING_SOON = {
  ta: 'ஆங்கில உரை விரைவில்',
  en: 'English gloss coming soon',
  draft: true,
}

export default function GlossComingSoon({ className = '' }) {
  return (
    <p className={`text-sm text-faint italic ${className}`} data-draft-string="true" role="status">
      <span className="tamil" lang="ta">{GLOSS_COMING_SOON.ta}</span>
      <span aria-hidden="true"> / </span>
      <span lang="en">{GLOSS_COMING_SOON.en}</span>
    </p>
  )
}
