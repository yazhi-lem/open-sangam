import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import NotFound from './NotFound'

export default function ArticleReader() {
  const { slug } = useParams()
  const [prevSlug, setPrevSlug] = useState(slug)
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  if (slug !== prevSlug) {
    setPrevSlug(slug)
    setArticle(null)
    setLoading(true)
    setError(false)
  }

  useEffect(() => {
    let ignore = false

    fetch(`/articles/${slug}.json`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Not found')
        }
        return res.json()
      })
      .then((data) => {
        if (!ignore) {
          setArticle(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error(err)
        if (!ignore) {
          setError(true)
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [slug])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-32 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-accent border-t-transparent"></div>
        <p className="text-muted text-sm">Loading article...</p>
      </div>
    )
  }

  if (error || !article) {
    return <NotFound />
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-12 md:py-16 space-y-8">
      {/* Back button and breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted">
        <Link to="/articles" className="hover:text-accent transition-colors">
          ← Back to Articles
        </Link>
      </div>

      {/* Article Header */}
      <header className="space-y-4 border-b border-line pb-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
          <time dateTime={article.date}>{article.date}</time>
          <span>•</span>
          <span>By {article.author}</span>
          <span>•</span>
          <span>{article.readingTime} min read</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary leading-tight">
          {article.title}
        </h1>
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] uppercase tracking-wide text-accent border border-line rounded-full px-2.5 py-0.5 bg-surface-alt/40"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Article Content */}
      <div
        className="prose-sangam max-w-none"
        dangerouslySetInnerHTML={{ __html: article.html }}
      />
    </article>
  )
}
