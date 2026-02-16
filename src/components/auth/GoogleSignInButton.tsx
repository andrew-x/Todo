import { CircleNotchIcon, GoogleLogoIcon } from '@phosphor-icons/react'
import { useState } from 'react'

import { useAuth } from '@/components/auth/AuthProvider'
import logger from '@/lib/logger'

export default function GoogleSignInButton() {
  const { signInWithGoogle } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSignIn() {
    setError(null)
    setIsLoading(true)
    try {
      await signInWithGoogle()
    } catch (e) {
      logger.error('Sign-in failed', e)
      setError('Sign-in failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleSignIn}
        disabled={isLoading}
        aria-busy={isLoading || undefined}
        className="border-border-default bg-surface-secondary hover:bg-surface-hover text-text-primary focus-ring transition-smooth inline-flex h-10 cursor-pointer items-center justify-center gap-2.5 rounded-md border px-5 text-sm font-medium disabled:pointer-events-none disabled:opacity-50"
      >
        {isLoading ? (
          <CircleNotchIcon size={18} className="animate-spin" />
        ) : (
          <GoogleLogoIcon size={18} weight="bold" />
        )}
        Sign in with Google
      </button>
      {error && <p className="text-error text-sm">{error}</p>}
    </div>
  )
}
