import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { HostPage } from './pages/HostPage'
import { ViewerPage } from './pages/ViewerPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/host/:roomId" element={<HostPage />} />
        <Route path="/view/:roomId" element={<ViewerPage />} />
      </Routes>
    </BrowserRouter>
  )
}
