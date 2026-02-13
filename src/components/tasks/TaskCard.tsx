import type { DraggableAttributes } from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import {
  DotsSixVerticalIcon,
  PencilSimpleIcon,
  TagIcon,
} from '@phosphor-icons/react'

import IconButton from '@/components/common/IconButton'
import Pill from '@/components/common/Pill'
import cn from '@/lib/classnames'
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
  'P3 - Optional': 'default',
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
  const hasMetadata = task.category !== null || task.priority !== null

  return (
    <div
      className={cn(
        'group border-border-default bg-bg-raised flex items-stretch gap-3 rounded-md border p-3',
        isDragging && 'border-dashed opacity-50',
        className,
      )}
    >
      {dragHandleListeners && (
        <button
          type="button"
          className="text-text-tertiary transition-smooth hover:text-text-secondary flex shrink-0 cursor-grab items-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...dragHandleListeners}
          {...dragHandleAttributes}
        >
          <DotsSixVerticalIcon size={20} />
        </button>
      )}

      <input
        type="checkbox"
        checked={task.isDone}
        onChange={() => onUpdate({ isDone: !task.isDone })}
        aria-label={`Mark "${task.title}" as ${task.isDone ? 'not done' : 'done'}`}
        className="accent-accent h-4 w-4 shrink-0 cursor-pointer self-center rounded"
      />

      <div className="min-w-0 flex-1">
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
          <div className="border-border-default mt-2 flex items-center justify-between gap-1.5 border-t pt-2">
            {task.category && (
              <p className="text-text-secondary flex items-center gap-2 text-sm">
                <TagIcon size={14} /> {task.category}
              </p>
            )}
            {task.priority && (
              <Pill
                className="ml-auto"
                size="sm"
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
        className="shrink-0 self-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
      >
        <PencilSimpleIcon size={16} />
      </IconButton>
    </div>
  )
}
