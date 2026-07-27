import { useEffect, useMemo, useRef, useState } from 'react'
import './background.css'
import { useTheme } from '../../hooks/useTheme'
import { useDeviceCapability } from '../../hooks/useDeviceCapability'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { useParallax } from '../../hooks/useParallax'
import { DETAIL_PRESETS } from './constants'
import FogLayer from './FogLayer'
import DustParticles from './DustParticles'
import FloatingLetters from './FloatingLetters'

/**
 * BackgroundScene — the ambient Sangam temple background.
 *
 * Mounted once in App.jsx, fixed behind all routed content. Only renders its
 * full cinematic form in dark mode: the light theme is a distinct "warm
 * editorial" aesthetic (see index.css) that this effect would fight rather
 * than complement, so light mode keeps its plain page background untouched
 * and this component renders nothing.
 */
export default function BackgroundScene() {
  const { isDark } = useTheme()
  // Only borrowing `isLowTier` (CPU/memory heuristic) for particle-count
  // scaling here — NOT `canRender3D`, which is WebGL-gated and meant for the
  // actual 3D world scene. This background is plain CSS/DOM, so it should
  // run fine even on devices without WebGL support.
  const { isLowTier } = useDeviceCapability()
  const prefersReducedMotion = usePrefersReducedMotion()
  const [revealed, setRevealed] = useState(false)
  const [tier, setTier] = useState(() => getSizeTier())

  // Track viewport width tier (desktop/tablet/mobile) for particle counts.
  // A resize listener rather than a one-time read, since rotating a tablet
  // or resizing a browser window shouldn't require a reload to adjust.
  useEffect(() => {
    let frame = null
    const onResize = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        setTier(getSizeTier())
        frame = null
      })
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => {
      window.removeEventListener('resize', onResize)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  // Fade the whole scene in shortly after mount (page-load requirement).
  // The individual layers stagger their own entrance via CSS transition-delay
  // isn't needed here — background.css's single opacity transition on
  // .sangam-bg already reads as fog/letters "arriving" together softly,
  // which looks calmer than a mechanical layer-by-layer sequence.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setRevealed(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const effectiveTier = isLowTier ? 'low' : tier
  const preset = DETAIL_PRESETS[effectiveTier] || DETAIL_PRESETS.high
  const animationsEnabled = !prefersReducedMotion

  const farRef = useRef(null)
  const nearRef = useRef(null)
  const dustRef = useRef(null)
  const fogRef = useRef(null)

  const parallaxLayers = useMemo(
    () => [
      { ref: fogRef, depth: 3 },
      { ref: dustRef, depth: 5 },
      { ref: farRef, depth: 6 },
      { ref: nearRef, depth: 14 },
    ],
    []
  )

  useParallax(parallaxLayers, { enabled: animationsEnabled && !isLowTier })

  // Only active in dark mode — the light theme keeps its untouched look.
  if (!isDark) return null

  return (
    <div className={`sangam-bg${revealed ? ' sangam-bg--revealed' : ''}`} aria-hidden="true">
      <div className="sangam-bg__gradient" style={{ animationPlayState: animationsEnabled ? 'running' : 'paused' }} />
      <div className="sangam-bg__grain" />
      <FogLayer ref={fogRef} count={preset.fogBlobs} />
      <DustParticles ref={dustRef} count={preset.dust} />
      <FloatingLetters
        ref={nearRef}
        farRef={farRef}
        count={preset.letters}
        glowEnabled={preset.glowLetters && animationsEnabled}
      />
    </div>
  )
}

function getSizeTier() {
  if (typeof window === 'undefined') return 'high'
  const width = window.innerWidth
  if (width < 640) return 'low'
  if (width < 1024) return 'mid'
  return 'high'
}
