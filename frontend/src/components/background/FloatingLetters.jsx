import { forwardRef, useMemo } from 'react'
import StoneLetter from './StoneLetter'
import { generateLetters } from './constants'

/**
 * FloatingLetters — Layers 4 (far) & 5 (near) of the depth system.
 *
 * Renders two absolutely-positioned layers so ParallaxController (via
 * useParallax in BackgroundScene) can move them at different rates —
 * near letters drift further under mouse parallax than far ones, which is
 * what actually sells the depth rather than just the blur/size difference.
 *
 * forwardRef exposes the *near* layer's node (the one with the mouse
 * parallax + glow) since that's the layer callers need a ref to.
 */
const FloatingLetters = forwardRef(function FloatingLetters(
  { count, glowEnabled, farRef },
  nearRef
) {
  const letters = useMemo(() => generateLetters(count, glowEnabled), [count, glowEnabled])

  const far = useMemo(() => letters.filter((l) => l.depthBand === 'far'), [letters])
  const near = useMemo(() => letters.filter((l) => l.depthBand === 'near'), [letters])

  return (
    <>
      <div ref={farRef} className="sangam-bg__letters-far">
        {far.map((letter) => (
          <StoneLetter key={letter.id} letter={letter} />
        ))}
      </div>
      <div ref={nearRef} className="sangam-bg__letters-near">
        {near.map((letter) => (
          <StoneLetter key={letter.id} letter={letter} />
        ))}
      </div>
    </>
  )
})

export default FloatingLetters
