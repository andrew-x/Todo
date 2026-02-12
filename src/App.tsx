import { BrowserRouter, Link, Outlet, Route, Routes } from 'react-router'

import HomePage from '@/pages/HomePage'
import LandingPage from '@/pages/LandingPage'

function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-4 border-b px-6 py-3">
        <Link to="/" className="font-semibold">
          Todo
        </Link>
        <nav className="flex gap-4">
          <Link to="/" className="hover:underline">
            Landing
          </Link>
          <Link to="/home" className="hover:underline">
            Home
          </Link>
        </nav>
      </header>
      <Outlet />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="home" element={<HomePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
