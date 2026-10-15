'use strict'

// Shared request guards for the public Cloud Functions (/translate,
// /analyze-word). They are open to the web, and every call spends model
// tokens, so each request is checked for origin, size, type and rate before
// the model is touched.

const DEFAULT_ORIGINS = [
  'https://sangam.yazhi.dev',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]

// Comma-separated list in ALLOWED_ORIGINS overrides the defaults.
function allowedOrigins(env = process.env) {
  const raw = env.ALLOWED_ORIGINS
  if (!raw) return DEFAULT_ORIGINS
  const list = raw.split(',').map((o) => o.trim()).filter(Boolean)
  return list.length ? list : DEFAULT_ORIGINS
}

const MAX_VERSE_CHARS = 2000
const MAX_WORD_CHARS = 60
const TARGET_LANGS = ['english', 'urai']

// Returns a trimmed string, or null if the value is missing, not a string,
// or longer than `max`.
function cleanText(value, max) {
  if (typeof value !== 'string') return null
  const text = value.trim()
  if (!text || text.length > max) return null
  return text
}

// Per-client sliding-window limiter, in-process only (like the Avai API's):
// good enough for a few instances, not a replacement for an edge limit.
function createRateLimiter({ limit, windowMs = 60000, now = Date.now } = {}) {
  const hits = new Map()
  return function check(key) {
    if (!limit || limit <= 0) return true
    const t = now()
    const recent = (hits.get(key) || []).filter((h) => t - h < windowMs)
    if (recent.length >= limit) {
      hits.set(key, recent)
      return false
    }
    recent.push(t)
    hits.set(key, recent)
    if (hits.size > 5000) {
      for (const [k, v] of hits) {
        if (!v.some((h) => t - h < windowMs)) hits.delete(k)
      }
    }
    return true
  }
}

// Rightmost X-Forwarded-For entry is the one added by Google's front end;
// earlier entries are client-supplied and can be rotated to dodge the limit.
function clientKey(req) {
  const forwarded = (req.headers && req.headers['x-forwarded-for']) || ''
  if (forwarded) return forwarded.split(',').pop().trim()
  return req.ip || 'unknown'
}

module.exports = {
  allowedOrigins,
  cleanText,
  createRateLimiter,
  clientKey,
  MAX_VERSE_CHARS,
  MAX_WORD_CHARS,
  TARGET_LANGS,
}
