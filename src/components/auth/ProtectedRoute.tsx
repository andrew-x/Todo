import { Navigate } from 'react-router'

import { useAuth } from '@/components/auth/AuthProvider'

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="center-col flex-1">
        <p className="text-text-tertiary">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return children
}
