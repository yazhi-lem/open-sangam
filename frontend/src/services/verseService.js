import { db } from './firebase'
import { collection, doc, getDocs, getDoc, query, orderBy } from 'firebase/firestore'

/**
 * Fetch all verses for a given poem from Firestore.
 * @param {string} poemId - e.g. 'maduraikanchi'
 * @returns {Promise<Array>}
 */
export async function getVerses(poemId) {
  const versesRef = collection(db, 'poems', poemId, 'verses')
  const q = query(versesRef, orderBy('number', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Fetch a single verse by its ID.
 * @param {string} poemId
 * @param {string} verseId
 * @returns {Promise<Object|null>}
 */
export async function getVerse(poemId, verseId) {
  const ref = doc(db, 'poems', poemId, 'verses', verseId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}
