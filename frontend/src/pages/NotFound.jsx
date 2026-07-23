import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import Reveal from '../components/motion/Reveal'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-16 text-center">
      <Reveal y={-20} duration={0.6}>
        <div className="max-w-lg space-y-8">
          {/* Tamil 404 display */}
          <div className="space-y-2">
            <p
              className="tamil text-8xl sm:text-9xl font-extrabold text-accent/20 leading-none select-none"
              aria-hidden="true"
            >
              இல்லை
            </p>
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-primary">
                404 · Not Found
              </h1>
              <p className="text-muted text-sm">
                <span className="italic">"இல்லை" (Illai)</span> — The verse or path
                you seek has yet to be composed in this corpus.
              </p>
            </div>
          </div>

          {/* Decorative verse fragment */}
          <div className="glass-panel rounded-2xl px-6 py-5 text-left space-y-3 border border-accent/15">
            <p className="text-[10px] font-bold uppercase tracking-widest text-faint">
              A Verse for the Lost Wanderer
            </p>
            <blockquote className="tamil-verse text-lg sm:text-xl text-primary/90 leading-relaxed">
              "யாதும் ஊரே யாவரும் கேளிர்"
            </blockquote>
            <p className="text-xs text-muted italic leading-relaxed">
              "Every town is my hometown; every person is my kin."
              <br />
              <span className="text-faint not-italic">— புறநானூறு 192 · கணியன் பூங்குன்றனார்</span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/">
              <Button size="md" icon="🏠">Return Home</Button>
            </Link>
            <Link to="/book">
              <Button size="md" variant="outline" icon="📖">Browse Library</Button>
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  )
}
