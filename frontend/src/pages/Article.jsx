import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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

export default function Article() {
  const { slug } = useParams()
  // Keep the loaded slug alongside the data so that, while a new article is
  // fetching after navigation, we render the spinner rather than stale content
  // — without a synchronous setState inside the effect.
  const [loaded, setLoaded] = useState({ slug: null, article: null, status: 'loading' })

  useEffect(() => {
    let cancelled = false
    fetch(`/articles/${slug}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        if (cancelled) return
        setLoaded({ slug, article: data, status: 'ready' })
        document.title = `${data.title} — Open Sangam`
      })
      .catch(() => {
        if (!cancelled) setLoaded({ slug, article: null, status: 'missing' })
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  const article = loaded.article
  const status = loaded.slug === slug ? loaded.status : 'loading'

  if (status === 'loading') return <LoadingSpinner className="min-h-[60vh]" />

  if (status === 'missing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <p className="tamil text-6xl text-faint">இல்லை</p>
        <h1 className="text-3xl font-semibold text-primary">Article Not Found</h1>
        <Link
          to="/articles"
          className="px-5 py-2.5 rounded-lg bg-accent text-on-accent font-medium hover:bg-accent-strong transition-colors"
        >
          All Articles
        </Link>
      </div>
    )
  }

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <Link to="/articles" className="text-sm text-muted hover:text-accent transition-colors">
        ← All articles
      </Link>

      <header className="mt-6 mb-10 space-y-4 border-b border-line pb-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-faint">
          <span className="text-accent font-medium">{article.category}</span>
          <span aria-hidden>·</span>
          <time dateTime={article.date}>{formatDate(article.date)}</time>
          <span aria-hidden>·</span>
          <span>{article.readingMinutes} min read</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-primary leading-tight">
          {article.title}
        </h1>
        <p className="text-muted">{article.author}</p>
      </header>

      <div className="prose-sangam" dangerouslySetInnerHTML={{ __html: article.html }} />

      <footer className="mt-16 pt-8 border-t border-line flex items-center justify-between">
        <Link to="/articles" className="text-sm text-muted hover:text-accent transition-colors">
          ← All articles
        </Link>
        <a href="/feed.xml" className="text-sm text-muted hover:text-accent transition-colors">
          RSS 📡
        </a>
      </footer>
    </article>
  )
}
