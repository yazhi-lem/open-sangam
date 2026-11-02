import { useNavigate } from 'react-router-dom'
import Badge from '../ui/Badge'
import useAppStore from '../../store/useAppStore'
import { artifactClassLabel, artifactAvailableLayerCount } from '../../data/library.js'

export default function ArtifactCard({ artifact }) {
  const nav = useNavigate()
  const language = useAppStore((s) => s.language)
  const cls = artifactClassLabel(artifact.class)
  return (
    <button
      type="button"
      onClick={() => nav(`/artifacts/${artifact.id}`)}
      className="group flex h-full min-w-0 flex-col rounded-2xl border border-line bg-surface p-3.5 text-left transition-all duration-200 hover:border-accent/60 hover:shadow-md focus-ring"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <Badge variant="accent" size="sm">{language === 'ta' ? cls.ta : cls.en}</Badge>
        <span className="text-[10px] font-mono text-faint">{artifact.period}</span>
      </div>
      <h3 className="tamil mb-1 line-clamp-2 min-h-[2.6em] text-lg font-bold leading-snug text-primary group-hover:text-accent">
        {artifact.ta}
      </h3>
      <p className="mb-2 line-clamp-1 text-sm text-muted">{artifact.en}</p>
      <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-faint">{artifact.summary}</p>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line/60 pt-3 text-[11px]">
        <span className="font-mono text-faint">
          {artifactAvailableLayerCount(artifact)}/7 layers
        </span>
        <span className="truncate text-muted">{artifact.rights}</span>
      </div>
    </button>
  )
}
