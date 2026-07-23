/**
 * Navbar — accessible, bilingual header navigation bar with global search trigger.
 * Scroll-aware: adds shadow + increased opacity when page has been scrolled.
 */

import { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import ThemeToggle from '../ui/ThemeToggle'
import useAppStore from '../../store/useAppStore'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const setCommandPaletteOpen = useAppStore(
    (state) => state.setCommandPaletteOpen
  )

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const closeMobile = () => setMobileOpen(false)

  const links = [
    {
      to: '/',
      end: true,
      labelTa: 'முகப்பு',
      labelEn: 'Home',
    },
    {
      to: '/book',
      labelTa: 'நூலகம்',
      labelEn: 'Library',
    },
    {
      to: '/world',
      labelTa: 'சங்க உலகம்',
      labelEn: 'Sangam World',
    },
    {
      to: '/knowledge',
      labelTa: 'அறிவு',
      labelEn: 'Knowledge',
    },
    {
      to: '/graph',
      labelTa: 'வரைபடம்',
      labelEn: 'Graph',
    },
    {
      to: '/articles',
      labelTa: 'கட்டுரைகள்',
      labelEn: 'Articles',
    },
  ]

  const linkClass = ({ isActive }) =>
    `relative flex flex-col items-center gap-0 px-3 py-2 rounded-lg text-xs font-medium transition-all focus-ring group ${
      isActive
        ? 'text-accent'
        : 'text-muted hover:text-primary'
    }`

  return (
    <>
      <header
        className={[
          'sticky top-0 z-40 border-b transition-all duration-200',
          scrolled
            ? 'border-line bg-page/95 backdrop-blur-md shadow-sm'
            : 'border-transparent bg-page/80 backdrop-blur-sm',
        ].join(' ')}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-primary font-bold tracking-tight focus-ring rounded-lg shrink-0"
          >
            <span
              className="text-xl leading-none"
              aria-hidden="true"
            >
              🏛️
            </span>

            <div className="flex flex-col leading-none gap-0.5">
              <span className="text-sm font-bold text-primary tracking-tight">
                Open Sangam
              </span>

              <span className="tamil text-[9px] text-accent font-semibold tracking-widest leading-none">
                திறந்த சங்கம்
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div
            className="hidden md:flex items-center gap-0.5"
            role="navigation"
            aria-label="Main navigation"
          >
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={linkClass}
                title={link.labelEn}
              >
                {({ isActive }) => (
                  <>
                    <span className="tamil text-xs font-semibold leading-tight">
                      {link.labelTa}
                    </span>

                    <span className="text-[9px] text-faint font-normal leading-tight mt-px">
                      {link.labelEn}
                    </span>

                    <span
                      className={[
                        'absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-accent transition-all duration-200',
                        isActive
                          ? 'w-5 opacity-100'
                          : 'w-0 opacity-0 group-hover:w-3 group-hover:opacity-50',
                      ].join(' ')}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen?.(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-line bg-surface-alt/70 text-faint hover:text-primary hover:border-line-strong hover:bg-surface-alt transition-all focus-ring text-xs"
              aria-label="Open command palette"
            >
              <svg
                viewBox="0 0 24 24"
                width="13"
                height="13"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>

              <span className="font-medium text-[11px]">
                Search...
              </span>

              <kbd className="hidden lg:inline-block px-1 py-0.5 text-[9px] font-mono bg-surface border border-line rounded">
                ⌘K
              </kbd>
            </button>

            {/* Mobile Search */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen?.(true)}
              className="sm:hidden p-2 rounded-lg text-muted hover:text-primary hover:bg-surface-alt focus-ring transition-colors"
              aria-label="Open search"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>

            <ThemeToggle />

            {/* Mobile Menu */}
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-lg text-muted hover:text-primary hover:bg-surface-alt focus-ring transition-colors"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-menu"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                {mobileOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
          onClick={closeMobile}
        />
      )}

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          id="mobile-nav-menu"
          className="md:hidden fixed top-14 inset-x-0 z-40 border-b border-line bg-surface shadow-lg"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={closeMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-accent/10 text-accent font-semibold'
                      : 'text-muted hover:text-primary hover:bg-surface-alt'
                  }`
                }
              >
                <span className="tamil text-sm font-semibold">
                  {link.labelTa}
                </span>

                <span className="text-xs text-faint">
                  {link.labelEn}
                </span>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
