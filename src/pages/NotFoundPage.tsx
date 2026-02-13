import Button from '@/components/common/Button'

export default function NotFoundPage() {
  return (
    <div className="center-col flex-1 gap-4">
      <h1 className="text-text-primary text-7xl font-bold">404</h1>
      <p className="text-text-tertiary text-lg">Page not found</p>
      <Button variant="primary" href="/">
        Go home
      </Button>
    </div>
  )
}
