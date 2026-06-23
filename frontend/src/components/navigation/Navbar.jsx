import { Link, NavLink } from 'react-router-dom'

export default function Navbar() {
  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-yellow-400' : 'text-stone-300 hover:text-white'}`

  return (
    <header className="border-b border-stone-800 bg-stone-950/80 backdrop-blur sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="tamil text-xl font-bold text-yellow-400">சங்கம்</span>
          <span className="text-white font-semibold tracking-wide">Open Sangam</span>
        </Link>
        <div className="flex items-center gap-6">
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          <NavLink to="/book" className={linkClass}>Book</NavLink>
          <NavLink to="/reader" className={linkClass}>Reader</NavLink>
          <NavLink to="/world" className={linkClass}>Sangam World</NavLink>
        </div>
      </nav>
    </header>
  )
}
