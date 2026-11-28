/**
 * FloatingAvai — the persistent சங்க அவை launcher that follows the reader
 * across the app.
 *
 * The bubble shows the supplied Open Sangam logo file exactly as it is
 * (`public/brand/avai-logo.png`): it is never recoloured, redrawn, re-cropped
 * or re-typeset. The disc behind it is painted with the artwork's own
 * background colour (#0d0b09), so the square edges dissolve into the circle
 * and every original pixel of the cream mark survives untouched. The lavender
 * glow lives outside the disc as a shadow, so it cannot alter the artwork.
 *
 * The panel talks to the deployed Avai backend through the same
 * `askAvaiAgent` client the full /avai page uses — no second transport, no
 * second prompt contract.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Send, X } from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import LanguageText from '../ui/LanguageText'
import Markdown from '../ui/Markdown'
import { askAvaiAgent } from '../../services/avaiService'

const LOGO_SRC = '/brand/avai-logo.png'

const SUGGESTIONS = [
  { ta: 'முல்லைத் திணைப் பாடல்களைத் தேடுக', en: 'Find verses about the Mullai landscape' },
  { ta: 'குறுந்தொகை 40 பாடலை விளக்குக', en: 'Explain Kurunthokai 40' },
  { ta: 'சங்க கால மகளிர் நிலை என்ன?', en: 'Status of women in the Sangam era' },
]

const COPY = {
  ta: {
    label: 'சங்க அவையுடன் உரையாடு',
    close: 'உரையாடலை மூடு',
    title: 'சங்க அவை',
    fullPage: 'முழுப் பக்கத்தைத் திற',
    greeting: 'வணக்கம். சங்கப் பாடல்கள், புலவர்கள், திணைகள் பற்றி என்னிடம் கேளுங்கள்.',
    placeholder: 'உங்கள் வினாவை எழுதுங்கள்…',
    send: 'வினவு',
    thinking: 'அவை சிந்திக்கிறது…',
    offline:
      'சங்க அவை இப்போது பதிலளிக்க இயலவில்லை. சிறிது நேரம் கழித்து மீண்டும் வினவுங்கள்.',
    hint: 'Enter — வினவு · Shift + Enter — புதிய வரி',
  },
  en: {
    label: 'Chat with the Sangam Avai',
    close: 'Close the chat',
    title: 'Sangam Avai',
    fullPage: 'Open the full page',
    greeting: 'Ask me about Sangam verses, poets, or tiṇai landscapes.',
    placeholder: 'Write your question…',
    send: 'Ask',
    thinking: 'The Avai is thinking…',
    offline: 'Sangam Avai could not answer just now. Please try again in a minute.',
    hint: 'Enter — ask · Shift + Enter — new line',
  },
}

let messageSeq = 0
function nextMessageId(prefix) {
  messageSeq += 1
  return `${prefix}_${messageSeq}`
}

export default function FloatingAvai() {
  const language = useAppStore((s) => s.language)
  const isTa = language === 'ta'
  const copy = isTa ? COPY.ta : COPY.en

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)

  const fabRef = useRef(null)
  const inputRef = useRef(null)
  const logRef = useRef(null)

  const closePanel = useCallback(() => {
    setOpen(false)
    fabRef.current?.focus()
  }, [])

  // Escape closes the panel and hands focus back to the bubble it came from.
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      closePanel()
    }
    window.addEventListener('keydown', onKeyDown)
    const focusId = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.clearTimeout(focusId)
    }
  }, [open, closePanel])

  // Keep the newest turn in view without scrolling the page behind the panel.
  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [messages, isLoading])

  const send = useCallback(
    async (rawText) => {
      const text = (rawText ?? input).trim()
      if (!text || isLoading) return
      setMessages((prev) => [...prev, { id: nextMessageId('user'), role: 'user', text }])
      setInput('')
      setIsLoading(true)
      try {
        const response = await askAvaiAgent({ message: text, sessionId, context: {} })
        if (response?.session_id) setSessionId(response.session_id)
        setMessages((prev) => [
          ...prev,
          {
            id: nextMessageId('avai'),
            role: 'avai',
            text: response?.response_text || copy.offline,
            citations: response?.citations || [],
            isFallback: Boolean(response?.isFallback),
          },
        ])
      } catch {
        setMessages((prev) => [
          ...prev,
          { id: nextMessageId('avai'), role: 'avai', text: copy.offline, citations: [], isFallback: true },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [input, isLoading, sessionId, copy.offline],
  )

  const onInputKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send()
    }
  }

  return (
    <div className="avai-assistant fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {open && (
        <section
          role="dialog"
          aria-label={copy.title}
          className="avai-panel glass-panel flex w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-line-strong shadow-lg"
        >
          <header className="flex items-center gap-2.5 border-b border-line px-3 py-2.5">
            <span className="avai-mark-disc flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full">
              <img src={LOGO_SRC} alt="" width="26" height="26" draggable="false" className="h-[26px] w-[26px]" />
            </span>
            <LanguageText
              as="h2"
              ta={COPY.ta.title}
              en={COPY.en.title}
              className="flex-1 text-sm font-semibold text-primary"
            />
            <Link
              to="/avai"
              onClick={closePanel}
              aria-label={copy.fullPage}
              title={copy.fullPage}
              className="rounded-lg p-1.5 text-muted hover:bg-surface-alt hover:text-accent-strong focus-ring"
            >
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={closePanel}
              aria-label={copy.close}
              className="rounded-lg p-1.5 text-muted hover:bg-surface-alt hover:text-primary focus-ring"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </header>

          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-label={copy.title}
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-3"
          >
            {messages.length === 0 ? (
              <div className="space-y-3">
                <LanguageText
                  as="p"
                  ta={COPY.ta.greeting}
                  en={COPY.en.greeting}
                  className="text-xs leading-relaxed text-muted"
                />
                <ul className="space-y-1.5">
                  {SUGGESTIONS.map((suggestion) => (
                    <li key={suggestion.en}>
                      <button
                        type="button"
                        onClick={() => send(isTa ? suggestion.ta : suggestion.en)}
                        className="w-full rounded-xl border border-line bg-surface px-2.5 py-2 text-left text-xs leading-snug text-muted transition-colors hover:border-accent/60 hover:text-accent-strong focus-ring"
                      >
                        <LanguageText ta={suggestion.ta} en={suggestion.en} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              messages.map((message) =>
                message.role === 'user' ? (
                  <p
                    key={message.id}
                    className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-3 py-2 text-xs leading-relaxed text-on-accent"
                  >
                    <span className="whitespace-pre-wrap break-words">{message.text}</span>
                  </p>
                ) : (
                  <div key={message.id} className="flex max-w-[92%] gap-2">
                    <span className="avai-mark-disc mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full">
                      <img src={LOGO_SRC} alt="" width="20" height="20" draggable="false" className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-line bg-surface px-3 py-2">
                      <Markdown text={message.text} className="text-xs leading-relaxed" />
                      {message.citations.length > 0 && (
                        <ul className="mt-2 space-y-0.5 border-t border-line pt-1.5 text-[11px] text-faint">
                          {message.citations.slice(0, 3).map((citation, index) => (
                            <li key={`${message.id}_${index}`} className="truncate">
                              {citation.poem_id || citation.source || citation.text || ''}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ),
              )
            )}

            {isLoading && (
              <p className="flex items-center gap-1.5 text-[11px] text-faint">
                <span className="avai-typing-dot" aria-hidden="true" />
                <span className="avai-typing-dot" aria-hidden="true" />
                <span className="avai-typing-dot" aria-hidden="true" />
                <LanguageText ta={COPY.ta.thinking} en={COPY.en.thinking} className="ml-1" />
              </p>
            )}
          </div>

          <div className="border-t border-line px-3 py-2.5">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder={copy.placeholder}
                aria-label={copy.placeholder}
                className="max-h-24 min-h-9 flex-1 resize-none rounded-xl border border-line bg-surface px-2.5 py-2 text-xs leading-relaxed text-primary placeholder:text-faint focus-ring"
              />
              <button
                type="button"
                onClick={() => send()}
                disabled={isLoading || !input.trim()}
                aria-label={copy.send}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-on-accent transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus-ring"
              >
                <Send size={15} aria-hidden="true" />
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-faint">{copy.hint}</p>
          </div>
        </section>
      )}

      <button
        ref={fabRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={open ? copy.close : copy.label}
        title={copy.label}
        className="avai-fab avai-fab-disc flex h-14 w-14 items-center justify-center rounded-full focus-ring"
      >
        {/* The supplied logo file, displayed at its own aspect ratio — never
            recoloured, never redrawn, never cropped. */}
        <img
          src={LOGO_SRC}
          alt=""
          width="46"
          height="46"
          draggable="false"
          className="h-[46px] w-[46px] select-none"
        />
      </button>
    </div>
  )
}
