import { cva, type VariantProps } from 'class-variance-authority'
import { useId } from 'react'

import cn from '@/lib/classnames'

const inputVariants = cva(
  'w-full border border-border-default bg-bg-base text-text-primary placeholder:text-text-tertiary transition-smooth focus-ring',
  {
    variants: {
      size: {
        xs: 'h-6 rounded-sm px-2 text-xs',
        sm: 'h-8 rounded px-3 text-sm',
        md: 'h-10 rounded-md px-4 text-sm',
        lg: 'h-12 rounded-md px-5 text-base',
        xl: 'h-14 rounded-lg px-6 text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

export type TextInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size'
> &
  VariantProps<typeof inputVariants> & {
    label?: string
    error?: string
  }

export default function TextInput({
  label,
  error,
  size,
  className,
  ...props
}: TextInputProps) {
  const id = useId()
  const inputId = props.id ?? id

  return (
    <div className={cn('stack gap-1.5', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-text-secondary text-sm font-medium"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(inputVariants({ size }), error && 'border-error')}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-error text-sm">
          {error}
        </p>
      )}
    </div>
  )
}
