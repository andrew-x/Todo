import { GearSixIcon, SignOutIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { BrowserRouter, Link, Outlet, Route, Routes } from 'react-router'

import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import IconButton from '@/components/common/IconButton'
import SettingsModal from '@/components/settings/SettingsModal'
import ErrorPage from '@/pages/ErrorPage'
import HomePage from '@/pages/HomePage'
import LandingPage from '@/pages/LandingPage'
import NotFoundPage from '@/pages/NotFoundPage'

function RootLayout() {
  const { user, isLoading, signOut } = useAuth()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-2">
        <Link to="/" className="transition-smooth hover:opacity-80">
          <img src="/logo.svg" alt="Todo" className="h-5" />
        </Link>
        {!isLoading && user && (
          <div className="flex items-center gap-3">
            <IconButton
              variant="ghost"
              size="xs"
              label="Settings"
              onClick={() => setIsSettingsOpen(true)}
            >
              <GearSixIcon size={16} />
            </IconButton>
            <IconButton
              variant="ghost"
              size="xs"
              label="Sign out"
              onClick={signOut}
            >
              <SignOutIcon size={16} />
            </IconButton>
            <SettingsModal
              userId={user.uid}
              open={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
            />
          </div>
        )}
      </header>
      <Outlet />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route index element={<LandingPage />} errorElement={<ErrorPage />} />
          <Route element={<RootLayout />} errorElement={<ErrorPage />}>
            <Route
              path="home"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
