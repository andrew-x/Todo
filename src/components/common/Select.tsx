import { CaretDownIcon } from '@phosphor-icons/react'
import { cva, type VariantProps } from 'class-variance-authority'
import { useId } from 'react'

import cn from '@/lib/classnames'

const selectVariants = cva(
  'w-full appearance-none border border-border-default bg-bg-base text-text-primary transition-smooth focus-ring cursor-pointer pr-8',
  {
    variants: {
      size: {
        xs: 'h-6 rounded-sm pl-2 text-xs',
        sm: 'h-8 rounded pl-3 text-sm',
        md: 'h-10 rounded-md pl-4 text-sm',
        lg: 'h-12 rounded-md pl-5 text-base',
        xl: 'h-14 rounded-lg pl-6 text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

const iconOffset: Record<string, string> = {
  xs: 'right-1.5',
  sm: 'right-2',
  md: 'right-3',
  lg: 'right-3.5',
  xl: 'right-4',
}

const iconSizes: Record<string, number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
}

export type SelectOption = {
  value: string
  label: string
}

export type SelectProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'size'
> &
  VariantProps<typeof selectVariants> & {
    label?: string
    error?: string
    options: SelectOption[]
    placeholder?: string
  }

export default function Select({
  label,
  error,
  size,
  options,
  placeholder,
  className,
  ...props
}: SelectProps) {
  const autoId = useId()
  const selectId = props.id ?? autoId
  const sizeKey = size ?? 'md'

  return (
    <div className={cn('stack gap-1.5', className)}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-text-secondary text-sm font-medium"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={cn(selectVariants({ size }), error && 'border-error')}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${selectId}-error` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <CaretDownIcon
          size={iconSizes[sizeKey]}
          className={cn(
            'text-text-tertiary pointer-events-none absolute top-1/2 -translate-y-1/2',
            iconOffset[sizeKey],
          )}
        />
      </div>
      {error && (
        <p id={`${selectId}-error`} className="text-error text-sm">
          {error}
        </p>
      )}
    </div>
  )
}
