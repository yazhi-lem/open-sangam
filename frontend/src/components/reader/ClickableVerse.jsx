import useAppStore from '../../store/useAppStore'

export default function ClickableVerse({ text, onWordClick, fontSize = 'md' }) {
  const language = useAppStore((s) => s.language)
  const words = text.split(/(\s+)/)

  const sizeClasses = {
    sm: 'text-lg sm:text-xl leading-[2]',
    md: 'text-xl sm:text-2xl leading-[2.1]',
    lg: 'text-2xl sm:text-3xl leading-[2.2]',
  }

  return (
    <p className={`tamil-verse text-primary whitespace-pre-wrap ${sizeClasses[fontSize]}`} lang="ta">
      {words.map((part, i) =>
        /^\s+$/.test(part) ? (
          part
        ) : (
          <button
            key={i}
            onClick={() => onWordClick(part)}
            aria-label={language === 'ta'
              ? `${part} என்பதற்கு அர்த்தம் அறிய`
              : `Look up definition for ${part}`
            }
            className="hover:text-accent hover:underline decoration-dotted underline-offset-4 cursor-pointer transition-colors focus-ring rounded px-0.5"
          >
            {part}
          </button>
        )
      )}
    </p>
  )
}
