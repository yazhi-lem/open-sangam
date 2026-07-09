import useAppStore from '../store/useAppStore'

/**
 * useTheme — ergonomic wrapper around the theme slice of useAppStore.
 *
 * Returns the current theme ('light' | 'dark'), plus setTheme/toggleTheme
 * actions. The store already persists to localStorage and keeps the <html>
 * class + theme-color meta in sync, so components using this hook never
 * need to touch the DOM or localStorage directly.
 */
export function useTheme() {
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)

  return { theme, isDark: theme === 'dark', setTheme, toggleTheme }
}
