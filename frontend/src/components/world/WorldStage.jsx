/**
 * WorldStage — adaptive host for a Tiṇai zone's hero visual.
 *
 * Picks between the lightweight 2D SVG landscape and the full WebGL 3D scene
 * based on device capability (WebGL support, reduced-motion, low-end CPU/RAM),
 * lets the user override that choice, and only mounts the (heavy, code-split)
 * 3D canvas once the stage has actually scrolled into view.
 */
import { lazy, Suspense } from 'react'
import useAppStore from '../../store/useAppStore'
import { useDeviceCapability } from '../../hooks/useDeviceCapability'
import { useInView } from '../../hooks/useInView'
import TinaiLandscape from './TinaiLandscape'

const TinaiScene3D = lazy(() => import('./TinaiScene3D'))

export default function WorldStage({ tinaiId }) {
  const { supportsWebGL, canRender3D, isLowTier } = useDeviceCapability()
  const worldRenderMode = useAppStore((s) => s.worldRenderMode)
  const setWorldRenderMode = useAppStore((s) => s.setWorldRenderMode)
  const [stageRef, inView] = useInView({ rootMargin: '150px' })

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

      {supportsWebGL && (
        <div className="flex justify-end gap-1">
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
  )
}
