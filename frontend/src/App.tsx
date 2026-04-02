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

function App() {
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

export default App