import type { DraggableAttributes } from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import {
  CalendarBlankIcon,
  CheckCircleIcon,
  DotsSixVerticalIcon,
  PencilSimpleIcon,
  TagIcon,
} from '@phosphor-icons/react'

import IconButton from '@/components/common/IconButton'
import Pill from '@/components/common/Pill'
import cn from '@/lib/classnames'
import dayjs, { fromISODate, isToday } from '@/lib/dayjs'
import type { Color, Priority, Task } from '@/lib/types'

export type TaskCardProps = {
  task: Task
  onUpdate: (updates: Partial<Task>) => void
  onDelete: () => void
  onEdit?: () => void
  className?: string
  isDragging?: boolean
  dragHandleListeners?: SyntheticListenerMap
  dragHandleAttributes?: DraggableAttributes
}

const PRIORITY_COLORS: Record<Priority, Color> = {
  'P0 - Critical': 'error',
  'P1 - Important': 'warning',
  'P2 - Standard': 'secondary',
  'P3 - Optional': 'success',
  'P4 - Later': 'default',
}

export default function TaskCard(props: TaskCardProps) {
  const {
    task,
    onUpdate,
    onEdit,
    className,
    isDragging,
    dragHandleListeners,
    dragHandleAttributes,
  } = props
  const hasDescription = task.description.length > 0
  const hasMetadata =
    task.category !== null ||
    task.priority !== null ||
    task.dueDate !== null ||
    (task.isDone && task.completedAt != null)

  const dueDate = task.dueDate ? fromISODate(task.dueDate) : null
  const isOverdue =
    dueDate !== null && !isToday(dueDate) && dueDate.isBefore(dayjs(), 'day')

  return (
    <div
      className={cn(
        'group border-border-default bg-bg-raised flex items-stretch gap-2 rounded-md border p-2',
        isDragging && 'border-dashed opacity-50',
        className,
      )}
    >
      {dragHandleListeners && (
        <button
          type="button"
          className="text-text-tertiary transition-smooth hover:bg-surface-hover hover:text-text-secondary -my-2 -ml-2 flex w-5 shrink-0 cursor-grab items-center justify-center rounded-l-[5px] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...dragHandleListeners}
          {...dragHandleAttributes}
        >
          <DotsSixVerticalIcon size={14} />
        </button>
      )}

      <input
        type="checkbox"
        checked={task.isDone}
        onChange={() => onUpdate({ isDone: !task.isDone })}
        aria-label={`Mark "${task.title}" as ${task.isDone ? 'not done' : 'done'}`}
        className="accent-accent h-4 w-4 shrink-0 cursor-pointer self-center rounded"
      />

      <div className="ml-0.5 min-w-0 flex-1">
        <p
          className={cn(
            'text-text-primary text-sm',
            task.isDone && 'text-text-disabled line-through',
          )}
        >
          {task.title}
        </p>

        {hasDescription && (
          <p className="text-text-tertiary mt-1 truncate text-xs">
            {task.description}
          </p>
        )}

        {hasMetadata && (
          <div className="mt-1.5 flex items-center justify-between gap-1.5">
            {task.category && (
              <p className="text-text-secondary flex items-center gap-1 text-xs">
                <TagIcon size={12} /> {task.category}
              </p>
            )}
            {dueDate && (
              <span
                className={cn(
                  'tooltip flex items-center gap-1 text-xs',
                  isOverdue ? 'text-error' : 'text-text-secondary',
                )}
                data-tooltip={dueDate.format('MMM D, YYYY')}
              >
                <CalendarBlankIcon size={12} />
                {isToday(dueDate) ? 'Today' : dueDate.fromNow()}
              </span>
            )}
            {task.isDone && task.completedAt != null && (
              <span className="text-text-tertiary flex items-center gap-1 text-xs">
                <CheckCircleIcon size={12} />
                {dayjs(task.completedAt).fromNow()}
              </span>
            )}
            {task.priority && (
              <Pill
                className="ml-auto"
                size="xs"
                color={PRIORITY_COLORS[task.priority]}
              >
                {task.priority.slice(0, 2)}
              </Pill>
            )}
          </div>
        )}
      </div>

      <IconButton
        variant="ghost"
        size="xs"
        label="Edit task"
        onClick={onEdit}
        className="tooltip-end shrink-0 self-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
      >
        <PencilSimpleIcon size={16} />
      </IconButton>
    </div>
  )
}
