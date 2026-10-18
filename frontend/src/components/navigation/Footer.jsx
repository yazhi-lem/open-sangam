/**
 * Footer — global responsive footer with quick navigation links, corpus statistics, and keyboard shortcut tips.
 */
import { Link } from 'react-router-dom'
import useAppStore from '../../store/useAppStore'
import lockupColour from '../../assets/brand/lockup-colour.svg'
import lockupReversed from '../../assets/brand/lockup-reversed.svg'

export default function Footer() {
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen)

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="border-t border-line bg-surface-alt/40 pt-12 pb-8 text-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Top section: Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & mission */}
          <div className="md:col-span-2 space-y-3">
            <Link to="/" className="inline-flex items-center min-h-[44px]" aria-label="Open Sangam — home">
              <img src={lockupColour} alt="" width="152" height="32" className="h-8 w-auto dark:hidden" />
              <img src={lockupReversed} alt="" width="152" height="32" className="hidden h-8 w-auto dark:block" />
            </Link>
            <p className="tamil text-accent font-medium text-base">தமிழ் தமிழரின் உயிர்</p>
            <p className="text-muted text-xs leading-relaxed max-w-md">
              An open digital architecture for 2,500-year-old classical Tamil poetry. Explore layered interlinear translations, click-to-define root etymologies, and 3D Tiṇai landscapes.
            </p>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-faint">Explore Corpus</p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/book" className="inline-flex min-h-[44px] items-center text-muted hover:text-accent transition-colors">
                  Library (சங்க நூலகம்)
                </Link>
              </li>
              <li>
                <Link to="/world" className="inline-flex min-h-[44px] items-center text-muted hover:text-accent transition-colors">
                  Sangam World (சங்க உலகம்)
                </Link>
              </li>
              <li>
                <Link to="/knowledge" className="inline-flex min-h-[44px] items-center text-muted hover:text-accent transition-colors">
                  Knowledge Base (அறிவு)
                </Link>
              </li>
              <li>
                <Link to="/graph" className="inline-flex min-h-[44px] items-center text-muted hover:text-accent transition-colors">
                  Connections Graph (வரைபடம்)
                </Link>
              </li>
              <li>
                <Link to="/scholars" className="inline-flex min-h-[44px] items-center text-muted hover:text-accent transition-colors">
                  <span lang="ta" className="tamil">உங்கள் உதவி</span>&nbsp;· Help us review
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Shortcuts */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-faint">Shortcuts & Data</p>
            <div className="space-y-2 text-xs text-muted">
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                className="flex min-h-[44px] items-center gap-2 text-muted hover:text-accent transition-colors text-left"
              >
                <span>Search Corpus</span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-surface border border-line rounded">⌘K</kbd>
              </button>
              <p className="text-faint leading-relaxed">
                Source: sangathamizh.com<br />
                License: Creative Commons CC0 1.0 Universal
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-faint">
          <p>
            © {new Date().getFullYear()} Open Sangam Project • <span lang="ta" className="tamil">வரைவு · அறிஞர் சரிபார்க்கவில்லை</span> (Draft · not yet scholar-verified) • Part of the{' '}
            <a
              href="https://yazhi.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-accent transition-colors font-medium"
            >
              Yazhi
            </a>{' '}
            Tamil-tech ecosystem
          </p>

          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-1.5 text-muted hover:text-primary transition-colors focus-ring rounded-lg px-2 py-1"
          >
            <span>Back to top</span>
            <span>↑</span>
          </button>
        </div>
      </div>
    </footer>
  )
}
