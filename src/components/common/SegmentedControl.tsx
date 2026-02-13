import { cva, type VariantProps } from 'class-variance-authority'

import cn from '@/lib/classnames'
import type { Size } from '@/lib/types'

const containerVariants = cva('bg-bg-raised flex rounded-lg', {
  variants: {
    size: {
      xs: 'gap-0.5 p-0.5',
      sm: 'gap-1 p-1',
      md: 'gap-1 p-1',
      lg: 'gap-1.5 p-1.5',
      xl: 'gap-2 p-2',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

const segmentVariants = cva(
  'transition-smooth focus-ring flex cursor-pointer items-center justify-center font-medium',
  {
    variants: {
      size: {
        xs: 'gap-1 rounded-sm px-2 py-1 text-xs',
        sm: 'gap-1.5 rounded-md px-3 py-1.5 text-sm',
        md: 'gap-1.5 rounded-md px-3 py-1.5 text-sm',
        lg: 'gap-2 rounded-md px-4 py-2 text-base',
        xl: 'gap-2.5 rounded-lg px-5 py-2.5 text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

const iconSizeMap: Record<Size, number> = {
  xs: 14,
  sm: 16,
  md: 16,
  lg: 18,
  xl: 20,
}

export type Option<T extends string> = {
  value: T
  label: string
  icon?: React.ElementType
}

export type SegmentedControlProps<T extends string> = Omit<
  VariantProps<typeof containerVariants>,
  'size'
> & {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  size?: Size
  className?: string
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
}: SegmentedControlProps<T>) {
  return (
    <div role="tablist" className={cn(containerVariants({ size }), className)}>
      {options.map(({ value: optionValue, label, icon: Icon }) => (
        <button
          key={optionValue}
          type="button"
          role="tab"
          aria-selected={value === optionValue}
          onClick={() => onChange(optionValue)}
          className={cn(
            segmentVariants({ size }),
            value === optionValue
              ? 'bg-surface-selected text-text-primary'
              : 'text-text-tertiary hover:text-text-secondary',
          )}
        >
          {Icon && <Icon size={iconSizeMap[size]} />}
          {label}
        </button>
      ))}
    </div>
  )
}
