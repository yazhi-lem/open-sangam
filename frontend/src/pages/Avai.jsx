/**
 * Avai.jsx — Sangam Avai Multi-Agent Chat Space.
 * Provides interactive chat spaces for each Sangam Pulavar Agent:
 * - நக்கீரர் (Nakkirar) — Convener & Assembly Moderator
 * - ஔவையார் (Avvaiyar) — Q&A & Ethical Philosophy
 * - கபிலர் (Kapilar) — Nature & Verse Discovery
 * - தொல்காப்பியர் (Tholkappiyar) — Scenario & Poetic Grammar
 * - பரணர் (Paranar) — Visual Imagery & Historical Scenes
 * - முழுச் சங்க அவை (Sangam Swarm) — Full Peer Mesh
 */

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Send,
  Sparkles,
  Trash2,
  Copy,
  Check,
  BookOpen,
  Filter,
  ExternalLink,
  ChevronRight,
  Info,
  RefreshCw,
} from 'lucide-react'
// import { marked } from 'marked' // Reverted
import { PULAVAR_AGENTS, TINAI_FILTER_OPTIONS } from '../data/pulavars'
import { askAvaiAgent, getSavedChat, saveChat, clearSavedChat } from '../services/avaiService'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Reveal from '../components/motion/Reveal'

let msgIdCounter = 0
function nextId(prefix) {
  msgIdCounter += 1
  return `${prefix}_${msgIdCounter}_${Math.random().toString(36).slice(2, 8)}`
}

export default function Avai() {
  const { agentId } = useParams()
  const navigate = useNavigate()

  // Determine active agent derived from URL param or default
  const effectiveAgentId = agentId && PULAVAR_AGENTS.some((a) => a.id === agentId) ? agentId : 'nakkirar'
  const activeAgent = PULAVAR_AGENTS.find((a) => a.id === effectiveAgentId) || PULAVAR_AGENTS[0]

  // Filter state
  const [selectedTinai, setSelectedTinai] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)

  // Messages state (keyed per agent)
  const [allChats, setAllChats] = useState(() => {
    const initial = {}
    for (const agent of PULAVAR_AGENTS) {
      initial[agent.id] = getSavedChat(agent.id) // getSavedChat now returns { messages, title }
    }
    return initial
  })

  const { messages, title: chatTitle } = allChats[effectiveAgentId] || { messages: [], title: '' }

  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [mobileAgentDrawer, setMobileAgentDrawer] = useState(false)
  const [isNewSessionInitiated, setIsNewSessionInitiated] = useState(false)

  const chatContainerRef = useRef(null)
  const textareaRef = useRef(null)
  const prevMsgCountRef = useRef(0)

  // Scroll inner chat container only when new messages are appended
  useEffect(() => {
    if (chatContainerRef.current && (messages.length > prevMsgCountRef.current || isLoading)) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
    prevMsgCountRef.current = messages.length // Update ref after messages are stable
  }, [messages.length, isLoading])

  // Handle switching agents or initiating new chat
  const handleSelectAgent = (id) => {
    if (isNewSessionInitiated) {
      clearSavedChat(id)
      setAllChats((prev) => ({
        ...prev,
        [id]: { messages: [], title: '' },
      }))
      setSessionId(null)
      setIsNewSessionInitiated(false)
    }
    navigate(`/avai/${id}`)
    setMobileAgentDrawer(false)
  }

  // Clear chat for current agent
  const handleClearChat = () => {
    if (window.confirm(`${activeAgent.nameTa} உடனான உரையாடலை அழிக்கவா?`)) {
      clearSavedChat(effectiveAgentId)
      setAllChats((prev) => ({
        ...prev,
        [effectiveAgentId]: { messages: [], title: '' },
      }))
      setSessionId(null)
    }
  }

  // Copy message text to clipboard
  const handleCopyMessage = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Send message
  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputMessage).trim()
    if (!query || isLoading) return

    const userMsg = {
      id: nextId('usr'),
      role: 'user',
      text: query,
      timestamp: new Date().toISOString(),
    }

    const updatedMessages = [...messages, userMsg]
    setAllChats((prev) => ({
      ...prev,
      [effectiveAgentId]: updatedMessages,
    }))
    saveChat(effectiveAgentId, updatedMessages)
    setInputMessage('')
    setIsLoading(true)

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const response = await askAvaiAgent({
        poet: effectiveAgentId,
        message: query,
        workflow: activeAgent.workflow,
        sessionId,
        context: {
          tinai: selectedTinai || undefined,
        },
      })

      if (response.session_id) {
        setSessionId(response.session_id)
      }

      const agentMsg = {
        id: nextId('agt'),
        role: 'agent',
        poetId: response.poet || effectiveAgentId,
        text: response.response_text,
        citations: response.citations || [],
        scenario: response.scenario || null,
        imageUrl: response.imageUrl || null,
        metadata: response.metadata,
        isFallback: response.isFallback,
        timestamp: new Date().toISOString(),
      }

      const finalMessages = [...updatedMessages, agentMsg]
      setAllChats((prev) => ({
        ...prev,
        [effectiveAgentId]: finalMessages,
      }))
      saveChat(effectiveAgentId, finalMessages)
    } catch (err) {
      console.error('[Avai] Failed to get response:', err)
      const errorMsg = {
        id: nextId('err'),
        role: 'agent',
        poetId: effectiveAgentId,
        text: `மன்னிக்கவும், புலவர் அவையிலிருந்து மறுமொழி பெறுவதில் தடை ஏற்பட்டது (${err.message}). சிறிது நேரம் கழித்து மீண்டும் வினவவும்.`,
        timestamp: new Date().toISOString(),
      }
      const finalMessages = [...updatedMessages, errorMsg]
      setAllChats((prev) => ({
        ...prev,
        [effectiveAgentId]: finalMessages,
      }))
      saveChat(effectiveAgentId, finalMessages)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Enter key for submission (Shift+Enter for new line)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Adjust textarea height dynamically
  const handleTextareaChange = (e) => {
    setInputMessage(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`
  }

  // Helper to parse verse id into poem and number (e.g. kurunthokai_40 -> /book/kurunthokai/40)
  const getVerseLink = (verseId) => {
    if (!verseId) return '/book'
    const parts = verseId.split('_')
    if (parts.length >= 2) {
      return `/book/${parts[0]}/${parts[1]}`
    }
    return `/book/${verseId}`
  }

  return (
    <div className="w-full px-4 sm:px-6 py-6 md:py-8 h-screen flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="accent" size="sm">
              <span className="flex items-center gap-1">
                <Sparkles size={12} />
                சங்க அவை பேரவை
              </span>
            </Badge>
            <span className="text-xs text-muted font-mono hidden md:inline">ADK பல்தொடர்பு</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary flex items-center gap-2">
            <span>சங்க அவை புலவர் பேரவை</span>
            <span className="tamil text-lg font-medium text-muted">• புலவர் மன்றம்</span>
          </h1>
          <p className="text-muted text-xs sm:text-sm">
            செவ்வியல் தமிழ்ப் புலவர்கள், இலக்கண ஆசிரியர்கள் மற்றும் முழுப் பல்தொடர்புப் பேரவையுடன் மேற்கோள் காட்டப்பட்ட பாடல்கள், பகுப்பாய்வு மற்றும் காட்சி உருவாக்கத்திற்காக உரையாடுங்கள்.
          </p>
        </div>

        {/* Mobile Poet Selector Trigger */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileAgentDrawer(!mobileAgentDrawer)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-line bg-surface text-primary font-medium text-xs focus-ring shadow-sm"
          >
            <span className="text-lg tamil">{activeAgent.nameTa[0]}</span>
            <span className="tamil">{activeAgent.nameTa}</span>
            <ChevronRight size={14} className="text-muted" />
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar + Chat Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 flex-1">
        {/* Desktop Sidebar: Pulavar Agent List */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4">
          {/* Uraiadalgal List (Saved Sessions) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                உரையாடல்கள் • Conversations
              </span>
            </div>
            <div className="space-y-1">
              {PULAVAR_AGENTS.map((agent) => {
                const hasChat = allChats[agent.id]?.messages?.length > 0
                if (!hasChat) return null
                return (
                  <button
                    key={`uraidal-${agent.id}`}
                    type="button"
                    onClick={() => handleSelectAgent(agent.id)}
                    className={`w-full text-left p-2 rounded-xl border transition-all duration-200 flex items-center gap-2 focus-ring ${
                      agent.id === effectiveAgentId
                        ? 'bg-accent/10 border-accent font-semibold text-primary'
                        : 'bg-surface-alt/40 border-line text-muted hover:bg-surface hover:border-line-strong'
                    }`}
                  >
                    <div className="shrink-0 w-6 h-6 rounded-md bg-surface-alt/70 flex items-center justify-center border border-line text-xs tamil font-bold">
                      {agent.nameTa[0]}
                    </div>
                    <p className="tamil text-sm font-bold text-primary truncate">{agent.nameTa}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              புலவர்கள் • புலவர் குழு
            </span>
            <button
              type="button"
              onClick={() => { setMobileAgentDrawer(true); setIsNewSessionInitiated(true); }}
              className="p-1.5 rounded-xl border border-line bg-surface text-muted hover:text-primary hover:border-accent/40 transition-colors focus-ring"
              title="புதிய உரையாடல் தொடங்கவும்"
              aria-label="புதிய உரையாடல்"
            >
              <Sparkles size={15} />
            </button>
          </div>

          <div className="space-y-2">
            {PULAVAR_AGENTS.map((agent) => {
              const isActive = agent.id === effectiveAgentId
              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => handleSelectAgent(agent.id)}
                  className={`w-full text-left p-2 rounded-xl border transition-all duration-200 flex items-center gap-2 focus-ring ${
                    isActive
                      ? 'bg-surface border-accent/60 shadow-md ring-1 ring-accent/30'
                      : 'bg-surface/50 border-line hover:bg-surface hover:border-line-strong'
                  }`}
                >
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-surface-alt/70 flex items-center justify-center border border-line text-lg tamil font-bold">
                    {agent.nameTa[0]}
                  </div>
                  <p className="tamil text-sm font-bold text-primary truncate">{agent.nameTa}</p>
                </button>
              )
            })}
          </div>

          {/* Quick Info Box */}
          <Card variant="flat" className="p-4 space-y-2 border-dashed">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Info size={14} className="text-accent" />
              <span>மேற்கோள்கள் & தரவுத்தளம்</span>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              ஒவ்வொரு புலவரும் 18 செவ்வியல் இலக்கியத் தொகுப்புகளிலிருந்தும் (எட்டுத்தொகை & பத்துப்பாட்டு) சரிபார்க்கப்பட்ட பாடல் இணைப்புகளுடன் நேரடியாக கேள்விகளுக்கு பதிலளிக்கின்றனர்.
            </p>
          </Card>
        </aside>

        {/* Mobile Pulavar Drawer */}
        {mobileAgentDrawer && (
          <div className="lg:hidden col-span-1 bg-surface border border-line rounded-2xl p-4 space-y-2 shadow-lg mb-4 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <span className="text-xs font-bold uppercase text-muted">புலவரைத் தேர்ந்தெடுங்கள்</span>
              <button
                type="button"
                onClick={() => setMobileAgentDrawer(false)}
                className="text-xs text-accent font-semibold"
              >
                முடிந்தது
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {PULAVAR_AGENTS.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => handleSelectAgent(agent.id)}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                    agent.id === effectiveAgentId
                      ? 'bg-accent/10 border-accent font-semibold text-primary'
                      : 'bg-surface-alt/40 border-line text-muted'
                  }`}
                >
                  <span className="shrink-0 w-8 h-8 rounded-full bg-surface-alt/70 flex items-center justify-center border border-line text-lg tamil font-bold">{agent.nameTa[0]}</span>
                  <p className="tamil text-xs font-bold text-primary truncate">{agent.nameTa}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Chat Space */}
        <main className="col-span-1 lg:col-span-8 flex flex-col flex-1 bg-surface rounded-2xl border border-line shadow-sm overflow-hidden">
          {/* Active Pulavar Header */}
          <header className="p-4 border-b border-line bg-surface-alt/30 backdrop-blur-xs flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 p-0.5 rounded-xl bg-surface border border-line shrink-0 flex items-center justify-center text-2xl sm:text-3xl tamil font-bold">
                {activeAgent.nameTa[0]}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="tamil text-base sm:text-lg font-bold text-primary truncate">
                    {activeAgent.nameTa}
                  </h2>
                  <Badge variant="accent" size="sm">
                    {activeAgent.tag}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted truncate">{activeAgent.bioTa}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Tiṇai context filter toggle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFilterOpen(!filterOpen)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all focus-ring ${
                    selectedTinai
                      ? 'border-accent bg-accent/10 text-accent font-semibold'
                      : 'border-line bg-surface text-muted hover:text-primary'
                  }`}
                  title="திணை சூழல் வடிகட்டி"
                >
                  <Filter size={13} />
                  <span className="hidden sm:inline">
                    {selectedTinai
                      ? TINAI_FILTER_OPTIONS.find((t) => t.id === selectedTinai)?.labelTa
                      : 'திணை சூழல்'}
                  </span>
                </button>

                {filterOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-surface border border-line rounded-xl shadow-xl p-1.5 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted px-2 py-1">
                      திணை வடிப்பான்
                    </p>
                    {TINAI_FILTER_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedTinai(opt.id)
                          setFilterOpen(false)
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          selectedTinai === opt.id
                            ? 'bg-accent/10 text-accent font-semibold'
                            : 'text-muted hover:bg-surface-alt hover:text-primary'
                        }`}
                      >
                        <span className="tamil">{opt.labelTa}</span>
                        {selectedTinai === opt.id && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Clear chat button */}
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="p-1.5 rounded-xl border border-line bg-surface text-muted hover:text-danger hover:border-danger/40 transition-colors focus-ring"
                  title="உரையாடலை அழிக்கவும்"
                  aria-label="உரையாடலை அழிக்கவும்"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </header>

          {/* Messages Stream */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Empty State / Welcome */}
            {messages.length === 0 && (
              <Reveal className="space-y-6 my-auto py-6">
                <div className="text-center max-w-lg mx-auto space-y-3">
                  <div className="inline-block p-1 rounded-3xl bg-surface-alt/60 border border-line shadow-xs overflow-hidden text-5xl tamil font-bold flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32">
                    {activeAgent.nameTa[0]}
                  </div>
                  <h3 className="tamil text-xl sm:text-2xl font-bold text-primary">
                    {activeAgent.nameTa} உடனான கலந்துரையாடல்
                  </h3>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed">
                    {activeAgent.bioTa}
                  </p>
                </div>

                {/* Suggested Prompts */}
                <div className="space-y-2 max-w-xl mx-auto">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted text-center">
                    தொடக்க வினாக்கள்
                  </p>
                  <div className="space-y-2">
                    {activeAgent.suggestedPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(prompt.ta)}
                        className="w-full text-left p-3 rounded-xl border border-line bg-surface hover:border-accent hover:bg-accent/5 transition-all text-xs text-primary group flex items-start justify-between gap-3 shadow-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="tamil font-medium text-primary group-hover:text-accent">
                            {prompt.ta}
                          </p>

                        </div>
                        <Sparkles
                          size={14}
                          className="text-faint group-hover:text-accent shrink-0 mt-0.5"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}

            {/* Message Bubbles */}
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user'

              return (
                <div
                  key={msg.id || idx}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-surface-alt border border-line shrink-0 h-fit select-none overflow-hidden flex items-center justify-center text-lg tamil font-bold">
                      {activeAgent.nameTa[0]}
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] space-y-1 rounded-2xl p-3 text-xs leading-normal ${
                      isUser
                        ? 'bg-accent text-on-accent rounded-br-xs'
                        : 'bg-surface-alt/70 border border-line text-primary rounded-bl-xs'
                    }`}
                  >
                    {/* Header for agent responses */}
                    {!isUser && (
                      <div className="flex items-center justify-between gap-2 pb-1 border-b border-line/60 text-xs">
                        <span className="tamil font-bold text-accent">{activeAgent.nameTa}</span>
                        <div className="flex items-center gap-1.5">
                          {msg.isFallback && (
                            <span className="text-[10px] text-faint font-mono bg-surface px-1.5 py-0.5 rounded border border-line">
                              தனிச்சக்தி அமைப்பு
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.text, idx)}
                            className="p-1 text-faint hover:text-primary transition-colors rounded"
                            title="மறுமொழியை நகலெடு"
                          >
                            {copiedIndex === idx ? (
                              <Check size={13} className="text-emerald-500" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Text content with whitespace preserve & markdown stanzas */}
                    <div className="font-sans text-xs leading-normal space-y-1">
                      {msg.text}
                    </div>

                    {/* Generated Visual image if provided (Paranar workflow) */}
                    {msg.imageUrl && (
                      <div className="pt-2">
                        <div className="overflow-hidden rounded-xl border border-line bg-surface relative group">
                          <img
                            src={msg.imageUrl}
                            alt="Visualized Sangam scene"
                            className="w-full h-48 sm:h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="p-2 bg-surface/90 backdrop-blur-xs text-[11px] text-muted flex items-center justify-between">
                            <span>🎨 காட்சிச் சித்தரிப்பு</span>
                            <span className="text-[10px] font-mono">1:1 திரைக்காட்சி வரைவு</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Scenario Extractor Card (Tholkappiyar workflow) */}
                    {msg.scenario && (
                      <div className="mt-3 p-3 rounded-xl border border-line bg-surface space-y-2 text-xs">
                        <div className="flex items-center justify-between border-b border-line pb-1.5">
                          <span className="tamil font-bold text-accent">📜 முப்பொருள் கட்டமைப்பு</span>
                          <Badge variant="outline" size="sm">தொல்காப்பியம்</Badge>
                        </div>
                        <div className="grid grid-cols-1 gap-1 text-[11px]">
                          <div><strong className="text-primary">திணை:</strong> {msg.scenario.tinai}</div>
                          <div><strong className="text-primary">முதல் பொருள்:</strong> {msg.scenario.muthal_porul?.nilam} ({msg.scenario.muthal_porul?.poluthu})</div>
                          <div><strong className="text-primary">கருப் பொருள்:</strong> {msg.scenario.karu_porul?.flora_fauna}</div>
                          <div><strong className="text-primary">உரிப் பொருள்:</strong> {msg.scenario.uri_porul}</div>
                          <div><strong className="text-primary">கூற்று:</strong> {msg.scenario.dramatic_speaker}</div>
                        </div>
                      </div>
                    )}

                    {/* Citations Pill Row */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="pt-2 border-t border-line/60 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                          <BookOpen size={11} />
                          சான்றாதாரப் பாடல்கள்
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.citations.map((c, cIdx) => (
                            <Link
                              key={cIdx}
                              to={getVerseLink(c.verse_id)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-accent/40 bg-surface text-accent hover:bg-accent hover:text-on-accent transition-all text-xs font-mono group"
                            >
                              <span>{c.verse_id}</span>
                              {c.tinai && <span className="text-[10px] text-faint group-hover:text-on-accent/80">• {c.tinai} திணை</span>}
                              <ExternalLink size={10} className="shrink-0" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Loading / Thinking indicator */}
            {isLoading && (
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-xl bg-surface-alt border border-line shrink-0 animate-pulse flex items-center justify-center overflow-hidden text-lg tamil font-bold">
                  {activeAgent.nameTa[0]}
                </div>
                <div className="p-3.5 rounded-2xl bg-surface-alt/70 border border-line text-muted text-xs flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin text-accent" />
                  <span className="tamil font-medium text-primary">{activeAgent.nameTa}</span>
                  <span>சங்க ஏடுகளை ஆராய்கின்றார்...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <footer className="p-3 sm:p-4 border-t border-line bg-surface shrink-0 space-y-2 rounded-3xl shadow-lg mt-4">
            <div className="flex items-end gap-2 bg-surface-alt/60 border border-line focus-within:border-accent rounded-2xl p-2 transition-all shadow-inner">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={`சங்க இலக்கியம், திணை அல்லது வரலாறு குறித்து ${activeAgent.nameTa} இடம் கேளுங்கள்...`}
                rows={1}
                className="flex-1 max-h-36 bg-transparent resize-none border-0 p-2 text-xs sm:text-sm text-primary placeholder:text-faint focus:outline-hidden"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="shrink-0 rounded-xl px-3 py-2"
                aria-label="புலவருக்கு செய்தி அனுப்ப"
              >
                <Send size={15} />
              </Button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-faint px-1">
              <span><kbd className="px-1 py-0.5 border border-line rounded bg-surface font-mono">Enter</kbd> அழுத்தி அனுப்பவும், <kbd className="px-1 py-0.5 border border-line rounded bg-surface font-mono">Shift+Enter</kbd> புதிய வரிக்கு</span>
              <span className="tamil">சங்க இலக்கியப் பேரவை</span>
            </div>
          </footer>

        </main>
      </div>
    </div>
  )
}
