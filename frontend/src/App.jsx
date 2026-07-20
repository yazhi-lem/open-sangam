import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/navigation/Navbar'
import Home from './pages/Home'
import SangamWorldPage from './pages/SangamWorldPage'
import Book from './pages/Book'
import Knowledge from './pages/Knowledge'
import GraphExplorer from './pages/GraphExplorer'
import Articles from './pages/Articles'
import Article from './pages/Article'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/book/:poemId?/:sectionId?" element={<Book />} />
            <Route path="/reader/:poemId?" element={<Navigate to="/book" replace />} />
            <Route path="/world" element={<SangamWorldPage />} />
            <Route path="/knowledge" element={<Knowledge />} />
            <Route path="/graph" element={<GraphExplorer />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/:slug" element={<Article />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
