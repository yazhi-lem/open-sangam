import { useEffect, useRef, useState } from 'react'

/**
 * useInView — reports whether an element is on screen via IntersectionObserver.
 *
 * Lets expensive renderers (the 3D canvas) mount only when actually visible,
 * and unmount once scrolled away, so an "open world" with many zones doesn't
 * pay GPU/CPU cost for scenes the user isn't looking at.
 */
export function useInView({ rootMargin = '200px', once = false } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
        if (entry.isIntersecting && once) observer.disconnect()
      },
      { rootMargin }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [rootMargin, once])

  return [ref, inView]
}
