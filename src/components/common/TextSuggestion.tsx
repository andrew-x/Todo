import { cva, type VariantProps } from 'class-variance-authority'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

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

export type TextSuggestionProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size'
> &
  VariantProps<typeof inputVariants> & {
    label?: string
    error?: string
    suggestions: string[]
    onSelect?: (value: string) => void
  }

export default function TextSuggestion({
  label,
  error,
  size,
  className,
  suggestions,
  onSelect,
  value: controlledValue,
  onChange: controlledOnChange,
  onFocus,
  onBlur,
  onKeyDown,
  ...props
}: TextSuggestionProps) {
  const autoId = useId()
  const inputId = props.id ?? autoId
  const listboxId = `${inputId}-listbox`

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [internalValue, setInternalValue] = useState(
    (controlledValue as string) ?? '',
  )
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const isControlled = controlledValue !== undefined
  const currentValue = isControlled
    ? (controlledValue as string)
    : internalValue

  const filteredSuggestions = useMemo(() => {
    if (!currentValue) return suggestions
    const lower = currentValue.toLowerCase()
    return suggestions.filter((s) => s.toLowerCase().startsWith(lower))
  }, [currentValue, suggestions])

  // Clamp activeIndex when filtered list shrinks (e.g. suggestions prop changes)
  const clampedIndex =
    activeIndex >= filteredSuggestions.length ? -1 : activeIndex

  // Click outside
  useEffect(() => {
    if (!isOpen) return
    function handleMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isOpen])

  function selectSuggestion(suggestion: string) {
    if (!isControlled) {
      setInternalValue(suggestion)
    }
    if (controlledOnChange && inputRef.current) {
      inputRef.current.value = suggestion
      controlledOnChange({
        target: inputRef.current,
        currentTarget: inputRef.current,
      } as React.ChangeEvent<HTMLInputElement>)
    }
    onSelect?.(suggestion)
    setIsOpen(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value
    if (!isControlled) {
      setInternalValue(newValue)
    }
    controlledOnChange?.(e)
    setActiveIndex(-1)
    if (
      newValue &&
      suggestions.some((s) =>
        s.toLowerCase().startsWith(newValue.toLowerCase()),
      )
    ) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    onFocus?.(e)
    if (currentValue && filteredSuggestions.length > 0) {
      setIsOpen(true)
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    // Delay to allow click on suggestion to fire first
    setTimeout(() => {
      if (
        containerRef.current &&
        !containerRef.current.contains(document.activeElement)
      ) {
        setIsOpen(false)
        onBlur?.(e)
      }
    }, 0)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(e)
    if (e.defaultPrevented) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen && filteredSuggestions.length > 0) {
        setIsOpen(true)
        setActiveIndex(0)
      } else if (isOpen) {
        setActiveIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0,
        )
      }
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (isOpen) {
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1,
        )
      }
      return
    }

    if (e.key === 'Enter') {
      if (
        isOpen &&
        clampedIndex >= 0 &&
        clampedIndex < filteredSuggestions.length
      ) {
        e.preventDefault()
        selectSuggestion(filteredSuggestions[clampedIndex])
      }
      return
    }

    if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault()
        setIsOpen(false)
        setActiveIndex(-1)
      }
      return
    }
  }

  const activeOptionId =
    clampedIndex >= 0 ? `${listboxId}-option-${clampedIndex}` : undefined

  return (
    <div className={cn('stack gap-1.5', className)} ref={containerRef}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-text-secondary text-sm font-medium"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...props}
          ref={inputRef}
          id={inputId}
          type="text"
          value={currentValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(inputVariants({ size }), error && 'border-error')}
        />
        {isOpen && filteredSuggestions.length > 0 && (
          <ul
            id={listboxId}
            role="listbox"
            className="bg-bg-overlay border-border-default absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-md border shadow-lg"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <li
                key={suggestion}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={index === clampedIndex}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  selectSuggestion(suggestion)
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  'text-text-primary transition-smooth cursor-pointer px-3 py-2 text-sm',
                  index === clampedIndex && 'bg-accent-subtle text-accent-text',
                )}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-error text-sm">
          {error}
        </p>
      )}
    </div>
  )
}
