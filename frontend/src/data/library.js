/**
 * library.js — extensible Tamil Library catalog.
 *
 * The Sangam reader (`data/poems.js`) stays the canonical registry for works
 * whose normalized verse JSON is readable today. This module adds the wider
 * library — Pathinenkilkkanakku, classics, and future artifact/document
 * collections — without pretending that a catalog record is readable data.
 *
 * Availability values:
 *   reader   → normalized verse data exists and can open in /book/:id
 *   metadata → catalog record only; no readable corpus yet
 *   planned  → collection placeholder (artifacts, manuscripts, inscriptions)
 */
import catalog from '@data/library/catalog.json'
import artifactData from '@data/library/artifacts.json'
import corpusArtifactData from '@data/library/corpus-artifacts.json'
import corpusEntityData from '@data/library/corpus-entities.json'
import avaiResearchData from '@data/library/avai-research/index.json'
import researchCampaignData from '@data/library/research-campaigns.json'

export const LIBRARY_SCHEMA_VERSION = catalog.schemaVersion
export const LIBRARY_COLLECTIONS = catalog.collections
export const LIBRARY_WORKS = catalog.works
export const LIBRARY_WORK_BY_ID = Object.fromEntries(
  LIBRARY_WORKS.map((work) => [work.id, work])
)

export const AVAILABILITY_LABELS = {
  reader: { ta: 'படிக்கலாம்', en: 'Readable' },
  metadata: { ta: 'பட்டியலில்', en: 'Catalogued' },
  planned: { ta: 'திட்டத்தில்', en: 'Planned' },
}

export function libraryWorksForCollection(collectionId) {
  return LIBRARY_WORKS.filter((work) => work.collection === collectionId)
}

export function workMatchesQuery(work, query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return true
  return [work.ta, work.en, work.author, work.period, work.collection]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q))
}

export function languageLabel(code) {
  return (
    {
      ta: 'தமிழ்',
      en: 'English',
      sa: 'Sanskrit',
      pi: 'Pali',
      translit: 'Transliteration',
    }[code] || code
  )
}

// ── Artifacts / material culture ────────────────────────────────────────────

export const ARTIFACT_SCHEMA_VERSION = artifactData.schemaVersion
export const ARTIFACT_CLASSES = artifactData.classes
export const ARTIFACT_SOURCES = artifactData.sources
export const ARTIFACTS = artifactData.artifacts
export const ARTIFACT_CLASS_BY_ID = Object.fromEntries(
  ARTIFACT_CLASSES.map((item) => [item.id, item])
)
export const ARTIFACT_BY_ID = Object.fromEntries(
  ARTIFACTS.map((item) => [item.id, item])
)
export const ARTIFACT_SOURCE_BY_ID = Object.fromEntries(
  ARTIFACT_SOURCES.map((item) => [item.id, item])
)

export const ARTIFACT_LAYERS = [
  { id: 'object', ta: 'பொருள்', en: 'Object' },
  { id: 'text', ta: 'மூல உரை', en: 'Text' },
  { id: 'transliteration', ta: 'ஒலிபெயர்ப்பு', en: 'Transliteration' },
  { id: 'translation', ta: 'மொழிபெயர்ப்பு', en: 'Translation' },
  { id: 'glossary', ta: 'சொல்லகராதி', en: 'Glossary' },
  { id: 'notes', ta: 'குறிப்புகள்', en: 'Notes' },
  { id: 'provenance', ta: 'மூலாதாரம்', en: 'Provenance' },
]

export const LAYER_STATUS_LABELS = {
  available: { ta: 'உள்ளது', en: 'Available' },
  draft: { ta: 'வரைவு', en: 'Draft' },
  pending: { ta: 'நிலுவையில்', en: 'Not yet digitised' },
  reference: { ta: 'மேற்கோள்', en: 'Reference only' },
}

export function artifactClassLabel(id) {
  return ARTIFACT_CLASS_BY_ID[id] || { ta: id, en: id }
}

export function artifactSourceLabel(id) {
  return ARTIFACT_SOURCE_BY_ID[id] || { name: id, rights: 'unknown' }
}

export function artifactLayerStatus(artifact, layerId) {
  if (layerId === 'object') return 'available'
  return artifact?.layers?.[layerId]?.status || 'pending'
}

export function artifactAvailableLayerCount(artifact) {
  return ARTIFACT_LAYERS.filter(
    (layer) => artifactLayerStatus(artifact, layer.id) === 'available'
  ).length
}

export function artifactMatchesQuery(artifact, query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return true
  return [
    artifact.ta,
    artifact.en,
    artifact.subclass,
    artifact.period,
    artifact.place,
    artifact.script,
    artifactClassLabel(artifact.class).ta,
    artifactClassLabel(artifact.class).en,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q))
}

// ── Corpus-attested artifacts & research campaigns ─────────────────────────

export const CORPUS_ARTIFACT_DATA = corpusArtifactData
export const CORPUS_ARTIFACT_CLASSES = corpusArtifactData.classes
export const CORPUS_ARTIFACTS = corpusArtifactData.artifacts
export const CORPUS_ARTIFACT_CLASS_BY_ID = Object.fromEntries(
  CORPUS_ARTIFACT_CLASSES.map((item) => [item.id, item])
)

export const RESEARCH_CAMPAIGNS = researchCampaignData.campaigns
export const RESEARCH_CAMPAIGN_BY_ID = Object.fromEntries(
  RESEARCH_CAMPAIGNS.map((item) => [item.id, item])
)

export function corpusArtifactsForClass(classId) {
  return CORPUS_ARTIFACTS.filter((item) => item.class === classId)
}

export function corpusArtifactMatchesQuery(item, query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return true
  return [item.ta, item.roman, item.en, item.class]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q))
}

export const CORPUS_ENTITY_DATA = corpusEntityData
export const CORPUS_ENTITY_CATEGORIES = corpusEntityData.categories
export const CORPUS_ENTITIES = corpusEntityData.entities

export const AVAI_RESEARCH_BRIEFS = avaiResearchData.briefs
