import { create } from 'zustand'

const WORLD_RENDER_MODE_KEY = 'sangam:worldRenderMode'
const THEME_KEY = 'sangam:theme'

function loadWorldRenderMode() {
  if (typeof localStorage === 'undefined') return 'auto'
  return localStorage.getItem(WORLD_RENDER_MODE_KEY) || 'auto'
}

function loadTheme() {
  if (typeof document !== 'undefined') {
    // index.html already applied the correct class pre-hydration
    // (from localStorage, or system preference on first visit) — read it
    // back so React state and the DOM never disagree.
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  }
  return 'light'
}

function applyTheme(theme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
  const meta = document.getElementById('theme-color-meta')
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0c0a09' : '#faf9f7')
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

  // Command Palette state
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

  // Light/Dark theme. Initialized from the class index.html already applied
  // pre-hydration (localStorage choice, or system preference on first visit)
  // so there's never a mismatch between DOM and store on load.
  theme: loadTheme(),
  setTheme: (theme) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(THEME_KEY, theme)
    applyTheme(theme)
    set({ theme })
  },
  toggleTheme: () => set((state) => {
    const next = state.theme === 'dark' ? 'light' : 'dark'
    if (typeof localStorage !== 'undefined') localStorage.setItem(THEME_KEY, next)
    applyTheme(next)
    return { theme: next }
  }),
}))

export default useAppStore

