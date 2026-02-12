import { cva, type VariantProps } from 'class-variance-authority'
import { useId } from 'react'

import cn from '@/lib/classnames'

const textAreaVariants = cva(
  'w-full border border-border-default bg-bg-base text-text-primary placeholder:text-text-tertiary transition-smooth focus-ring',
  {
    variants: {
      size: {
        xs: 'rounded px-2 py-1 text-xs',
        sm: 'rounded-md px-3 py-1.5 text-sm',
        md: 'rounded-lg px-4 py-2 text-sm',
        lg: 'rounded-lg px-5 py-2.5 text-base',
        xl: 'rounded-xl px-6 py-3 text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

type TextAreaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'size'
> &
  VariantProps<typeof textAreaVariants> & {
    label?: string
    error?: string
  }

function TextArea({ label, error, size, className, ...props }: TextAreaProps) {
  const id = useId()
  const textAreaId = props.id ?? id

  return (
    <div className={cn('stack gap-1.5', className)}>
      {label && (
        <label
          htmlFor={textAreaId}
          className="text-text-secondary text-sm font-medium"
        >
          {label}
        </label>
      )}
      <textarea
        id={textAreaId}
        className={cn(textAreaVariants({ size }), error && 'border-error')}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${textAreaId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${textAreaId}-error`} className="text-error text-sm">
          {error}
        </p>
      )}
    </div>
  )
}

export { TextArea }
export type { TextAreaProps }
