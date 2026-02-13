import { XIcon } from '@phosphor-icons/react'
import { cva, type VariantProps } from 'class-variance-authority'
import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

import IconButton from '@/components/common/IconButton'
import cn from '@/lib/classnames'

const panelVariants = cva(
  'bg-bg-raised border-border-default rounded-lg border shadow-xl w-full',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

export type ModalProps = VariantProps<typeof panelVariants> & {
  open: boolean
  onClose: () => void
  title?: string
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export default function Modal({
  open,
  onClose,
  title,
  footer,
  size,
  children,
  className,
}: ModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  // Focus the panel when modal opens
  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  // Escape key listener
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // Body scroll lock
  useEffect(() => {
    if (!open) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="center-all fixed inset-0 z-50 bg-black/50"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(panelVariants({ size }), 'outline-none', className)}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between p-5 pb-0">
            <h2
              id={titleId}
              className="text-text-primary text-lg font-semibold"
            >
              {title}
            </h2>
            <IconButton
              variant="ghost"
              size="sm"
              label="Close"
              onClick={onClose}
              className="-mr-1"
            >
              <XIcon size={20} />
            </IconButton>
          </div>
        )}
        <div className="text-text-secondary p-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 px-5 pb-5">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  )
}
