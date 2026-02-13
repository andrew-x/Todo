import { useDroppable } from '@dnd-kit/core'
import { CaretDownIcon, CaretRightIcon } from '@phosphor-icons/react'
import { useState } from 'react'

import SortableGroup from '@/components/tasks/SortableGroup'
import SortableTaskCard from '@/components/tasks/SortableTaskCard'
import TaskCard from '@/components/tasks/TaskCard'
import type { TaskColumnGroup } from '@/components/tasks/TaskColumn'
import cn from '@/lib/classnames'
import type { Task } from '@/lib/types'

type StaticProps = {
  mode?: 'static'
  tasks: Task[]
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
  className?: string
  groups?: never
  columnId?: never
  totalCount?: never
}

type DndProps = {
  mode: 'dnd'
  groups: TaskColumnGroup[]
  columnId: string
  totalCount: number
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
  className?: string
  tasks?: never
}

export type UnscheduledSectionProps = StaticProps | DndProps

function StaticBody({
  tasks,
  onUpdate,
  onDelete,
  onEdit,
}: {
  tasks: Task[]
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onUpdate={(updates) => onUpdate(task.id, updates)}
          onDelete={() => onDelete(task.id)}
          onEdit={() => onEdit(task)}
          className="w-full"
        />
      ))}
    </div>
  )
}

function DndBody({
  groups,
  columnId,
  onUpdate,
  onDelete,
  onEdit,
}: {
  groups: TaskColumnGroup[]
  columnId: string
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId })

  return (
    <div
      ref={setNodeRef}
      className={cn('stack gap-2', isOver && 'bg-surface-hover/30 rounded-md')}
    >
      {groups.map((group) => (
        <SortableGroup
          key={group.containerId}
          id={group.containerId}
          items={group.itemIds}
        >
          <div className="stack gap-2">
            {group.label && (
              <p className="text-text-tertiary mt-1 text-xs font-medium first:mt-0">
                {group.label}
              </p>
            )}
            {group.tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onUpdate={(updates) => onUpdate(task.id, updates)}
                onDelete={() => onDelete(task.id)}
                onEdit={() => onEdit(task)}
              />
            ))}
            {group.tasks.length === 0 && (
              <div className="border-border-default rounded-md border border-dashed py-4 text-center">
                <p className="text-text-tertiary text-xs">Drop here</p>
              </div>
            )}
          </div>
        </SortableGroup>
      ))}
    </div>
  )
}

export default function UnscheduledSection(props: UnscheduledSectionProps) {
  const { onUpdate, onDelete, onEdit, className } = props
  const [isOpen, setIsOpen] = useState(false)

  const isDnd = props.mode === 'dnd'
  const count = isDnd ? props.totalCount : props.tasks.length

  if (count === 0 && !isDnd) return null

  return (
    <div className={cn('border-border-default mb-4 border-b pb-4', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="text-text-secondary transition-smooth hover:text-text-primary focus-ring mb-2 flex cursor-pointer items-center gap-1.5 text-sm font-medium"
      >
        {isOpen ? <CaretDownIcon size={14} /> : <CaretRightIcon size={14} />}
        Unscheduled
        <span className="text-text-tertiary text-xs">{count}</span>
      </button>

      {isOpen &&
        (isDnd ? (
          <DndBody
            groups={props.groups}
            columnId={props.columnId}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ) : (
          <StaticBody
            tasks={props.tasks}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
    </div>
  )
}
