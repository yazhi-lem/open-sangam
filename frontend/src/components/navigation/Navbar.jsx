import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import ThemeToggle from '../ui/ThemeToggle'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const linkClass = ({ isActive }) =>
    `tamil text-sm font-medium transition-colors ${isActive ? 'text-accent' : 'text-muted hover:text-primary'}`

  const links = [
    { to: '/', end: true, label: 'முகப்பு', title: 'Home' },
    { to: '/book', label: 'நூலகம்', title: 'Library' },
    { to: '/world', label: 'சங்க உலகம்', title: 'Sangam World' },
    { to: '/knowledge', label: 'அறிவு', title: 'Knowledge' },
    { to: '/graph', label: 'வரைபடம்', title: 'Graph' },
    { to: '/articles', label: 'கட்டுரைகள்', title: 'Articles' },
  ]

  return (
    <header className="border-b border-line bg-page/80 backdrop-blur sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-primary font-semibold tracking-wide">
          Open Sangam
        </Link>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-6">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass} title={l.title}>
              {l.label}
            </NavLink>
          ))}
          <ThemeToggle />
        </div>

        {/* Mobile controls */}
        <div className="flex sm:hidden items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setOpen(o => !o)}
            className="text-primary text-xl leading-none"
            aria-label="Toggle menu"
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {open && (
        <div className="sm:hidden flex flex-col gap-4 px-4 pb-4 border-t border-line pt-4">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={linkClass}
              title={l.title}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  )
}