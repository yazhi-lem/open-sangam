import { forwardRef, useMemo } from 'react'
import { generateDust } from './constants'

/** DustParticles — Layer 3 of the depth system: tiny drifting temple dust. */
const DustParticles = forwardRef(function DustParticles({ count }, ref) {
  const motes = useMemo(() => generateDust(count), [count])

  return (
    <div ref={ref} className="sangam-bg__dust-layer">
      {motes.map((mote) => (
        <div
          key={mote.id}
          className="sangam-bg__mote"
          style={{
            top: `${mote.top}%`,
            left: `${mote.left}%`,
            width: `${mote.size}px`,
            height: `${mote.size}px`,
            '--o': mote.opacity,
            animationName: 'sangam-dust-drift',
            animationDuration: `${mote.duration}s`,
            animationDelay: `${mote.delay}s`,
          }}
        />
      ))}
    </div>
  )
})

export default DustParticles
