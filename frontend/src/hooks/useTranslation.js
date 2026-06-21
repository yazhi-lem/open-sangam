import { useState } from 'react'
import { translateVerse } from '../services/geminiApi'

/**
 * useTranslation — on-demand AI translation via Gemini 2.5 Flash.
 */
export function useTranslation() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const translate = async (verseText, targetLang = 'english') => {
    setLoading(true)
    setError(null)
    try {
      const translation = await translateVerse(verseText, targetLang)
      setResult(translation)
      return translation
    } catch (err) {
      setError(err.message || 'Translation failed')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { result, loading, error, translate }
}
