import { Link } from 'react-router-dom'
import Card from '../components/ui/Card'

// Home has one job: get a reader into a poem. One primary action, one featured poem,
// two small side doors (scholars, developers). Tamil first, English second.
// All Tamil strings on this page are DRAFTS pending native-reviewer sign-off (†).

const REPO_URL = 'https://github.com/yazhi-lem/open-sangam'

function Bilingual({ ta, en, taClass = '', enClass = '' }) {
  return (
    <>
      <span lang="ta" className={`tamil block ${taClass}`}>{ta}</span>
      <span lang="en" className={`block ${enClass}`}>{en}</span>
    </>
  )
}

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8 sm:px-6 sm:py-14">
      {/* Hook + the one big button */}
      <section className="space-y-5 text-center">
        <h1 className="space-y-2">
          <span lang="ta" className="tamil block text-2xl font-bold leading-snug text-primary sm:text-4xl">
            சங்க இலக்கியம் — எல்லோருக்குமான பொதுச் சொத்து
          </span>
          <span lang="en" className="block text-base font-normal text-muted sm:text-xl">
            Sangam literature, held in common
          </span>
        </h1>

        <Link
          to="/book"
          className="mx-auto flex min-h-[64px] w-full max-w-sm flex-col items-center justify-center rounded-2xl bg-[var(--kumkumam)] px-6 py-3 text-white shadow-md transition-colors hover:bg-[#9a2a19] focus-ring"
        >
          <Bilingual ta="இப்போதே படிக்கலாம்" en="Read now" taClass="text-lg font-bold" enClass="text-sm opacity-90" />
        </Link>

        <p className="text-sm text-muted">
          <span lang="ta" className="tamil">பாடலைத் தேர்ந்தெடு → படி → பொருள் அறி</span>
          <span className="text-faint"> · Choose a poem → Read → Understand</span>
        </p>
      </section>

      {/* Featured poem */}
      <Link to="/book/maduraikanchi" className="block focus-ring rounded-2xl">
        <Card variant="interactive" className="space-y-3 p-5">
          <div className="space-y-2">
            <div className="min-w-0">
              <h2 lang="ta" className="tamil text-2xl font-bold text-primary">மதுரைக்காஞ்சி</h2>
              <p lang="en" className="text-sm text-muted">Maduraikanchi</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-1 text-xs text-muted">
              <span lang="ta" className="tamil">விரைவில்</span>
              <span aria-hidden="true">·</span>
              <span lang="en">Coming soon</span>
            </span>
          </div>
          <p className="text-sm font-semibold text-accent">
            <span lang="ta" className="tamil">வரைவைப் படிக்க</span>
            <span> · Read the draft →</span>
          </p>
        </Card>
      </Link>

      {/* Two small side doors */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Link to="/scholars" className="block focus-ring rounded-2xl">
          <Card variant="interactive" className="h-full space-y-1 p-4">
            <p className="text-xs text-faint"><Bilingual ta="அறிஞர்களுக்கு" en="For scholars" /></p>
            <p className="font-semibold text-primary">
              <Bilingual ta="உங்கள் உதவி" en="Help us review" taClass="text-lg" enClass="text-sm font-normal text-muted" />
            </p>
          </Card>
        </Link>

        <Card variant="default" className="h-full space-y-3 p-4">
          <p className="text-xs text-faint"><Bilingual ta="உருவாக்குநர்களுக்கு" en="For developers" /></p>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[44px] items-center justify-center rounded-xl border border-line-strong px-4 text-sm font-semibold text-primary hover:border-primary focus-ring"
          >
            GitHub →
          </a>
        </Card>
      </section>
    </div>
  )
}
