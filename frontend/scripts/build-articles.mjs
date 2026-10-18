/**
 * build-articles.mjs
 * This script is part of the build system.
 * It reads all Markdown articles, parses their YAML frontmatter, compiles the Markdown into HTML,
 * generates a manifest, and emits an RSS 2.0 feed.
 *
 * GENERATED OUTPUT notice: The outputs of this script (feed.xml, manifest.json, etc.)
 * are auto-generated. Do not edit them directly.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const sourceDir = path.resolve(__dirname, '../../content/articles');
const publicDir = path.resolve(__dirname, '../public');
const outputDir = path.resolve(publicDir, 'articles');

// Setup output directories
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('[Articles Build] Starting build of articles...');

// Helper to parse YAML frontmatter manually
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]+?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, body: content };
  }
  const yamlText = match[1];
  const body = match[2];
  const data = {};

  yamlText.split('\n').forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx > -1) {
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();
      
      // Clean quotes
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }

      if (key === 'tags') {
        if (value.startsWith('[') && value.endsWith(']')) {
          data[key] = value.slice(1, -1).split(',').map(t => t.trim().replace(/['"]/g, ''));
        } else {
          data[key] = value.split(',').map(t => t.trim());
        }
      } else {
        data[key] = value;
      }
    }
  });

  return { data, body };
}

// Read markdown files
const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.md'));
const articles = [];

for (const file of files) {
  const filePath = path.join(sourceDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const { data, body } = parseFrontmatter(content);
  
  if (!data.slug || !data.title) {
    console.warn(`[Articles Build] Warning: Skipping ${file} due to missing frontmatter fields (title or slug).`);
    continue;
  }

  // Calculate reading time: 200 words per minute
  const words = body.trim().split(/\s+/).length;
  const readingTime = Math.ceil(words / 200);

  // Compile Markdown to HTML
  const html = marked.parse(body);

  const article = {
    title: data.title,
    slug: data.slug,
    summary: data.summary || '',
    author: data.author || 'Anonymous',
    date: data.date || new Date().toISOString().split('T')[0],
    tags: data.tags || [],
    readingTime
  };

  articles.push(article);

  // Write individual article JSON with HTML contents
  const articlePath = path.join(outputDir, `${data.slug}.json`);
  fs.writeFileSync(articlePath, JSON.stringify({ ...article, html }, null, 2), 'utf-8');
  console.log(`[Articles Build] Compiled: ${file} -> articles/${data.slug}.json`);
}

// Sort articles by date descending
articles.sort((a, b) => new Date(b.date) - new Date(a.date));

// Write JSON manifest
fs.writeFileSync(
  path.join(outputDir, 'manifest.json'),
  JSON.stringify(articles, null, 2),
  'utf-8'
);
console.log('[Articles Build] Manifest generated at articles/manifest.json');

// Generate RSS 2.0 feed
// Default to the production origin so the committed feed/sitemap never point
// at localhost; CI passes SITE_URL explicitly for the deploy build.
const siteUrl = (process.env.SITE_URL || 'https://sangam.yazhi.dev').replace(/\/$/, '');
// Stamp the feed with the newest article's date rather than "now", so a local
// build doesn't rewrite the committed feed.xml when no article changed.
const lastUpdated = new Date(articles[0]?.date || 0).toUTCString();
const feedPath = path.join(publicDir, 'feed.xml');

const rssItems = articles.map(a => {
  const pubDate = new Date(a.date).toUTCString();
  const link = `${siteUrl}/articles/${a.slug}`;
  return `    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${a.summary}]]></description>
      <pubDate>${pubDate}</pubDate>
      <author><![CDATA[${a.author}]]></author>
    </item>`;
}).join('\n');

const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
<!-- Generated output - DO NOT EDIT DIRECTLY -->
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Open Sangam Articles</title>
    <link>${siteUrl}/articles</link>
    <description>Long-form essays about Open Sangam, Sangam literature, Tamil language technology, and AI.</description>
    <language>en-us</language>
    <pubDate>${lastUpdated}</pubDate>
    <lastBuildDate>${lastUpdated}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>`;

fs.writeFileSync(feedPath, rssFeed, 'utf-8');
console.log('[Articles Build] RSS feed generated at feed.xml');

// Sitemap + robots.txt — every public SPA route search engines should index.
const poemsSource = fs.readFileSync(path.resolve(__dirname, '../src/data/poems.js'), 'utf-8');
const poemIds = [...new Set([...poemsSource.matchAll(/^\s*id: '([a-z]+)'/gm)].map(m => m[1]))];
const staticRoutes = ['/', '/book', '/avai', '/world', '/knowledge', '/graph', '/articles'];
const sitemapUrls = [
  ...staticRoutes.map(r => ({ loc: `${siteUrl}${r === '/' ? '/' : r}` })),
  ...poemIds.map(id => ({ loc: `${siteUrl}/book/${id}` })),
  ...articles.map(a => ({ loc: `${siteUrl}/articles/${a.slug}`, lastmod: new Date(a.date).toISOString().slice(0, 10) })),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated output - DO NOT EDIT DIRECTLY -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(u => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap, 'utf-8');
fs.writeFileSync(
  path.join(publicDir, 'robots.txt'),
  `# Generated output - DO NOT EDIT DIRECTLY\nUser-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
  'utf-8'
);
console.log(`[Articles Build] sitemap.xml (${sitemapUrls.length} URLs) and robots.txt generated`);
console.log('[Articles Build] Build completed successfully.');
