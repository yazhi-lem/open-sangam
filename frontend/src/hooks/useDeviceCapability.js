import { useState } from 'react'

/**
 * useDeviceCapability — one-time detection of whether this device/browser
 * can comfortably run the WebGL 3D world renderer.
 *
 * Used to pick a sane default render mode (3D vs 2D) and a detail tier
 * (instance/particle counts) so the open world scales down gracefully on
 * low-end phones instead of dropping frames or draining battery.
 */
function detect() {
  if (typeof window === 'undefined') {
    return { supportsWebGL: false, prefersReducedMotion: false, isLowTier: false, canRender3D: false, tier: 'low' }
  }

  const supportsWebGL = (() => {
    try {
      const canvas = document.createElement('canvas')
      return !!(
        canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')
      )
    } catch {
      return false
    }
  })()

  const prefersReducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const cores = navigator.hardwareConcurrency || 4
  const memory = navigator.deviceMemory || 4 // deviceMemory is Chromium-only; default to mid-tier
  const isLowTier = cores <= 4 || memory <= 4

  const canRender3D = supportsWebGL && !prefersReducedMotion

  return {
    supportsWebGL,
    prefersReducedMotion,
    isLowTier,
    canRender3D,
    tier: isLowTier ? 'low' : 'high',
  }
}

let cached = null

export function useDeviceCapability() {
  const [capability] = useState(() => {
    if (!cached) cached = detect()
    return cached
  })
  return capability
}
