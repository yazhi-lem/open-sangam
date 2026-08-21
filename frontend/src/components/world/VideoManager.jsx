import { useEffect, useRef, useState } from 'react'

const VIDEO_SOURCES = {
  kurinji: 'https://assets.mixkit.co/videos/preview/mixkit-fog-over-the-top-of-a-mountain-41549-large.mp4',
  mullai: 'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4',
  marutam: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-grassy-field-41539-large.mp4',
  neytal: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4',
  palai: 'https://assets.mixkit.co/videos/preview/mixkit-desolate-desert-dunes-under-a-clear-sky-40089-large.mp4',
}

const TINAI_QUOTES = {
  kurinji: {
    ta: '“யாயும் ஞாயும் யாரா கியரோ எந்தையும் நுந்தையும் எம்முறைக் கேளிர்”',
    en: '“My mother and your mother, how are they related? My father and your father, how are they kin? Yet like red earth and pouring rain, our loving hearts have mingled into one.”',
    ref: 'குறுந்தொகை 40',
  },
  mullai: {
    ta: '“மடவ வாழி மஞ்ஞை… வன்பாரவல் கானம் மலர விவண் நின்றோர்க்கே”',
    en: '“Bless you, peacock! How foolish of you to dance, seeing the clouds gathering... when he who brought flowers to bloom in these dry woodlands has not yet returned.”',
    ref: 'குறுந்தொகை 251',
  },
  marutam: {
    ta: '“வருபுனல் வையை வார்மணல் அகன்துறை… தேம்பாய் கோதை மகளிர் தோளினில் தழுவி”',
    en: '“In the fertile fields where irrigation waters run full, the water lily rises like the bright, wide-open eyes of a bride waiting for reconciliation.”',
    ref: 'ஐங்குறுநூறு 12',
  },
  neytal: {
    ta: '“பெருங்கடல் பரப்பில் பனித்துறை நீங்கி கொடுந்திமிற் பரதவர் உப்புவிளை கானல்”',
    en: '“The fishermen launch their catamaran hulls into the wide oceanic depths under the dark twilight clouds, leaving their anxious loved ones on the shore.”',
    ref: 'அகனானூறு 110',
  },
  palai: {
    ta: '“அழல் அவிர் உருப்பின் ஆய் கதிர் திகழ… நிழல் அற்று அலமரும் கணச்சுரம் பலவே”',
    en: '“The sun blazes down on the waterless path, stripping every trace of shadow. On that scorched wasteland road, my lord walked—and did not look back.”',
    ref: 'புறநானூறு 68',
  },
}

export default function VideoManager({ tinaiId, onComplete, onSkip }) {
  const videoRef = useRef(null)
  const [videoVisible, setVideoVisible] = useState(false)
  const [isEnding, setIsEnding] = useState(false)

  const quote = TINAI_QUOTES[tinaiId]
  const videoSrc = VIDEO_SOURCES[tinaiId]

  useEffect(() => {
    // Show quote first, then fade in the video loop after 2.8 seconds
    const timer = setTimeout(() => {
      setVideoVisible(true)
    }, 2800)

    return () => clearTimeout(timer)
  }, [tinaiId])

  useEffect(() => {
    if (videoVisible && videoRef.current) {
      videoRef.current.load()
      const playPromise = videoRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log('Video autoplay blocked or deferred:', error)
        })
      }
    }
  }, [videoVisible])

  function handleVideoEnded() {
    setIsEnding(true)
    setTimeout(() => {
      if (onComplete) onComplete()
    }, 1000) // Fade out duration matching transition-opacity
  }

  function handleSkip() {
    setIsEnding(true)
    setTimeout(() => {
      if (onSkip) onSkip()
    }, 800)
  }

  if (!videoSrc || !quote) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-1000 select-none
        ${isEnding ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      {/* Background Video Layer */}
      {videoVisible && (
        <video
          ref={videoRef}
          src={videoSrc}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ease-in-out
            ${videoVisible ? 'opacity-70' : 'opacity-0'}`}
          muted
          playsInline
          onEnded={handleVideoEnded}
        />
      )}

      {/* Screen Vignette for cinematic mood */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_40%,_rgba(0,0,0,0.85)_100%)] pointer-events-none" />

      {/* Quote Overlay Content */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center space-y-6 flex flex-col items-center justify-center h-full">
        <div
          className={`transition-all duration-[1200ms] transform space-y-4
            ${videoVisible ? 'translate-y-[-24px] scale-95 opacity-80' : 'translate-y-0 opacity-100 scale-100'}`}
        >
          <p className="tamil text-2xl sm:text-4xl text-amber-300 font-serif leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
            {quote.ta}
          </p>
          <p className="text-sm sm:text-lg text-stone-300 italic max-w-2xl leading-relaxed mx-auto drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">
            {quote.en}
          </p>
          <p className="text-xs sm:text-sm font-mono text-amber-500 uppercase tracking-widest pt-2">
            {quote.ref}
          </p>
        </div>
      </div>

      {/* Skip button floating at the bottom */}
      <div className="absolute bottom-12 z-20">
        <button
          onClick={handleSkip}
          className="px-6 py-2 text-xs font-semibold uppercase tracking-widest text-white/80 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 hover:text-white rounded-full backdrop-blur-md transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        >
          Skip Intro ➔
        </button>
      </div>
    </div>
  )
}
