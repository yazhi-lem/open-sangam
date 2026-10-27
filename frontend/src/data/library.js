/**
 * library.js — extensible Tamil Library catalog.
 *
 * The Sangam reader (`data/poems.js`) stays the canonical registry for works
 * whose normalized verse JSON is readable today. This module adds the wider
 * library — Pathinenkilkkanakku, classics, and future artifact/document
 * collections — without pretending that a catalog record is readable data.
 *
 * Availability values:
 *   reader   → normalized verse data exists and can open in /book/:id
 *   metadata → catalog record only; no readable corpus yet
 *   planned  → collection placeholder (artifacts, manuscripts, inscriptions)
 */
import catalog from '@data/library/catalog.json'

export const LIBRARY_SCHEMA_VERSION = catalog.schemaVersion
export const LIBRARY_COLLECTIONS = catalog.collections
export const LIBRARY_WORKS = catalog.works
export const LIBRARY_WORK_BY_ID = Object.fromEntries(
  LIBRARY_WORKS.map((work) => [work.id, work])
)

export const AVAILABILITY_LABELS = {
  reader: { ta: 'படிக்கலாம்', en: 'Readable' },
  metadata: { ta: 'பட்டியலில்', en: 'Catalogued' },
  planned: { ta: 'திட்டத்தில்', en: 'Planned' },
}

export function libraryWorksForCollection(collectionId) {
  return LIBRARY_WORKS.filter((work) => work.collection === collectionId)
}

export function workMatchesQuery(work, query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return true
  return [work.ta, work.en, work.author, work.period, work.collection]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q))
}

export function languageLabel(code) {
  return (
    {
      ta: 'தமிழ்',
      en: 'English',
      sa: 'Sanskrit',
      pi: 'Pali',
      translit: 'Transliteration',
    }[code] || code
  )
}
