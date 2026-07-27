import { memo } from 'react'

/**
 * StoneLetter — one carved-stone Tamil glyph.
 *
 * All per-instance randomness (position, size, rotation, timing) is passed
 * in as CSS custom properties rather than baked into unique per-element
 * @keyframes rules — with up to ~36 of these on screen, generating a fresh
 * keyframe block per letter would bloat the stylesheet and cost more to
 * parse than reusing the four shared drift paths in background.css.
 */
function StoneLetter({ letter }) {
  const style = {
    top: `${letter.top}%`,
    left: `${letter.left}%`,
    fontSize: `${letter.size}rem`,
    opacity: letter.opacity,
    '--r': `${letter.rotation}deg`,
    '--o': letter.opacity,
    '--float-anim': `sangam-${letter.floatVariant}`,
    '--float-duration': `${letter.duration}s`,
    '--float-delay': `${letter.delay}s`,
    '--glow-delay': `${letter.glowDelay}s`,
  }

  return (
    <span
      className={`sangam-bg__letter${letter.glow ? ' sangam-bg__letter--glow' : ''}`}
      style={style}
      aria-hidden="true"
    >
      {letter.glyph}
    </span>
  )
}

export default memo(StoneLetter)
