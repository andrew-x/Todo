import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useMemo, useState } from 'react'

import TaskCard from '@/components/tasks/TaskCard'
import TaskColumn, { type TaskColumnGroup } from '@/components/tasks/TaskColumn'
import {
  buildColumnId,
  buildContainerMap,
  buildGroupId,
  buildItemId,
  findContainer,
  getColumnContainers,
  getPriorityFromContainerId,
  getQueueFromContainerId,
  parseContainerId,
  sortTasks,
} from '@/lib/dnd'
import type { Priority, Task } from '@/lib/types'
import { PRIORITIES } from '@/lib/types'

export type WorkViewProps = {
  tasks: Task[]
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
  onBatchUpdate: (
    updates: Array<
      { id: string } & Partial<Pick<Task, 'queue' | 'priority' | 'order'>>
    >,
  ) => void
}

type DragState = {
  activeTask: Task
  containers: Record<string, string[]>
}

const QUEUES: Array<Task['queue']> = [null, 'day', 'week']
const QUEUE_TITLES: Record<string, string> = {
  null: 'Backlog',
  day: 'Today',
  week: 'This Week',
}

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

function computeColumnGroups(
  tasks: Task[],
  queue: Task['queue'],
): TaskColumnGroup[] {
  const queueTasks = sortTasks(
    tasks.filter((t) => t.queue === queue && !t.isDone),
  )
  const groups = groupByPriority(queueTasks)

  if (groups) {
    return groups.map((g) => ({
      containerId: buildGroupId(queue, g.priority),
      label: g.priority ?? 'No priority',
      tasks: g.tasks,
      itemIds: g.tasks.map((t) => buildItemId(t.id)),
    }))
  }

  return [
    {
      containerId: buildColumnId(queue),
      label: null,
      tasks: queueTasks,
      itemIds: queueTasks.map((t) => buildItemId(t.id)),
    },
  ]
}

function computeColumnGroupsFromDragState(
  containers: Record<string, string[]>,
  taskMap: Map<string, Task>,
  queue: Task['queue'],
): TaskColumnGroup[] {
  const columnContainers = getColumnContainers(containers, queue)

  if (columnContainers.length === 0) {
    return [
      {
        containerId: buildColumnId(queue),
        label: null,
        tasks: [],
        itemIds: [],
      },
    ]
  }

  return columnContainers.map(({ containerId, priority, taskIds }) => ({
    containerId,
    label: containerId.startsWith('group::')
      ? (priority ?? 'No priority')
      : null,
    tasks: taskIds
      .map((id) => taskMap.get(id))
      .filter((t): t is Task => t !== undefined),
    itemIds: taskIds.map((id) => buildItemId(id)),
  }))
}

function getDoneTasks(tasks: Task[], queue: Task['queue']): Task[] {
  return tasks
    .filter((t) => t.isDone && t.queue === queue)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

/** Extract the raw task ID from an item:: prefixed ID or return the string as-is */
function toTaskId(itemId: string): string {
  return itemId.startsWith('item::') ? itemId.slice(6) : itemId
}

export default function WorkView({
  tasks,
  onUpdate,
  onDelete,
  onEdit,
  onBatchUpdate,
}: WorkViewProps) {
  const [dragState, setDragState] = useState<DragState | null>(null)

  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function getColumnGroups(queue: Task['queue']): TaskColumnGroup[] {
    if (dragState) {
      return computeColumnGroupsFromDragState(
        dragState.containers,
        taskMap,
        queue,
      )
    }
    return computeColumnGroups(tasks, queue)
  }

  function getColumnCount(queue: Task['queue']): number {
    if (dragState) {
      const columnContainers = getColumnContainers(dragState.containers, queue)
      return columnContainers.reduce((sum, c) => sum + c.taskIds.length, 0)
    }
    return tasks.filter((t) => t.queue === queue && !t.isDone).length
  }

  function handleDragStart(event: DragStartEvent) {
    const activeId = String(event.active.id)
    const taskId = toTaskId(activeId)
    const task = taskMap.get(taskId)
    if (!task) return

    setDragState({
      activeTask: task,
      containers: buildContainerMap(tasks),
    })
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over || !dragState) return

    const activeId = toTaskId(String(active.id))
    const overId = String(over.id)

    // Find source container
    const sourceContainer = findContainer(dragState.containers, activeId)
    if (!sourceContainer) return

    // Find destination container
    let destContainer: string | null = null
    const overTaskId = toTaskId(overId)

    if (overId.startsWith('item::')) {
      // Dragging over another item — find its container
      destContainer = findContainer(dragState.containers, overTaskId)
    } else {
      // Dragging over a container (group or column)
      destContainer = overId
    }

    if (!destContainer || sourceContainer === destContainer) return

    // Ensure destination is a valid container (not an item)
    const parsed = parseContainerId(destContainer)
    if (!parsed || parsed.type === 'item') return

    // For column drops when the column has group containers,
    // redirect to the "No priority" group
    if (parsed.type === 'column') {
      const queue = parsed.queue
      const queueContainers = getColumnContainers(dragState.containers, queue)
      const hasGroups = queueContainers.some((c) =>
        c.containerId.startsWith('group::'),
      )
      if (hasGroups) {
        const existing = queueContainers.find((c) => c.priority === null)
        destContainer = existing
          ? existing.containerId
          : buildGroupId(queue, null)
        if (sourceContainer === destContainer) return
      }
    }

    setDragState((prev) => {
      if (!prev) return null
      const newContainers = { ...prev.containers }

      // Ensure destination container exists (for newly created groups)
      if (!(destContainer! in newContainers)) {
        newContainers[destContainer!] = []
      }

      // Remove from source
      const sourceItems = [...(newContainers[sourceContainer] ?? [])]
      const activeIndex = sourceItems.indexOf(activeId)
      if (activeIndex === -1) return prev
      sourceItems.splice(activeIndex, 1)
      newContainers[sourceContainer] = sourceItems

      // Insert into destination
      const destItems = [...(newContainers[destContainer!] ?? [])]

      if (overId.startsWith('item::')) {
        // Insert near the item being hovered
        const overIndex = destItems.indexOf(overTaskId)
        if (overIndex >= 0) {
          destItems.splice(overIndex + 1, 0, activeId)
        } else {
          destItems.push(activeId)
        }
      } else {
        // Dropping on the container itself — append to end
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

    // Handle within-container reorder
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

    // If same container, handle reorder
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

      // Renumber and dispatch updates
      const updates = computeUpdates(
        { ...dragState.containers, [sourceContainer]: items },
        [sourceContainer],
        taskMap,
      )
      if (updates.length > 0) onBatchUpdate(updates)
    } else {
      // Cross-container: onDragOver may not have fired for the final position.
      // Reconstruct the correct order in the destination container.
      const finalContainers = { ...dragState.containers }
      const destItems = [...(finalContainers[destContainer] ?? [])]
      const sourceItems = [...(finalContainers[sourceContainer] ?? [])]

      // Remove from source if still there
      const srcIndex = sourceItems.indexOf(activeId)
      if (srcIndex >= 0) sourceItems.splice(srcIndex, 1)
      finalContainers[sourceContainer] = sourceItems

      // Remove from dest if already there (from partial onDragOver)
      const existingIndex = destItems.indexOf(activeId)
      if (existingIndex >= 0) destItems.splice(existingIndex, 1)

      // Insert at correct position
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

      const updates = computeUpdates(
        finalContainers,
        [sourceContainer, destContainer],
        taskMap,
      )
      if (updates.length > 0) onBatchUpdate(updates)
    }

    setDragState(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid flex-1 grid-cols-3 gap-4">
        {QUEUES.map((queue) => (
          <TaskColumn
            key={String(queue)}
            title={QUEUE_TITLES[String(queue)]}
            queue={queue}
            groups={getColumnGroups(queue)}
            totalCount={getColumnCount(queue)}
            doneTasks={getDoneTasks(tasks, queue)}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
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

/**
 * Compute batch updates for all tasks in the given containers.
 * Assigns dense integer order values and determines queue/priority changes.
 */
function computeUpdates(
  containers: Record<string, string[]>,
  affectedContainers: string[],
  taskMap: Map<string, Task>,
): Array<{ id: string } & Partial<Pick<Task, 'queue' | 'priority' | 'order'>>> {
  const updates: Array<
    { id: string } & Partial<Pick<Task, 'queue' | 'priority' | 'order'>>
  > = []

  for (const containerId of affectedContainers) {
    const taskIds = containers[containerId] ?? []
    const queue = getQueueFromContainerId(containerId)
    const priority = getPriorityFromContainerId(containerId)

    for (let i = 0; i < taskIds.length; i++) {
      const taskId = taskIds[i]
      const task = taskMap.get(taskId)
      if (!task) continue

      const patch: Partial<Pick<Task, 'queue' | 'priority' | 'order'>> = {}
      let hasChanges = false

      // Update order if changed
      if (task.order !== i) {
        patch.order = i
        hasChanges = true
      }

      // Update queue if changed
      if (queue !== undefined && task.queue !== queue) {
        patch.queue = queue
        hasChanges = true
      }

      // Update priority if changed (only for group containers)
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
