/**
 * Avai.jsx — Sangam Avai Multi-Agent Chat Space.
 * Features:
 * - Summarizes first Avai agent response into dynamic chat titles.
 * - Olai Chuvadi aesthetic.
 * - Prominent "New Chat" creation.
 * - Enriched "சான்றாதாரத் தரவுத்தளம்" (Verified Corpus Knowledge Database) sidebar details.
 * - Rich Editor Toolbar & Auto-Translate to Tamil options.
 * - Collapsible "புலவர் சிந்தனை ஓட்டம் • Reasoning" block.
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
  RefreshCw,
  MessageSquare,
  Brain,
  Bold,
  Italic,
  Quote,
  List,
  Languages,
  Eraser,
  Plus,
  Database,
  Layers,
  Network,
} from 'lucide-react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
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

function deriveFallbackTitle(firstMessage) {
  if (!firstMessage) return ''
  const trimmed = firstMessage.trim()
  if (trimmed.length <= 28) return trimmed
  return `${trimmed.slice(0, 28)}...`
}

function summarizeResponseToTitle(responseText, userPrompt = '') {
  if (!responseText) return deriveFallbackTitle(userPrompt)

  const cleanText = responseText
    .split('\n')
    .filter((line) => !line.trim().startsWith('சிந்தனை:') && !line.trim().startsWith('Thought:'))
    .join('\n')
    .trim()

  const boldMatch = cleanText.match(/\*\*([^*]{3,35})\*\*/)?.[1]
  if (boldMatch && !boldMatch.includes('சிந்தனை') && !boldMatch.includes('பொருள்')) {
    return boldMatch.trim()
  }

  const poemKeywords = ['குறுந்தொகை', 'புறநானூறு', 'நற்றிணை', 'அகநானூறு', 'கலித்தொகை', 'பதிற்றுப்பத்து', 'பரிபாடல்', 'ஐங்குறுநூறு', 'தொல்காப்பியம்', 'குறிஞ்சி', 'முல்லை', 'மருதம்', 'நெய்தல்', 'பாலை']
  for (const kw of poemKeywords) {
    if (cleanText.includes(kw)) {
      const matchLine = cleanText.split('\n').find((l) => l.includes(kw) && !l.includes('சிந்தனை'))
      if (matchLine) {
        const cleaned = matchLine.replace(/^[*#\->\s]+/, '').trim()
        if (cleaned.length <= 30) return cleaned
        return `${cleaned.slice(0, 28)}...`
      }
    }
  }

  const firstLine = cleanText.split('\n').find((l) => l.trim().length > 4) || userPrompt
  const cleanLine = firstLine.replace(/^[*#\->\s]+/, '').trim()
  if (cleanLine.length <= 28) return cleanLine
  return `${cleanLine.slice(0, 28)}...`
}

const QUICK_TRANSLITERATE_MAP = {
  vanakkam: 'வணக்கம்',
  namaste: 'வணக்கம்',
  kurunthokai: 'குறுந்தொகை',
  purananooru: 'புறநானூறு',
  natrinai: 'நற்றிணை',
  akananooru: 'அகநானூறு',
  kalittokai: 'கலித்தொகை',
  patirruppattu: 'பதிற்றுப்பத்து',
  paripatal: 'பரிபாடல்',
  ainkurunuru: 'ஐங்குறுநூறு',
  tholkappiyam: 'தொல்காப்பியர்',
  meaning: 'விளக்கம்',
  explanation: 'விளக்கம்',
  poet: 'புலவர்',
  poets: 'புலவர்கள்',
  verse: 'பாடல்',
  verses: 'பாடல்கள்',
  tinai: 'திணை',
  kurinji: 'குறிஞ்சி',
  mullai: 'முல்லை',
  marutham: 'மருதம்',
  neythal: 'நெய்தல்',
  palai: 'பாலை',
  avvaiyar: 'ஔவையார்',
  kapilar: 'கபிலர்',
  nakkirar: 'நக்கீரர்',
  tholkappiyar: 'தொல்காப்பியர்',
  paranar: 'பரணர்',
  who: 'யார்',
  what: 'என்ன',
  why: 'ஏன்',
  how: 'எப்படி',
  tell: 'கூறுக',
  explain: 'விளக்குக',
  search: 'தேடுக',
}

function autoTranslateToTamil(input) {
  if (!input) return ''
  let result = input

  Object.keys(QUICK_TRANSLITERATE_MAP).forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    result = result.replace(regex, QUICK_TRANSLITERATE_MAP[word])
  })

  const hasEnglish = /[a-zA-Z]/.test(result)
  if (hasEnglish) {
    return `[தமிழ் மொழியாக்கம் செய்து விடையளிக்கவும்]: ${result}`
  }
  return result
}

function MessageContent({ text }) {
  const [showThoughts, setShowThoughts] = useState(false)

  if (!text || (!text.includes('சிந்தனை:') && !text.includes('Thought:'))) {
    return (
      <div
        className="font-sans text-xs sm:text-sm leading-relaxed space-y-2 prose prose-sangam tracking-normal"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(text || '')) }}
      />
    )
  }

  const lines = text.split('\n')
  const thoughtLines = []
  const answerLines = []

  let inThought = false
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('சிந்தனை:') || trimmed.startsWith('Thought:')) {
      inThought = true
      const cleaned = trimmed.replace(/^(சிந்தனை|Thought):\s*/, '').trim()
      if (cleaned) thoughtLines.push(cleaned)
    } else if (inThought && (trimmed.startsWith('#') || trimmed.startsWith('**') || (trimmed.length > 0 && !trimmed.startsWith('சிந்தனை')))) {
      inThought = false
      answerLines.push(line)
    } else if (inThought) {
      if (trimmed) thoughtLines.push(trimmed)
    } else {
      answerLines.push(line)
    }
  }

  const thoughtsText = thoughtLines.join('\n').trim()
  const answerText = answerLines.join('\n').trim() || text

  return (
    <div className="space-y-3">
      {thoughtsText && (
        <div className="rounded-xl border border-[#beaa82]/60 bg-[#f4ebd9]/70 dark:bg-[#251f17] p-2.5 text-xs space-y-1.5 shadow-xs">
          <button
            type="button"
            onClick={() => setShowThoughts(!showThoughts)}
            className="flex items-center justify-between w-full text-left font-bold text-accent hover:opacity-90 focus-ring"
          >
            <span className="flex items-center gap-1.5 tamil">
              <Brain size={13} className="text-accent" />
              <span>புலவர் சிந்தனை ஓட்டம்</span>
              <span className="text-[11px] text-muted font-normal">• Reasoning & Reflection</span>
            </span>
            <ChevronRight size={13} className={`transition-transform duration-200 text-muted ${showThoughts ? 'rotate-90' : ''}`} />
          </button>
          {showThoughts && (
            <div className="tamil text-muted pt-2 border-t border-line/40 whitespace-pre-line text-xs leading-relaxed italic space-y-1">
              {thoughtsText}
            </div>
          )}
        </div>
      )}

      <div
        className="font-sans text-xs sm:text-sm leading-relaxed space-y-2 prose prose-sangam tracking-normal"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(answerText)) }}
      />
    </div>
  )
}

export default function Avai() {
  const { agentId } = useParams()
  const navigate = useNavigate()

  const effectiveAgentId = agentId && PULAVAR_AGENTS.some((a) => a.id === agentId) ? agentId : 'nakkirar'
  const activeAgent = PULAVAR_AGENTS.find((a) => a.id === effectiveAgentId) || PULAVAR_AGENTS[0]

  const [selectedTinai, setSelectedTinai] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(false)

  const [allChats, setAllChats] = useState(() => {
    const initial = {}
    for (const agent of PULAVAR_AGENTS) {
      initial[agent.id] = getSavedChat(agent.id)
    }
    return initial
  })

  const { messages = [], title: chatTitle = '' } = allChats[effectiveAgentId] || {}

  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [mobileAgentDrawer, setMobileAgentDrawer] = useState(false)

  const chatContainerRef = useRef(null)
  const textareaRef = useRef(null)
  const prevMsgCountRef = useRef(0)

  useEffect(() => {
    if (chatContainerRef.current && (messages.length > prevMsgCountRef.current || isLoading)) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
    prevMsgCountRef.current = messages.length
  }, [messages.length, isLoading])

  const handleSelectAgent = (id) => {
    navigate(`/avai/${id}`)
    setMobileAgentDrawer(false)
  }

  const handleNewChat = (targetPulavarId = effectiveAgentId) => {
    clearSavedChat(targetPulavarId)
    setAllChats((prev) => ({
      ...prev,
      [targetPulavarId]: { messages: [], title: '' },
    }))
    setSessionId(null)
    setInputMessage('')
    if (targetPulavarId !== effectiveAgentId) {
      navigate(`/avai/${targetPulavarId}`)
    }
    setMobileAgentDrawer(false)
  }

  const handleClearChat = () => {
    if (window.confirm(`${activeAgent.nameTa} உடனான உரையாடலை அழிக்கவா?`)) {
      handleNewChat(effectiveAgentId)
    }
  }

  const handleCopyMessage = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const insertFormatting = (symbol) => {
    if (!textareaRef.current) return
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const current = inputMessage

    let updated
    if (symbol === '>') {
      updated = current.slice(0, start) + `\n> ` + current.slice(start)
    } else if (symbol === '-') {
      updated = current.slice(0, start) + `\n- ` + current.slice(start)
    } else {
      const selected = current.slice(start, end) || 'சொல்'
      updated = current.slice(0, start) + `${symbol}${selected}${symbol}` + current.slice(end)
    }

    setInputMessage(updated)
    textarea.focus()
  }

  const handleAutoTranslateClick = () => {
    if (!inputMessage.trim()) return
    const translated = autoTranslateToTamil(inputMessage)
    setInputMessage(translated)
  }

  const handleSendMessage = async (textToSend) => {
    let query = (textToSend || inputMessage).trim()
    if (!query || isLoading) return

    if (autoTranslateEnabled && !textToSend) {
      query = autoTranslateToTamil(query)
    }

    const isFirstMsg = messages.length === 0
    let tempTitle = isFirstMsg ? deriveFallbackTitle(query) : (chatTitle || deriveFallbackTitle(query))

    const userMsg = {
      id: nextId('usr'),
      role: 'user',
      text: query,
      timestamp: new Date().toISOString(),
    }

    const updatedMessages = [...messages, userMsg]
    setAllChats((prev) => ({
      ...prev,
      [effectiveAgentId]: { messages: updatedMessages, title: tempTitle },
    }))
    saveChat(effectiveAgentId, updatedMessages, tempTitle)
    setInputMessage('')
    setIsLoading(true)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const response = await askAvaiAgent({
        pulavar: effectiveAgentId,
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
        pulavarId: response.pulavar || response.poet || effectiveAgentId,
        text: response.response_text,
        citations: response.citations || [],
        scenario: response.scenario || null,
        imageUrl: response.imageUrl || null,
        metadata: response.metadata,
        isFallback: response.isFallback,
        timestamp: new Date().toISOString(),
      }

      const finalMessages = [...updatedMessages, agentMsg]

      const summarizedTitle = isFirstMsg
        ? summarizeResponseToTitle(response.response_text, query)
        : (chatTitle || summarizeResponseToTitle(response.response_text, query))

      setAllChats((prev) => ({
        ...prev,
        [effectiveAgentId]: { messages: finalMessages, title: summarizedTitle },
      }))
      saveChat(effectiveAgentId, finalMessages, summarizedTitle)
    } catch (err) {
      console.error('[Avai] Failed to get response:', err)
      const errorMsg = {
        id: nextId('err'),
        role: 'agent',
        pulavarId: effectiveAgentId,
        text: `மன்னிக்கவும், புலவர் அவையிலிருந்து மறுமொழி பெறுவதில் தடை ஏற்பட்டது (${err.message}). சிறிது நேரம் கழித்து மீண்டும் வினவவும்.`,
        timestamp: new Date().toISOString(),
      }
      const finalMessages = [...updatedMessages, errorMsg]
      setAllChats((prev) => ({
        ...prev,
        [effectiveAgentId]: { messages: finalMessages, title: tempTitle },
      }))
      saveChat(effectiveAgentId, finalMessages, tempTitle)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleTextareaChange = (e) => {
    setInputMessage(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`
  }

  const getVerseLink = (verseId) => {
    if (!verseId) return '/book'
    const parts = verseId.split('_')
    if (parts.length >= 2) {
      return `/book/${parts[0]}/${parts[1]}`
    }
    return `/book/${verseId}`
  }

  return (
    <div className="w-full px-4 sm:px-6 py-4 flex flex-col flex-1 h-full min-h-0 overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-line shrink-0">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Badge variant="accent" size="sm">
              <span className="flex items-center gap-1">
                <Sparkles size={12} />
                சங்க அவை பேரவை
              </span>
            </Badge>
            <span className="text-xs text-muted font-mono hidden md:inline">ADK பல்தொடர்பு</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-primary flex items-center gap-2">
            <span>சங்க அவை புலவர் பேரவை</span>
            <span className="tamil text-base font-medium text-muted">• புலவர் மன்றம்</span>
          </h1>
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => handleNewChat()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-accent text-on-accent font-medium text-xs shadow-sm"
          >
            <Plus size={14} />
            <span className="tamil">புதிய உரையாடல்</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileAgentDrawer(!mobileAgentDrawer)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-line bg-surface text-primary font-medium text-xs focus-ring shadow-sm"
          >
            <span className="text-base tamil">{activeAgent.nameTa[0]}</span>
            <span className="tamil">{activeAgent.nameTa}</span>
            <ChevronRight size={14} className="text-muted" />
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar + Chat Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-3 flex-1 min-h-0 h-0 overflow-hidden">
        {/* Desktop Sidebar: New Chat Button + Conversations + Pulavar Agent List */}
        <aside className="hidden lg:flex lg:col-span-3 flex-col space-y-4 h-full overflow-y-auto pr-1">
          {/* Prominent New Chat Button */}
          <button
            type="button"
            onClick={() => handleNewChat()}
            className="w-full py-2 px-3 rounded-xl border border-accent bg-accent/10 hover:bg-accent hover:text-on-accent text-accent transition-all duration-200 flex items-center justify-center gap-2 font-bold text-xs sm:text-sm focus-ring shadow-xs group shrink-0"
          >
            <Plus size={16} className="group-hover:scale-110 transition-transform" />
            <span className="tamil">புதிய உரையாடல் • New Chat</span>
          </button>

          {/* Active Conversations List */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                <MessageSquare size={12} className="text-accent" />
                உரையாடல்கள் • Recent Chats
              </span>
            </div>
            <div className="space-y-1">
              {PULAVAR_AGENTS.map((agent) => {
                const chatData = allChats[agent.id]
                const hasChat = chatData?.messages?.length > 0
                if (!hasChat) return null

                const titleText = chatData.title || `${agent.nameTa} உரையாடல்`

                return (
                  <button
                    key={`urayadal-${agent.id}`}
                    type="button"
                    onClick={() => handleSelectAgent(agent.id)}
                    className={`w-full text-left p-2 rounded-xl border transition-all duration-200 flex flex-col gap-0.5 focus-ring ${
                      agent.id === effectiveAgentId
                        ? 'bg-accent/10 border-accent text-primary font-medium'
                        : 'bg-surface-alt/40 border-line text-muted hover:bg-surface hover:border-line-strong'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span className="tamil text-xs font-bold text-primary truncate">
                        {titleText}
                      </span>
                      <span className="text-[10px] text-faint font-mono bg-surface/80 px-1 py-0.2 rounded shrink-0">
                        {agent.nameTa}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Pulavars Selection Section */}
          <div className="space-y-1.5 pt-2 border-t border-line/60">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                புலவர்கள் • Pulavars
              </span>
              <button
                type="button"
                onClick={() => handleNewChat()}
                className="p-1 rounded-lg border border-line bg-surface text-muted hover:text-primary transition-colors focus-ring"
                title="புதிய உரையாடல் தொடங்கவும்"
              >
                <Plus size={13} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {PULAVAR_AGENTS.map((agent) => {
                const isActive = agent.id === effectiveAgentId
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => handleSelectAgent(agent.id)}
                    className={`relative w-full aspect-square text-left p-1 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center focus-ring group ${
                      isActive
                        ? 'bg-accent/10 border-accent font-semibold text-primary'
                        : 'bg-surface-alt/40 border-line text-muted hover:bg-surface'
                    }`}
                  >
                    <span className="text-2xl leading-none group-hover:scale-110 transition-transform">
                      {agent.avatarEmoji}
                    </span>
                    <p className="tamil text-[11px] font-bold text-primary mt-1 truncate max-w-full px-0.5">
                      {agent.nameTa}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Detailed Enriched "சான்றாதாரத் தரவுத்தளம்" Card */}
          <Card variant="flat" className="p-3 space-y-2 border-dashed mt-auto bg-surface-alt/40">
            <div className="flex items-center justify-between text-xs font-bold text-primary pb-1 border-b border-line/50">
              <span className="flex items-center gap-1.5 tamil">
                <Database size={13} className="text-accent" />
                <span>சான்றாதாரத் தரவுத்தளம்</span>
              </span>
              <span className="text-[10px] font-mono text-faint">2,489 பாக்கள்</span>
            </div>

            <div className="space-y-1.5 text-[11px] text-muted leading-snug">
              <div className="flex items-start gap-1.5">
                <Layers size={12} className="text-accent shrink-0 mt-0.5" />
                <p>
                  <strong className="text-primary font-semibold">18 செவ்வியல் நூல்கள்:</strong> எட்டுத்தொகை (400 அகப்பாக்கள் உட்பட) & பத்துப்பாட்டு நெடும்பாக்கள்.
                </p>
              </div>

              <div className="flex items-start gap-1.5">
                <Network size={12} className="text-accent shrink-0 mt-0.5" />
                <p>
                  <strong className="text-primary font-semibold">அறிவு வரைபடம் (Knowledge Graph):</strong> 109 முப்பொருள் கணுக்கள், 292 திணை-கருப்பொருள் தொடர்புகள்.
                </p>
              </div>

              <div className="flex items-start gap-1.5">
                <BookOpen size={12} className="text-accent shrink-0 mt-0.5" />
                <p>
                  <strong className="text-primary font-semibold">சரிபார்க்கப்பட்ட சான்றுகள்:</strong> ஒவ்வொரு விடையும் <code className="font-mono text-[10px] text-accent bg-surface px-1 py-0.2 rounded border border-line">kurunthokai_40</code> வடிவில் பாடல் எண்ணுடன் சான்றளிக்கப்படும்.
                </p>
              </div>
            </div>
          </Card>
        </aside>

        {/* Main Chat Space */}
        <main className="col-span-1 lg:col-span-9 flex flex-col flex-1 h-full min-h-0 bg-surface rounded-2xl border border-line shadow-sm overflow-hidden">
          {/* Active Pulavar Header */}
          <header className="px-4 py-3 border-b border-line bg-surface-alt/30 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-surface border border-line shrink-0 flex items-center justify-center text-xl tamil font-bold">
                {activeAgent.nameTa[0]}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="tamil text-sm sm:text-base font-bold text-primary truncate">
                    {chatTitle || activeAgent.nameTa}
                  </h2>
                  <Badge variant="accent" size="sm">
                    {activeAgent.nameTa} • {activeAgent.tag}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleNewChat()}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-accent/50 bg-accent/10 text-accent hover:bg-accent hover:text-on-accent text-xs font-bold transition-all focus-ring"
                title="புதிய உரையாடல்"
              >
                <Plus size={13} />
                <span className="tamil hidden sm:inline">புதிய உரையாடல்</span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFilterOpen(!filterOpen)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all focus-ring ${
                    selectedTinai
                      ? 'border-accent bg-accent/10 text-accent font-semibold'
                      : 'border-line bg-surface text-muted hover:text-primary'
                  }`}
                >
                  <Filter size={12} />
                  <span className="hidden sm:inline">
                    {selectedTinai
                      ? TINAI_FILTER_OPTIONS.find((t) => t.id === selectedTinai)?.labelTa
                      : 'திணை சூழல்'}
                  </span>
                </button>

                {filterOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-surface border border-line rounded-xl shadow-xl p-1 z-50 space-y-0.5">
                    {TINAI_FILTER_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedTinai(opt.id)
                          setFilterOpen(false)
                        }}
                        className={`w-full text-left px-2 py-1 rounded-lg text-xs flex items-center justify-between ${
                          selectedTinai === opt.id
                            ? 'bg-accent/10 text-accent font-semibold'
                            : 'text-muted hover:bg-surface-alt'
                        }`}
                      >
                        <span className="tamil">{opt.labelTa}</span>
                        {selectedTinai === opt.id && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="p-1.5 rounded-lg border border-line bg-surface text-muted hover:text-danger focus-ring"
                  title="உரையாடலை அழிக்கவும்"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </header>

          {/* Messages Stream */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5 min-h-0 h-0">
            {messages.length === 0 && (
              <Reveal className="space-y-5 my-auto py-6">
                <div className="text-center max-w-lg mx-auto space-y-2.5">
                  <div className="inline-block p-1 rounded-2xl bg-surface-alt/60 border border-line text-4xl tamil font-bold flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mx-auto">
                    {activeAgent.nameTa[0]}
                  </div>
                  <h3 className="tamil text-lg sm:text-xl font-bold text-primary">
                    {activeAgent.nameTa} உடனான கலந்துரையாடல்
                  </h3>
                  <p className="text-xs text-muted leading-relaxed max-w-md mx-auto">
                    {activeAgent.bioTa}
                  </p>
                </div>

                <div className="space-y-2 max-w-xl mx-auto">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted text-center">
                    தொடக்க வினாக்கள்
                  </p>
                  <div className="space-y-1.5">
                    {activeAgent.suggestedPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(prompt.ta)}
                        className="w-full text-left p-3 rounded-xl border border-line bg-surface hover:border-accent hover:bg-accent/5 transition-all text-xs sm:text-sm text-primary group flex items-center justify-between gap-3 shadow-xs"
                      >
                        <p className="tamil font-medium text-primary group-hover:text-accent truncate">
                          {prompt.ta}
                        </p>
                        <Sparkles size={14} className="text-faint group-hover:text-accent shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}

            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user'

              return (
                <div
                  key={msg.id || idx}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-lg bg-surface-alt border border-line shrink-0 select-none flex items-center justify-center text-sm tamil font-bold mt-0.5">
                      {activeAgent.nameTa[0]}
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] sm:max-w-[82%] space-y-2 rounded-2xl px-3.5 py-3 text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[#d8c59f] dark:bg-[#3a3023] text-[#2c2013] dark:text-[#f3e9d8] border border-[#beaa82]/70 dark:border-[#524433] rounded-br-xs shadow-xs font-medium'
                        : 'bg-surface-alt/70 border border-line text-primary rounded-bl-xs'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-line/60 text-xs">
                        <span className="tamil font-bold text-accent">{activeAgent.nameTa}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.text, idx)}
                          className="p-0.5 text-faint hover:text-primary transition-colors"
                          title="மறுமொழியை நகலெடு"
                        >
                          {copiedIndex === idx ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        </button>
                      </div>
                    )}

                    <MessageContent text={msg.text} />

                    {msg.citations && msg.citations.length > 0 && (
                      <div className="pt-2 border-t border-line/60 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                          <BookOpen size={11} /> சான்றாதாரங்கள்
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.citations.map((c, cIdx) => (
                            <Link
                              key={cIdx}
                              to={getVerseLink(c.verse_id)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-accent/40 bg-surface text-accent hover:bg-accent hover:text-on-accent text-xs font-mono transition-all"
                            >
                              <span>{c.verse_id}</span>
                              <ExternalLink size={10} />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {isLoading && (
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-lg bg-surface-alt border border-line shrink-0 flex items-center justify-center text-sm tamil font-bold">
                  {activeAgent.nameTa[0]}
                </div>
                <div className="px-3.5 py-2.5 rounded-2xl bg-surface-alt/70 border border-line text-muted text-xs sm:text-sm flex items-center gap-2.5">
                  <RefreshCw size={14} className="animate-spin text-accent" />
                  <span className="tamil font-medium text-primary">{activeAgent.nameTa}</span>
                  <span>சிந்தனை ஓட்டத்துடன் ஆராய்கின்றார்...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <footer className="p-3 border-t border-line bg-surface shrink-0 space-y-2">
            <div className="flex items-center justify-between px-1 text-xs">
              <div className="flex items-center gap-1 text-muted">
                <button
                  type="button"
                  onClick={() => insertFormatting('**')}
                  className="p-1.5 rounded-md hover:bg-surface-alt text-muted hover:text-primary transition-colors"
                  title="தடிமன் (Bold)"
                >
                  <Bold size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('*')}
                  className="p-1.5 rounded-md hover:bg-surface-alt text-muted hover:text-primary transition-colors"
                  title="சாய்வு (Italic)"
                >
                  <Italic size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('>')}
                  className="p-1.5 rounded-md hover:bg-surface-alt text-muted hover:text-primary transition-colors"
                  title="செய்யுள் அடி (Stanza Quote)"
                >
                  <Quote size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('-')}
                  className="p-1.5 rounded-md hover:bg-surface-alt text-muted hover:text-primary transition-colors"
                  title="வரிசை (List)"
                >
                  <List size={13} />
                </button>
                {inputMessage && (
                  <button
                    type="button"
                    onClick={() => setInputMessage('')}
                    className="p-1.5 rounded-md hover:bg-surface-alt text-faint hover:text-danger transition-colors ml-1"
                    title="எழுத்தைத் துடைக்க"
                  >
                    <Eraser size={13} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoTranslateClick}
                  disabled={!inputMessage.trim()}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg border border-accent/40 bg-accent/10 text-accent hover:bg-accent hover:text-on-accent text-[11px] font-medium transition-all disabled:opacity-40"
                  title="உடனடித் தமிழ் மொழியாக்கம்"
                >
                  <Languages size={12} />
                  <span>ஆங்கிலம் ➔ தமிழ்</span>
                </button>

                <label className="flex items-center gap-1 text-[11px] text-muted cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoTranslateEnabled}
                    onChange={(e) => setAutoTranslateEnabled(e.target.checked)}
                    className="rounded border-line text-accent focus:ring-accent accent-accent"
                  />
                  <span>தானியங்கி மொழியாக்கம்</span>
                </label>
              </div>
            </div>

            <div className="flex items-end gap-2 bg-surface-alt/60 border border-line focus-within:border-accent rounded-xl p-2 shadow-inner">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={`சங்க இலக்கியம் குறித்து ${activeAgent.nameTa} இடம் கேளுங்கள்... (Enter அனுப்ப, Shift+Enter புதிய வரி)`}
                rows={1}
                className="flex-1 max-h-32 bg-transparent resize-none border-0 p-1 text-xs sm:text-sm text-primary placeholder:text-faint focus:outline-hidden leading-relaxed"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="shrink-0 rounded-lg px-3 py-2"
                aria-label="புலவருக்கு செய்தி அனுப்ப"
              >
                <Send size={14} />
              </Button>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}
