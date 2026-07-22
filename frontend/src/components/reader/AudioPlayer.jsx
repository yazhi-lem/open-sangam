/**
 * AudioPlayer — plays recorded or synthesized recitation of a verse.
 */
import { useState, useRef } from 'react'

export default function AudioPlayer({ audioUrl, label = 'Listen to verse' }) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef(null)

  const toggle = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setPlaying(!playing)
  }

  if (!audioUrl) return null

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggle}
        aria-label={playing ? 'Pause audio recitation' : 'Play audio recitation'}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-alt border border-line-strong text-muted hover:text-primary hover:border-line-strong transition-colors text-sm focus-ring"
      >
        <span>{playing ? '⏸' : '▶'}</span>
        <span>{label}</span>
      </button>
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />
    </div>
  )
}
