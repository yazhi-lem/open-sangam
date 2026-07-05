import * as THREE from 'three'

/**
 * Draw-once, reuse-everywhere emoji sprite textures.
 *
 * A zone with dozens of flora/fauna glyphs would otherwise rasterize the same
 * emoji glyph repeatedly (once per instance); caching by glyph keeps the cost
 * at "one canvas draw per unique symbol across the whole open world," which is
 * what makes scaling up instance counts per zone cheap.
 */
const textureCache = new Map()

function buildTexture(glyph) {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.font = `${size * 0.75}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(glyph, size / 2, size / 2 + size * 0.05)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function getEmojiTexture(glyph) {
  let texture = textureCache.get(glyph)
  if (!texture) {
    texture = buildTexture(glyph)
    textureCache.set(glyph, texture)
  }
  return texture
}
