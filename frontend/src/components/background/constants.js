/**
 * constants.js — data + deterministic generation for the Sangam ambient
 * background. Reuses the seeded PRNG from components/world/worldGen.js so
 * generation stays consistent with the rest of the codebase (same Mulberry32
 * generator the 3D world scenes use for flora/fauna scatter).
 */
import { seededRandom, hashString } from '../world/worldGen'

// A curated set of visually distinct Tamil letters — vowels and a few
// consonants with strong, recognizable strokes for the carved-stone look.
export const TAMIL_GLYPHS = [
  'ழ', 'ற', 'அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஐ', 'ஔ', 'ஞ',
  'ண', 'க', 'ச', 'த', 'ந', 'ம', 'ய', 'ர', 'ல', 'வ', 'ள', 'ஃ',
]

// Per-tier tuning. "high" = desktop, "mid" = tablet, "low" = phone / low-tier
// device (from useDeviceCapability). Keeps the same visual language at every
// tier, just fewer instances and lighter effects.
export const DETAIL_PRESETS = {
  high: { letters: 36, dust: 46, fogBlobs: 4, glowLetters: true },
  mid: { letters: 24, dust: 26, fogBlobs: 3, glowLetters: true },
  low: { letters: 14, dust: 12, fogBlobs: 2, glowLetters: false },
}

const FLOAT_VARIANTS = ['float-a', 'float-b', 'float-c', 'float-d']

/**
 * Deterministically generate the floating-letter field. Split into "far"
 * (smaller, dimmer, slower, no glow animation) and "near" (larger, brighter,
 * eligible for the pulsing golden glow) depth bands — this is Layers 4 & 5
 * from the brief.
 */
export function generateLetters(count, glowEnabled) {
  const rand = seededRandom(hashString('sangam-bg-letters') + count)
  const letters = []

  for (let i = 0; i < count; i++) {
    const isNear = i % 3 === 0 // ~1/3 near, 2/3 far — far outnumbers near in real depth fields
    const glyph = TAMIL_GLYPHS[Math.floor(rand() * TAMIL_GLYPHS.length)]

    letters.push({
      id: `letter-${i}`,
      glyph,
      depthBand: isNear ? 'near' : 'far',
      // Position as viewport percentages; a small margin keeps letters off
      // the very edges where they'd clip awkwardly.
      top: 4 + rand() * 92,
      left: 2 + rand() * 96,
      // Near letters render bigger and closer to full opacity; far letters
      // are small, faint, and slightly blurred to read as background.
      size: isNear ? 2.6 + rand() * 2.4 : 1.1 + rand() * 1.4, // rem
      opacity: isNear ? 0.22 + rand() * 0.2 : 0.08 + rand() * 0.12,
      rotation: (rand() - 0.5) * 50, // degrees
      parallaxDepth: isNear ? 10 + rand() * 10 : 2 + rand() * 4, // px at full tilt
      duration: 20 + rand() * 20, // seconds, per the 20-40s spec
      delay: -rand() * 30, // negative delay so the field never looks "just started"
      floatVariant: FLOAT_VARIANTS[Math.floor(rand() * FLOAT_VARIANTS.length)],
      glow: isNear && glowEnabled,
      glowDelay: -rand() * 6,
    })
  }

  return letters
}

/** Layer 3 — tiny drifting dust motes. */
export function generateDust(count) {
  const rand = seededRandom(hashString('sangam-bg-dust') + count)
  const motes = []

  for (let i = 0; i < count; i++) {
    motes.push({
      id: `dust-${i}`,
      top: rand() * 100,
      left: rand() * 100,
      size: 1 + rand() * 2.5, // px
      opacity: 0.15 + rand() * 0.35,
      duration: 14 + rand() * 22,
      delay: -rand() * 30,
      variant: FLOAT_VARIANTS[Math.floor(rand() * FLOAT_VARIANTS.length)],
    })
  }

  return motes
}

/** Layer 2 — slow-drifting volumetric fog blobs. */
export function generateFog(count) {
  const rand = seededRandom(hashString('sangam-bg-fog') + count)
  const blobs = []

  for (let i = 0; i < count; i++) {
    blobs.push({
      id: `fog-${i}`,
      top: -10 + rand() * 90,
      left: -20 + rand() * 110,
      width: 55 + rand() * 45, // vw
      duration: 55 + rand() * 40,
      delay: -rand() * 60,
      opacity: 0.12 + rand() * 0.14,
    })
  }

  return blobs
}
