/**
 * geminiApi.js — client-side wrapper that calls the Firebase Cloud Function
 * which proxies requests to the Gemini 2.5 Flash API.
 * The API key is kept server-side and never exposed to the browser.
 */

const FUNCTIONS_BASE_URL = import.meta.env.VITE_FUNCTIONS_URL || 'http://127.0.0.1:5001'

/**
 * Translate a Sangam Tamil verse to the requested target language.
 * @param {string} verseText - Original Sangam Tamil verse
 * @param {'english'|'urai'} targetLang
 * @returns {Promise<{ text: string, model: string }>}
 */
export async function translateVerse(verseText, targetLang = 'english') {
  const res = await fetch(`${FUNCTIONS_BASE_URL}/translate`, {
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
  const res = await fetch(`${FUNCTIONS_BASE_URL}/analyze-word`, {
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
