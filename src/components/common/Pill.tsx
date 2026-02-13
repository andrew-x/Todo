import { XIcon } from '@phosphor-icons/react'
import { cva, type VariantProps } from 'class-variance-authority'

import cn from '@/lib/classnames'

const pillVariants = cva(
  'inline-flex items-center font-medium transition-smooth',
  {
    variants: {
      color: {
        default: 'bg-surface text-text-secondary',
        primary: 'bg-accent text-white',
        secondary: 'bg-accent-subtle text-accent-text',
        success: 'bg-success-subtle text-success',
        warning: 'bg-warning-subtle text-warning',
        error: 'bg-error-subtle text-error',
      },
      size: {
        xs: 'h-5 gap-0.5 rounded-sm px-1.5 text-[11px]',
        sm: 'h-6 gap-1 rounded-sm px-2 text-xs',
        md: 'h-7 gap-1.5 rounded px-2.5 text-xs',
      },
    },
    defaultVariants: {
      color: 'default',
      size: 'sm',
    },
  },
)

export type PillProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof pillVariants> & {
    onRemove?: () => void
  }

export default function Pill({
  color,
  size,
  onRemove,
  className,
  children,
  ...props
}: PillProps) {
  return (
    <span className={cn(pillVariants({ color, size }), className)} {...props}>
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove"
          className="transition-smooth hover:bg-surface-active -mr-0.5 rounded-sm p-0.5"
        >
          <XIcon size={12} weight="bold" />
        </button>
      )}
    </span>
  )
}
