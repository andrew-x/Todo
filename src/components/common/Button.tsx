import { CircleNotchIcon } from '@phosphor-icons/react'
import { cva, type VariantProps } from 'class-variance-authority'

import cn from '@/lib/classnames'

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center font-medium transition-smooth focus-ring disabled:pointer-events-none disabled:opacity-50',
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
        xs: 'h-6 gap-1 rounded-sm px-2 text-xs',
        sm: 'h-8 gap-1.5 rounded px-3 text-sm',
        md: 'h-10 gap-2 rounded-md px-4 text-sm',
        lg: 'h-12 gap-2.5 rounded-md px-5 text-base',
        xl: 'h-14 gap-3 rounded-lg px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

type ButtonBase = VariantProps<typeof buttonVariants> & {
  isLoading?: boolean
  className?: string
  children?: React.ReactNode
}

type ButtonAsButton = ButtonBase &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBase> & {
    href?: never
  }

type ButtonAsAnchor = ButtonBase &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBase> & {
    href: string
  }

export type ButtonProps = ButtonAsButton | ButtonAsAnchor

export default function Button({
  variant,
  size,
  isLoading,
  href,
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(
    buttonVariants({ variant, size }),
    isLoading && 'pointer-events-none',
    className,
  )

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    )
  }

  const buttonProps = props as React.ButtonHTMLAttributes<HTMLButtonElement>

  return (
    <button
      className={classes}
      disabled={buttonProps.disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...buttonProps}
    >
      {isLoading && <CircleNotchIcon className="animate-spin" />}
      {children}
    </button>
  )
}
