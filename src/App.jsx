import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './contexts/LanguageContext'
import Home from './pages/Home'
import DrillList from './pages/DrillList'
import { preloadTest1 } from './routes/preloaders'
import { scheduleAdsenseLoad } from './utils/adsense'

const Test1 = lazy(preloadTest1)

function RouteFallback() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center text-sm font-bold text-[#22D3EE]">
      Loading training...
    </div>
  )
}

function App() {
  useEffect(() => {
    scheduleAdsenseLoad()
  }, [])

  return (
    <LanguageProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/drills" element={<DrillList />} />
            <Route path="/test1" element={<Test1 />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </LanguageProvider>
  )
}

export default App
