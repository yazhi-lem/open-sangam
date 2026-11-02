import { useState } from 'react'
import { Volume2, Square } from 'lucide-react'
import useAppStore from '../../store/useAppStore'

export default function InlineVoiceButton({ text }) {
  const language = useAppStore((s) => s.language)
  const L = (ta, en) => (language === 'ta' ? ta : en)
  const [speaking, setSpeaking] = useState(false)

  function toggle() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ta-IN'
    utterance.rate = 0.9
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-muted hover:text-accent hover:border-accent transition-colors focus-ring"
      aria-label={speaking ? L('ஒலியை நிறுத்து', 'Stop voice') : L('ஒலிவாசிப்பு', 'Listen to verse')}
    >
      {speaking ? <Square size={12} /> : <Volume2 size={12} />}
      <span>{L('ஒலி', 'Voice')}</span>
    </button>
  )
}
