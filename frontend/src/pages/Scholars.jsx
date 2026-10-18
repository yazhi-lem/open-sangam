import { useState } from 'react'
import { Link } from 'react-router-dom'
import Input from '../components/ui/Input'

// "உங்கள் உதவி" — scholars who want to help review. UI only: the form is deliberately NOT
// wired to any store or backend (data-in-India gate), and submit stays disabled until it is.
// All Tamil on this page is a DRAFT pending native review (†); the consent line also needs
// lawyer review before any real submission is accepted.

const HELP_OPTIONS = [
  { id: 'verse', ta: 'மூலப் பாடலைச் சரிபார்க்க', en: 'Check the original verse' },
  { id: 'urai', ta: 'இன்றைய தமிழ் உரையைச் சரிபார்க்க', en: 'Review the modern Tamil commentary' },
  { id: 'english', ta: 'ஆங்கில மொழிபெயர்ப்பைச் சரிபார்க்க', en: 'Review the English translation' },
  { id: 'other', ta: 'வேறு வகையில்', en: 'Another way' },
]

const CONSENT = {
  ta: 'உங்கள் பெயரும் தொடர்புத் தகவலும் திறந்த சங்கத்தின் மதிப்பாய்வுப் பணிக்கு மட்டுமே பயன்படுத்தப்படும்; இந்தியாவிலேயே சேமிக்கப்படும்; எப்போது வேண்டுமானாலும் விலகலாம்.',
  en: 'Your name and contact details will be used only for Open Sangam review work, stored in India, and you can withdraw at any time.',
}

export default function Scholars() {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [help, setHelp] = useState('verse')

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <header className="space-y-1">
        <h1 lang="ta" className="tamil text-3xl font-extrabold text-primary">உங்கள் உதவி</h1>
        <p className="text-lg text-muted">Help us review</p>
        <p className="pt-2 text-sm text-muted">
          <span lang="ta" className="tamil">வரைவு உரைகளையும் மொழிபெயர்ப்புகளையும் அறிஞர்கள் சரிபார்க்க வேண்டும்.</span>
          <span> · Scholars need to check the draft commentary and translations.</span>
        </p>
      </header>

      {/* No onSubmit, no action, no network: this form is a preview of the final one. */}
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()} noValidate>
        <label className="block space-y-1.5">
          <span className="block text-sm font-semibold text-primary">
            <span lang="ta" className="tamil">பெயர்</span> · Name
          </span>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </label>

        <label className="block space-y-1.5">
          <span className="block text-sm font-semibold text-primary">
            <span lang="ta" className="tamil">தொடர்பு</span> · Contact (email or phone)
          </span>
          <Input value={contact} onChange={(e) => setContact(e.target.value)} autoComplete="email" />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-primary">
            <span lang="ta" className="tamil">எப்படி உதவலாம்?</span> · How can you help?
          </legend>
          {HELP_OPTIONS.map((o) => (
            <label
              key={o.id}
              className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-2 ${
                help === o.id ? 'border-primary bg-surface-alt' : 'border-line-strong'
              }`}
            >
              <input
                type="radio"
                name="help"
                value={o.id}
                checked={help === o.id}
                onChange={() => setHelp(o.id)}
                className="h-5 w-5 accent-[var(--kumkumam)]"
              />
              <span className="min-w-0">
                <span lang="ta" className="tamil block text-sm font-semibold">{o.ta}</span>
                <span lang="en" className="block text-xs text-muted">{o.en}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <p className="rounded-xl border border-line bg-surface-alt/50 p-4 text-sm text-muted">
          <span lang="ta" className="tamil block">{CONSENT.ta}</span>
          <span lang="en" className="mt-1 block text-xs">{CONSENT.en}</span>
        </p>

        <button
          type="submit"
          disabled
          aria-disabled="true"
          className="flex min-h-[56px] w-full flex-col items-center justify-center rounded-2xl bg-surface-alt px-6 py-2 text-muted opacity-80"
        >
          <span lang="ta" className="tamil text-base font-semibold">விரைவில்</span>
          <span lang="en" className="text-xs">Coming soon · this form does not send anything yet</span>
        </button>
      </form>

      <Link to="/" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-accent">
        ← <span lang="ta" className="tamil ml-1">முகப்பு</span><span> · Home</span>
      </Link>
    </div>
  )
}
