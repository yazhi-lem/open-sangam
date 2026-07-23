/**
 * AudioPlayer — plays recorded or synthesized recitation of a verse.
 * Shows a waveform placeholder and elapsed time while playing.
 */
import { useState, useRef, useEffect } from 'react'

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M5 3l14 9-14 9V3z"/>
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16" rx="1"/>
      <rect x="14" y="4" width="4" height="16" rx="1"/>
    </svg>
  )
}

function formatTime(secs) {
  if (!isFinite(secs)) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function AudioPlayer({ audioUrl, label = 'Listen to verse' }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)     // 0–1
  const [current, setCurrent]   = useState(0)     // seconds
  const [duration, setDuration] = useState(0)     // seconds
  const audioRef = useRef(null)

  useEffect(() => {
    const el = audioRef.current
    if (!el) return

    const onTimeUpdate = () => {
      setCurrent(el.currentTime)
      setProgress(el.duration ? el.currentTime / el.duration : 0)
    }
    const onLoadedMeta = () => setDuration(el.duration)
    const onEnded = () => { setPlaying(false); setProgress(0); setCurrent(0) }

    el.addEventListener('timeupdate', onTimeUpdate)
    el.addEventListener('loadedmetadata', onLoadedMeta)
    el.addEventListener('ended', onEnded)
    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate)
      el.removeEventListener('loadedmetadata', onLoadedMeta)
      el.removeEventListener('ended', onEnded)
    }
  }, [])

  const toggle = () => {
    if (!audioRef.current) return
    if (playing) { audioRef.current.pause() } else { audioRef.current.play() }
    setPlaying(!playing)
  }

  const seek = (e) => {
    const el = audioRef.current
    if (!el || !el.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const ratio = Math.max(0, Math.min(1, x / rect.width))
    el.currentTime = ratio * el.duration
    setProgress(ratio)
  }

  if (!audioUrl) return null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        {/* Play/Pause button */}
        <button
          onClick={toggle}
          aria-label={playing ? 'Pause audio recitation' : 'Play audio recitation'}
          className="w-9 h-9 rounded-full bg-accent text-on-accent flex items-center justify-center hover:bg-accent-strong transition-colors focus-ring shadow-sm shrink-0"
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>

        {/* Progress bar + label */}
        <div className="flex-1 space-y-1 min-w-0">
          <p className="text-xs font-medium text-muted truncate">{label}</p>

          {/* Seekable progress bar */}
          <button
            type="button"
            className="w-full h-1.5 rounded-full bg-line-strong overflow-hidden cursor-pointer focus-ring"
            onClick={seek}
            aria-label="Seek audio"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            role="slider"
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-150"
              style={{ width: `${progress * 100}%` }}
            />
          </button>
        </div>

        {/* Time */}
        <span className="text-[10px] font-mono text-faint shrink-0 tabular-nums">
          {formatTime(current)}
          {duration > 0 && ` / ${formatTime(duration)}`}
        </span>
      </div>

      <audio ref={audioRef} src={audioUrl} className="hidden" preload="metadata" />
    </div>
  )
}
