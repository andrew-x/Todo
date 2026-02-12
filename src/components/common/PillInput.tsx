import { useId, useState } from 'react'

import cn from '@/lib/classnames'
import type { Size } from '@/lib/types'

import { Pill } from './Pill'

const containerSizeClasses: Record<string, string> = {
  xs: 'min-h-6 rounded px-2 text-xs',
  sm: 'min-h-8 rounded-md px-3 text-sm',
  md: 'min-h-10 rounded-lg px-3 text-sm',
  lg: 'min-h-12 rounded-lg px-4 text-base',
  xl: 'min-h-14 rounded-xl px-5 text-lg',
}

interface PillInputProps {
  values: string[]
  onValuesChange: (values: string[]) => void
  label?: string
  error?: string
  placeholder?: string
  size?: Size
  disabled?: boolean
  className?: string
}

function PillInput({
  values,
  onValuesChange,
  label,
  error,
  placeholder,
  size = 'md',
  disabled,
  className,
}: PillInputProps) {
  const [inputValue, setInputValue] = useState('')
  const id = useId()

  function addValues(raw: string) {
    const newValues = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && !values.includes(s))
    if (newValues.length > 0) {
      onValuesChange([...values, ...newValues])
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addValues(inputValue)
      setInputValue('')
    }
    if (e.key === 'Backspace' && inputValue === '' && values.length > 0) {
      onValuesChange(values.slice(0, -1))
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text')
    addValues(pasted)
    setInputValue('')
  }

  function handleBlur() {
    if (inputValue.trim()) {
      addValues(inputValue)
      setInputValue('')
    }
  }

  return (
    <div className={cn('stack gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-text-secondary text-sm font-medium">
          {label}
        </label>
      )}
      <div
        className={cn(
          'border-border-default bg-bg-base transition-smooth flex flex-wrap items-center gap-1.5 border py-1',
          'has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-2',
          containerSizeClasses[size],
          error && 'border-error',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        {values.map((value) => (
          <Pill
            key={value}
            size="sm"
            onRemove={() => onValuesChange(values.filter((v) => v !== value))}
          >
            {value}
          </Pill>
        ))}
        <input
          id={id}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
          disabled={disabled}
          className="placeholder:text-text-tertiary min-w-20 flex-1 bg-transparent outline-none"
          placeholder={values.length === 0 ? placeholder : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="text-error text-sm">
          {error}
        </p>
      )}
    </div>
  )
}

export { PillInput }
export type { PillInputProps }
