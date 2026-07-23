/**
 * Footer — global responsive footer with quick navigation links, corpus statistics,
 * keyboard shortcut tips, and open-source attribution.
 */
import { Link } from 'react-router-dom'
import useAppStore from '../../store/useAppStore'

export default function Footer() {
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen)

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <footer className="border-t border-line bg-surface-alt/30 pt-12 pb-8 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">

        {/* Top section: responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* Brand & mission */}
          <div className="sm:col-span-2 space-y-3">
            <Link to="/" className="inline-flex items-center gap-2.5 text-primary font-bold">
              <span className="text-xl" aria-hidden="true">🏛️</span>
              <div className="flex flex-col leading-none gap-0.5">
                <span className="text-sm font-bold tracking-tight">Open Sangam</span>
                <span className="tamil text-[9px] text-accent font-semibold tracking-widest">திறந்த சங்கம்</span>
              </div>
            </Link>
            <p className="tamil text-accent font-medium text-sm">தமிழ் தமிழரின் உயிர்</p>
            <p className="text-muted text-xs leading-relaxed max-w-sm">
              An open digital architecture for 2,000-year-old classical Tamil poetry.
              Explore layered interlinear translations, click-to-define root etymologies,
              and immersive 3D Tiṇai landscapes.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://github.com/open-sangam"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors font-medium"
                aria-label="Open Sangam on GitHub"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
                GitHub
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-faint">
              Explore Corpus
            </p>
            <ul className="space-y-2 text-xs">
              {[
                { to: '/book',      label: 'Library',       ta: 'சங்க நூலகம்' },
                { to: '/world',     label: 'Sangam World',  ta: 'சங்க உலகம்' },
                { to: '/knowledge', label: 'Knowledge Base', ta: 'அறிவு' },
                { to: '/graph',     label: 'Graph Explorer', ta: 'வரைபடம்' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="group flex items-center gap-1.5 text-muted hover:text-accent transition-colors"
                  >
                    <span className="w-3.5 h-px bg-line-strong group-hover:bg-accent/60 transition-colors shrink-0" />
                    <span>
                      {link.label}
                      <span className="tamil text-faint ml-1 text-[10px]">({link.ta})</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Shortcuts & Data */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-faint">
              Shortcuts & Data
            </p>
            <div className="space-y-3 text-xs text-muted">
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                className="flex items-center gap-2 hover:text-accent transition-colors text-left group"
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <span className="group-hover:underline underline-offset-2">Search Corpus</span>
                <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-surface border border-line rounded ml-auto">
                  ⌘K
                </kbd>
              </button>

              <div className="pt-1 space-y-1 text-faint text-[11px] leading-relaxed">
                <p>Source: sangathamizh.com</p>
                <p>License: CC0 1.0 Universal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-faint">
          <p>© {new Date().getFullYear()} Open Sangam · Scholar-verified classical Tamil digital corpus</p>

          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-1.5 text-muted hover:text-accent transition-colors focus-ring rounded-lg px-2 py-1 group"
            aria-label="Scroll back to top"
          >
            <span className="group-hover:underline underline-offset-2">Back to top</span>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M18 15l-6-6-6 6"/>
            </svg>
          </button>
        </div>
      </div>
    </footer>
  )
}
