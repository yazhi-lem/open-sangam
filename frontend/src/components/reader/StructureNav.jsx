import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import { groupSections, sectionKindLabel } from '../../data/structure.js'

/**
 * Grouped book → chapter navigator for structural works (sutras, cantos,
 * pathigams). Falls back gracefully: records without a `structure` object land
 * in a single unnamed book/chapter.
 */
export default function StructureNav({ sections, activeId, onSelect, kind = 'sutra' }) {
  const language = useAppStore((s) => s.language)
  const tree = groupSections(sections)
  const [collapsed, setCollapsed] = useState(() => new Set())

  const toggle = (key) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const unit = sectionKindLabel(kind, language)

  return (
    <nav className="flex-1 overflow-y-auto py-1" aria-label="Work structure">
      {tree.map((book, bi) => {
        const bookKey = `book-${bi}`
        const bookClosed = collapsed.has(bookKey)
        return (
          <div key={bookKey}>
            {book.book && (
              <button
                type="button"
                onClick={() => toggle(bookKey)}
                aria-expanded={!bookClosed}
                className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-xs font-bold text-primary hover:bg-surface-alt/60 focus-ring"
              >
                {bookClosed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                <span className="tamil flex-1 truncate">{book.book}</span>
                <span className="font-mono text-[10px] text-faint">{book.count}</span>
              </button>
            )}
            {!bookClosed &&
              book.chapters.map((chapter, ci) => {
                const chapterKey = `${bookKey}-ch-${ci}`
                const chapterClosed = collapsed.has(chapterKey)
                return (
                  <div key={chapterKey}>
                    {chapter.title && (
                      <button
                        type="button"
                        onClick={() => toggle(chapterKey)}
                        aria-expanded={!chapterClosed}
                        className="flex w-full items-center gap-1.5 py-1.5 pl-6 pr-3 text-left text-[11px] font-semibold text-muted hover:bg-surface-alt/60 focus-ring"
                      >
                        {chapterClosed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                        <span className="tamil flex-1 truncate">{chapter.title}</span>
                        <span className="font-mono text-[10px] text-faint">{chapter.items.length}</span>
                      </button>
                    )}
                    {!chapterClosed &&
                      chapter.items.map((item) => {
                        const isActive = item.id === activeId
                        const n = item.structure?.number ?? item.number ?? item.sectionNumber ?? item.id
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => onSelect(item.id)}
                            aria-current={isActive ? 'true' : undefined}
                            className={`flex w-full min-h-[40px] items-center gap-2 border-l-2 py-2 pl-9 pr-3 text-left text-xs transition-colors focus-ring ${
                              isActive
                                ? 'border-accent bg-accent/10 font-semibold text-primary'
                                : 'border-transparent text-muted hover:bg-surface-alt/60 hover:text-primary'
                            }`}
                          >
                            <span className="w-6 shrink-0 text-right font-mono text-[10px] text-faint">{n}</span>
                            <span className="tamil truncate">
                              {item.title || item.heading || `${unit} ${n}`}
                            </span>
                          </button>
                        )
                      })}
                  </div>
                )
              })}
          </div>
        )
      })}
    </nav>
  )
}
