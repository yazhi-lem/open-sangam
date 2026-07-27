import { useEffect, useRef } from 'react'

/**
 * useParallax — smooth cursor-driven parallax for a set of layered elements.
 *
 * Deliberately bypasses React state for the per-frame work: mousemove can
 * fire dozens of times a second, and routing that through setState would
 * re-render the whole background tree every time. Instead we track a target
 * offset from the pointer, ease a "current" offset toward it every
 * animation frame, and write the resulting transform straight to each
 * layer's DOM node. Near layers (higher `depth`) move further than far ones,
 * matching how real depth-of-field parallax reads.
 *
 * @param {Array<{ ref: React.RefObject<HTMLElement>, depth: number }>} layers
 * @param {{ enabled?: boolean }} options - disable entirely (e.g. reduced motion)
 */
export function useParallax(layers, { enabled = true } = {}) {
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })
  const raf = useRef(null)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    const handlePointerMove = (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2 // -1..1
      const ny = (e.clientY / window.innerHeight - 0.5) * 2
      target.current.x = nx
      target.current.y = ny
    }

    // Pointer leaving the viewport eases back to center rather than
    // snapping, so the scene settles gently instead of jumping.
    const handlePointerLeave = () => {
      target.current.x = 0
      target.current.y = 0
    }

    const tick = () => {
      const ease = 0.06
      current.current.x += (target.current.x - current.current.x) * ease
      current.current.y += (target.current.y - current.current.y) * ease

      for (const { ref, depth } of layers) {
        const node = ref.current
        if (!node) continue
        const dx = current.current.x * depth
        const dy = current.current.y * depth
        node.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`
      }

      raf.current = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', handlePointerMove, { passive: true })
    window.addEventListener('mouseleave', handlePointerLeave)
    raf.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('mouseleave', handlePointerLeave)
      if (raf.current) cancelAnimationFrame(raf.current)
    }
    // `layers` is an array of refs built fresh each render; only its length
    // (the set of layers) and `enabled` should ever actually change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, layers.length])
}
