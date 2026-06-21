import { create } from 'zustand'

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
}))

export default useAppStore
