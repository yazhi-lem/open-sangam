import { Link, NavLink } from 'react-router-dom'
import ThemeToggle from '../ui/ThemeToggle'

export default function Navbar() {
  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-accent' : 'text-muted hover:text-primary'}`

  return (
    <header className="border-b border-line bg-page/80 backdrop-blur sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="tamil text-xl font-bold text-accent">சங்கம்</span>
          <span className="text-primary font-semibold tracking-wide">Open Sangam</span>
        </Link>
        <div className="flex items-center gap-6">
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          <NavLink to="/book" className={linkClass}>Library</NavLink>
          <NavLink to="/world" className={linkClass}>Sangam World</NavLink>
          <NavLink to="/knowledge" className={linkClass}>Knowledge</NavLink>
          <NavLink to="/graph" className={linkClass}>Graph</NavLink>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
