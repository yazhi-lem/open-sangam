/**
 * structure.js — navigation model for works that are not simple verse lists.
 *
 * Sangam anthologies and idylls paginate by verse/section. But the corpus also
 * holds structural works — grammar sutras (Tholkappiyam, Nannul, Iṟaiyanār),
 * epics in cantos (Silappathikaram, Manimekalai) and devotional pathigams
 * (Thevaram, Thiruvasagam). Those need book → chapter → record navigation.
 *
 * A structural record carries:
 *   { structure: { level, book, chapter, number } }
 * Everything here is pure so it can be unit-tested with `node --test`.
 */

/** Navigation granularity for a work. */
export const SECTION_KINDS = {
  verse: { ta: 'பாடல்', en: 'Verse', short: 'verse' },
  sutra: { ta: 'சூத்திரம்', en: 'Sutra', short: 'sutra' },
  canto: { ta: 'காண்டம்', en: 'Canto', short: 'canto' },
  pathigam: { ta: 'பதிகம்', en: 'Pathigam', short: 'pathigam' },
  pasuram: { ta: 'பாசுரம்', en: 'Pasuram', short: 'pasuram' },
}

export function sectionKindLabel(kind, language = 'en') {
  const entry = SECTION_KINDS[kind]
  if (!entry) return SECTION_KINDS.verse[language === 'ta' ? 'ta' : 'en']
  return language === 'ta' ? entry.ta : entry.en
}

/** True when a work should use the grouped (book → chapter) navigator. */
export function isStructural(kind) {
  return typeof kind === 'string' && kind !== 'verse'
}

function chapterTitle(section) {
  return section?.structure?.chapter ?? section?.heading ?? null
}

function bookTitle(section) {
  return section?.structure?.book ?? null
}

/**
 * Group sections into an ordered tree: [{ book, chapters: [{ title, items: [] }] }].
 * Keeps the original order; books/chapters with no title collect under `null`.
 */
export function groupSections(sections = []) {
  const books = new Map()
  for (const section of sections) {
    const book = bookTitle(section)
    const chapter = chapterTitle(section)
    if (!books.has(book)) books.set(book, new Map())
    const chapters = books.get(book)
    if (!chapters.has(chapter)) chapters.set(chapter, [])
    chapters.get(chapter).push(section)
  }
  return [...books.entries()].map(([book, chapters]) => ({
    book,
    chapters: [...chapters.entries()].map(([title, items]) => ({ title, items })),
    count: [...chapters.values()].reduce((n, items) => n + items.length, 0),
  }))
}

/** Breadcrumb text for one section, e.g. "புகர்க்காண்டம் · காட்சிக் காதை · 1". */
export function structureBreadcrumb(section, language = 'en', kind = 'verse') {
  const parts = []
  const book = bookTitle(section)
  const chapter = chapterTitle(section)
  if (book) parts.push(book)
  if (chapter && chapter !== book) parts.push(chapter)
  const number = section?.structure?.number ?? section?.number ?? section?.sectionNumber
  const unit = sectionKindLabel(kind, language)
  if (number != null) parts.push(language === 'ta' ? `${unit} ${number}` : `${unit} ${number}`)
  return parts.join(' · ')
}

/**
 * Flat ordering index used for prev/next when a work is structural:
 * returns a map from section id → { bookIndex, chapterIndex, position }.
 */
export function structureIndex(sections = []) {
  const tree = groupSections(sections)
  const index = new Map()
  tree.forEach((book, bi) => {
    book.chapters.forEach((chapter, ci) => {
      chapter.items.forEach((item, pi) => {
        index.set(item.id, { bookIndex: bi, chapterIndex: ci, position: pi })
      })
    })
  })
  return index
}

/** Given the active section, return its book and chapter in the tree (or null). */
export function locateSection(sections, sectionId) {
  const tree = groupSections(sections)
  for (const book of tree) {
    for (const chapter of book.chapters) {
      if (chapter.items.some((item) => item.id === sectionId)) {
        return { book: book.book, chapter: chapter.title }
      }
    }
  }
  return null
}
