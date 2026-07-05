import { create } from 'zustand'

const WORLD_RENDER_MODE_KEY = 'sangam:worldRenderMode'

function loadWorldRenderMode() {
  if (typeof localStorage === 'undefined') return 'auto'
  return localStorage.getItem(WORLD_RENDER_MODE_KEY) || 'auto'
}

/**
 * Global app store (Zustand).
 * Manages UI state: active Tiṇai, reader preferences, open overlays.
 */
const useAppStore = create((set) => ({
  // Reader
  activeTinai: null,
  setActiveTinai: (tinai) => set({ activeTinai: tinai }),

  // Glossary overlay
  activeWord: null,
  openGlossary: (word) => set({ activeWord: word }),
  closeGlossary: () => set({ activeWord: null }),

  // Cultural context overlay
  activeCulturalContext: null,
  openCulturalContext: (ctx) => set({ activeCulturalContext: ctx }),
  closeCulturalContext: () => set({ activeCulturalContext: null }),

  // Layer preference persisted per session
  preferredLayer: 'sangam',
  setPreferredLayer: (layer) => set({ preferredLayer: layer }),

  // Sangam World render mode: 'auto' picks 3D/2D based on device capability,
  // '3d'/'2d' are explicit user overrides, persisted across sessions.
  worldRenderMode: loadWorldRenderMode(),
  setWorldRenderMode: (mode) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(WORLD_RENDER_MODE_KEY, mode)
    set({ worldRenderMode: mode })
  },
}))

export default useAppStore
