/**
 * ComingSoon — bilingual empty state for a slot with no content yet (Tamil first, English second).
 * Pass TRANSLATION_SOON or MEANING_SOON from data/readerStrings.js.
 */
export default function ComingSoon({ ta, en }) {
  return (
    <p className="text-sm text-faint italic">
      <span lang="ta" className="tamil" data-draft-string>{ta}</span>
      <span aria-hidden="true"> · </span>
      <span lang="en">{en}</span>
    </p>
  )
}
