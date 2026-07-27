import { useEffect, useState } from 'react'

/**
 * usePrefersReducedMotion — reactive version of the `prefers-reduced-motion`
 * check used in components/motion/Reveal.jsx. That component reads the media
 * query once per render (cheap, since it only matters at mount); this hook
 * also subscribes to changes, since the ambient background lives for the
 * whole session and should react if the user flips the OS setting live.
 */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e) => setReduced(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return reduced
}
