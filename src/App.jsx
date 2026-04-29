import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './contexts/LanguageContext'
import Home from './pages/Home'
import Test1 from './pages/Test1'
import Test2 from './pages/Test2'
import Test3 from './pages/Test3'
import Result from './pages/Result'
import DevTest1 from './pages/DevTest1'

function App() {
  return (
    <LanguageProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/test1" element={<Test1 />} />
        <Route path="/dev/test1" element={<DevTest1 />} />
        <Route path="/test2" element={<Test2 />} />
        <Route path="/test3" element={<Test3 />} />
        <Route path="/result" element={<Result />} />
      </Routes>
    </BrowserRouter>
    </LanguageProvider>
  )
}

export default App
