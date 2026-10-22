/**
 * Navbar — accessible, bilingual header navigation bar with global search trigger.
 */
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { House, BookOpen, Globe, Brain, Map, FileText, Users } from 'lucide-react'
import lockupColour from '../../assets/brand/lockup-colour.svg'
import lockupReversed from '../../assets/brand/lockup-reversed.svg'
import ThemeToggle from '../ui/ThemeToggle'
import useAppStore from '../../store/useAppStore'

const NAV_ICON_PROPS = { size: 14, strokeWidth: 1.75, 'aria-hidden': true }

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen)

  const links = [
    { to: '/', end: true, labelTa: 'முகப்பு', labelEn: 'Home', Icon: House },
    { to: '/book', labelTa: 'நூலகம்', labelEn: 'Library', Icon: BookOpen },
    { to: '/avai', labelTa: 'சங்க அவை', labelEn: 'Avai', Icon: Users },
    { to: '/world', labelTa: 'சங்க உலகம்', labelEn: 'Sangam World', Icon: Globe },
    { to: '/knowledge', labelTa: 'அறிவு', labelEn: 'Knowledge', Icon: Brain },
    { to: '/graph', labelTa: 'வரைபடம்', labelEn: 'Graph', Icon: Map },
    { to: '/articles', labelTa: 'கட்டுரைகள்', labelEn: 'Articles', Icon: FileText },
  ]

  const linkClass = ({ isActive }) =>
    `relative flex min-h-[44px] items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all focus-ring ${
      isActive
        ? 'text-accent bg-accent/10 font-semibold'
        : 'text-muted hover:text-primary hover:bg-surface-alt/60'
    }`

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-page/80 backdrop-blur-md transition-colors">
      <nav className="w-full px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand logo: Z1 ழ mark + Latin "Open Sangam" wordmark (brand kit v0.3). The wordmark
            is outlined SVG, so the alt text carries the name; no Tamil name in the header. */}
        <Link
          to="/"
          className="flex shrink-0 items-center min-h-[44px] focus-ring rounded-lg px-1"
          aria-label="Open Sangam — முகப்பு"
        >
          <img src={lockupColour} alt="" width="152" height="32" className="h-8 w-auto dark:hidden" />
          <img src={lockupReversed} alt="" width="152" height="32" className="hidden h-8 w-auto dark:block" />
        </Link>

        {/* Desktop links */}
        <div className="hidden xl:flex shrink-0 items-center gap-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {/* Icons only once there's room; at xl the seven Tamil labels alone fill the bar. */}
              <l.Icon {...NAV_ICON_PROPS} className="hidden shrink-0 min-[1700px]:block" />
              <span className="tamil text-sm">{l.labelTa}</span>
            </NavLink>
          ))}
        </div>

        {/* Search trigger & controls */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {/* Quick Search Button */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="flex h-11 min-w-[44px] items-center justify-center gap-2 whitespace-nowrap px-3 rounded-xl border border-line bg-surface-alt/60 text-muted hover:text-primary hover:border-line-strong transition-all focus-ring text-xs"
            aria-label="தேடல் பலகையைத் திறக்க"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <span className="hidden sm:inline xl:hidden font-medium tamil">தேடல்</span>
            <span className="hidden min-[1700px]:inline font-medium tamil">சங்க இலக்கியத் தேடல்...</span>
            <kbd className="hidden min-[1700px]:inline-block px-1.5 py-0.5 text-[10px] font-mono text-faint bg-surface border border-line rounded">
              ⌘K
            </kbd>
          </button>

          <ThemeToggle />

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="xl:hidden flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:text-primary hover:bg-surface-alt focus-ring transition-colors"
            aria-label={mobileOpen ? 'பட்டியலை மூட' : 'பட்டியலைத் திறக்க'}
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
        <div className="xl:hidden max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-surface px-4 py-4 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={linkClass}
              onClick={() => setMobileOpen(false)}
            >
              <l.Icon {...NAV_ICON_PROPS} className="shrink-0" />
              <span className="min-w-0">
                <span lang="ta" className="tamil block text-base font-semibold">{l.labelTa}</span>
                <span lang="en" className="block text-xs font-normal text-faint">{l.labelEn}</span>
              </span>
            </NavLink>
          ))}
        </div>
      )}
    </header>
  )
}