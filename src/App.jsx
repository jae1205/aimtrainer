import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './contexts/LanguageContext'
import Home from './pages/Home'
import Test1 from './pages/Test1'
import DevTest1 from './pages/DevTest1'
import DrillList from './pages/DrillList'

function App() {
  return (
    <LanguageProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/drills" element={<DrillList />} />
        <Route path="/test1" element={<Test1 />} />
        <Route path="/dev/test1" element={<DevTest1 />} />
      </Routes>
    </BrowserRouter>
    </LanguageProvider>
  )
}

export default App
