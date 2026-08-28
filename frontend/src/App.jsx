import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/navigation/Navbar'
import Footer from './components/navigation/Footer'
import ScrollToTop from './components/navigation/ScrollToTop'
import CommandPalette from './components/search/CommandPalette'
import BackgroundScene from './components/background/BackgroundScene'
import Home from './pages/Home'
import SangamWorldPage from './pages/SangamWorldPage'
import Book from './pages/Book'
import Knowledge from './pages/Knowledge'
import GraphExplorer from './pages/GraphExplorer'
import ArticlesList from './pages/ArticlesList'
import ArticleReader from './pages/ArticleReader'
import Avai from './pages/Avai'
import NotFound from './pages/NotFound'

function AppContent() {
  const location = useLocation()
  const isAvaiPage = location.pathname.startsWith('/avai')

  return (
    <div
      className={`relative isolate flex flex-col bg-page text-primary selection:bg-accent/20 selection:text-accent ${
        isAvaiPage ? 'h-screen overflow-hidden' : 'min-h-screen'
      }`}
    >
      <ScrollToTop />
      <BackgroundScene />
      <div
        className={`relative z-10 flex flex-col flex-1 ${
          isAvaiPage ? 'h-full overflow-hidden' : 'min-h-screen'
        }`}
      >
        <Navbar />
        <CommandPalette />
        <main
          className={`flex-1 flex flex-col ${isAvaiPage ? 'min-h-0 h-0 overflow-hidden' : ''}`}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/book/:poemId?/:sectionId?" element={<Book />} />
            <Route path="/reader/:poemId?" element={<Navigate to="/book" replace />} />
            <Route path="/avai" element={<Avai />} />
            <Route path="/avai/:agentId" element={<Avai />} />
            <Route path="/world" element={<SangamWorldPage />} />
            <Route path="/knowledge" element={<Knowledge />} />
            <Route path="/graph" element={<GraphExplorer />} />
            <Route path="/articles" element={<ArticlesList />} />
            <Route path="/articles/:slug" element={<ArticleReader />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        {!isAvaiPage && <Footer />}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
