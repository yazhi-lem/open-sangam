import { createElement } from 'react'
import useAppStore from '../../store/useAppStore'

/** Render exactly one language. Never shows both. */
export default function LanguageText({ ta, en, as = 'span', className = '', ...rest }) {
  const language = useAppStore((s) => s.language)
  const text = language === 'ta' ? ta : en
  return createElement(
    as,
    {
      lang: language,
      className: `${language === 'ta' ? 'tamil' : ''} ${className}`.trim(),
      ...rest,
    },
    text
  )
}
