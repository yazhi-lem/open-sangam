/**
 * localNakkirar.js — offline, evidence-linked Nakkirar fallback.
 *
 * This is NOT an LLM. It is a deterministic retrieval agent over the data that
 * already ships with the frontend: tiṇai summaries, knowledge sections, poets,
 * poems, artifacts, story seeds and research campaigns. It works in production
 * with no backend and never exposes an API key in the browser.
 */
import { TINAI_LIST } from '../data/tinaiWorld'
import { KNOWLEDGE_SECTIONS } from '../data/knowledge'
import { PULAVAR_AGENTS } from '../data/pulavars'
import { POEMS } from '../data/poems'
import { CORPUS_ARTIFACTS } from '../data/library'

const TINAI_ALIASES = {
  kurinji: ['kurinji', 'குறிஞ்சி', 'mountain', 'மலை'],
  mullai: ['mullai', 'முல்லை', 'forest', 'காடு'],
  marutam: ['marutam', 'மருதம்', 'marutham', 'cropland', 'வயல்'],
  neytal: ['neytal', 'நெய்தல்', 'neithal', 'sea', 'கடல்'],
  palai: ['palai', 'பாலை', 'wasteland', 'பாலைவனம்'],
}

const TOPIC_TERMS = {
  akam: ['akam', 'அகம்', 'love', 'காதல்'],
  puram: ['puram', 'புறம்', 'war', 'போர்', 'king', 'அரசன்'],
  music: ['music', 'இசை', 'யாழ்', 'yazh', 'பண்', 'pann'],
  life: ['life', 'வாழ்க்கை', 'வாழ்வு', 'food', 'உணவு', 'ornament', 'அணிகலன்'],
  poets: ['poet', 'புலவர்', 'புலவர்கள்'],
  patrons: ['patron', 'king', 'மன்னன்', 'வள்ளல்', 'கொடை'],
  artifacts: ['artifact', 'கலைப்பொருள்', 'கலைப்பொருட்கள்', 'object', 'பொருள்'],
  stories: ['story', 'கதை', 'கதைகள்', 'narrative'],
}

function hasAny(text, terms) {
  return terms.some((term) => text.includes(term))
}

function L(language, ta, en) {
  return language === 'ta' ? ta : en
}

function makeCitation(label, detail) {
  return detail ? `${label} — ${detail}` : label
}

function tiṇaiAnswer(tinai, language) {
  const name = L(language, tinai.ta, tinai.en)
  const people = tinai.people.map((p) => L(language, p.ta, p.en)).join(' · ')
  const music = tinai.music.slice(0, 2).map((m) => L(language, m.ta, m.en)).join(' · ')
  const text = language === 'ta'
    ? `${name} (${tinai.en}) திணையின் சுருக்கம்:\n\n` +
      `• பொழுது: ${tinai.atmosphere.timeOfDay.ta} — ${tinai.atmosphere.season.desc}\n` +
      `• கடவுள்: ${tinai.deity.ta}\n` +
      `• உரிப்பொருள்: ${tinai.emotion.akam.ta}\n` +
      `• மக்கள்: ${people}\n` +
      `• இசை: ${music}\n` +
      `• வாழ்க்கை: ${tinai.crafts.map((c) => c.ta).join(' · ')}\n\n` +
      `இந்தத் திணையைப் பற்றிய பாடல்களை நூலகத்தில் “${tinai.ta}” எனத் தேடலாம்.`
    : `${name} (${tinai.ta}) in brief:\n\n` +
      `• Time: ${tinai.atmosphere.timeOfDay.en} — ${tinai.atmosphere.season.desc}\n` +
      `• Deity: ${tinai.deity.en}\n` +
      `• Mood: ${tinai.emotion.akam.en}\n` +
      `• People: ${people}\n` +
      `• Music: ${music}\n` +
      `• Life: ${tinai.crafts.map((c) => c.en).join(' · ')}\n\n` +
      `Search the Library for “${tinai.en}” to read its poems.`
  return {
    response_text: text,
    citations: [
      makeCitation('Tiṇai framework', tinai.ta),
      makeCitation('People', people),
    ],
  }
}

function poetAnswer(agent, language) {
  return {
    response_text: language === 'ta'
      ? `${agent.nameTa} — ${agent.titleTa}\n\n${agent.bioTa}\n\nதிணை: ${agent.tinai}\nபங்கு: ${agent.roleTa}`
      : `${agent.nameEn} — ${agent.titleEn}\n\n${agent.bioEn}\n\nLandscape: ${agent.tinaiEn}\nRole: ${agent.roleEn}`,
    citations: [makeCitation(L(language, 'புலவர்', 'Poet'), L(language, agent.nameTa, agent.nameEn))],
  }
}

function artifactAnswer(artifact, language) {
  const sample = artifact.samples?.[0]
  if (language === 'ta') {
    return {
      response_text:
        `${artifact.ta} (${artifact.en}) — ${artifact.count} சான்றுகள்.\n\n` +
        (sample ? `எடுத்துக்காட்டு: ${sample.text}\n(${sample.recordId}, வரி ${sample.lineNumber})` : ''),
      citations: [makeCitation('Corpus artifact index', artifact.id)],
    }
  }
  return {
    response_text:
      `${artifact.ta} (${artifact.en}) — ${artifact.count} attestations.\n\n` +
      (sample ? `Example: ${sample.text}\n(${sample.recordId}, line ${sample.lineNumber})` : ''),
    citations: [makeCitation('Corpus artifact index', artifact.id)],
  }
}

async function storyAnswer(language) {
  const storyData = (await import('@data/library/stories.json')).default
  const counts = storyData.counts
  const samples = storyData.stories.filter((story) => story.confidence >= 0.8).slice(0, 4)
  const lines = samples.map((story) => `• ${story.titleTa} — ${story.poem} ${story.ordinal || ''}`)
  return {
    response_text: language === 'ta'
      ? `சங்கப் பாடல்களிலிருந்து ${counts.total} கதை விதைகள் உள்ளன: அகம் ${counts.akam}, புறம் ${counts.puram}.\n\nஎடுத்துக்காட்டுகள்:\n${lines.join('\n')}\n\nசங்க உலகம் → பாடல்களின் கதைகள் என்பதில் இவற்றைத் திறக்கலாம்.`
      : `The corpus has ${counts.total} story seeds: ${counts.akam} akam and ${counts.puram} puram.\n\nExamples:\n${lines.join('\n')}\n\nOpen Sangam World → Stories from the songs to explore them.`,
    citations: [makeCitation('Story seeds', 'data/library/stories.json')],
  }
}

function knowledgeAnswer(section, language) {
  const items = section.items.slice(0, 4).map((item) => `• ${L(language, item.ta, item.en)} — ${item.desc}`)
  return {
    response_text: language === 'ta'
      ? `${section.ta} — ${section.en}\n\n${section.intro}\n\n${items.join('\n')}`
      : `${section.en} — ${section.ta}\n\n${section.intro}\n\n${items.join('\n')}`,
    citations: [makeCitation(L(language, 'அறிவுக் களஞ்சியம்', 'Knowledge base'), section.id)],
  }
}

async function poemAnswer(poem, language) {
  let sample = ''
  try {
    const module = await poem.loader()
    const first = module.default?.[0]
    if (first?.sangamTamil) sample = first.sangamTamil.split('\n').slice(0, 3).join('\n')
  } catch {
    sample = ''
  }
  return {
    response_text: language === 'ta'
      ? `${poem.ta} (${poem.en}) — ${poem.count.toLocaleString()} ${poem.unit}.\n\n${sample ? `தொடக்கம்:\n${sample}` : 'தொடக்கப் பாடலை ஏற்ற முடியவில்லை.'}\n\nநூலகத்தில் /book/${poem.id} என்ற இணைப்பில் படிக்கலாம்.`
      : `${poem.en} (${poem.ta}) — ${poem.count.toLocaleString()} ${poem.unit}.\n\n${sample ? `Opening:\n${sample}` : 'Could not load the opening verse.'}\n\nRead it at /book/${poem.id}.`,
    citations: [makeCitation(L(language, 'பாடல்', 'Poem'), poem.id)],
  }
}

export async function askLocalNakkirar({ message, language = 'ta' }) {
  const query = String(message || '').trim().toLowerCase()
  if (!query) {
    return {
      response_text: L(language,
        'நக்கீரர்: திணை, புலவர், பாடல், கலைப்பொருள் அல்லது கதை பற்றிக் கேளுங்கள்.',
        'Nakkirar: ask about a tiṇai, poet, poem, artifact or story.'),
      citations: [],
    }
  }

  // 1. Tiṇai
  for (const tinai of TINAI_LIST) {
    if (hasAny(query, TINAI_ALIASES[tinai.id] || [tinai.id])) {
      return tiṇaiAnswer(tinai, language)
    }
  }

  // 2. Poet / agent
  for (const agent of PULAVAR_AGENTS) {
    if (query.includes(agent.id) || query.includes(agent.nameTa.toLowerCase()) || query.includes(agent.nameEn.toLowerCase())) {
      return poetAnswer(agent, language)
    }
  }

  // 3. Corpus artifact
  for (const artifact of CORPUS_ARTIFACTS) {
    if (query.includes(artifact.ta) || query.includes(artifact.roman) || query.includes(artifact.en.toLowerCase())) {
      return artifactAnswer(artifact, language)
    }
  }

  // 4. Story request
  if (hasAny(query, TOPIC_TERMS.stories)) {
    return storyAnswer(language)
  }

  // 5. Poem
  for (const poem of POEMS) {
    if (query.includes(poem.id) || query.includes(poem.ta) || query.includes(poem.en.toLowerCase())) {
      return poemAnswer(poem, language)
    }
  }

  // 6. Knowledge topics
  for (const [topic, terms] of Object.entries(TOPIC_TERMS)) {
    if (!hasAny(query, terms)) continue
    const section =
      KNOWLEDGE_SECTIONS.find((item) => item.id === topic) ||
      KNOWLEDGE_SECTIONS.find((item) => item.id.includes(topic)) ||
      KNOWLEDGE_SECTIONS.find((item) =>
        item.items.some((entry) => query.includes(entry.ta.toLowerCase()) || query.includes(entry.en.toLowerCase()))
      )
    if (section) return knowledgeAnswer(section, language)
  }

  // 7. Best-effort keyword match over knowledge items
  const words = query.split(/\s+/).filter((word) => word.length > 2)
  let best = null
  let bestScore = 0
  for (const section of KNOWLEDGE_SECTIONS) {
    for (const item of section.items) {
      const haystack = `${item.ta} ${item.en} ${item.desc}`.toLowerCase()
      const score = words.reduce((total, word) => total + (haystack.includes(word) ? 1 : 0), 0)
      if (score > bestScore) {
        best = { section, item }
        bestScore = score
      }
    }
  }
  if (best) {
    return {
      response_text: language === 'ta'
        ? `${best.item.ta} — ${best.item.en}\n\n${best.item.desc}\n\nமேலும்: ${best.section.ta} → ${best.section.en}`
        : `${best.item.en} — ${best.item.ta}\n\n${best.item.desc}\n\nMore: ${best.section.en} → ${best.section.ta}`,
      citations: [makeCitation(L(language, 'அறிவுக் களஞ்சியம்', 'Knowledge base'), best.section.id)],
    }
  }

  return {
    response_text: L(language,
      'நக்கீரர்: இந்தக் கேள்விக்கான சான்று என்னிடம் இல்லை. திணை, புலவர், பாடல், கலைப்பொருள் அல்லது கதை பற்றிக் கேளுங்கள். சான்று இல்லாமல் விடையளிக்க மாட்டேன்.',
      'Nakkirar: I do not have evidence for that question. Ask about a tiṇai, poet, poem, artifact or story. I will not answer without a source.'),
    citations: [],
    local: true,
  }
}
