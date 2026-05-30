import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './contexts/LanguageContext'
import Home from './pages/Home'
import Test1 from './pages/Test1'
import DrillList from './pages/DrillList'

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/drills" element={<DrillList />} />
          <Route path="/test1" element={<Test1 />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  )
}

export default App
