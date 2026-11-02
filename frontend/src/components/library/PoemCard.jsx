import { useNavigate } from 'react-router-dom'
import Badge from '../ui/Badge'
import AnimatedCard from '../motion/AnimatedCard'
import useAppStore from '../../store/useAppStore'

export default function PoemCard({ poem }) {
  const available = poem.available
  const nav = useNavigate()
  const language = useAppStore((s) => s.language)
  const L = (ta, en) => (language === 'ta' ? ta : en)

  const cardClassName = `group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border p-5 transition-all duration-200
    ${
      available
        ? 'border-line-strong bg-surface hover:border-accent/60 hover:shadow-md cursor-pointer'
        : 'border-line bg-surface-alt/40 cursor-default opacity-85'
    }`

  const collectionLabel = {
    '8thokai': 'Anthology',
    '10paddu': 'Idyll',
    pathinenkilkkanakku: 'Minor Work',
    aimperumkappiyam: 'Great Epic',
    'bhakti-corpus': 'Bhakti',
    'grammar-treatise': 'Grammar',
    artifacts: 'Artifact',
  }[poem.collection] || 'Work'
  const collectionVariant = {
    '8thokai': 'anthology',
    '10paddu': 'idyll',
    pathinenkilkkanakku: 'accent',
    aimperumkappiyam: 'accent',
    'bhakti-corpus': 'kurinji',
    'grammar-treatise': 'marutam',
    artifacts: 'outline',
  }[poem.collection] || 'default'

  const content = (
    <>
      <div className="flex items-center justify-between gap-2 mb-3">
        <Badge variant={collectionVariant} size="sm">
          {collectionLabel}
        </Badge>
        {available ? (
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" title="Available in reader" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-line-strong" title="Coming soon" />
        )}
      </div>

      <h3
        className={`tamil text-base sm:text-lg font-bold leading-snug mb-1 shrink-0 line-clamp-2 break-words [overflow-wrap:anywhere] min-h-[2.6em]
          ${available ? 'text-primary group-hover:text-accent' : 'text-muted'}`}
      >
        {poem.ta}
      </h3>

      <p
        className={`text-sm mb-4 shrink-0 leading-relaxed break-words [overflow-wrap:anywhere] line-clamp-2 min-h-[2.2em]
          ${available ? 'text-muted' : 'text-faint'}`}
      >
        {poem.en}
      </p>

      <div className="mt-auto pt-3 border-t border-line/60 flex items-center justify-between text-xs font-mono">
        <span className={available ? 'text-muted' : 'text-faint'}>
          {poem.count.toLocaleString()} {L(poem.unit === 'lines' ? 'வரிகள்' : poem.unit === 'couplets' ? 'குறட்பாக்கள்' : poem.unit === 'quatrains' ? 'நான்கடிகள்' : 'பாடல்கள்', poem.unit)}
        </span>
        {available && (
          <span className="text-accent font-semibold group-hover:translate-x-1 transition-transform">
            Read →
          </span>
        )}
      </div>
    </>
  )

  if (available) {
    return (
      <AnimatedCard onClick={() => nav(`/book/${poem.id}`)} className={cardClassName}>
        {content}
      </AnimatedCard>
    )
  }

  return <div className={cardClassName}>{content}</div>
}
