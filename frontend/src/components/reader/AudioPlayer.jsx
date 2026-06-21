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
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-800 border border-stone-700 text-stone-300 hover:text-white hover:border-stone-500 transition-colors text-sm"
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
