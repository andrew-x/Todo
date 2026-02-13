import { isRouteErrorResponse, useRouteError } from 'react-router'

import Button from '@/components/common/Button'

function getErrorMessage(error: unknown): { message: string; stack?: string } {
  if (isRouteErrorResponse(error)) {
    return { message: `${error.status} — ${error.statusText}` }
  }

  if (error instanceof Error) {
    return { message: error.message, stack: error.stack }
  }

  return { message: String(error) }
}

export default function ErrorPage() {
  const error = useRouteError()
  const { message, stack } = getErrorMessage(error)

  return (
    <div className="bg-bg-base center-col min-h-screen gap-4 p-8">
      <h1 className="text-text-primary text-3xl font-bold">
        Something went wrong
      </h1>
      <p className="text-text-secondary">{message}</p>
      {stack && (
        <pre className="bg-bg-raised text-error border-border-default max-w-2xl overflow-auto rounded-lg border p-4 font-mono text-sm">
          {stack}
        </pre>
      )}
      <Button variant="primary" onClick={() => window.location.reload()}>
        Refresh page
      </Button>
    </div>
  )
}
