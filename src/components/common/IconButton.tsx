import { CircleNotchIcon } from '@phosphor-icons/react'
import { cva, type VariantProps } from 'class-variance-authority'

import cn from '@/lib/classnames'

const iconButtonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center transition-smooth focus-ring tooltip disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary',
        primary: 'bg-accent text-white hover:bg-accent-hover',
        danger: 'bg-error text-white hover:bg-error/90',
        outline:
          'border border-border-default bg-transparent text-text-secondary hover:border-border-hover hover:text-text-primary',
        ghost:
          'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
        link: 'text-accent-text underline-offset-4 hover:underline',
      },
      size: {
        xs: 'size-6 rounded-sm text-xs',
        sm: 'size-8 rounded text-sm',
        md: 'size-10 rounded-md text-sm',
        lg: 'size-12 rounded-md text-base',
        xl: 'size-14 rounded-lg text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

export type IconButtonProps = VariantProps<typeof iconButtonVariants> & {
  label: string
  isLoading?: boolean
  className?: string
  children: React.ReactNode
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'>

export default function IconButton({
  variant,
  size,
  label,
  isLoading,
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={cn(
        iconButtonVariants({ variant, size }),
        isLoading && 'pointer-events-none',
        className,
      )}
      aria-label={label}
      data-tooltip={label}
      disabled={props.disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? <CircleNotchIcon className="animate-spin" /> : children}
    </button>
  )
}
