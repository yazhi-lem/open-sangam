import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LoadingSpinner from '../components/ui/LoadingSpinner'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export default function Articles() {
  const [articles, setArticles] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    document.title = 'Articles — Open Sangam'
    fetch('/articles/index.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => setArticles(data.articles || []))
      .catch(() => setError(true))
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
      {/* Header */}
      <header className="space-y-4">
        <p className="tamil text-accent text-lg tracking-widest">கட்டுரைகள்</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-primary leading-tight">Articles</h1>
        <p className="text-muted text-lg max-w-2xl leading-relaxed">
          Essays on Open Sangam, the Sangam corpus, and its bearing on AI for Tamil and
          other Indic languages.
        </p>
        <a
          href="/feed.xml"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors"
        >
          <span aria-hidden>📡</span> Subscribe via RSS
        </a>
      </header>

      {error && (
        <p className="text-muted">
          Articles could not be loaded. Run <code>npm run articles</code> to generate them.
        </p>
      )}

      {!articles && !error && <LoadingSpinner className="py-16" />}

      {articles && (
        <ul className="space-y-4">
          {articles.map((a) => (
            <li key={a.slug}>
              <Link
                to={`/articles/${a.slug}`}
                className="block rounded-2xl border border-line bg-surface p-6 hover:border-line-strong transition-colors group"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-faint mb-2">
                  <span className="text-accent font-medium">{a.category}</span>
                  <span aria-hidden>·</span>
                  <time dateTime={a.date}>{formatDate(a.date)}</time>
                  <span aria-hidden>·</span>
                  <span>{a.readingMinutes} min read</span>
                </div>
                <h2 className="text-xl font-semibold text-primary group-hover:text-accent transition-colors leading-snug">
                  {a.title}
                </h2>
                <p className="text-muted mt-2 leading-relaxed">{a.description}</p>
                {a.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {a.tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs px-2 py-0.5 rounded-full bg-surface-alt text-muted"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
