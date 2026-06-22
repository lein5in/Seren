import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import Integrations from './components/Integrations'
import Pricing from './components/Pricing'
import WhySeren from './components/WhySeren'
import About from './components/About'
import CTA from './components/CTA'
import Footer from './components/Footer'
import Login from './pages/Login'
import Register from './pages/Register'
import Chat from './pages/Chat'
import Settings from './pages/Settings'

function Landing() {
  const user = localStorage.getItem('seren_user')
  if (user) return <Navigate to="/chat" replace />
  return (
    <div className="app">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Integrations />
      <Pricing />
      <WhySeren />
      <About />
      <CTA />
      <Footer />
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = localStorage.getItem('seren_user')
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={<RequireAuth><Chat /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
        <Route path="/dashboard" element={<Navigate to="/chat" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App