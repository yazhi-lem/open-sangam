/**
 * readerStrings.js — Tamil/English placeholder strings for slots that have no content yet.
 *
 * Tamil text is from Kabilar (Tamil quality authority), pending a human scholar's sign-off (†).
 * Two separate slots, two strings: a translation is மொழிபெயர்ப்பு, a one-word English meaning
 * is பொருள். Never use 'உரை' (commentary) for either.
 */
export const TRANSLATION_SOON = {
  ta: 'ஆங்கில மொழிபெயர்ப்பு விரைவில்',
  en: 'English translation coming soon',
}

export const MEANING_SOON = {
  ta: 'ஆங்கிலப் பொருள் விரைவில்',
  en: 'English meaning coming soon',
}

/**
 * Pill on an Avai answer whose cited quote was matched to corpus text by a program. It says only
 * that the quote was compared, never that anything is verified. Tamil from Kabilar, † pending a
 * human scholar. One ' · ' separator.
 */
export const QUOTE_MATCHED = {
  ta: 'மேற்கோள் பாடலுடன் ஒப்பிடப்பட்டது',
  en: 'Quote matched to corpus text',
}
