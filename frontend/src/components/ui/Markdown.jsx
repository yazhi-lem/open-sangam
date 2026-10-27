import { useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

/** Sanitized Markdown renderer for Avai answers and research briefs. */
export default function Markdown({ text, className = '' }) {
  const html = useMemo(() => {
    if (!text) return ''
    const raw = marked.parse(String(text), { breaks: true, gfm: true })
    return DOMPurify.sanitize(raw)
  }, [text])

  return (
    <div
      className={`prose-sangam max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
