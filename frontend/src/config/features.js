/**
 * Feature flags, resolved at build time.
 *
 * Avai (சங்க அவை) needs a deployed API (VITE_AVAI_API_URL). It stays on in
 * `npm run dev` (the Vite proxy handles it). Production builds require both
 * VITE_ENABLE_AVAI=true and a real VITE_AVAI_API_URL, so merging the launch
 * flag before the backend secret exists cannot expose a broken /avai route.
 */
export const AVAI_ENABLED = import.meta.env.DEV
  ? true
  : import.meta.env.VITE_ENABLE_AVAI === 'true' &&
    Boolean(import.meta.env.VITE_AVAI_API_URL)
