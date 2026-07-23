/**
 * CommandPalette — global modal search & command shortcut palette (Cmd+K or /).
 * Fast search over Poems, Tiṇai landscapes, Knowledge base topics, and navigation.
 */
import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../../store/useAppStore'
import { POEMS } from '../../data/poems'
import { KNOWLEDGE_SECTIONS } from '../../data/knowledge'
import { TINAI_LIST } from '../../data/tinaiWorld'

export default function CommandPalette() {
  const isOpen = useAppStore((s) => s.commandPaletteOpen)
  const setOpen = useAppStore((s) => s.setCommandPaletteOpen)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const isDark = useAppStore((s) => s.theme === 'dark')

  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef(null)

  // Listen for global shortcut Cmd+K or Ctrl+K or '/'
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(!isOpen)
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault()
        setOpen(true)
      } else if (e.key === 'Escape' && isOpen) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, setOpen])

  // Focus input and reset query when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
        setQuery('')
        setSelectedIndex(0)
      }, 30)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Index items for search
  const items = useMemo(() => {
    const results = []

    // Quick navigation actions
    results.push(
      { id: 'nav-home', category: 'Navigation', title: 'Home · முகப்பு', subtitle: 'Return to landing page', icon: '🏠', action: () => navigate('/') },
      { id: 'nav-book', category: 'Navigation', title: 'Library · சங்க நூலகம்', subtitle: 'Browse 18 classical Tamil collections', icon: '📖', action: () => navigate('/book') },
      { id: 'nav-world', category: 'Navigation', title: 'Sangam World · சங்க உலகம்', subtitle: 'Explore 5 poetic landscapes', icon: '🗺️', action: () => navigate('/world') },
      { id: 'nav-knowledge', category: 'Navigation', title: 'Knowledge Base · அறிவு', subtitle: 'Learn history, metrics, and academy lore', icon: '💡', action: () => navigate('/knowledge') },
      { id: 'nav-graph', category: 'Navigation', title: 'Connections Graph · வரைபடம்', subtitle: 'Interactive ego-network of corpus', icon: '🕸️', action: () => navigate('/graph') },
      { id: 'act-theme', category: 'Actions', title: `Switch Theme to ${isDark ? 'Light Mode' : 'Dark Mode'}`, subtitle: 'Toggle app color palette', icon: isDark ? '☀️' : '🌙', action: () => toggleTheme() }
    )

    // Poems
    POEMS.forEach((p) => {
      results.push({
        id: `poem-${p.id}`,
        category: 'Classical Works',
        title: `${p.ta} (${p.en})`,
        subtitle: `${p.collection === '8thokai' ? 'Eight Anthologies' : 'Ten Idylls'} · ${p.count} ${p.unit}`,
        icon: '📜',
        action: () => navigate(p.available ? `/book/${p.id}` : '/book'),
      })
    })

    // Tiṇai Landscapes
    TINAI_LIST.forEach((t) => {
      results.push({
        id: `tinai-${t.id}`,
        category: 'Landscapes (திணை)',
        title: `${t.ta} (${t.en})`,
        subtitle: t.subEn,
        icon: t.emoji,
        action: () => navigate(`/world?tinai=${t.id}`),
      })
    })

    // Knowledge Sections
    KNOWLEDGE_SECTIONS.forEach((ks) => {
      results.push({
        id: `know-${ks.id}`,
        category: 'Knowledge Topics',
        title: `${ks.ta} — ${ks.en}`,
        subtitle: ks.intro.slice(0, 75) + '…',
        icon: ks.icon,
        action: () => navigate(`/knowledge#${ks.id}`),
      })
    })

    if (!query.trim()) return results

    const q = query.toLowerCase()
    return results.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    )
  }, [query, navigate, isDark, toggleTheme])

  // Handle arrow key navigation
  const handleInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, items.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + items.length) % Math.max(1, items.length))
    } else if (e.key === 'Enter' && items[selectedIndex]) {
      e.preventDefault()
      items[selectedIndex].action()
      setOpen(false)
    }
  }

  if (!isOpen) return null

  // Group items by category when showing all (no query)
  const grouped = query.trim()
    ? null
    : items.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = []
        acc[item.category].push(item)
        return acc
      }, {})

  // Flatten for keyboard index tracking
  const flatItems = query.trim() ? items : Object.values(grouped || {}).flat()


  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false)
      }}
    >
      <div className="w-full max-w-xl rounded-2xl border border-line-strong bg-surface shadow-xl overflow-hidden flex flex-col max-h-[78vh] animate-scale-in">

        {/* Search header */}
        <div className="flex items-center px-4 border-b border-line gap-3">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-faint shrink-0" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search poems, verses, landscapes, or topics…"
            className="w-full h-13 py-3.5 bg-transparent text-primary placeholder:text-faint focus:outline-none text-sm font-medium"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setSelectedIndex(0) }}
              className="shrink-0 p-1 text-faint hover:text-primary rounded-md transition-colors"
              aria-label="Clear search"
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono font-medium text-faint bg-surface-alt border border-line rounded shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {flatItems.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="text-4xl" aria-hidden="true">🔍</div>
              <p className="text-sm font-medium text-muted">No results for "{query}"</p>
              <p className="text-xs text-faint">
                Try: "Kurunthokai", "Kurinji", "Akam", "poet"
              </p>
            </div>
          ) : grouped ? (
            // Grouped view (no query)
            <div className="py-1">
              {Object.entries(grouped).map(([category, catItems]) => (
                <div key={category}>
                  <div className="px-4 py-2 sticky top-0 bg-surface/95 backdrop-blur-sm z-10">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-faint">
                      {category}
                    </p>
                  </div>
                  {catItems.map((item) => {
                    const index = flatItems.indexOf(item)
                    const isSelected = index === selectedIndex
                    return (
                      <CommandItem
                        key={item.id}
                        item={item}
                        isSelected={isSelected}
                        onMouseEnter={() => setSelectedIndex(index)}
                        onClick={() => { item.action(); setOpen(false) }}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          ) : (
            // Flat filtered view
            <div className="p-1.5 space-y-0.5">
              {flatItems.map((item, index) => {
                const isSelected = index === selectedIndex
                return (
                  <CommandItem
                    key={item.id}
                    item={item}
                    isSelected={isSelected}
                    showCategory
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => { item.action(); setOpen(false) }}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-line bg-surface-alt/50 flex items-center justify-between text-[10px] text-faint">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-surface border border-line rounded">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-surface border border-line rounded">↵</kbd>
              select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-surface border border-line rounded">ESC</kbd>
              close
            </span>
          </div>
          <span className="font-medium text-faint">Open Sangam</span>
        </div>
      </div>
    </div>
  )
}

function CommandItem({ item, isSelected, showCategory = false, onMouseEnter, onClick }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={[
        'w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-colors',
        isSelected
          ? 'bg-accent/12 text-primary'
          : 'text-muted hover:text-primary hover:bg-surface-alt/60',
      ].join(' ')}
    >
      <span className="text-lg shrink-0 leading-none" aria-hidden="true">{item.icon}</span>
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-semibold truncate ${isSelected ? 'text-accent' : 'text-primary'}`}>
          {item.title}
        </p>
        <p className="text-[10px] text-faint truncate leading-tight mt-0.5">{item.subtitle}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {showCategory && (
          <span className="text-[9px] font-medium uppercase tracking-wider text-faint px-1.5 py-0.5 rounded bg-surface-alt border border-line hidden sm:inline">
            {item.category}
          </span>
        )}
        {isSelected && (
          <kbd className="text-[9px] font-mono text-faint px-1 py-0.5 bg-surface border border-line rounded">
            ↵
          </kbd>
        )}
      </div>
    </button>
  )
}
