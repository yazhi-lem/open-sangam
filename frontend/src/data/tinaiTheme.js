/**
 * tinaiTheme.js — canonical visual-token registry for the five Tiṇai zones.
 *
 * TINAI_WORLD (tinaiWorld.js) owns the *content* (lore, flora, fauna, deity, poetry).
 * This file owns the *rendering* tokens shared by every world renderer — the 2D SVG
 * hero (TinaiLandscape), the map tiles (TinaiMap), and the 3D scene (TinaiScene3D).
 *
 * Adding a new zone/biome only requires an entry here plus a TINAI_WORLD entry —
 * no renderer component needs to change.
 */

export const TINAI_VISUAL = {
  kurinji: {
    terrain: 'peaks',       // jagged mountain displacement
    sky: { top: '#1e1b4b', bottom: '#0f0a29' },
    fog: '#1e1b4b',
    ground: '#3b2f6b',
    groundAccent: '#211a45',
    ambientLight: '#8b7bd8',
    keyLight: '#a78bfa',
    sun: null,
    water: false,
    stars: true,
  },
  mullai: {
    terrain: 'rolling',     // soft forest hills
    sky: { top: '#052e1e', bottom: '#031a12' },
    fog: '#0a3a26',
    ground: '#1c4a30',
    groundAccent: '#0f2e1d',
    ambientLight: '#6ee7a8',
    keyLight: '#34d399',
    sun: null,
    water: false,
    stars: false,
  },
  marutam: {
    terrain: 'flat',        // river-delta paddies
    sky: { top: '#4a3308', bottom: '#2b1c05' },
    fog: '#4a3308',
    ground: '#7a5a12',
    groundAccent: '#4a3708',
    ambientLight: '#fde68a',
    keyLight: '#fbbf24',
    sun: null,
    water: true,
    stars: false,
  },
  neytal: {
    terrain: 'shore',       // beach shelving into sea
    sky: { top: '#082f49', bottom: '#041c2e' },
    fog: '#0c4a6e',
    ground: '#d4c48f',
    groundAccent: '#0c4a6e',
    ambientLight: '#7dd3fc',
    keyLight: '#38bdf8',
    sun: null,
    water: true,
    stars: false,
  },
  palai: {
    terrain: 'cracked',     // scorched flat wasteland
    sky: { top: '#431407', bottom: '#2b0a03' },
    fog: '#431407',
    ground: '#7c2d12',
    groundAccent: '#431407',
    ambientLight: '#fdba74',
    keyLight: '#fb923c',
    sun: '#fed7aa',
    water: false,
    stars: false,
  },
}

const DEFAULT_VISUAL = TINAI_VISUAL.mullai

/** Look up 3D/lighting tokens for a zone, falling back to a safe default for unknown ids. */
export function getVisualTheme(tinaiId) {
  return TINAI_VISUAL[tinaiId] || DEFAULT_VISUAL
}
