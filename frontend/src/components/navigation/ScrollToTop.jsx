import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Reset the viewport to the top on every route change.
 *
 * Two details matter here and both were bugs before:
 *
 * 1. `useLayoutEffect`, not `useEffect` — the reset has to happen before the
 *    browser paints the new route, otherwise the new screen flashes at the
 *    previous scroll offset and only then jumps.
 * 2. `scroll-behavior: smooth` is set globally on `html` (src/index.css), and it
 *    applies to programmatic scrolling too, so a plain `window.scrollTo(0, 0)`
 *    animates and can be interrupted. The behaviour is pinned to `auto` for the
 *    duration of the reset so the new screen starts at the top, not en route.
 *
 * The reader keeps its own scroll container (see Reader.jsx), which is handled
 * there by remounting the container per work — `window` scrolling does not
 * touch it.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    const html = document.documentElement
    const previous = html.style.scrollBehavior
    html.style.scrollBehavior = 'auto'
    window.scrollTo(0, 0)
    if (document.body) document.body.scrollTop = 0
    html.scrollTop = 0
    html.style.scrollBehavior = previous
  }, [pathname])

  return null
}
