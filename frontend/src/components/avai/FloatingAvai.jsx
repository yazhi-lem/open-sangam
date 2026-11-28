/**
 * FloatingAvai — the floating சங்க அவை council: five specialist Pulavars in
 * one launcher that follows the reader across the app.
 *
 * The bubble shows the supplied Open Sangam logo file exactly as it is
 * (`public/brand/avai-logo.png`): it is never recoloured, redrawn, re-cropped
 * or re-typeset. The disc behind it is painted with the artwork's own
 * background colour (#0d0b09), so the square edges dissolve into the circle
 * and every original pixel of the cream mark survives untouched. The lavender
 * glow lives outside the disc as a shadow, so it cannot alter the artwork.
 *
 * Routing is the backend's, never a frontend guess:
 *   - picking a Pulavar sends `pulavar=<id>` to POST /avai/ask, so the request
 *     runs on that poet's ADK runner (agents/avai/api/app.py);
 *   - picking அவை sends no pulavar at all, so the backend classifies the
 *     message itself (`classify_message`) and answers as whichever specialist
 *     it routes to. The panel then reports the poet the backend actually used.
 * Both paths share `askAvaiAgent`, the same client and prompt contract the
 * /avai page uses, and keep one session id per council mode.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Compass,
  Crown,
  Landmark,
  Palette,
  Quote,
  ScrollText,
  Send,
  Trash2,
  X,
} from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import LanguageText from '../ui/LanguageText'
import Markdown from '../ui/Markdown'
import { PULAVAR_AGENTS } from '../../data/pulavars'
import {
  askAvaiAgent,
  clearSavedChat,
  getSavedChat,
  saveChat,
} from '../../services/avaiService'

const LOGO_SRC = '/brand/avai-logo.png'

/** History lives beside the /avai page's, never on top of it. */
const STORE_SCOPE = 'float'

/** The sixth mode: no pulavar sent, the backend's intent router decides. */
const ASSEMBLY_ID = 'swarm'

/** Council order: the five Pulavars, then the whole assembly. */
const COUNCIL_IDS = ['nakkirar', 'avvaiyar', 'kapilar', 'tholkappiyar', 'paranar', ASSEMBLY_ID]

/**
 * UI-only presentation layer. Names, titles, workflows and suggested prompts
 * all come from `data/pulavars.js` — the single source of truth shared with the
 * /avai page — so no agent is described twice. Deliberately no avatar images or
 * emoji portraits: each Pulavar gets an emblem, never a face.
 */
const PROFILES = {
  nakkirar: { Icon: Crown, roleTa: 'தலைமை வழிகாட்டி', roleEn: 'Chief Literary Guide' },
  avvaiyar: { Icon: BookOpen, roleTa: 'தமிழ் அறிவு வல்லுநர்', roleEn: 'Tamil Knowledge' },
  kapilar: { Icon: Compass, roleTa: 'இலக்கிய ஆய்வுத் தேடல்', roleEn: 'Literary Research' },
  tholkappiyar: { Icon: ScrollText, roleTa: 'இலக்கண வல்லுநர்', roleEn: 'Grammar' },
  paranar: { Icon: Palette, roleTa: 'காட்சி உருவகம்', roleEn: 'Imagery' },
  swarm: { Icon: Landmark, roleTa: 'அனைத்துப் புலவர்கள்', roleEn: 'All Pulavars' },
}

const AGENT_BY_ID = Object.fromEntries(PULAVAR_AGENTS.map((agent) => [agent.id, agent]))

/** Backend `routing_reason` codes (agents/avai/api/app.py) → readable labels. */
const ROUTE_LABELS = {
  explicit_pulavar_selected: { ta: 'நேரடித் தேர்வு', en: 'Direct selection' },
  explicit_workflow_selected: { ta: 'தேர்ந்த பணிப்பாதை', en: 'Chosen workflow' },
  greeting_or_meta: { ta: 'வாழ்த்து / தகவல்', en: 'Greeting or meta' },
  verse_search_intent: { ta: 'பாடல் தேடல்', en: 'Verse search' },
  imagery_intent: { ta: 'காட்சி உருவகம்', en: 'Imagery' },
  grammar_scenario_intent: { ta: 'இலக்கணம்', en: 'Grammar' },
  qa_commentary_intent: { ta: 'விளக்க உரை', en: 'Commentary' },
  default_convener: { ta: 'தலைமைப் புலவர்', en: 'Convener default' },
}

const COPY = {
  ta: {
    label: 'சங்க அவையுடன் உரையாடு',
    close: 'உரையாடலை மூடு',
    title: 'அவை – சங்க இலக்கிய AI',
    subtitle: 'ஐந்து புலவர்கள் • ஒரே அவை',
    fullPage: 'முழுப் பக்கத்தைத் திற',
    council: 'புலவரைத் தேர்ந்தெடுங்கள்',
    assemblyHint: 'அவை — வினாவுக்கு ஏற்ற புலவரை இயங்குதளம் தானே தேர்ந்தெடுக்கும்',
    placeholder: 'உங்கள் வினாவை எழுதுங்கள்…',
    send: 'வினவு',
    thinking: 'புலவர் சிந்திக்கிறார்…',
    offline: 'சங்க அவை இப்போது பதிலளிக்க இயலவில்லை. சிறிது நேரம் கழித்து மீண்டும் வினவுங்கள்.',
    newChat: 'புதிய உரையாடல்',
    answeredBy: 'விடையளித்தவர்',
    cited: 'சான்றுகள்',
    empty: 'இந்த அவையில் உங்கள் வினாவைத் தொடங்குங்கள்.',
    hint: 'Enter — வினவு · Shift + Enter — புதிய வரி',
    abstained: 'சான்று போதாததால் புலவர் விடை தவிர்த்தார்',
    locallyAnswered: 'உள்ளூர் நூலகச் சான்று',
  },
  en: {
    label: 'Chat with the Sangam Avai',
    close: 'Close the chat',
    title: 'Avai – Sangam Literary AI',
    subtitle: 'Five Pulavars • One Assembly',
    fullPage: 'Open the full page',
    council: 'Choose a Pulavar',
    assemblyHint: 'Assembly — the platform picks the poet your question needs',
    placeholder: 'Write your question…',
    send: 'Ask',
    thinking: 'The Pulavar is thinking…',
    offline: 'Sangam Avai could not answer just now. Please try again in a minute.',
    newChat: 'New conversation',
    answeredBy: 'Answered by',
    cited: 'Citations',
    empty: 'Start a question with this council.',
    hint: 'Enter — ask · Shift + Enter — new line',
    abstained: 'The Pulavar abstained — not enough evidence',
    locallyAnswered: 'Local corpus evidence',
  },
}

/** Same link shape the /avai page uses for a citation chip. */
function getVerseLink(verseId) {
  if (!verseId) return '/book'
  const parts = String(verseId).split('_')
  if (parts.length >= 2) return `/book/${parts[0]}/${parts[1]}`
  return `/book/${verseId}`
}

let messageSeq = 0
function nextMessageId(prefix) {
  messageSeq += 1
  return `${prefix}_${messageSeq}`
}

function storageKey(agentId) {
  return `${STORE_SCOPE}:${agentId}`
}

/** One saved thread per council mode, read once on mount. */
function loadThreads() {
  const loaded = {}
  for (const id of COUNCIL_IDS) {
    const saved = getSavedChat(storageKey(id))
    loaded[id] = Array.isArray(saved.messages) ? saved.messages : []
  }
  return loaded
}

export default function FloatingAvai() {
  const language = useAppStore((s) => s.language)
  const isTa = language === 'ta'
  const copy = isTa ? COPY.ta : COPY.en

  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState(ASSEMBLY_ID)
  const [threads, setThreads] = useState(loadThreads)
  const [sessions, setSessions] = useState({})
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const fabRef = useRef(null)
  const inputRef = useRef(null)
  const logRef = useRef(null)
  const cardRefs = useRef({})

  const messages = threads[activeId] || []
  const activeAgent = AGENT_BY_ID[activeId]
  const activeProfile = PROFILES[activeId]
  const isAssembly = activeId === ASSEMBLY_ID

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
  }, [threads, isLoading, activeId])

  const send = useCallback(
    async (rawText) => {
      const text = (rawText ?? input).trim()
      if (!text || isLoading) return

      const targetId = activeId
      const targetKey = storageKey(targetId)
      const userMessage = { id: nextMessageId('user'), role: 'user', text, pulavarId: targetId }
      const withUser = [...(threads[targetId] || []), userMessage]

      setThreads((prev) => ({ ...prev, [targetId]: withUser }))
      saveChat(targetKey, withUser)
      setInput('')
      setIsLoading(true)

      const appendAgent = (agentMessage) => {
        const withAgent = [...withUser, agentMessage]
        setThreads((prev) => ({ ...prev, [targetId]: withAgent }))
        saveChat(targetKey, withAgent)
      }

      try {
        // Assembly mode sends no pulavar: the backend's classifier picks the
        // poet. A named mode sends the pulavar, so that poet's runner answers.
        const response = await askAvaiAgent({
          pulavar: targetId === ASSEMBLY_ID ? null : targetId,
          message: text,
          sessionId: sessions[targetId] || null,
          context: {},
        })

        if (response?.session_id) {
          setSessions((prev) => ({ ...prev, [targetId]: response.session_id }))
        }

        appendAgent({
          id: nextMessageId('avai'),
          role: 'agent',
          // Who answered: the backend's own field, never a frontend assumption.
          pulavarId: response?.pulavar || response?.poet || targetId,
          routingReason: targetId === ASSEMBLY_ID
            ? response?.routing_reason || response?.metadata?.routing_reason || null
            : response?.routing_reason || null,
          text: response?.response_text || copy.offline,
          citations: response?.citations || [],
          isAbstained: Boolean(response?.is_abstained),
          abstentionReason: response?.abstention_reason || null,
          evidenceStatus: response?.evidence_status || 'unsupported',
          isFallback: Boolean(response?.isFallback),
          timestamp: new Date().toISOString(),
        })
      } catch {
        appendAgent({
          id: nextMessageId('avai'),
          role: 'agent',
          pulavarId: targetId,
          text: copy.offline,
          citations: [],
          isAbstained: false,
          evidenceStatus: 'unsupported',
          isFallback: true,
          timestamp: new Date().toISOString(),
        })
      } finally {
        setIsLoading(false)
      }
    },
    [activeId, copy.offline, input, isLoading, sessions, threads],
  )

  const startNewChat = () => {
    clearSavedChat(storageKey(activeId))
    setThreads((prev) => ({ ...prev, [activeId]: [] }))
    setSessions((prev) => ({ ...prev, [activeId]: null }))
    inputRef.current?.focus()
  }

  const onInputKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send()
    }
  }

  // Arrow keys walk the council from whichever card has focus, as a radio
  // group with a roving tabindex should.
  const onCouncilKeyDown = (event) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
    if (!step) return
    event.preventDefault()
    const focusedId = COUNCIL_IDS.find((id) => cardRefs.current[id] === document.activeElement)
    const index = COUNCIL_IDS.indexOf(focusedId || activeId)
    const nextId = COUNCIL_IDS[(index + step + COUNCIL_IDS.length) % COUNCIL_IDS.length]
    setActiveId(nextId)
    cardRefs.current[nextId]?.focus()
  }

  const routeLabel = (reason) => {
    const label = ROUTE_LABELS[reason]
    if (!label) return null
    return isTa ? label.ta : label.en
  }

  const suggestions = (activeAgent?.suggestedPrompts || []).slice(0, 3)
  const ActiveIcon = activeProfile.Icon

  return (
    <div className="avai-assistant fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {open && (
        <section
          role="dialog"
          aria-label={copy.title}
          className="avai-panel glass-panel flex w-[min(26rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-line-strong"
        >
          <header className="flex items-center gap-2.5 border-b border-line px-3 py-2.5">
            <span className="avai-mark-disc flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
              <img src={LOGO_SRC} alt="" width="28" height="28" draggable="false" className="h-7 w-7" />
            </span>
            <div className="min-w-0 flex-1">
              <LanguageText
                as="h2"
                ta={COPY.ta.title}
                en={COPY.en.title}
                className="truncate text-sm font-semibold text-primary"
              />
              <LanguageText
                as="p"
                ta={COPY.ta.subtitle}
                en={COPY.en.subtitle}
                className="truncate text-[11px] text-faint"
              />
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={startNewChat}
                aria-label={copy.newChat}
                title={copy.newChat}
                className="rounded-lg p-1.5 text-muted hover:bg-surface-alt hover:text-accent-strong focus-ring"
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            )}
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
            role="radiogroup"
            aria-label={copy.council}
            onKeyDown={onCouncilKeyDown}
            className="grid shrink-0 grid-cols-2 gap-1.5 border-b border-line px-2.5 py-2 sm:grid-cols-3"
          >
            {COUNCIL_IDS.map((id) => {
              const agent = AGENT_BY_ID[id]
              const profile = PROFILES[id]
              const Icon = profile.Icon
              const selected = id === activeId
              return (
                <button
                  key={id}
                  ref={(node) => {
                    cardRefs.current[id] = node
                  }}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveId(id)}
                  title={`${agent?.nameEn} — ${profile.roleEn}`}
                  aria-label={`${agent?.nameTa}, ${agent?.nameEn} — ${isTa ? profile.roleTa : profile.roleEn}`}
                  className="avai-agent-card flex min-w-0 flex-col items-start gap-0.5 rounded-xl border px-2 py-1.5 text-left focus-ring"
                >
                  {/* Proper names stay in their own script, like the /avai page's
                      poet list; only UI copy follows the language switch. */}
                  <span className="flex w-full items-center gap-1">
                    <Icon size={13} className="shrink-0 text-accent" aria-hidden="true" />
                    <span lang="ta" className="tamil truncate text-[11px] font-semibold leading-tight text-primary">
                      {agent?.nameTa}
                    </span>
                    {selected && (
                      <Check size={11} className="ml-auto shrink-0 text-accent" aria-hidden="true" />
                    )}
                  </span>
                  <span className="w-full truncate text-[9px] leading-tight text-muted">
                    {agent?.nameEn}
                  </span>
                  <LanguageText
                    ta={profile.roleTa}
                    en={profile.roleEn}
                    className="line-clamp-1 w-full text-[10px] leading-snug text-faint"
                  />
                </button>
              )
            })}
          </div>

          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-label={copy.title}
            className="avai-thread flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-3"
          >
            {isAssembly && (
              <p className="rounded-lg border border-line/70 bg-surface-alt/40 px-2 py-1.5 text-[10px] leading-snug text-faint">
                <LanguageText ta={COPY.ta.assemblyHint} en={COPY.en.assemblyHint} />
              </p>
            )}

            {messages.length === 0 ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="avai-mark-disc flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full">
                    <img src={LOGO_SRC} alt="" width="20" height="20" draggable="false" className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <LanguageText
                      ta={activeAgent?.titleTa}
                      en={activeAgent?.titleEn}
                      className="block truncate text-xs font-semibold text-primary"
                    />
                    <LanguageText
                      as="p"
                      ta={COPY.ta.empty}
                      en={COPY.en.empty}
                      className="text-[11px] text-faint"
                    />
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {suggestions.map((suggestion) => (
                    <li key={suggestion.en}>
                      <button
                        type="button"
                        onClick={() => send(isTa ? suggestion.ta : suggestion.en)}
                        className="w-full rounded-xl border border-line bg-surface px-2.5 py-2 text-left text-[11px] leading-snug text-muted hover:border-accent/60 hover:text-accent-strong focus-ring"
                      >
                        <LanguageText ta={suggestion.ta} en={suggestion.en} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              messages.map((message) => {
                if (message.role === 'user') {
                  return (
                    <p
                      key={message.id}
                      className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-3 py-2 text-xs leading-relaxed text-on-accent"
                    >
                      <span className="whitespace-pre-wrap break-words">{message.text}</span>
                    </p>
                  )
                }

                const answeredBy = AGENT_BY_ID[message.pulavarId]
                const reason = message.routingReason ? routeLabel(message.routingReason) : null
                const citations = message.citations || []

                return (
                  <article key={message.id} className="flex max-w-[94%] gap-2">
                    <span className="avai-mark-disc mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full">
                      <img src={LOGO_SRC} alt="" width="18" height="18" draggable="false" className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-line bg-surface px-3 py-2">
                      <div className="mb-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                        <LanguageText
                          ta={answeredBy?.nameTa}
                          en={answeredBy?.nameEn}
                          className="text-[11px] font-bold text-accent"
                        />
                        {reason && (
                          <span className="rounded-full border border-line px-1.5 py-px text-[9px] text-faint">
                            {reason}
                          </span>
                        )}
                      </div>

                      {message.isAbstained && (
                        <p className="mb-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-300">
                          ⚠️ <LanguageText ta={COPY.ta.abstained} en={COPY.en.abstained} />
                        </p>
                      )}

                      <Markdown text={message.text} className="text-xs leading-relaxed" />

                      {citations.length > 0 && (
                        <div className="mt-2 border-t border-line pt-1.5">
                          <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-faint">
                            <Quote size={10} aria-hidden="true" />
                            <LanguageText ta={COPY.ta.cited} en={COPY.en.cited} />({citations.length})
                          </p>
                          <ul className="flex flex-wrap gap-1">
                            {citations.slice(0, 6).map((citation, index) => (
                              <li key={`${message.id}_${index}`}>
                                <Link
                                  to={getVerseLink(citation.verse_id)}
                                  title={citation.quote ? `“${citation.quote}”` : citation.verse_id}
                                  className="inline-flex items-center gap-1 rounded-md border border-accent/40 bg-surface-alt/60 px-1.5 py-0.5 font-mono text-[10px] text-accent hover:bg-accent hover:text-on-accent focus-ring"
                                >
                                  {citation.verse_id || citation.citation_id}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </article>
                )
              })
            )}

            {isLoading && (
              <p className="flex items-center gap-1.5 text-[10px] text-faint">
                <span className="avai-typing-dot" aria-hidden="true" />
                <span className="avai-typing-dot" aria-hidden="true" />
                <span className="avai-typing-dot" aria-hidden="true" />
                <LanguageText ta={COPY.ta.thinking} en={COPY.en.thinking} className="ml-1" />
              </p>
            )}
          </div>

          <div className="border-t border-line px-3 py-2.5">
            <p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-faint">
              <ActiveIcon size={11} className="text-accent" aria-hidden="true" />
              <LanguageText ta={activeAgent?.nameTa} en={activeAgent?.nameEn} />
              <span className="text-faint/70">·</span>
              <LanguageText ta={activeProfile.roleTa} en={activeProfile.roleEn} className="font-normal" />
            </p>
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
