import { useEffect, useRef, useState } from 'react'

import cn from '@/lib/classnames'

export type PopoverProps = {
  trigger: React.ReactNode
  children: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  align?: 'start' | 'end'
  className?: string
}

export default function Popover(props: PopoverProps) {
  const {
    trigger,
    children,
    open,
    onOpenChange,
    align = 'start',
    className,
  } = props

  const containerRef = useRef<HTMLDivElement>(null)
  const [flipUp, setFlipUp] = useState(false)

  // Measure viewport space and flip if needed when opening
  useEffect(() => {
    if (!open || !containerRef.current) return

    const PANEL_HEIGHT = 360
    const rect = containerRef.current.getBoundingClientRect()
    setFlipUp(rect.bottom + PANEL_HEIGHT > window.innerHeight)
  }, [open])

  // Click-outside dismissal
  useEffect(() => {
    if (!open) return

    function handleMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onOpenChange(false)
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open, onOpenChange])

  // Escape key closes
  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  return (
    <div ref={containerRef} className="relative">
      {trigger}
      {open && (
        <div
          className={cn(
            'bg-bg-overlay border-border-default absolute z-50 rounded-md border shadow-lg',
            flipUp ? 'bottom-full mb-1' : 'top-full mt-1',
            align === 'end' ? 'right-0' : 'left-0',
            className,
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}
