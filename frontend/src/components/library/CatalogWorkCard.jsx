import { useNavigate } from 'react-router-dom'
import Badge from '../ui/Badge'
import useAppStore from '../../store/useAppStore'
import { AVAILABILITY_LABELS, languageLabel } from '../../data/library.js'
import { POEM_BY_ID } from '../../data/poems.js'

export default function CatalogWorkCard({ work }) {
  const language = useAppStore((s) => s.language)
  const status = AVAILABILITY_LABELS[work.availability] || AVAILABILITY_LABELS.metadata
  const readable = work.availability === 'reader'
  const nav = useNavigate()
  return (
    <div
      className={`group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border p-4 transition-all duration-200 ${
        readable
          ? 'border-line-strong bg-surface hover:border-accent/60 hover:shadow-md cursor-pointer'
          : 'border-line bg-surface cursor-default'
      }`}
      onClick={() => {
        if (readable && POEM_BY_ID[work.id]) {
          nav(`/book/${work.id}`)
        }
      }}
      role="button"
      tabIndex={readable ? 0 : -1}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <Badge variant={readable ? 'accent' : 'outline'} size="sm">
          {language === 'ta' ? status.ta : status.en}
        </Badge>
        <span className="text-[10px] font-mono text-faint">{work.period}</span>
      </div>
      <h3 className="tamil mb-1 line-clamp-2 min-h-[2.6em] shrink-0 text-lg font-bold leading-snug text-primary sm:text-xl">
        {work.ta}
      </h3>
      <p className="mb-2 line-clamp-1 text-sm text-muted">{work.en}</p>
      <p className="mb-4 line-clamp-2 min-h-[2.2em] text-xs leading-relaxed text-faint">
        {work.author}
      </p>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line/60 pt-3 text-xs">
        <span className="flex flex-wrap gap-1">
          {work.languages.map((code) => (
            <span key={code} className="rounded-full bg-surface-alt px-2 py-0.5 font-mono text-[10px] text-muted">
              {languageLabel(code)}
            </span>
          ))}
          {work.translations?.map((code) => (
            <span key={code} className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent">
              {languageLabel(code)}
            </span>
          ))}
        </span>
        <span className="shrink-0 font-mono text-faint">
          {work.count ? `${work.count.toLocaleString()} ${work.unit}` : work.unit}
        </span>
      </div>
    </div>
  )
}
