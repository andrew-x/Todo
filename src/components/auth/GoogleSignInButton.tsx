import { useState } from 'react'

import { useAuth } from '@/components/auth/AuthProvider'
import Button from '@/components/common/Button'

export default function GoogleSignInButton() {
  const { signInWithGoogle } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSignIn() {
    setError(null)
    setIsLoading(true)
    try {
      await signInWithGoogle()
    } catch {
      setError('Sign-in failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        variant="primary"
        size="lg"
        onClick={handleSignIn}
        isLoading={isLoading}
      >
        Sign in with Google
      </Button>
      {error && <p className="text-error text-sm">{error}</p>}
    </div>
  )
}
