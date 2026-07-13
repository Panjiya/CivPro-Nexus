import TopBar from './components/TopBar'
import Hero from './components/Hero'
import Problem from './components/Problem'
import Demo from './components/Demo'
import HowItWorks from './components/HowItWorks'
import Status from './components/Status'
import Footer from './components/Footer'

function App() {
  return (
    <>
      <TopBar />
      <main>
        <Hero />
        <Problem />
        <Demo />
        <HowItWorks />
        <Status />
      </main>
      <Footer />
    </>
  )
}

export default App
