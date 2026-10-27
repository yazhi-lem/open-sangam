import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted fonts (no Google Fonts CDN): Tamil + Latin subsets load on demand via unicode-range.
import '@fontsource/noto-sans-tamil/400.css'
import '@fontsource/noto-sans-tamil/500.css'
import '@fontsource/noto-sans-tamil/600.css'
import '@fontsource/noto-sans-tamil/700.css'
import '@fontsource/noto-serif-tamil/400.css'
import '@fontsource/noto-serif-tamil/600.css'
import '@fontsource/noto-serif-tamil/700.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import './index.css'
import App from './App.jsx'
import useAppStore from './store/useAppStore'

const initialLanguage = useAppStore.getState().language
document.documentElement.lang = initialLanguage
document.documentElement.dataset.uiLanguage = initialLanguage

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
