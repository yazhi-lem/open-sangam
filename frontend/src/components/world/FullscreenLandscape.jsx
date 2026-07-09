/**
 * FullscreenLandscape — immersive, viewport-filling view of a Tiṇai zone's
 * terrain mesh only. No flora/fauna glyphs, water, sun, or stars — just the
 * landscape geometry, sky, and orbit controls, so it stays light enough to
 * fill the whole screen at high detail.
 */
import { createPortal } from 'react-dom'
import { lazy, Suspense, useEffect } from 'react'
import { useDeviceCapability } from '../../hooks/useDeviceCapability'

const TinaiScene3D = lazy(() => import('./TinaiScene3D'))

export default function FullscreenLandscape({ tinaiId, onClose }) {
  const { isLowTier } = useDeviceCapability()

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black">
      <Suspense fallback={<div className="flex h-full items-center justify-center text-stone-500 text-sm">Loading landscape…</div>}>
        <TinaiScene3D tinaiId={tinaiId} detail={isLowTier ? 'low' : 'high'} meshOnly fullscreen />
      </Suspense>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-xs text-white/80 hover:text-white hover:bg-black/60 transition-colors backdrop-blur-sm"
      >
        ✕ Exit fullscreen
      </button>
    </div>,
    document.body
  )
}
