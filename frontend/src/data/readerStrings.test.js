import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TRANSLATION_SOON, MEANING_SOON } from './readerStrings.js'

test('placeholder strings are exactly the reviewed wording (Kabilar)', () => {
  assert.equal(TRANSLATION_SOON.ta, 'ஆங்கில மொழிபெயர்ப்பு விரைவில்')
  assert.equal(MEANING_SOON.ta, 'ஆங்கிலப் பொருள் விரைவில்')
})

test('Tamil strings are NFC, have no invisible characters, no known misspelling, never use உரை for English', () => {
  for (const { ta } of [TRANSLATION_SOON, MEANING_SOON]) {
    assert.equal(ta, ta.normalize('NFC'))
    for (const ch of ['\u200b', '\u200c', '\u200d', '\u00a0', '\ufeff']) assert.ok(!ta.includes(ch))
    assert.doesNotMatch(ta, /\u0BC6\u0BB3/) // ெ + ள is not a Tamil syllable (ௌ is)
    assert.ok(!ta.includes('மொழிபெபர்ப்பு'), 'known typo')
    assert.ok(!ta.includes('ஆங்கில உரை'), 'உரை means commentary')
  }
})
