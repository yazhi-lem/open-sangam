const { onRequest } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')
const admin = require('firebase-admin')
const cors = require('cors')({ origin: true })
const { GoogleGenerativeAI } = require('@google/generative-ai')

admin.initializeApp()

const geminiApiKey = defineSecret('GEMINI_API_KEY')

// ---------------------------------------------------------------------------
// POST /translate
// Body: { verse: string, targetLang: 'english' | 'urai' }
// ---------------------------------------------------------------------------
exports.translate = onRequest({ secrets: [geminiApiKey] }, (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' })
    }

    const { verse, targetLang = 'english' } = req.body
    if (!verse) {
      return res.status(400).json({ message: '`verse` is required' })
    }

    const langLabel = targetLang === 'urai'
      ? 'contemporary Tamil prose (Urai — உரை)'
      : 'contemporary English'

    const prompt = [
      'You are a classical Tamil scholar specializing in Sangam literature (c. 300 BCE – 300 CE).',
      `Translate the following Sangam Tamil verse into ${langLabel}.`,
      'Preserve poetic nuance and cultural context. Keep the translation concise and accurate.',
      '',
      'Verse:',
      verse,
      '',
      'Return ONLY the translation, no preamble or explanation.',
    ].join('\n')

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey.value())
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      const result = await model.generateContent(prompt)
      const text = result.response.text().trim()
      return res.json({ text, model: 'gemini-2.5-flash', targetLang })
    } catch (err) {
      console.error('Gemini translation error:', err)
      return res.status(500).json({ message: 'Translation failed', error: err.message })
    }
  })
})

// ---------------------------------------------------------------------------
// POST /analyze-word
// Body: { word: string }
// ---------------------------------------------------------------------------
exports.analyzeWord = onRequest({ secrets: [geminiApiKey] }, (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' })
    }

    const { word } = req.body
    if (!word) {
      return res.status(400).json({ message: '`word` is required' })
    }

    const prompt = [
      'You are a classical Tamil linguist and lexicographer.',
      `Analyze the Sangam Tamil word: "${word}"`,
      '',
      'Respond ONLY with a JSON object (no markdown fences) with these fields:',
      '  root       — the root word in Tamil script',
      '  urichol    — grammatical/semantic class (e.g., உரிச்சொல், வினைச்சொல்)',
      '  etymology  — brief etymology in English (1-2 sentences)',
      '  gloss      — English gloss / meaning (short phrase)',
    ].join('\n')

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey.value())
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      const result = await model.generateContent(prompt)
      const raw = result.response.text().trim()
      const data = JSON.parse(raw)
      return res.json(data)
    } catch (err) {
      console.error('Gemini word analysis error:', err)
      return res.status(500).json({ message: 'Word analysis failed', error: err.message })
    }
  })
})
