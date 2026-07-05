/**
 * worldGen.js — deterministic procedural helpers shared by the 3D world scene.
 *
 * Keeping generation logic (terrain heightmaps, scattering) in plain functions
 * rather than baked into the Three.js component means new terrain types can be
 * added by extending HEIGHT_FNS, without touching rendering or instancing code.
 */

/** Mulberry32 — small, fast, deterministic PRNG so a zone's layout is stable across renders. */
export function seededRandom(seed) {
  let a = seed >>> 0
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashString(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return h
}

const HEIGHT_FNS = {
  peaks: (x, z) =>
    Math.sin(x * 0.9) * Math.cos(z * 0.7) * 1.1 +
    Math.sin(x * 2.1 + z) * 0.35 +
    Math.abs(Math.sin(x * 0.4) * Math.cos(z * 0.4)) * 0.8,
  rolling: (x, z) => Math.sin(x * 0.5) * Math.cos(z * 0.45) * 0.45 + Math.sin(z * 1.3) * 0.08,
  flat: (x, z) => Math.sin(x * 1.6) * Math.cos(z * 1.6) * 0.03,
  shore: (x, z) => Math.max(0, -z * 0.18) + Math.sin(x * 0.8) * 0.04,
  cracked: (x, z) => Math.sin(x * 3 + z * 2) * 0.025,
}

/** Terrain height at a given (x, z) for a named biome. Falls back to gentle rolling hills. */
export function terrainHeight(terrainType, x, z) {
  const fn = HEIGHT_FNS[terrainType] || HEIGHT_FNS.rolling
  return fn(x, z)
}

/**
 * Scatter `count` points across a square of `span` centered at origin, avoiding the
 * very center (kept clear for camera focus), deterministic per `seed`.
 */
export function scatterPoints(seed, count, span = 4.2) {
  const rand = seededRandom(seed)
  const points = []
  for (let i = 0; i < count; i++) {
    let x, z
    do {
      x = (rand() - 0.5) * span
      z = (rand() - 0.5) * span
    } while (Math.hypot(x, z) < span * 0.12)
    points.push({ x, z, scale: 0.75 + rand() * 0.5, rotationSeed: rand() })
  }
  return points
}
