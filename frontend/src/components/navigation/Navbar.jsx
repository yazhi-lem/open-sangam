/**
 * Navbar — accessible, bilingual header navigation bar with global search trigger.
 */
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import ThemeToggle from '../ui/ThemeToggle'
import useAppStore from '../../store/useAppStore'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen)

  const links = [
    { to: '/', end: true, label: 'முகப்பு', title: 'Home' },
    { to: '/book', label: 'நூலகம்', title: 'Library' },
    { to: '/world', label: 'சங்க உலகம்', title: 'Sangam World' },
    { to: '/knowledge', label: 'அறிவு', title: 'Knowledge' },
    { to: '/graph', label: 'வரைபடம்', title: 'Graph' },
    { to: '/articles', label: 'கட்டுரைகள்', title: 'Articles' },
  ]

  const linkClass = ({ isActive }) =>
    `relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all focus-ring ${
      isActive
        ? 'text-accent bg-accent/10 font-semibold'
        : 'text-muted hover:text-primary hover:bg-surface-alt/60'
    }`

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-page/80 backdrop-blur-md transition-colors">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand logo */}
        <Link to="/" className="flex items-center gap-2 text-primary font-bold tracking-tight text-lg focus-ring rounded-lg px-1">
          <span className="text-2xl" aria-hidden="true">🏛️</span>
          <div className="flex flex-col leading-none">
            <span className="text-primary font-semibold">Open Sangam</span>
            <span className="tamil text-[10px] text-accent font-medium tracking-wider">திறந்த சங்கம்</span>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              <span className="tamil text-sm">{l.labelTa}</span>
              <span className="text-[11px] text-faint font-normal">• {l.labelEn}</span>
            </NavLink>
          ))}
        </div>

        {/* Search trigger & controls */}
        <div className="flex items-center gap-2">
          {/* Quick Search Button */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-line bg-surface-alt/60 text-muted hover:text-primary hover:border-line-strong transition-all focus-ring text-xs"
            aria-label="Open command palette search"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <span className="hidden sm:inline font-medium">Search corpus...</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono text-faint bg-surface border border-line rounded">
              ⌘K
            </kbd>
          </button>

          <ThemeToggle />

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl text-muted hover:text-primary hover:bg-surface-alt focus-ring transition-colors"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-line bg-surface px-4 py-4 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={linkClass}
              onClick={() => setMobileOpen(false)}
            >
              <span className="tamil text-base font-semibold">{l.labelTa}</span>
              <span className="text-xs text-faint ml-2">({l.labelEn})</span>
            </NavLink>
          ))}
        </div>
      )}
    </header>
  )
}