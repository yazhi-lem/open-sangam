/**
 * geminiApi.js — client-side wrapper that calls the Firebase Cloud Function
 * which proxies requests to the Gemini 2.5 Flash API.
 * The API key is kept server-side and never exposed to the browser.
 */

// The emulator default is for local development only; a production build without
// VITE_FUNCTIONS_URL calls same-origin paths and fails cleanly instead of
// reaching for the visitor's localhost.
/**
 * Resolves the URL for a backend function endpoint.
 * - If VITE_FUNCTIONS_URL is explicitly set:
 *   - If pointed at a bare emulator root (e.g. http://127.0.0.1:5001), routes to
 *     http://127.0.0.1:5001/<project-id>/us-central1/<endpoint>
 *   - Otherwise uses the configured base URL + endpoint
 * - If VITE_FUNCTIONS_URL is empty (default):
 *   - Uses relative path `/${endpoint}`. Vite proxies this in dev and
 *     Firebase Hosting rewrites route it to the Cloud Function in production.
 */
function getEndpointUrl(endpoint) {
  const base = (import.meta.env.VITE_FUNCTIONS_URL || '').replace(/\/$/, '')
  if (!base) {
    return `/${endpoint}`
  }
  if (/^https?:\/\/(127\.0\.0\.1|localhost):5001\/?$/.test(base)) {
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'open-sangam'
    const fnName = endpoint === 'analyze-word' ? 'analyzeWord' : endpoint
    return `${base}/${projectId}/us-central1/${fnName}`
  }
  return `${base}/${endpoint}`
}

/**
 * Translate a Sangam Tamil verse to the requested target language.
 * @param {string} verseText - Original Sangam Tamil verse
 * @param {'english'|'urai'} targetLang
 * @returns {Promise<{ text: string, model: string }>}
 */
export async function translateVerse(verseText, targetLang = 'english') {
  const url = getEndpointUrl('translate')
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verse: verseText, targetLang }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Translation request failed (${res.status})`)
  }
  return res.json()
}

/**
 * Fetch etymological analysis for a single word.
 * @param {string} word - Tamil word in original script
 * @returns {Promise<{ root: string, urichol: string, etymology: string, gloss: string }>}
 */
export async function analyzeWord(word) {
  const url = getEndpointUrl('analyze-word')
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Word analysis failed (${res.status})`)
  }
  return res.json()
}
