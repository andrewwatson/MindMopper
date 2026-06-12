import { Routes, Route } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { getOrCreateUserId } from './identity/userId'
import DashboardPage from './pages/DashboardPage'

const EditorPage = lazy(() => import('./pages/EditorPage'))
const SharedMapPage = lazy(() => import('./pages/SharedMapPage'))

export default function App() {
  useEffect(() => { getOrCreateUserId() }, [])

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/maps/:id" element={<EditorPage />} />
        <Route path="/s/:token" element={<SharedMapPage />} />
      </Routes>
    </Suspense>
  )
}
