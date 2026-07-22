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

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false)
      }}
    >
      <div className="w-full max-w-xl rounded-2xl border border-line-strong bg-surface shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150">
        {/* Search header */}
        <div className="flex items-center px-4 border-b border-line bg-surface-alt/50 gap-3">
          <span className="text-muted text-lg">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search poems, verses, landscapes, or topics..."
            className="w-full h-14 bg-transparent text-primary placeholder:text-faint focus:outline-none text-base font-medium"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-medium text-faint bg-surface border border-line rounded shadow-xs">
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {items.length === 0 ? (
            <div className="py-12 text-center text-muted space-y-2">
              <p className="text-2xl">🔍</p>
              <p className="text-sm font-medium">No results found for "{query}"</p>
              <p className="text-xs text-faint">Try searching for "Kurunthokai", "Kurinji", or "Akam"</p>
            </div>
          ) : (
            items.map((item, index) => {
              const isSelected = index === selectedIndex
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action()
                    setOpen(false)
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                    isSelected
                      ? 'bg-accent/15 border border-accent/30 text-primary'
                      : 'text-muted hover:text-primary hover:bg-surface-alt/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl shrink-0" aria-hidden="true">{item.icon}</span>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${isSelected ? 'text-accent' : 'text-primary'}`}>
                        {item.title}
                      </p>
                      <p className="text-xs text-faint truncate">{item.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-faint px-2 py-0.5 rounded bg-surface border border-line shrink-0">
                    {item.category}
                  </span>
                </button>
              )
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2.5 border-t border-line bg-surface-alt/40 flex items-center justify-between text-xs text-faint">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 py-0.5 text-[10px] bg-surface border border-line rounded">↑↓</kbd> navigate</span>
            <span><kbd className="px-1 py-0.5 text-[10px] bg-surface border border-line rounded">↵</kbd> select</span>
          </div>
          <span>Open Sangam Command Center</span>
        </div>
      </div>
    </div>
  )
}
