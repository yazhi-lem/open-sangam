import { useEffect, useState } from 'react'
import audioManager from '../../services/AudioManager'

export default function SoundToggle() {
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    const unsubscribe = audioManager.subscribe((isMuted) => {
      setMuted(isMuted)
    })
    return () => unsubscribe()
  }, [])

  return (
    <button
      type="button"
      onClick={() => audioManager.setMute(!muted)}
      className="p-2.5 rounded-xl text-muted hover:text-primary hover:bg-surface-alt/60 focus-ring transition-all flex items-center justify-center hover:scale-105 active:scale-95"
      aria-label={muted ? 'Unmute nature soundscapes' : 'Mute nature soundscapes'}
      title={muted ? 'Unmute nature soundscapes' : 'Mute nature soundscapes'}
    >
      {muted ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M22 9l-6 6M16 9l6 6" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          className="text-accent animate-pulse"
        >
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </button>
  )
}
