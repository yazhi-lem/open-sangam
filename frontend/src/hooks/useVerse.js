import { useState, useEffect } from 'react'
import { getVerses } from '../services/verseService'

/**
 * useVerse — fetches verses for a given poem and manages current index state.
 */
export function useVerse(poemId) {
  const [verses, setVerses] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!poemId) return
    setLoading(true)
    setError(null)
    setCurrentIndex(0)

    getVerses(poemId)
      .then(setVerses)
      .catch((err) => setError(err.message || 'Failed to load verses'))
      .finally(() => setLoading(false))
  }, [poemId])

  return { verses, currentIndex, setCurrentIndex, loading, error }
}
