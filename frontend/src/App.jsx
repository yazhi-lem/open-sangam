import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/navigation/Navbar'
import Home from './pages/Home'
import Reader from './pages/Reader'
import SangamWorldPage from './pages/SangamWorldPage'
import Book from './pages/Book'
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
            <Route path="/reader/:poemId?" element={<Reader />} />
            <Route path="/world" element={<SangamWorldPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
