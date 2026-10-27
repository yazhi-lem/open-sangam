import useAppStore from '../../store/useAppStore'

export default function LanguageToggle() {
  const language = useAppStore((s) => s.language)
  const toggleLanguage = useAppStore((s) => s.toggleLanguage)
  const next = language === 'ta' ? 'English' : 'தமிழ்'

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="flex h-11 min-w-[44px] items-center justify-center rounded-xl border border-line bg-surface-alt/60 px-3 text-xs font-semibold text-muted hover:text-primary hover:border-line-strong transition-all focus-ring"
      aria-label={language === 'ta' ? 'Switch to English' : 'தமிழுக்கு மாற்று'}
      title={language === 'ta' ? 'Switch to English' : 'Switch to Tamil'}
    >
      {next}
    </button>
  )
}
