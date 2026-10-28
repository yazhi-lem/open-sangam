/**
 * Footer — global responsive footer with quick navigation links, corpus statistics, and keyboard shortcut tips.
 */
import { Link } from 'react-router-dom'
import useAppStore from '../../store/useAppStore'
import lockupColour from '../../assets/brand/lockup-colour.svg'
import lockupReversed from '../../assets/brand/lockup-reversed.svg'

export default function Footer() {
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen)
  const language = useAppStore((s) => s.language)
  const L = (ta, en) => (language === 'ta' ? ta : en)

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
            <p className={`text-accent font-medium text-base ${language === 'ta' ? 'tamil' : ''}`}>{L('தமிழ் தமிழரின் உயிர்', 'Tamil is the life of Tamils')}</p>
            <p className="text-muted text-xs leading-relaxed max-w-md">
              {L('2,500 ஆண்டு பழமையான செவ்வியல் தமிழ்க் கவிதைக்கான திறந்த மின்னணு கட்டமைப்பு. அடுக்கு மொழிபெயர்ப்புகள், சொற்பொருள் விளக்கங்கள், திணை நிலங்கள்.', 'An open digital architecture for 2,500-year-old classical Tamil poetry. Explore layered translations, word glosses and tiṇai landscapes.')}
            </p>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-faint">{L('நூலகம்', 'Explore Corpus')}</p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/book" className="inline-flex min-h-[44px] items-center text-muted hover:text-accent transition-colors">
                  {L('நூலகம்', 'Library')}
                </Link>
              </li>
              <li>
                <Link to="/world" className="inline-flex min-h-[44px] items-center text-muted hover:text-accent transition-colors">
                  {L('சங்க உலகம்', 'Sangam World')}
                </Link>
              </li>
              <li>
              </li>
              <li>
              </li>
              <li>
                <Link to="/scholars" className="inline-flex min-h-[44px] items-center text-muted hover:text-accent transition-colors">
                  {L('உங்கள் உதவி', 'Help us review')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Shortcuts */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-faint">{L('குறுக்குவழிகள் & தரவு', 'Shortcuts & Data')}</p>
            <div className="space-y-2 text-xs text-muted">
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                className="flex min-h-[44px] items-center gap-2 text-muted hover:text-accent transition-colors text-left"
              >
                <span>{L('தேடல்', 'Search Corpus')}</span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-surface border border-line rounded">⌘K</kbd>
              </button>
              <p className="text-faint leading-relaxed">
                {L('மூலம்', 'Source')}: sangathamizh.com<br />
                {L('உரிமம்', 'License')}: Creative Commons CC0 1.0 Universal
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-faint">
          <p>
            © {new Date().getFullYear()} Open Sangam Project • {L('வரைவு · அறிஞர் சரிபார்க்கவில்லை', 'Draft · not yet scholar-verified')} • Part of the{' '}
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
            <span>{L('மேலே செல்', 'Back to top')}</span>
            <span>↑</span>
          </button>
        </div>
      </div>
    </footer>
  )
}
