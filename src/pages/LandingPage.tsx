import { Navigate } from 'react-router'

import { useAuth } from '@/components/auth/AuthProvider'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'

export default function LandingPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="center-col flex-1">
        <p className="text-text-tertiary">Loading...</p>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/home" replace />
  }

  return (
    <div className="center-all size-full">
      <div className="center-col">
        <img src="/logo.svg" alt="Todo" className="h-10" />
        <p className="text-text-tertiary mt-4 text-lg">
          A simple way to manage your tasks.
        </p>
        <div className="mt-6">
          <GoogleSignInButton />
        </div>
      </div>
    </div>
  )
}
