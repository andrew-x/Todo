import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import {
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  ClockClockwiseIcon,
} from '@phosphor-icons/react'
import { useMemo, useState } from 'react'

import Button from '@/components/common/Button'
import IconButton from '@/components/common/IconButton'
import ReschedulePopover from '@/components/tasks/ReschedulePopover'
import SortableGroup from '@/components/tasks/SortableGroup'
import SortableTaskCard from '@/components/tasks/SortableTaskCard'
import TaskCard from '@/components/tasks/TaskCard'
import type { TaskColumnGroup } from '@/components/tasks/TaskColumn'
import UnscheduledSection from '@/components/tasks/UnscheduledSection'
import cn from '@/lib/classnames'
import dayjs, { getWeekDays, isToday, toISODate } from '@/lib/dayjs'
import {
  buildDateColumnId,
  buildDateContainerMap,
  buildDateGroupId,
  buildItemId,
  findContainer,
  getDateColumnContainers,
  getDateFromContainerId,
  getPriorityFromContainerId,
  parseContainerId,
  sortTasks,
} from '@/lib/dnd'
import type { Priority, Task } from '@/lib/types'
import { PRIORITIES } from '@/lib/types'

export type WeekViewProps = {
  tasks: Task[]
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
  onBatchUpdate: (
    updates: Array<
      { id: string } & Partial<
        Pick<Task, 'queue' | 'priority' | 'order' | 'dueDate'>
      >
    >,
  ) => void
}

type DragState = {
  activeTask: Task
  containers: Record<string, string[]>
}

// --- Helper: group tasks by priority (local, parallels WorkView) ---

function groupByPriority(
  tasks: Task[],
): Array<{ priority: Priority | null; tasks: Task[] }> | null {
  const hasPriorities = tasks.some((t) => t.priority !== null)
  if (!hasPriorities) return null

  const groups = new Map<Priority | null, Task[]>()
  for (const task of tasks) {
    const existing = groups.get(task.priority)
    if (existing) {
      existing.push(task)
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
    .map(([priority, tasks]) => ({ priority, tasks }))
}

// --- Compute column groups from tasks (static, no drag) ---

function computeDateColumnGroups(
  tasks: Task[],
  date: string | null,
): TaskColumnGroup[] {
  const dateTasks = sortTasks(
    tasks.filter((t) => t.dueDate === date && !t.isDone),
  )
  const groups = groupByPriority(dateTasks)

  if (groups) {
    return groups.map((g) => ({
      containerId: buildDateGroupId(date, g.priority),
      label: g.priority ?? 'No priority',
      tasks: g.tasks,
      itemIds: g.tasks.map((t) => buildItemId(t.id)),
    }))
  }

  return [
    {
      containerId: buildDateColumnId(date),
      label: null,
      tasks: dateTasks,
      itemIds: dateTasks.map((t) => buildItemId(t.id)),
    },
  ]
}

// --- Compute column groups from drag state containers ---

function computeDateColumnGroupsFromDragState(
  containers: Record<string, string[]>,
  taskMap: Map<string, Task>,
  date: string | null,
): TaskColumnGroup[] {
  const dateContainers = getDateColumnContainers(containers, date)

  if (dateContainers.length === 0) {
    return [
      {
        containerId: buildDateColumnId(date),
        label: null,
        tasks: [],
        itemIds: [],
      },
    ]
  }

  return dateContainers.map(({ containerId, priority, taskIds }) => ({
    containerId,
    label: containerId.startsWith('dategrp::')
      ? (priority ?? 'No priority')
      : null,
    tasks: taskIds
      .map((id) => taskMap.get(id))
      .filter((t): t is Task => t !== undefined),
    itemIds: taskIds.map((id) => buildItemId(id)),
  }))
}

// --- Extract raw task ID from item:: prefix ---

function toTaskId(itemId: string): string {
  return itemId.startsWith('item::') ? itemId.slice(6) : itemId
}

// --- Compute batch updates for date-based containers ---

function computeWeekUpdates(
  containers: Record<string, string[]>,
  affectedContainers: string[],
  taskMap: Map<string, Task>,
): Array<
  { id: string } & Partial<Pick<Task, 'dueDate' | 'priority' | 'order'>>
> {
  const updates: Array<
    { id: string } & Partial<Pick<Task, 'dueDate' | 'priority' | 'order'>>
  > = []

  for (const containerId of affectedContainers) {
    const taskIds = containers[containerId] ?? []
    const date = getDateFromContainerId(containerId)
    const priority = getPriorityFromContainerId(containerId)

    for (let i = 0; i < taskIds.length; i++) {
      const taskId = taskIds[i]
      const task = taskMap.get(taskId)
      if (!task) continue

      const patch: Partial<Pick<Task, 'dueDate' | 'priority' | 'order'>> = {}
      let hasChanges = false

      if (task.order !== i) {
        patch.order = i
        hasChanges = true
      }

      if (date !== undefined && task.dueDate !== date) {
        patch.dueDate = date
        hasChanges = true
      }

      if (priority !== undefined && task.priority !== priority) {
        patch.priority = priority
        hasChanges = true
      }

      if (hasChanges) {
        updates.push({ id: taskId, ...patch })
      }
    }
  }

  return updates
}

// --- DnD-aware day column (inline, not exported) ---

function DndWeekDayColumn({
  title,
  columnId,
  groups,
  totalCount,
  isToday: today,
  isPast,
  onUpdate,
  onDelete,
  onEdit,
  onBulkReschedule,
}: {
  title: string
  columnId: string
  groups: TaskColumnGroup[]
  totalCount: number
  isToday?: boolean
  isPast?: boolean
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
  onBulkReschedule?: (dueDate: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'stack min-h-0 flex-1 rounded-lg p-2',
        isOver && totalCount === 0 && 'bg-surface-hover/30',
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <h3
          className={cn(
            'text-sm font-medium',
            today ? 'text-accent' : 'text-text-secondary',
          )}
        >
          {title}
        </h3>
        <span className="text-text-tertiary text-xs">{totalCount}</span>
        {isPast && totalCount > 0 && onBulkReschedule && (
          <ReschedulePopover
            onSelect={(date) => {
              if (date) onBulkReschedule(date)
            }}
            trigger={
              <IconButton variant="ghost" size="xs" label="Reschedule all">
                <ClockClockwiseIcon size={14} />
              </IconButton>
            }
          />
        )}
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
      </div>
    </div>
  )
}

// --- Overdue section (no DnD, static list with bulk reschedule) ---

function OverdueSection({
  tasks,
  onUpdate,
  onDelete,
  onEdit,
  onBulkReschedule,
  className,
}: {
  tasks: Task[]
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
  onBulkReschedule: (dueDate: string) => void
  className?: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={cn('border-border-default mb-4 border-b pb-4', className)}>
      <div className="mb-2 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className="text-text-secondary transition-smooth hover:text-text-primary focus-ring flex cursor-pointer items-center gap-1.5 text-sm font-medium"
        >
          {isOpen ? <CaretDownIcon size={14} /> : <CaretRightIcon size={14} />}
          Overdue
          <span className="text-text-tertiary text-xs">{tasks.length}</span>
        </button>
        <ReschedulePopover
          onSelect={(date) => {
            if (date) onBulkReschedule(date)
          }}
          trigger={
            <IconButton variant="ghost" size="xs" label="Reschedule all">
              <ClockClockwiseIcon size={14} />
            </IconButton>
          }
        />
      </div>

      {isOpen && (
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
      )}
    </div>
  )
}

// --- Main component ---

export default function WeekView({
  tasks,
  onUpdate,
  onDelete,
  onEdit,
  onBatchUpdate,
}: WeekViewProps) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [isWeekendExpanded, setIsWeekendExpanded] = useState(false)
  const [dragState, setDragState] = useState<DragState | null>(null)

  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const weekDays = useMemo(
    () => getWeekDays(dayjs().add(weekOffset, 'week')),
    [weekOffset],
  )

  const visibleDates = useMemo(() => {
    const days = isWeekendExpanded ? weekDays : weekDays.slice(0, 5)
    return days.map((d) => toISODate(d))
  }, [weekDays, isWeekendExpanded])

  const weekLabel = `${weekDays[0].format('MMM D')} – ${weekDays[6].format('MMM D')}`

  const weekendDays = weekDays.slice(5)
  const weekendTaskCount = weekendDays.reduce((count, day) => {
    const dateStr = toISODate(day)
    return (
      count + tasks.filter((t) => t.dueDate === dateStr && !t.isDone).length
    )
  }, 0)

  // --- Column group getters ---

  function getColumnGroups(date: string | null): TaskColumnGroup[] {
    if (dragState) {
      return computeDateColumnGroupsFromDragState(
        dragState.containers,
        taskMap,
        date,
      )
    }
    return computeDateColumnGroups(tasks, date)
  }

  function getColumnCount(date: string | null): number {
    if (dragState) {
      const containers = getDateColumnContainers(dragState.containers, date)
      return containers.reduce((sum, c) => sum + c.taskIds.length, 0)
    }
    return tasks.filter((t) => t.dueDate === date && !t.isDone).length
  }

  // --- Drag handlers ---

  function handleDragStart(event: DragStartEvent) {
    const activeId = String(event.active.id)
    const taskId = toTaskId(activeId)
    const task = taskMap.get(taskId)
    if (!task) return

    setDragState({
      activeTask: task,
      containers: buildDateContainerMap(tasks, visibleDates),
    })
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over || !dragState) return

    const activeId = toTaskId(String(active.id))
    const overId = String(over.id)

    const sourceContainer = findContainer(dragState.containers, activeId)
    if (!sourceContainer) return

    let destContainer: string | null = null
    const overTaskId = toTaskId(overId)

    if (overId.startsWith('item::')) {
      destContainer = findContainer(dragState.containers, overTaskId)
    } else {
      destContainer = overId
    }

    if (!destContainer || sourceContainer === destContainer) return

    const parsed = parseContainerId(destContainer)
    if (!parsed || parsed.type === 'item') return

    // For datecol drops when the column has group containers,
    // redirect to the "No priority" group
    if (parsed.type === 'datecol') {
      const date = parsed.date
      const dateContainers = getDateColumnContainers(dragState.containers, date)
      const hasGroups = dateContainers.some((c) =>
        c.containerId.startsWith('dategrp::'),
      )
      if (hasGroups) {
        const existing = dateContainers.find((c) => c.priority === null)
        destContainer = existing
          ? existing.containerId
          : buildDateGroupId(date, null)
        if (sourceContainer === destContainer) return
      }
    }

    setDragState((prev) => {
      if (!prev) return null
      const newContainers = { ...prev.containers }

      if (!(destContainer! in newContainers)) {
        newContainers[destContainer!] = []
      }

      const sourceItems = [...(newContainers[sourceContainer] ?? [])]
      const activeIndex = sourceItems.indexOf(activeId)
      if (activeIndex === -1) return prev
      sourceItems.splice(activeIndex, 1)
      newContainers[sourceContainer] = sourceItems

      const destItems = [...(newContainers[destContainer!] ?? [])]

      if (overId.startsWith('item::')) {
        const overIndex = destItems.indexOf(overTaskId)
        if (overIndex >= 0) {
          destItems.splice(overIndex + 1, 0, activeId)
        } else {
          destItems.push(activeId)
        }
      } else {
        destItems.push(activeId)
      }

      newContainers[destContainer!] = destItems

      return { ...prev, containers: newContainers }
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!dragState) {
      setDragState(null)
      return
    }

    if (!over) {
      setDragState(null)
      return
    }

    const activeId = toTaskId(String(active.id))
    const overId = String(over.id)

    const sourceContainer = findContainer(dragState.containers, activeId)
    if (!sourceContainer) {
      setDragState(null)
      return
    }

    let destContainer = sourceContainer
    if (overId.startsWith('item::')) {
      const overTaskId = toTaskId(overId)
      const overContainer = findContainer(dragState.containers, overTaskId)
      if (overContainer) destContainer = overContainer
    }

    if (sourceContainer === destContainer) {
      const items = [...(dragState.containers[sourceContainer] ?? [])]
      const activeIndex = items.indexOf(activeId)
      const overIndex = overId.startsWith('item::')
        ? items.indexOf(toTaskId(overId))
        : items.length - 1

      if (activeIndex !== overIndex && activeIndex >= 0 && overIndex >= 0) {
        items.splice(activeIndex, 1)
        items.splice(overIndex, 0, activeId)
      }

      const updates = computeWeekUpdates(
        { ...dragState.containers, [sourceContainer]: items },
        [sourceContainer],
        taskMap,
      )
      if (updates.length > 0) onBatchUpdate(updates)
    } else {
      const finalContainers = { ...dragState.containers }
      const destItems = [...(finalContainers[destContainer] ?? [])]
      const sourceItems = [...(finalContainers[sourceContainer] ?? [])]

      const srcIndex = sourceItems.indexOf(activeId)
      if (srcIndex >= 0) sourceItems.splice(srcIndex, 1)
      finalContainers[sourceContainer] = sourceItems

      const existingIndex = destItems.indexOf(activeId)
      if (existingIndex >= 0) destItems.splice(existingIndex, 1)

      if (overId.startsWith('item::')) {
        const overTaskId = toTaskId(overId)
        const overIndex = destItems.indexOf(overTaskId)
        if (overIndex >= 0) {
          destItems.splice(overIndex + 1, 0, activeId)
        } else {
          destItems.push(activeId)
        }
      } else {
        destItems.push(activeId)
      }
      finalContainers[destContainer] = destItems

      const updates = computeWeekUpdates(
        finalContainers,
        [sourceContainer, destContainer],
        taskMap,
      )
      if (updates.length > 0) onBatchUpdate(updates)
    }

    setDragState(null)
  }

  // --- Overdue tasks ---

  const todayStr = toISODate(dayjs())
  const allVisibleDates = useMemo(
    () => weekDays.map((d) => toISODate(d)),
    [weekDays],
  )

  const overdueTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          !t.isDone &&
          t.dueDate !== null &&
          t.dueDate < todayStr &&
          !allVisibleDates.includes(t.dueDate),
      ),
    [tasks, todayStr, allVisibleDates],
  )

  // --- Render ---

  const weekdaySlice = weekDays.slice(0, 5)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="stack flex-1">
        <div className="flex gap-4">
          {overdueTasks.length > 0 && (
            <OverdueSection
              tasks={overdueTasks}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onEdit={onEdit}
              onBulkReschedule={(dueDate) =>
                onBatchUpdate(overdueTasks.map((t) => ({ id: t.id, dueDate })))
              }
              className="flex-1"
            />
          )}
          <UnscheduledSection
            mode="dnd"
            groups={getColumnGroups(null)}
            columnId={buildDateColumnId(null)}
            totalCount={getColumnCount(null)}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onEdit={onEdit}
            className="flex-1"
          />
        </div>

        <div className="mb-4 flex items-center gap-3">
          <IconButton
            variant="ghost"
            size="sm"
            label="Previous week"
            onClick={() => setWeekOffset((o) => o - 1)}
            disabled={dragState !== null}
          >
            <CaretLeftIcon size={16} />
          </IconButton>
          <h3 className="text-text-primary text-sm font-medium">{weekLabel}</h3>
          <IconButton
            variant="ghost"
            size="sm"
            label="Next week"
            onClick={() => setWeekOffset((o) => o + 1)}
            disabled={dragState !== null}
          >
            <CaretRightIcon size={16} />
          </IconButton>
          {weekOffset !== 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset(0)}
              disabled={dragState !== null}
            >
              Today
            </Button>
          )}
        </div>

        <div
          className="grid flex-1 gap-2"
          style={{
            gridTemplateColumns: isWeekendExpanded
              ? 'repeat(5, 1fr) auto repeat(2, 1fr)'
              : 'repeat(5, 1fr) auto',
          }}
        >
          {weekdaySlice.map((day) => {
            const dateStr = toISODate(day)
            const today = isToday(day)
            const isPast = day.isBefore(dayjs(), 'day')

            return (
              <DndWeekDayColumn
                key={dateStr}
                title={day.format('ddd D')}
                columnId={buildDateColumnId(dateStr)}
                groups={getColumnGroups(dateStr)}
                totalCount={getColumnCount(dateStr)}
                isToday={today}
                isPast={isPast}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onEdit={onEdit}
                onBulkReschedule={(dueDate) =>
                  onBatchUpdate(
                    tasks
                      .filter((t) => t.dueDate === dateStr && !t.isDone)
                      .map((t) => ({ id: t.id, dueDate })),
                  )
                }
              />
            )
          })}

          {/* Separator / collapse toggle between weekdays and weekend */}
          <button
            type="button"
            onClick={() => setIsWeekendExpanded(!isWeekendExpanded)}
            disabled={dragState !== null}
            aria-label={
              isWeekendExpanded ? 'Collapse weekend' : 'Expand weekend'
            }
            className="group hover:bg-surface-hover transition-smooth stack cursor-pointer items-center justify-center gap-2 rounded-lg px-1 disabled:cursor-default disabled:opacity-50"
          >
            <div className="bg-border-default group-hover:bg-border-hover transition-smooth h-full w-px" />
            {isWeekendExpanded ? (
              <CaretRightIcon
                size={14}
                className="text-text-tertiary group-hover:text-text-secondary transition-smooth absolute"
              />
            ) : (
              <>
                <CaretLeftIcon
                  size={14}
                  className="text-text-tertiary group-hover:text-text-secondary transition-smooth"
                />
                <span className="text-text-tertiary group-hover:text-text-secondary transition-smooth text-xs font-medium [writing-mode:vertical-lr]">
                  Weekend
                </span>
                {weekendTaskCount > 0 && (
                  <span className="bg-surface text-text-secondary flex h-5 min-w-5 items-center justify-center rounded-full text-xs">
                    {weekendTaskCount}
                  </span>
                )}
              </>
            )}
          </button>

          {isWeekendExpanded &&
            weekendDays.map((day) => {
              const dateStr = toISODate(day)
              const today = isToday(day)
              const isPast = day.isBefore(dayjs(), 'day')

              return (
                <DndWeekDayColumn
                  key={dateStr}
                  title={day.format('ddd D')}
                  columnId={buildDateColumnId(dateStr)}
                  groups={getColumnGroups(dateStr)}
                  totalCount={getColumnCount(dateStr)}
                  isToday={today}
                  isPast={isPast}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onBulkReschedule={(dueDate) =>
                    onBatchUpdate(
                      tasks
                        .filter((t) => t.dueDate === dateStr && !t.isDone)
                        .map((t) => ({ id: t.id, dueDate })),
                    )
                  }
                />
              )
            })}
        </div>
      </div>

      <DragOverlay>
        {dragState?.activeTask && (
          <div className="rotate-[2deg] opacity-95 shadow-lg">
            <TaskCard
              task={dragState.activeTask}
              onUpdate={() => {}}
              onDelete={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
