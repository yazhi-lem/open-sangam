import { Link, NavLink } from 'react-router-dom'
import ThemeToggle from '../ui/ThemeToggle'

export default function Navbar() {
  const linkClass = ({ isActive }) =>
    `tamil text-sm font-medium transition-colors ${isActive ? 'text-accent' : 'text-muted hover:text-primary'}`

  return (
    <header className="border-b border-line bg-page/80 backdrop-blur sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-primary font-semibold tracking-wide">
          Open Sangam
        </Link>
        <div className="flex items-center gap-6">
          <NavLink to="/" end className={linkClass} title="Home">முகப்பு</NavLink>
          <NavLink to="/book" className={linkClass} title="Library">நூலகம்</NavLink>
          <NavLink to="/world" className={linkClass} title="Sangam World">சங்க உலகம்</NavLink>
          <NavLink to="/knowledge" className={linkClass} title="Knowledge">அறிவு</NavLink>
          <NavLink to="/graph" className={linkClass} title="Graph">வரைபடம்</NavLink>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
