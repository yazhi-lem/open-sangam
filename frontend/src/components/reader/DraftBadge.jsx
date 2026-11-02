import Chip from '../ui/Chip'
import { draftBadgeLabel, draftBadgeTitle } from '../../data/readerLayers.js'

// Marks a commentary/translation layer that has not had scholar sign-off.
// The label is "<Tamil> · <English>" (exactly one ' · '), see data/readerLayers.js.
export default function DraftBadge({ verse, field }) {
  const label = draftBadgeLabel(verse, field)
  if (!label) return null
  return <Chip variant="badge" label={label} title={draftBadgeTitle(verse, field)} />
}
