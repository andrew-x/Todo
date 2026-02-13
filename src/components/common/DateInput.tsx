import {
  CalendarBlankIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from '@phosphor-icons/react'
import { cva, type VariantProps } from 'class-variance-authority'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

import IconButton from '@/components/common/IconButton'
import cn from '@/lib/classnames'
import dayjs, {
  fromISODate,
  getMonthGrid,
  isToday,
  toISODate,
} from '@/lib/dayjs'

const dateInputVariants = cva(
  'w-full border border-border-default bg-bg-base text-text-primary placeholder:text-text-tertiary transition-smooth focus-ring cursor-pointer',
  {
    variants: {
      size: {
        xs: 'h-6 rounded-sm pr-6 pl-2 text-xs',
        sm: 'h-8 rounded pr-7 pl-3 text-sm',
        md: 'h-10 rounded-md pr-8 pl-4 text-sm',
        lg: 'h-12 rounded-md pr-9 pl-5 text-base',
        xl: 'h-14 rounded-lg pr-10 pl-6 text-lg',
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

export type DateInputProps = VariantProps<typeof dateInputVariants> & {
  value: string
  onChange: (value: string) => void
  label?: string
  error?: string
  placeholder?: string
  disabled?: boolean
  id?: string
  className?: string
}

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function DateInput({
  value,
  onChange,
  label,
  error,
  placeholder = 'YYYY-MM-DD',
  disabled,
  size = 'md',
  id: idProp,
  className,
}: DateInputProps) {
  const autoId = useId()
  const inputId = idProp ?? autoId
  const calendarId = `${inputId}-calendar`

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const [inputValue, setInputValue] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [flipUp, setFlipUp] = useState(false)
  const [focusedDate, setFocusedDate] = useState<dayjs.Dayjs | null>(null)

  // Calendar view month/year
  const parsed = value ? fromISODate(value) : null
  const validParsed = parsed?.isValid() ? parsed : null
  const [viewYear, setViewYear] = useState(
    () => validParsed?.year() ?? dayjs().year(),
  )
  const [viewMonth, setViewMonth] = useState(
    () => validParsed?.month() ?? dayjs().month(),
  )

  // Sync input text when prop value changes externally
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Sync calendar view and measure direction when popup opens
  useEffect(() => {
    if (isOpen) {
      const d = value ? fromISODate(value) : null
      const target = d?.isValid() ? d : dayjs()
      setViewYear(target.year())
      setViewMonth(target.month())
      setFocusedDate(d?.isValid() ? d : dayjs())

      // Flip calendar upward if not enough space below
      const CALENDAR_HEIGHT = 300
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setFlipUp(rect.bottom + CALENDAR_HEIGHT > window.innerHeight)
      }
    }
  }, [isOpen, value])

  const grid = useMemo(
    () => getMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  )

  const monthLabel = dayjs().year(viewYear).month(viewMonth).format('MMMM YYYY')

  // --- Commit logic ---
  function commitValue(raw: string) {
    const trimmed = raw.trim()
    if (trimmed === '') {
      onChange('')
      setInputValue('')
      return
    }
    const d = fromISODate(trimmed)
    if (d.isValid()) {
      onChange(trimmed)
      setInputValue(trimmed)
    } else {
      // Revert to last good value
      setInputValue(value)
    }
  }

  // --- Input handlers ---
  function handleInputBlur(e: React.FocusEvent) {
    // Don't commit if focus is moving within the container (e.g. to calendar)
    if (containerRef.current?.contains(e.relatedTarget as Node)) return
    commitValue(inputValue)
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitValue(inputValue)
    }
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault()
      setIsOpen(false)
    }
  }

  // --- Toggle button ---
  function handleToggle() {
    setIsOpen((prev) => !prev)
  }

  // --- Click outside ---
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

  // --- Month navigation ---
  function goToPrevMonth() {
    const d = dayjs().year(viewYear).month(viewMonth).subtract(1, 'month')
    setViewYear(d.year())
    setViewMonth(d.month())
  }

  function goToNextMonth() {
    const d = dayjs().year(viewYear).month(viewMonth).add(1, 'month')
    setViewYear(d.year())
    setViewMonth(d.month())
  }

  // --- Date selection ---
  function selectDate(date: dayjs.Dayjs) {
    const iso = toISODate(date)
    onChange(iso)
    setInputValue(iso)
    setIsOpen(false)
    inputRef.current?.focus()
  }

  // --- Calendar keyboard navigation ---
  const handleCalendarKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!focusedDate) return

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        selectDate(focusedDate)
        return
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        setIsOpen(false)
        inputRef.current?.focus()
        return
      }

      const directionMap: Record<string, dayjs.Dayjs> = {
        ArrowLeft: focusedDate.subtract(1, 'day'),
        ArrowRight: focusedDate.add(1, 'day'),
        ArrowUp: focusedDate.subtract(1, 'week'),
        ArrowDown: focusedDate.add(1, 'week'),
      }

      const next = directionMap[e.key]
      if (!next) return

      e.preventDefault()

      if (next.month() !== viewMonth || next.year() !== viewYear) {
        setViewYear(next.year())
        setViewMonth(next.month())
      }
      setFocusedDate(next)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [focusedDate, viewMonth, viewYear],
  )

  // Focus the active calendar cell when focusedDate changes
  useEffect(() => {
    if (!isOpen || !focusedDate || !gridRef.current) return
    const focusedISO = toISODate(focusedDate)
    const cell = gridRef.current.querySelector(
      `[data-date="${focusedISO}"]`,
    ) as HTMLElement | null
    cell?.focus()
  }, [isOpen, focusedDate])

  const sizeKey = size ?? 'md'

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
          ref={inputRef}
          id={inputId}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-controls={isOpen ? calendarId : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            dateInputVariants({ size }),
            error && 'border-error',
            disabled && 'pointer-events-none opacity-50',
          )}
        />
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          tabIndex={-1}
          aria-label="Choose date"
          className={cn(
            'text-text-tertiary hover:text-text-primary transition-smooth absolute top-1/2 -translate-y-1/2 cursor-pointer',
            iconOffset[sizeKey],
          )}
        >
          <CalendarBlankIcon size={iconSizes[sizeKey]} />
        </button>

        {isOpen && (
          <div
            id={calendarId}
            role="dialog"
            aria-label="Choose date"
            className={cn(
              'bg-bg-overlay border-border-default absolute left-0 z-50 w-64 rounded-md border p-3 shadow-lg',
              flipUp ? 'bottom-full mb-1' : 'top-full mt-1',
            )}
          >
            {/* Month navigation */}
            <div className="mb-3 flex items-center justify-between">
              <IconButton
                variant="ghost"
                size="xs"
                label="Previous month"
                onClick={goToPrevMonth}
              >
                <CaretLeftIcon size={14} />
              </IconButton>
              <span
                className="text-text-primary text-sm font-medium"
                aria-live="polite"
              >
                {monthLabel}
              </span>
              <IconButton
                variant="ghost"
                size="xs"
                label="Next month"
                onClick={goToNextMonth}
              >
                <CaretRightIcon size={14} />
              </IconButton>
            </div>

            {/* Day headers */}
            <div className="mb-1 grid grid-cols-7">
              {DAY_HEADERS.map((day) => (
                <div
                  key={day}
                  className="text-text-tertiary text-center text-xs font-medium"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div
              ref={gridRef}
              className="grid grid-cols-7"
              onKeyDown={handleCalendarKeyDown}
            >
              {grid.map(({ date, isCurrentMonth }) => {
                const dateStr = toISODate(date)
                const today = isToday(date)
                const selected = value === dateStr
                const focused =
                  focusedDate && toISODate(focusedDate) === dateStr

                return (
                  <button
                    key={dateStr}
                    type="button"
                    data-date={dateStr}
                    tabIndex={focused ? 0 : -1}
                    onClick={() => selectDate(date)}
                    aria-label={date.format('MMMM D, YYYY')}
                    aria-pressed={selected}
                    className={cn(
                      'transition-smooth center-all h-8 w-8 cursor-pointer rounded-md text-sm',
                      !isCurrentMonth && 'text-text-disabled',
                      isCurrentMonth &&
                        !selected &&
                        'text-text-secondary hover:bg-surface-hover',
                      today && !selected && 'text-accent-text font-medium',
                      selected && 'bg-accent text-text-inverse',
                    )}
                  >
                    {date.date()}
                  </button>
                )
              })}
            </div>
          </div>
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
