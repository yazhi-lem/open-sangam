import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function ArticlesList() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/articles/manifest.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to load articles manifest.')
        }
        return res.json()
      })
      .then((data) => {
        setArticles(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-32 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-accent border-t-transparent"></div>
        <p className="text-muted text-sm">Loading articles...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-32 text-center space-y-4">
        <p className="text-danger font-semibold">Error loading articles</p>
        <p className="text-muted text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-16">
      {/* Header */}
      <header className="text-center space-y-4 max-w-3xl mx-auto">
        <p className="tamil text-accent text-lg tracking-widest">கட்டுரைகள்</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-primary leading-tight">
          Articles & Essays
        </h1>
        <p className="text-muted text-lg leading-relaxed">
          Deep-dive explorations of classical Tamil literature, historical context, language technology, and the future of Indic artificial intelligence.
        </p>
      </header>

      {/* Grid of Articles */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <Link
            key={article.slug}
            to={`/articles/${article.slug}`}
            className="group flex flex-col gap-4 rounded-xl border border-line bg-surface-alt/40 p-6 transition-all hover:border-line-strong hover:bg-surface-alt"
          >
            <div className="space-y-2">
              <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                {article.date}
              </span>
              <h2 className="text-xl font-bold text-primary group-hover:text-accent transition-colors leading-tight">
                {article.title}
              </h2>
            </div>
            <p className="text-muted text-sm leading-relaxed flex-1">
              {article.summary}
            </p>
            <div className="flex items-center justify-between text-xs text-faint border-t border-line/60 pt-4 mt-2">
              <span>By {article.author}</span>
              <span>{article.readingTime} min read</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
