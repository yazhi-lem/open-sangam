import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, LayoutList, Maximize2, Minimize2, Rows3 } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Chip from '../components/ui/Chip'
import Toast from '../components/ui/Toast'
import NotFound from './NotFound'
import useAppStore from '../store/useAppStore'
import {
  ARTIFACTS,
  ARTIFACT_BY_ID,
  ARTIFACT_LAYERS,
  LAYER_STATUS_LABELS,
  artifactAvailableLayerCount,
  artifactClassLabel,
  artifactLayerStatus,
  artifactSourceLabel,
} from '../data/library.js'

const DEFAULT_LAYERS = ['object', 'text', 'translation', 'notes']

function layerLabel(id) {
  return ARTIFACT_LAYERS.find((layer) => layer.id === id) || { ta: id, en: id }
}

function StatusBadge({ status }) {
  const language = useAppStore((s) => s.language)
  const meta = LAYER_STATUS_LABELS[status] || LAYER_STATUS_LABELS.pending
  const variant =
    status === 'available' ? 'accent' : status === 'draft' ? 'outline' : 'default'
  return (
    <Badge variant={variant} size="sm">
      {language === 'ta' ? meta.ta : meta.en}
    </Badge>
  )
}

function ObjectLayer({ artifact }) {
  const language = useAppStore((s) => s.language)
  const L = (ta, en) => (language === 'ta' ? ta : en)
  const rows = [
    [L('வகை', 'Class'), L(artifactClassLabel(artifact.class).ta, artifactClassLabel(artifact.class).en)],
    [L('துணைவகை', 'Subclass'), artifact.subclass],
    [L('காலம்', 'Period'), artifact.period],
    [L('இடம்', 'Place'), artifact.place],
    [L('எழுத்து', 'Script'), artifact.script || '—'],
    [L('மொழி', 'Language'), artifact.language || '—'],
    [L('பொருள்', 'Material'), artifact.material || '—'],
    [L('காப்பகம்', 'Holder'), artifact.holder],
  ]
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-[11px] font-mono uppercase tracking-wide text-faint">{label}</dt>
          <dd className="break-words text-sm text-primary">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function ValueLayer({ layer }) {
  const language = useAppStore((s) => s.language)
  const L = (ta, en) => (language === 'ta' ? ta : en)
  if (!layer?.value?.length) return null
  const values = Array.isArray(layer.value) ? layer.value : [layer.value]
  return (
    <div className="space-y-1.5">
      {values.map((line, index) => (
        <p
          key={index}
          className={`whitespace-pre-wrap leading-relaxed ${
            layer.id === 'text' || layer.id === 'transliteration'
              ? 'tamil text-lg text-primary'
              : 'text-sm text-primary'
          }`}
        >
          {line}
        </p>
      ))}
      {layer.source && <p className="pt-1 text-xs text-faint">{L('மூலம்', 'Source')}: {layer.source}</p>}
    </div>
  )
}

function GlossaryLayer({ entries }) {
  if (!entries?.length) return null
  return (
    <dl className="divide-y divide-line/60">
      {entries.map((entry) => (
        <div key={entry.term} className="grid grid-cols-1 gap-1 py-1.5 sm:grid-cols-[minmax(7rem,auto)_1fr] sm:gap-4">
          <dt className="tamil text-base font-semibold text-primary">{entry.term}</dt>
          <dd className="text-sm text-muted">{entry.gloss}</dd>
        </div>
      ))}
    </dl>
  )
}

function NotesLayer({ entries }) {
  if (!entries?.length) return null
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-sm text-primary">
      {entries.map((entry, index) => (
        <li key={index}>{entry}</li>
      ))}
    </ul>
  )
}

function LayerBody({ artifact, layerId }) {
  const language = useAppStore((s) => s.language)
  const L = (ta, en) => (language === 'ta' ? ta : en)
  const layer = artifact.layers?.[layerId]
  const status = artifactLayerStatus(artifact, layerId)

  if (layerId === 'object') return <ObjectLayer artifact={artifact} />

  if (status !== 'available' && status !== 'draft') {
    return (
      <div className="rounded-lg border border-dashed border-line bg-surface-alt/40 p-3 text-sm text-muted">
        <p>{layer?.note || 'This layer has not been digitised yet.'}</p>
        <p className="mt-1 text-xs text-faint">
          The reader keeps this slot visible so the missing evidence is explicit, not hidden.
        </p>
      </div>
    )
  }

  switch (layerId) {
    case 'text':
    case 'transliteration':
    case 'translation':
      return <ValueLayer layer={{ ...layer, id: layerId }} />
    case 'glossary':
      return <GlossaryLayer entries={layer.entries} />
    case 'notes':
      return <NotesLayer entries={layer.entries} />
    case 'provenance':
      return (
        <div className="space-y-2 text-sm text-primary">
          <p>{layer.value}</p>
          <p className="text-xs text-muted">
            {L('மூலம்', 'Source')}: {artifactSourceLabel(artifact.sourceId).name} · {L('உரிமை', 'Rights')}: {artifact.rights}
          </p>
          <a
            href={artifact.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-xs font-medium text-accent hover:underline"
          >
            Open source page ↗
          </a>
        </div>
      )
    default:
      return null
  }
}

function LayerCard({ artifact, layerId, condensed }) {
  const label = layerLabel(layerId)
  const status = artifactLayerStatus(artifact, layerId)
  return (
    <section
      id={`layer-${layerId}`}
      className={`min-w-0 rounded-xl border border-line bg-surface ${
        condensed ? 'p-3 sm:p-4' : 'p-4 sm:p-5'
      }`}
    >
      <header className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-2">
        <h2 className="tamil text-base font-bold text-primary">
          {label.ta} <span className="text-xs font-normal text-muted">· {label.en}</span>
        </h2>
        <StatusBadge status={status} />
      </header>
      <LayerBody artifact={artifact} layerId={layerId} />
    </section>
  )
}

export default function ArtifactReader() {
  const language = useAppStore((s) => s.language)
  const L = (ta, en) => (language === 'ta' ? ta : en)
  const { artifactId } = useParams()
  const artifact = ARTIFACT_BY_ID[artifactId] || ARTIFACTS[0]
  const [activeLayers, setActiveLayers] = useState(
    () => new Set(DEFAULT_LAYERS)
  )
  const [condensed, setCondensed] = useState(false)
  const [showPending, setShowPending] = useState(true)
  const [parallel, setParallel] = useState(false)
  const [toast, setToast] = useState(null)

  const availableCount = artifactAvailableLayerCount(artifact)
  const visibleLayers = useMemo(
    () =>
      ARTIFACT_LAYERS.filter((layer) => {
        if (!activeLayers.has(layer.id)) return false
        if (!showPending && artifactLayerStatus(artifact, layer.id) === 'pending') return false
        return true
      }),
    [activeLayers, artifact, showPending]
  )

  if (!artifactId || !ARTIFACT_BY_ID[artifactId]) return <NotFound />

  const toggleLayer = (id) => {
    setActiveLayers((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const citation = `${artifact.en} (${artifact.ta}). ${artifact.holder}. ${artifact.period}. Open Sangam Tamil Library, accessed ${new Date().toLocaleDateString('en-GB')}.`

  const copyCitation = async () => {
    try {
      await navigator.clipboard.writeText(citation)
      setToast('Citation copied')
    } catch {
      setToast('Could not copy citation')
    }
  }

  return (
    <div className="min-h-screen bg-page">
      <Toast message={toast} type="success" onClose={() => setToast(null)} />
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-8 sm:pt-12">
        <Link
          to="/book"
          className="mb-6 inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-muted hover:text-accent"
        >
          <ArrowLeft size={16} aria-hidden="true" /> {L('தமிழ் நூலகம்', 'Tamil Library')}
        </Link>

        <header className="mb-8 border-b border-line-strong pb-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="accent" size="sm">
              {L(artifactClassLabel(artifact.class).ta, artifactClassLabel(artifact.class).en)}
            </Badge>
            <Badge variant="outline" size="sm">{artifact.period}</Badge>
            <Badge variant="outline" size="sm">{artifact.rights}</Badge>
          </div>
          <h1 className="tamil text-3xl font-extrabold leading-tight text-primary sm:text-5xl">
            {artifact.ta}
          </h1>
          <p className="mt-1 text-lg text-muted">{artifact.en}</p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">{artifact.summary}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-faint">
            <span className="font-mono">{availableCount}/{ARTIFACT_LAYERS.length} layers available</span>
            <span>·</span>
            <span>{artifact.place}</span>
            <span>·</span>
            <span>{artifact.holder}</span>
          </div>
        </header>

        <div className="mb-8 space-y-4 rounded-2xl border border-line bg-surface p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`mr-1 text-xs font-semibold text-faint ${language === 'ta' ? 'tamil' : ''}`}>{L('அடுக்குகள்', 'Layers')}</span>
            {ARTIFACT_LAYERS.map((layer) => (
              <Chip
                key={layer.id}
                label={`${layer.ta} · ${layer.en}`}
                selected={activeLayers.has(layer.id)}
                onClick={() => toggleLayer(layer.id)}
                title={LAYER_STATUS_LABELS[artifactLayerStatus(artifact, layer.id)]?.en}
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-line/60 pt-3">
            <Button
              size="sm"
              variant={condensed ? 'primary' : 'outline'}
              icon={condensed ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              onClick={() => setCondensed((value) => !value)}
            >
              {condensed ? 'Condensed' : 'Condense'}
            </Button>
            <Button
              size="sm"
              variant={parallel ? 'primary' : 'outline'}
              icon={<Rows3 size={14} />}
              onClick={() => setParallel((value) => !value)}
            >
              Parallel
            </Button>
            <Button
              size="sm"
              variant={showPending ? 'primary' : 'outline'}
              icon={<LayoutList size={14} />}
              onClick={() => setShowPending((value) => !value)}
            >
              {showPending ? 'Pending shown' : 'Pending hidden'}
            </Button>
            <Button size="sm" variant="ghost" icon={<Copy size={14} />} onClick={copyCitation}>
              Cite
            </Button>
          </div>
        </div>

        {artifact.rights === 'permission-required' && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
            <strong>{L('உரிமைக் குறிப்பு', 'Rights note')}:</strong> {L('இந்தப் பதிவு விவரக்குறிப்பு மட்டுமே. படங்கள், எஸ்டாம்பேஜ்கள் அல்லது முழுப் பதிப்புகளுக்கு அனுமதி தேவை', 'this record is metadata only. Images, estampages or full editions require permission')} — {artifactSourceLabel(artifact.sourceId).name}.
          </div>
        )}

        <div
          className={
            condensed
              ? 'space-y-2'
              : parallel
                ? 'grid grid-cols-1 gap-4 lg:grid-cols-2'
                : 'space-y-4'
          }
        >
          {visibleLayers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
              No layers selected. Choose a layer above.
            </div>
          ) : (
            visibleLayers.map((layer) => (
              <LayerCard
                key={layer.id}
                artifact={artifact}
                layerId={layer.id}
                condensed={condensed}
              />
            ))
          )}
        </div>

        <footer className="mt-10 border-t border-line pt-5 text-xs leading-relaxed text-faint">
          <p>
            {L('அறிஞர் குறிப்பு:', 'Scholar note:')} <strong>{L('இன்னும் மின்னணுவாக்கப்படாத', 'Not yet digitised')}</strong> {L('அடுக்குகள் வேண்டுமென்றே காட்டப்படுகின்றன. பெயரிடப்பட்ட மூலம் இல்லாமல் இந்தப் படிப்பு எதையும் மொழிபெயர்க்கவோ மீட்டுருவாக்கவோ செய்யாது.', 'layers are deliberately visible. This reader does not translate or reconstruct an artifact without a named source.')}
          </p>
          <p className="mt-2">
            Source registry: {artifactSourceLabel(artifact.sourceId).name} ({artifactSourceLabel(artifact.sourceId).rights}).
          </p>
        </footer>
      </div>
    </div>
  )
}
