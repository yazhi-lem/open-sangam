/**
 * WorldStage — adaptive host for a Tiṇai zone's hero visual.
 *
 * Picks between the lightweight 2D SVG landscape and the full WebGL 3D scene
 * based on device capability (WebGL support, reduced-motion, low-end CPU/RAM),
 * lets the user override that choice, and only mounts the (heavy, code-split)
 * 3D canvas once the stage has actually scrolled into view.
 */
import { lazy, Suspense, useState } from 'react'
import useAppStore from '../../store/useAppStore'
import { useDeviceCapability } from '../../hooks/useDeviceCapability'
import { useInView } from '../../hooks/useInView'
import TinaiLandscape from './TinaiLandscape'

const TinaiScene3D = lazy(() => import('./TinaiScene3D'))
const FullscreenLandscape = lazy(() => import('./FullscreenLandscape'))

export default function WorldStage({ tinaiId }) {
  const { supportsWebGL, canRender3D, isLowTier } = useDeviceCapability()
  const worldRenderMode = useAppStore((s) => s.worldRenderMode)
  const setWorldRenderMode = useAppStore((s) => s.setWorldRenderMode)
  const [stageRef, inView] = useInView({ rootMargin: '150px' })
  const [fullscreen, setFullscreen] = useState(false)

  const effectiveMode = worldRenderMode === 'auto' ? (canRender3D ? '3d' : '2d') : worldRenderMode
  const show3D = supportsWebGL && effectiveMode === '3d' && inView

  return (
    <div ref={stageRef} className="space-y-2">
      {show3D ? (
        <Suspense fallback={<TinaiLandscape tinaiId={tinaiId} />}>
          <TinaiScene3D tinaiId={tinaiId} detail={isLowTier ? 'low' : 'high'} />
        </Suspense>
      ) : (
        <TinaiLandscape tinaiId={tinaiId} />
      )}

      <div className="flex justify-end items-center gap-2">
        {supportsWebGL && (
          <button
            onClick={() => setFullscreen(true)}
            className="text-[10px] px-2 py-1 rounded-md border border-line text-faint hover:text-muted transition-colors uppercase tracking-widest"
            title="Open immersive fullscreen landscape"
          >
            ⛶ Fullscreen
          </button>
        )}

        {supportsWebGL && (
          <div className="flex gap-1">
            {['auto', '3d', '2d'].map((mode) => (
              <button
                key={mode}
                onClick={() => setWorldRenderMode(mode)}
                className={`text-[10px] px-2 py-1 rounded-md border transition-colors uppercase tracking-widest
                  ${worldRenderMode === mode
                    ? 'border-accent/60 text-accent bg-accent/10'
                    : 'border-line text-faint hover:text-muted'
                  }`}
                title={mode === 'auto' ? 'Choose automatically for this device' : `Force ${mode.toUpperCase()} view`}
              >
                {mode}
              </button>
            ))}
          </div>
        )}
      </div>

      {fullscreen && (
        <Suspense fallback={null}>
          <FullscreenLandscape tinaiId={tinaiId} onClose={() => setFullscreen(false)} />
        </Suspense>
      )}
    </div>
  )
}
