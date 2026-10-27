import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookMarked } from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import Badge from '../ui/Badge'
import Card from '../ui/Card'

export default function ResearchNotes() {
  const language = useAppStore((s) => s.language)
  const [articles, setArticles] = useState([])
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/articles/manifest.json')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('manifest'))))
      .then((data) => {
        const research = data.filter((article) =>
          (article.tags || []).includes('Tamil Research')
        )
        setArticles(research.slice(0, 6))
      })
      .catch(() => setError(true))
  }, [])

  const L = (ta, en) => (language === 'ta' ? ta : en)

  return (
    <section id="katturai" className="mt-12 border-t border-line-strong pt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-line-strong pb-2">
        <div>
          <h2 className={`text-2xl font-bold text-primary ${language === 'ta' ? 'tamil' : ''}`}>
            {L('ஆய்வுக் கட்டுரைகள்', 'Research notes')}
          </h2>
          <p className="text-sm text-muted">
            {L('கலைப்பொருட்கள், கதைகள், இசை, வாணிபம் — ஆய்வுக் குறிப்புகள்.', 'Artifacts, stories, music and trade — research notes.')}
          </p>
        </div>
        <Badge variant="accent" size="sm">{articles.length} notes</Badge>
      </div>

      {error ? (
        <p className="text-sm text-muted">{L('கட்டுரைகளை ஏற்ற முடியவில்லை.', 'Could not load research notes.')}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Card key={article.slug} variant="flat" className="flex flex-col gap-2 p-3">
              <div className="flex items-center gap-2 text-[10px] text-faint">
                <BookMarked size={12} className="text-accent" />
                <span className="font-mono">{article.date}</span>
                <span>· {article.readingTime} min</span>
              </div>
              <h3 className={`text-sm font-bold text-primary ${language === 'ta' ? 'tamil' : ''}`}>
                {article.title}
              </h3>
              <p className="line-clamp-2 text-[11px] leading-relaxed text-muted">{article.summary}</p>
              <Link
                to={`/articles/${article.slug}`}
                className="mt-auto inline-flex items-center gap-1 text-[10px] font-semibold text-accent hover:underline"
              >
                {L('படிக்க', 'Read')} <ArrowRight size={10} />
              </Link>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
