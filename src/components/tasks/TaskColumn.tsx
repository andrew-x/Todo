import { useDroppable } from '@dnd-kit/core'
import { CaretRightIcon } from '@phosphor-icons/react'
import { useState } from 'react'

import SortableGroup from '@/components/tasks/SortableGroup'
import SortableTaskCard from '@/components/tasks/SortableTaskCard'
import TaskCard from '@/components/tasks/TaskCard'
import cn from '@/lib/classnames'
import { buildColumnId } from '@/lib/dnd'
import { PRIORITIES } from '@/lib/types'
import type { Priority, Task } from '@/lib/types'

export type TaskColumnGroup = {
  containerId: string
  label: string | null
  tasks: Task[]
  itemIds: string[]
}

type DndColumnProps = {
  title: string
  queue: Task['queue']
  groups: TaskColumnGroup[]
  totalCount: number
  doneTasks?: Task[]
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
  className?: string
  headerAction?: React.ReactNode
  isToday?: boolean
  tasks?: never
}

type StaticColumnProps = {
  title: string
  tasks: Task[]
  doneTasks?: Task[]
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
  className?: string
  headerAction?: React.ReactNode
  isToday?: boolean
  queue?: never
  groups?: never
  totalCount?: never
}

export type TaskColumnProps = DndColumnProps | StaticColumnProps

// --- Done section (shared between static & DnD) ---

function DoneSection({
  doneTasks,
  onUpdate,
  onDelete,
  onEdit,
}: {
  doneTasks: Task[]
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
}) {
  const [isCollapsed, setIsCollapsed] = useState(true)

  if (doneTasks.length === 0) return null

  return (
    <div className="border-border-default mt-3 border-t pt-3">
      <button
        type="button"
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="text-text-tertiary mb-2 flex items-center gap-1 text-xs font-medium"
      >
        <CaretRightIcon
          size={12}
          className={cn(
            'transition-transform duration-150',
            !isCollapsed && 'rotate-90',
          )}
        />
        Done ({doneTasks.length})
      </button>
      {!isCollapsed && (
        <div className="stack gap-2">
          {doneTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdate={(updates) => onUpdate(task.id, updates)}
              onDelete={() => onDelete(task.id)}
              onEdit={() => onEdit(task)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// --- Static (non-DnD) rendering ---

type PriorityGroup = {
  priority: Priority | null
  label: string
  tasks: Task[]
}

function groupByPriority(tasks: Task[]): PriorityGroup[] | null {
  const hasPriorities = tasks.some((t) => t.priority !== null)
  if (!hasPriorities) return null

  const groups = new Map<Priority | null, Task[]>()
  for (const task of tasks) {
    const group = groups.get(task.priority)
    if (group) {
      group.push(task)
    } else {
      groups.set(task.priority, [task])
    }
  }

  return [...groups.entries()]
    .sort(([a], [b]) => {
      if (a === null) return 1
      if (b === null) return -1
      return PRIORITIES.indexOf(a) - PRIORITIES.indexOf(b)
    })
    .map(([priority, tasks]) => ({
      priority,
      label: priority ?? 'No priority',
      tasks,
    }))
}

function StaticTaskColumn({
  title,
  tasks,
  doneTasks = [],
  onUpdate,
  onDelete,
  onEdit,
  className,
  headerAction,
  isToday,
}: StaticColumnProps) {
  const priorityGroups = groupByPriority(tasks)

  return (
    <div className={cn('stack min-h-0 flex-1', className)}>
      <div className="mb-3 flex items-center gap-2">
        <h3
          className={cn(
            'text-sm font-medium',
            isToday ? 'text-accent' : 'text-text-secondary',
          )}
        >
          {title}
        </h3>
        <span className="text-text-tertiary text-xs">{tasks.length}</span>
        {headerAction && <div className="ml-auto">{headerAction}</div>}
      </div>

      <div className="stack flex-1 gap-2 overflow-y-auto">
        {tasks.length === 0 && doneTasks.length === 0 ? (
          <p className="text-text-tertiary py-8 text-center text-sm">
            No tasks
          </p>
        ) : priorityGroups ? (
          priorityGroups.map((group) => (
            <div key={group.priority ?? 'none'} className="stack gap-2">
              <p className="text-text-tertiary mt-1 text-xs font-medium first:mt-0">
                {group.label}
              </p>
              {group.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={(updates) => onUpdate(task.id, updates)}
                  onDelete={() => onDelete(task.id)}
                  onEdit={() => onEdit(task)}
                />
              ))}
            </div>
          ))
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdate={(updates) => onUpdate(task.id, updates)}
              onDelete={() => onDelete(task.id)}
              onEdit={() => onEdit(task)}
            />
          ))
        )}
        <DoneSection
          doneTasks={doneTasks}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      </div>
    </div>
  )
}

// --- DnD-enabled rendering ---

function DndTaskColumn({
  title,
  queue,
  groups,
  totalCount,
  doneTasks = [],
  onUpdate,
  onDelete,
  onEdit,
  className,
  headerAction,
  isToday,
}: DndColumnProps) {
  const columnId = buildColumnId(queue)
  const { setNodeRef: setColumnRef, isOver: isColumnOver } = useDroppable({
    id: columnId,
  })

  return (
    <div
      ref={setColumnRef}
      className={cn(
        'stack min-h-0 flex-1',
        isColumnOver && totalCount === 0 && 'bg-surface-hover/30 rounded-lg',
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <h3
          className={cn(
            'text-sm font-medium',
            isToday ? 'text-accent' : 'text-text-secondary',
          )}
        >
          {title}
        </h3>
        <span className="text-text-tertiary text-xs">{totalCount}</span>
        {headerAction && <div className="ml-auto">{headerAction}</div>}
      </div>

      <div className="stack flex-1 gap-2 overflow-y-auto">
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
                  <p className="text-text-tertiary text-xs">
                    {totalCount === 0 ? 'No tasks' : 'Drop here'}
                  </p>
                </div>
              )}
            </div>
          </SortableGroup>
        ))}
        <DoneSection
          doneTasks={doneTasks}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      </div>
    </div>
  )
}

// --- Exported component ---

export default function TaskColumn(props: TaskColumnProps) {
  if ('groups' in props && props.groups) {
    return <DndTaskColumn {...(props as DndColumnProps)} />
  }
  return <StaticTaskColumn {...(props as StaticColumnProps)} />
}
