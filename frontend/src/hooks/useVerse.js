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

    getVerses(poemId)
      .then(verses => {
        setVerses(verses)
        setCurrentIndex(0)
      })
      .catch((err) => setError(err.message || 'Failed to load verses'))
      .finally(() => setLoading(false))

    return () => {
      setLoading(true)
      setError(null)
    }
  }, [poemId])

  return { verses, currentIndex, setCurrentIndex, loading, error }
}
