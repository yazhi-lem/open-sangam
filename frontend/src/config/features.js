/**
 * Feature flags, resolved at build time.
 *
 * Avai (சங்க அவை) needs a deployed API (VITE_AVAI_API_URL) that does not exist
 * yet. Until the beta it is hidden from the nav, the home page and the router
 * in production builds. It stays on in `npm run dev`; to turn it on in a
 * production build set VITE_ENABLE_AVAI=true.
 */
export const AVAI_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_AVAI === 'true'
