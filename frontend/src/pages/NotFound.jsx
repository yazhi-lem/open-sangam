import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <p className="tamil text-6xl text-faint">இல்லை</p>
      <h1 className="text-3xl font-semibold text-primary">Page Not Found</h1>
      <p className="text-muted">The verse you seek has yet to be written.</p>
      <Link
        to="/"
        className="px-5 py-2.5 rounded-lg bg-accent text-on-accent font-medium hover:bg-accent-strong transition-colors"
      >
        Return Home
      </Link>
    </div>
  )
}
