'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const {
  allowedOrigins,
  cleanText,
  createRateLimiter,
  clientKey,
} = require('../src/guards')

test('allowedOrigins defaults to the site and local dev, never "*"', () => {
  const list = allowedOrigins({})
  assert.ok(list.includes('https://sangam.yazhi.dev'))
  assert.ok(!list.includes('*'))
})

test('allowedOrigins reads ALLOWED_ORIGINS', () => {
  assert.deepEqual(
    allowedOrigins({ ALLOWED_ORIGINS: ' https://a.example , https://b.example ' }),
    ['https://a.example', 'https://b.example'],
  )
})

test('cleanText rejects non-strings, empty and oversized input', () => {
  assert.equal(cleanText(undefined, 10), null)
  assert.equal(cleanText({ a: 1 }, 10), null)
  assert.equal(cleanText('   ', 10), null)
  assert.equal(cleanText('x'.repeat(11), 10), null)
  assert.equal(cleanText('  யாயும்  ', 10), 'யாயும்')
})

test('rate limiter blocks after the limit and recovers after the window', () => {
  let t = 0
  const check = createRateLimiter({ limit: 2, windowMs: 1000, now: () => t })
  assert.equal(check('a'), true)
  assert.equal(check('a'), true)
  assert.equal(check('a'), false)
  assert.equal(check('b'), true)
  t = 1500
  assert.equal(check('a'), true)
})

test('rate limiter with limit 0 is disabled', () => {
  const check = createRateLimiter({ limit: 0 })
  for (let i = 0; i < 50; i++) assert.equal(check('a'), true)
})

test('clientKey uses the rightmost X-Forwarded-For entry', () => {
  assert.equal(clientKey({ headers: { 'x-forwarded-for': '1.1.1.1, 2.2.2.2' } }), '2.2.2.2')
  assert.equal(clientKey({ headers: {}, ip: '3.3.3.3' }), '3.3.3.3')
})
