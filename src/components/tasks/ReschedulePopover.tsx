import {
  CaretLeftIcon,
  CaretRightIcon,
  ClockClockwiseIcon,
} from '@phosphor-icons/react'
import { useMemo, useState } from 'react'

import IconButton from '@/components/common/IconButton'
import Popover from '@/components/common/Popover'
import cn from '@/lib/classnames'
import dayjs, { getMonthGrid, isToday, toISODate } from '@/lib/dayjs'

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

type Shortcut = {
  label: string
  date: string
}

function getShortcuts(): Shortcut[] {
  const today = dayjs()
  const weekday = today.isoWeekday() // 1=Mon ... 7=Sun

  const shortcuts: Shortcut[] = [
    { label: 'Today', date: toISODate(today) },
    { label: 'Tomorrow', date: toISODate(today.add(1, 'day')) },
  ]

  // Later this week: Wed if Mon/Tue, Fri if Wed/Thu, skip Fri–Sun
  if (weekday <= 2) {
    shortcuts.push({
      label: 'Later this week',
      date: toISODate(today.startOf('isoWeek').add(2, 'day')), // Wednesday
    })
  } else if (weekday <= 4) {
    shortcuts.push({
      label: 'Later this week',
      date: toISODate(today.startOf('isoWeek').add(4, 'day')), // Friday
    })
  }

  // Weekend: this Saturday, skip if already Sat/Sun
  if (weekday <= 5) {
    shortcuts.push({
      label: 'Weekend',
      date: toISODate(today.startOf('isoWeek').add(5, 'day')), // Saturday
    })
  }

  // Next week: next Monday
  shortcuts.push({
    label: 'Next week',
    date: toISODate(today.startOf('isoWeek').add(7, 'day')),
  })

  return shortcuts
}

function formatShortcutDate(dateStr: string): string {
  const date = dayjs(dateStr)
  if (isToday(date)) return 'Today'
  return date.format('ddd, MMM D')
}

export default function ReschedulePopover(props: {
  dueDate?: string | null
  onSelect: (dueDate: string | null) => void
  trigger?: React.ReactNode
  className?: string
}) {
  const { dueDate = null, onSelect, trigger, className } = props
  const [isOpen, setIsOpen] = useState(false)

  const shortcuts = useMemo(() => getShortcuts(), [])

  // Calendar state
  const [viewYear, setViewYear] = useState(() => dayjs().year())
  const [viewMonth, setViewMonth] = useState(() => dayjs().month())

  const grid = useMemo(
    () => getMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  )
  const monthLabel = dayjs().year(viewYear).month(viewMonth).format('MMMM YYYY')

  function handleOpen(open: boolean) {
    if (open) {
      // Reset calendar to current due date or today
      const target = dueDate ? dayjs(dueDate) : dayjs()
      setViewYear(target.year())
      setViewMonth(target.month())
    }
    setIsOpen(open)
  }

  function handleSelect(date: string | null) {
    onSelect(date)
    setIsOpen(false)
  }

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

  const defaultTrigger = (
    <IconButton
      variant="ghost"
      size="xs"
      label="Reschedule"
      onClick={() => handleOpen(!isOpen)}
      className={cn('tooltip-end', isOpen && 'opacity-100', className)}
    >
      <ClockClockwiseIcon size={16} />
    </IconButton>
  )

  return (
    <Popover
      align="end"
      open={isOpen}
      onOpenChange={handleOpen}
      className="w-64 p-2"
      trigger={
        trigger ? (
          <div onClick={() => handleOpen(!isOpen)}>{trigger}</div>
        ) : (
          defaultTrigger
        )
      }
    >
      {/* Shortcut buttons */}
      <div className="stack gap-0.5">
        {shortcuts.map((shortcut) => (
          <button
            key={shortcut.date}
            type="button"
            onClick={() => handleSelect(shortcut.date)}
            className={cn(
              'transition-smooth flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-left text-sm',
              dueDate === shortcut.date
                ? 'bg-accent text-text-inverse hover:bg-accent-hover'
                : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
            )}
          >
            <span>{shortcut.label}</span>
            <span
              className={cn(
                'text-xs',
                dueDate === shortcut.date
                  ? 'text-text-inverse/70'
                  : 'text-text-tertiary',
              )}
            >
              {formatShortcutDate(shortcut.date)}
            </span>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="border-border-default my-2 border-t" />

      {/* Calendar */}
      <div>
        {/* Month navigation */}
        <div className="mb-2 flex items-center justify-between">
          <IconButton
            variant="ghost"
            size="xs"
            label="Previous month"
            onClick={goToPrevMonth}
          >
            <CaretLeftIcon size={14} />
          </IconButton>
          <span className="text-text-primary text-xs font-medium">
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
        <div className="mb-0.5 grid grid-cols-7">
          {DAY_HEADERS.map((day) => (
            <div
              key={day}
              className="text-text-tertiary text-center text-[10px] font-medium"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {grid.map(({ date, isCurrentMonth }) => {
            const dateStr = toISODate(date)
            const today = isToday(date)
            const selected = dueDate === dateStr

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => handleSelect(dateStr)}
                aria-label={date.format('MMMM D, YYYY')}
                className={cn(
                  'transition-smooth center-all h-7 w-full cursor-pointer rounded text-xs',
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
    </Popover>
  )
}
