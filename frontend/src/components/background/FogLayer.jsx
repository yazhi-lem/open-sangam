import { forwardRef, useMemo } from 'react'
import { generateFog } from './constants'

/** FogLayer — Layer 2 of the depth system: slow, semi-transparent fog blobs. */
const FogLayer = forwardRef(function FogLayer({ count }, ref) {
  const blobs = useMemo(() => generateFog(count), [count])

  return (
    <div ref={ref} className="sangam-bg__fog-layer">
      {blobs.map((blob) => (
        <div
          key={blob.id}
          className="sangam-bg__fog-blob"
          style={{
            top: `${blob.top}%`,
            left: `${blob.left}%`,
            width: `${blob.width}vw`,
            opacity: blob.opacity,
            animationDuration: `${blob.duration}s`,
            animationDelay: `${blob.delay}s`,
          }}
        />
      ))}
    </div>
  )
})

export default FogLayer
