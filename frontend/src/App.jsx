import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/navigation/Navbar'
import Footer from './components/navigation/Footer'
import CommandPalette from './components/search/CommandPalette'
import BackgroundScene from './components/background/BackgroundScene'
import Home from './pages/Home'
import SangamWorldPage from './pages/SangamWorldPage'
import Book from './pages/Book'
import Knowledge from './pages/Knowledge'
import GraphExplorer from './pages/GraphExplorer'
import ArticlesList from './pages/ArticlesList'
import ArticleReader from './pages/ArticleReader'
import PromptMaker from './pages/PromptMaker'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      {/*
        `isolate` gives this div its own stacking context, so BackgroundScene
        (fixed, z-0) reliably sits behind the content wrapper (relative,
        z-10) below regardless of DOM order. `bg-page` stays here as the
        fallback paint for light mode / low-tier devices where
        BackgroundScene renders nothing.
      */}
      <div className="relative isolate min-h-screen flex flex-col bg-page text-primary selection:bg-accent/20 selection:text-accent">
        <BackgroundScene />
        <div className="relative z-10 min-h-screen flex flex-col">
          <Navbar />
          <CommandPalette />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/book/:poemId?/:sectionId?" element={<Book />} />
              <Route path="/reader/:poemId?" element={<Navigate to="/book" replace />} />
              <Route path="/world" element={<SangamWorldPage />} />
              <Route path="/knowledge" element={<Knowledge />} />
              <Route path="/graph" element={<GraphExplorer />} />
              <Route path="/articles" element={<ArticlesList />} />
              <Route path="/articles/:slug" element={<ArticleReader />} />
              <Route path="/prompt-maker" element={<PromptMaker />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </div>
    </BrowserRouter>
  )
}
