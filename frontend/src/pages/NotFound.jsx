import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Reveal from '../components/motion/Reveal'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-4 py-16 text-center">
      <Reveal y={-16}>
        <Card variant="glass" className="p-8 sm:p-12 max-w-md space-y-6 border-accent/20 shadow-xl">
          <p className="tamil text-7xl font-bold text-accent">இல்லை</p>
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-primary">404 · Page Not Found</h1>
            <p className="text-muted text-sm leading-relaxed">
              "இல்லை" (Illai) — The verse or path you seek has yet to be composed in this corpus.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/">
              <Button size="md" icon="🏠">Return Home</Button>
            </Link>
            <Link to="/book">
              <Button size="md" variant="outline" icon="📖">Browse Library</Button>
            </Link>
          </div>
        </Card>
      </Reveal>
    </div>
  )
}
