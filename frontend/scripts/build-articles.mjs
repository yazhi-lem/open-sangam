// Build step: read the markdown essays in content/articles/, render them to
// HTML + a JSON manifest the React app consumes, and emit an RSS 2.0 feed.
//
//   node scripts/build-articles.mjs            (run from frontend/)
//
// Source of truth: content/articles/*.md (repo root). Output: frontend/public/.
// Wired into `npm run build` and `npm run dev` via package.json.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs'
import { resolve, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptDir, '../..')
const CONTENT_DIR = resolve(repoRoot, 'content/articles')
const OUT_DIR = resolve(repoRoot, 'frontend/public/articles')
const FEED_PATH = resolve(repoRoot, 'frontend/public/feed.xml')

// Production origin used for absolute links in the RSS feed. Override with
// SITE_URL when the real domain is known (Firebase default shown here).
const SITE_URL = (process.env.SITE_URL || 'https://opensangam.web.app').replace(/\/$/, '')
const SITE_TITLE = 'Open Sangam — Articles'
const SITE_DESC =
  'Essays on Open Sangam, the Sangam corpus, and its bearing on AI for Tamil and other Indic languages.'

marked.setOptions({ gfm: true, breaks: false })

// --- tiny YAML-frontmatter parser (only the subset we author) --------------
function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!m) return { data: {}, body: raw }
  const data = {}
  for (const line of m[1].split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let val = line.slice(idx + 1).trim()
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
    } else {
      val = val.replace(/^["']|["']$/g, '')
    }
    data[key] = val
  }
  return { data, body: raw.slice(m[0].length) }
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\w஀-௿]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function readingTime(body) {
  const words = body.replace(/[#>*`_\-|]/g, ' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

// Add anchor ids to h2/h3 so headings are linkable.
function addHeadingIds(html) {
  return html.replace(/<(h[23])>([\s\S]*?)<\/\1>/g, (_, tag, inner) => {
    const id = slugify(inner)
    return `<${tag} id="${id}">${inner}</${tag}>`
  })
}

// The app renders the title from metadata, so drop the leading <h1> from the
// in-app HTML. The RSS feed keeps the full document (title included).
function stripLeadingH1(html) {
  return html.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/, '')
}

function esc(s = '') {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function rfc822(dateStr) {
  return new Date(`${dateStr}T09:00:00Z`).toUTCString()
}

// --- build ------------------------------------------------------------------
mkdirSync(OUT_DIR, { recursive: true })

const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md') && f !== 'README.md')
const articles = []
const fullHtml = {} // slug -> full HTML (with title), for the RSS feed

for (const file of files) {
  const raw = readFileSync(resolve(CONTENT_DIR, file), 'utf8').replace(/\r\n/g, '\n')
  const { data, body } = parseFrontmatter(raw)
  const slug = data.slug || basename(file, '.md')
  const html = addHeadingIds(marked.parse(body))
  fullHtml[slug] = html

  const meta = {
    slug,
    title: data.title || slug,
    date: data.date || '',
    author: data.author || 'Open Sangam Project',
    category: data.category || 'General',
    tags: Array.isArray(data.tags) ? data.tags : [],
    description: data.description || '',
    status: data.status || 'essay',
    readingMinutes: readingTime(body),
  }

  articles.push(meta)
  writeFileSync(
    resolve(OUT_DIR, `${slug}.json`),
    JSON.stringify({ ...meta, html: stripLeadingH1(html) }, null, 2),
  )
}

// Newest first.
articles.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

writeFileSync(
  resolve(OUT_DIR, 'index.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), count: articles.length, articles }, null, 2),
)

// --- RSS 2.0 ----------------------------------------------------------------
const lastBuild = articles.length ? rfc822(articles[0].date) : new Date().toUTCString()
const items = articles
  .map((a) => {
    const url = `${SITE_URL}/articles/${a.slug}`
    const full = fullHtml[a.slug]
    return `    <item>
      <title>${esc(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${rfc822(a.date)}</pubDate>
      <category>${esc(a.category)}</category>
      <description>${esc(a.description)}</description>
      <content:encoded><![CDATA[${full}]]></content:encoded>
    </item>`
  })
  .join('\n')

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE_TITLE)}</title>
    <link>${SITE_URL}/articles</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${esc(SITE_DESC)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>
`
writeFileSync(FEED_PATH, feed)

console.log(`Built ${articles.length} articles → frontend/public/articles/`)
console.log(`RSS feed → frontend/public/feed.xml  (SITE_URL=${SITE_URL})`)
