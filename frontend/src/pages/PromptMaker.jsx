import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const TINAI_INFO = {
  kurinji: { ta: 'குறிஞ்சி', en: 'Kurinji (Mountains)', color: 'violet', emoji: '🏔️' },
  mullai: { ta: 'முல்லை', en: 'Mullai (Forest)', color: 'green', emoji: '🌳' },
  marutam: { ta: 'மருதம்', en: 'Marutam (Cropland)', color: 'teal', emoji: '🌾' },
  neytal: { ta: 'நெய்தல்', en: 'Neytal (Seashore)', color: 'blue', emoji: '🌊' },
  palai: { ta: 'பாலை', en: 'Palai (Wasteland)', color: 'amber', emoji: '🏜️' },
}

const STYLE_PRESETS = [
  { id: 'classical', label: 'Classical Tamil Painting', prompt: 'Classical Tamil Sangam era painting, golden hour lighting, detailed landscape, traditional South Indian art style, warm earth tones, intricate details' },
  { id: 'photorealistic', label: 'Photorealistic', prompt: 'Photorealistic, cinematic composition, golden hour lighting, detailed textures, 8K resolution, dramatic atmosphere' },
  { id: 'watercolor', label: 'Watercolor Illustration', prompt: 'Delicate watercolor illustration, soft washes, Sangam Tamil landscape, artistic, flowing brushstrokes, pastel tones' },
  { id: 'digital-art', label: 'Digital Art', prompt: 'Digital art, vibrant colors, detailed environment, concept art style, dramatic lighting, epic scale' },
  { id: 'ancient-scroll', label: 'Ancient Palm Leaf Scroll', prompt: 'Painted on aged palm leaf manuscript, traditional Tamil illustration, ochre and vermillion pigments, weathered texture, ancient wisdom' },
]

const SAMPLE_VERSES = [
  { id: 'kurunthokai_100', text: 'மலர் விரி தோடு மல்லி சூடி...', tinai: 'kurinji', note: 'Mountain flowers in bloom' },
  { id: 'natrinai_1', text: 'குன்றம் தோய் நீர் விளையாட்டு...', tinai: 'kurinji', note: 'Hill streams and play' },
  { id: 'purananooru_1', text: 'வெட்சி மலர் கையால் பறித்த...', tinai: 'mullai', note: 'Forest flower gathering' },
  { id: 'akananooru_1', text: 'கானம் சூழ் நகரம்...', tinai: 'marutam', note: 'City surrounded by forest' },
]

export default function PromptMaker() {
  const navigate = useNavigate()
  const [verseInput, setVerseInput] = useState('')
  const [selectedVerse, setSelectedVerse] = useState(null)
  const [selectedTinai, setSelectedTinai] = useState('kurinji')
  const [stylePreset, setStylePreset] = useState('classical')
  const [customStyle, setCustomStyle] = useState('')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [imageResult, setImageResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const buildPrompt = useCallback(() => {
    const verse = verseInput || selectedVerse?.text || ''
    const tinai = TINAI_INFO[selectedTinai]
    const style = customStyle || STYLE_PRESETS.find(s => s.id === stylePreset)?.prompt || ''

    let prompt = ''
    if (verse) {
      prompt += `Scene inspired by Sangam Tamil poetry: "${verse}". `
    }
    prompt += `Landscape: ${tinai.en}. `
    if (style) {
      prompt += `Artistic style: ${style}. `
    }
    prompt += `Aspect ratio: ${aspectRatio}. `
    prompt += 'AI-recreated imagery — not a historical depiction.'
    return prompt
  }, [verseInput, selectedVerse, selectedTinai, stylePreset, customStyle, aspectRatio])

  const handleGenerate = async () => {
    const prompt = buildPrompt()
    setGeneratedPrompt(prompt)
    setLoading(true)
    setError(null)
    setImageResult(null)

    try {
      const res = await fetch('http://127.0.0.1:8080/avai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Craft an image prompt for this scene: ${prompt}`,
          agent: 'paranar',
          workflow: 'imagery',
          context: { tinai: selectedTinai },
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || `HTTP ${res.status}`)
      }

      const data = await res.json()
      setImageResult({
        prompt: data.image_prompt || prompt,
        imageUrl: data.image_url,
        responseText: data.response_text,
        citations: data.citations,
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt || buildPrompt())
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">தமிழ் ப்ராம்ப்ட் மேக்கர்</h1>
        <p className="text-lg opacity-70">Tamil Prompt Maker — Visualize Sangam Literature</p>
        <p className="text-sm opacity-50 mt-1">
          Transform ancient Tamil verses into visual imagery using AI.
          Select a verse, choose a landscape and style, and generate an image prompt.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Input */}
        <div className="space-y-6">
          {/* Verse Input */}
          <div className="bg-surface rounded-xl p-5 border border-outline/10">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span>📜</span> Verse Source
            </h2>
            <textarea
              className="w-full h-24 bg-surface-container rounded-lg p-3 text-sm border border-outline/20 focus:border-accent outline-none resize-none"
              placeholder="Enter a Sangam Tamil verse or description..."
              value={verseInput}
              onChange={(e) => { setVerseInput(e.target.value); setSelectedVerse(null) }}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {SAMPLE_VERSES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => { setSelectedVerse(v); setVerseInput('') }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    selectedVerse?.id === v.id
                      ? 'bg-accent text-white border-accent'
                      : 'bg-surface-container border-outline/20 hover:border-accent/50'
                  }`}
                >
                  {v.id} — {v.note}
                </button>
              ))}
            </div>
          </div>

          {/* Tiṇai Selection */}
          <div className="bg-surface rounded-xl p-5 border border-outline/10">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span>🌿</span> Tiṇai Landscape
            </h2>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(TINAI_INFO).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => setSelectedTinai(key)}
                  className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                    selectedTinai === key
                      ? `border-${info.color}-500 bg-${info.color}-50 dark:bg-${info.color}-950/30`
                      : 'border-outline/20 hover:border-outline/40'
                  }`}
                >
                  <span className="text-2xl">{info.emoji}</span>
                  <span className="text-xs mt-1 font-medium">{info.ta}</span>
                  <span className="text-[10px] opacity-50">{info.en.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Style Preset */}
          <div className="bg-surface rounded-xl p-5 border border-outline/10">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span>🎨</span> Artistic Style
            </h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {STYLE_PRESETS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setStylePreset(s.id); setCustomStyle('') }}
                  className={`text-sm px-4 py-2 rounded-lg border transition-colors ${
                    stylePreset === s.id && !customStyle
                      ? 'bg-accent text-white border-accent'
                      : 'bg-surface-container border-outline/20 hover:border-accent/50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <textarea
              className="w-full h-16 bg-surface-container rounded-lg p-3 text-sm border border-outline/20 focus:border-accent outline-none resize-none"
              placeholder="Or write a custom style description..."
              value={customStyle}
              onChange={(e) => setCustomStyle(e.target.value)}
            />
          </div>

          {/* Aspect Ratio */}
          <div className="bg-surface rounded-xl p-5 border border-outline/10">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span>📐</span> Aspect Ratio
            </h2>
            <div className="flex gap-3">
              {['1:1', '16:9', '9:16', '4:3', '3:4'].map((ar) => (
                <button
                  key={ar}
                  onClick={() => setAspectRatio(ar)}
                  className={`px-4 py-2 rounded-lg border text-sm font-mono ${
                    aspectRatio === ar
                      ? 'bg-accent text-white border-accent'
                      : 'bg-surface-container border-outline/20 hover:border-accent/50'
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-accent text-white font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Image Prompt'}
          </button>
        </div>

        {/* Right: Output */}
        <div className="space-y-6">
          {/* Generated Prompt */}
          <div className="bg-surface rounded-xl p-5 border border-outline/10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span>✨</span> Generated Prompt
              </h2>
              {(generatedPrompt || buildPrompt()) && (
                <button
                  onClick={handleCopyPrompt}
                  className="text-xs px-3 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-outline/20 transition-colors"
                >
                  Copy
                </button>
              )}
            </div>
            <div className="bg-surface-container rounded-lg p-4 text-sm min-h-[120px] whitespace-pre-wrap font-mono">
              {generatedPrompt || buildPrompt()}
            </div>
          </div>

          {/* Image Result */}
          {imageResult && (
            <div className="bg-surface rounded-xl p-5 border border-outline/10">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span>🖼️</span> Generated Image
              </h2>
              {imageResult.imageUrl ? (
                <img
                  src={imageResult.imageUrl}
                  alt="AI-generated Sangam imagery"
                  className="w-full rounded-lg border border-outline/20"
                />
              ) : (
                <div className="bg-surface-container rounded-lg p-8 text-center text-sm opacity-60">
                  Image prompt only — set SANGAM_IMAGE_BACKEND=gemini to generate actual images.
                </div>
              )}
              {imageResult.responseText && (
                <div className="mt-3 text-sm opacity-70 whitespace-pre-wrap">
                  {imageResult.responseText}
                </div>
              )}
              {imageResult.citations?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {imageResult.citations.map((c) => (
                    <span key={c.verse_id} className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent">
                      ◆ {c.verse_id}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Info */}
          <div className="bg-surface rounded-xl p-5 border border-outline/10 text-sm opacity-60">
            <p className="mb-2">
              <strong>How it works:</strong> The Tamil Prompt Maker uses the
              பரணர் (Paranar) imagery agent to transform Sangam Tamil verses
              into visual scene descriptions.
            </p>
            <p>
              Generated images are labeled <em>"AI-recreated imagery — not a
              historical depiction."</em> The prompt captures elements from
              the verse's tiṇai (landscape classification) and cultural context.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
