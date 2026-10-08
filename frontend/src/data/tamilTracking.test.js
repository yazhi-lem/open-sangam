import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findViolations } from '../../scripts/check-tamil-tracking.mjs'

test('flags tracking on a .tamil element', () => {
  const hits = findViolations('<p className="tamil text-lg tracking-widest">x</p>')
  assert.equal(hits.length, 1)
})

test('flags tracking when literal text is Tamil, even across lines', () => {
  const src = '<span className="text-xs uppercase tracking-wider">\n  புலவர்கள் • Pulavars\n</span>'
  assert.equal(findViolations(src).length, 1)
})

test('ignores tracking on Latin-only text and tracking-normal on Tamil', () => {
  assert.equal(findViolations('<span className="uppercase tracking-wider">English Translation</span>').length, 0)
  assert.equal(findViolations('<p className="tamil tracking-normal">தமிழ்</p>').length, 0)
})

test('opt-out comment silences a deliberate exception', () => {
  assert.equal(findViolations('<p className="tamil tracking-wide">தமிழ்</p> {/* tamil-tracking-ok */}').length, 0)
})

test('flags tracking when Tamil follows an inline icon child', () => {
  const src = '<span className="uppercase tracking-wider flex">\n  <BookOpen size={11} /> சான்றாதாரங்கள்\n</span>'
  assert.equal(findViolations(src).length, 1)
})
