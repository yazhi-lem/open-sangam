import { useEffect, useState } from 'react'
import { Pause, Play, Square } from 'lucide-react'
import Button from '../ui/Button'

export default function VoiceLayer({ text, language = 'ta-IN' }) {
  const [supported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window)
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)
  const [rate, setRate] = useState(0.9)

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  function play() {
    if (!supported || !text) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language
    utterance.rate = rate
    utterance.onend = () => {
      setSpeaking(false)
      setPaused(false)
    }
    utterance.onerror = () => {
      setSpeaking(false)
      setPaused(false)
    }
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
    setPaused(false)
  }

  function pause() {
    if (!supported) return
    if (paused) {
      window.speechSynthesis.resume()
      setPaused(false)
    } else {
      window.speechSynthesis.pause()
      setPaused(true)
    }
  }

  function stop() {
    if (!supported) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
    setPaused(false)
  }

  if (!supported) {
    return <p className="text-sm text-faint">Voice recitation is not supported in this browser.</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="primary" icon={<Play size={14} />} onClick={play} disabled={!text}>
          Play
        </Button>
        <Button size="sm" variant="outline" icon={<Pause size={14} />} onClick={pause} disabled={!speaking}>
          {paused ? 'Resume' : 'Pause'}
        </Button>
        <Button size="sm" variant="ghost" icon={<Square size={14} />} onClick={stop} disabled={!speaking}>
          Stop
        </Button>
        <label className="ml-auto flex items-center gap-2 text-xs text-muted">
          Speed
          <input
            type="range"
            min="0.6"
            max="1.3"
            step="0.1"
            value={rate}
            onChange={(event) => setRate(Number(event.target.value))}
            className="w-24 accent-[var(--accent)]"
          />
          <span className="font-mono">{rate.toFixed(1)}×</span>
        </label>
      </div>
      <p className="text-xs text-faint">
        Browser speech synthesis reads the Tamil text. A scholar-recorded recitation can replace this layer later.
      </p>
    </div>
  )
}
