import type { Priority, Task } from '@/lib/types'
import { PRIORITIES } from '@/lib/types'

// --- Container ID builders ---

export function buildColumnId(queue: Task['queue']): string {
  return `column::${queue}`
}

export function buildGroupId(
  queue: Task['queue'],
  priority: Priority | null,
): string {
  return `group::${queue}::${priority}`
}

export function buildItemId(taskId: string): string {
  return `item::${taskId}`
}

// --- Date-based container ID builders ---

/** `datecol::<YYYY-MM-DD>` or `datecol::unscheduled` */
export function buildDateColumnId(date: string | null): string {
  return `datecol::${date ?? 'unscheduled'}`
}

/** `dategrp::<YYYY-MM-DD>::<priority>` or `dategrp::unscheduled::<priority>` */
export function buildDateGroupId(
  date: string | null,
  priority: Priority | null,
): string {
  return `dategrp::${date ?? 'unscheduled'}::${priority}`
}

// --- Container ID parsers ---

type ParsedColumn = { type: 'column'; queue: Task['queue'] }
type ParsedGroup = {
  type: 'group'
  queue: Task['queue']
  priority: Priority | null
}
type ParsedDateColumn = { type: 'datecol'; date: string | null }
type ParsedDateGroup = {
  type: 'dategrp'
  date: string | null
  priority: Priority | null
}
type ParsedItem = { type: 'item'; taskId: string }
export type ParsedContainer =
  | ParsedColumn
  | ParsedGroup
  | ParsedDateColumn
  | ParsedDateGroup
  | ParsedItem

function parseQueue(raw: string): Task['queue'] {
  if (raw === 'day') return 'day'
  if (raw === 'week') return 'week'
  return null
}

function parsePriority(raw: string): Priority | null {
  if (raw === 'null') return null
  return PRIORITIES.includes(raw as Priority) ? (raw as Priority) : null
}

function parseDate(raw: string): string | null {
  return raw === 'unscheduled' ? null : raw
}

export function parseContainerId(id: string): ParsedContainer | null {
  const parts = id.split('::')
  if (parts[0] === 'column') {
    return { type: 'column', queue: parseQueue(parts[1]) }
  }
  if (parts[0] === 'group') {
    return {
      type: 'group',
      queue: parseQueue(parts[1]),
      priority: parsePriority(parts[2]),
    }
  }
  if (parts[0] === 'datecol') {
    return { type: 'datecol', date: parseDate(parts[1]) }
  }
  if (parts[0] === 'dategrp') {
    return {
      type: 'dategrp',
      date: parseDate(parts[1]),
      priority: parsePriority(parts[2]),
    }
  }
  if (parts[0] === 'item') {
    return { type: 'item', taskId: parts[1] }
  }
  return null
}

/** Extract queue from any container ID (column or group) */
export function getQueueFromContainerId(id: string): Task['queue'] | undefined {
  const parsed = parseContainerId(id)
  if (!parsed) return undefined
  if (parsed.type === 'column') return parsed.queue
  if (parsed.type === 'group') return parsed.queue
  return undefined
}

/**
 * Extract priority from a container ID.
 * - Group/dategrp containers: returns the group's priority (may be null for "No priority" group)
 * - Column/datecol containers: returns undefined (no priority change — task keeps its current priority)
 */
export function getPriorityFromContainerId(
  id: string,
): Priority | null | undefined {
  const parsed = parseContainerId(id)
  if (!parsed) return undefined
  if (parsed.type === 'group' || parsed.type === 'dategrp')
    return parsed.priority
  return undefined
}

/** Extract date from a datecol or dategrp container ID. Returns undefined for non-date containers. */
export function getDateFromContainerId(id: string): string | null | undefined {
  const parsed = parseContainerId(id)
  if (!parsed) return undefined
  if (parsed.type === 'datecol') return parsed.date
  if (parsed.type === 'dategrp') return parsed.date
  return undefined
}

// --- Task sorting ---

/** Sort tasks by order (ascending, null last), then by createdAt desc for null-order tasks */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.order !== null && b.order !== null) return a.order - b.order
    if (a.order !== null) return -1
    if (b.order !== null) return 1
    return b.createdAt - a.createdAt
  })
}

// --- Container map ---

type PriorityGroup = { priority: Priority | null; tasks: Task[] }

function groupByPriority(tasks: Task[]): PriorityGroup[] | null {
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

const QUEUES: Array<Task['queue']> = [null, 'day', 'week']

/**
 * Build a map of container ID → ordered task IDs from a flat task list.
 * Containers are either `group::<queue>::<priority>` or `column::<queue>` (ungrouped).
 */
export function buildContainerMap(tasks: Task[]): Record<string, string[]> {
  const containers: Record<string, string[]> = {}

  for (const queue of QUEUES) {
    const queueTasks = sortTasks(
      tasks.filter((t) => t.queue === queue && !t.isDone),
    )
    const groups = groupByPriority(queueTasks)

    if (groups) {
      for (const group of groups) {
        const containerId = buildGroupId(queue, group.priority)
        containers[containerId] = group.tasks.map((t) => t.id)
      }
    } else {
      const containerId = buildColumnId(queue)
      containers[containerId] = queueTasks.map((t) => t.id)
    }
  }

  return containers
}

/** Find which container a task ID is in */
export function findContainer(
  containers: Record<string, string[]>,
  taskId: string,
): string | null {
  for (const [containerId, ids] of Object.entries(containers)) {
    if (ids.includes(taskId)) return containerId
  }
  return null
}

/**
 * Given a containers map and queue, return the ordered task IDs for that queue's containers.
 * Returns an array of { containerId, priority, taskIds } sorted by priority order.
 */
export function getColumnContainers(
  containers: Record<string, string[]>,
  queue: Task['queue'],
): Array<{
  containerId: string
  priority: Priority | null
  taskIds: string[]
}> {
  const result: Array<{
    containerId: string
    priority: Priority | null
    taskIds: string[]
  }> = []

  for (const [containerId, taskIds] of Object.entries(containers)) {
    const parsed = parseContainerId(containerId)
    if (!parsed) continue

    if (parsed.type === 'column' && parsed.queue === queue) {
      result.push({ containerId, priority: null, taskIds })
    } else if (parsed.type === 'group' && parsed.queue === queue) {
      result.push({ containerId, priority: parsed.priority, taskIds })
    }
  }

  // Sort: groups by priority order (P0 first), ungrouped/null-priority last
  return result.sort((a, b) => {
    if (a.priority === null && b.priority === null) return 0
    if (a.priority === null) return 1
    if (b.priority === null) return -1
    return PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority)
  })
}

/**
 * Ensure a container exists for the given queue. If the queue has group containers,
 * returns the appropriate group container for the given priority.
 * If no containers exist for the queue, creates a column container.
 */
export function getOrCreateContainer(
  containers: Record<string, string[]>,
  queue: Task['queue'],
  priority: Priority | null,
): string {
  const queueContainers = getColumnContainers(containers, queue)

  // If queue has group containers, find or create matching priority group
  const hasGroups = queueContainers.some((c) =>
    c.containerId.startsWith('group::'),
  )
  if (hasGroups) {
    const existing = queueContainers.find((c) => c.priority === priority)
    if (existing) return existing.containerId
    // Create a new group for this priority
    const id = buildGroupId(queue, priority)
    containers[id] = []
    return id
  }

  // Queue uses column container (ungrouped)
  const columnId = buildColumnId(queue)
  if (!containers[columnId]) {
    containers[columnId] = []
  }
  return columnId
}

// --- Date-based container map ---

/**
 * Build a map of container ID → ordered task IDs grouped by dueDate then priority.
 * Containers use `dategrp::<date>::<priority>` or `datecol::<date>` (ungrouped).
 * `dates` is the list of visible date strings (YYYY-MM-DD). Unscheduled tasks are always included.
 */
export function buildDateContainerMap(
  tasks: Task[],
  dates: string[],
): Record<string, string[]> {
  const containers: Record<string, string[]> = {}
  const allDates = [...dates, null] // null = unscheduled

  for (const date of allDates) {
    const dateTasks = sortTasks(
      tasks.filter((t) => t.dueDate === date && !t.isDone),
    )
    const groups = groupByPriority(dateTasks)

    if (groups) {
      for (const group of groups) {
        const containerId = buildDateGroupId(date, group.priority)
        containers[containerId] = group.tasks.map((t) => t.id)
      }
    } else {
      const containerId = buildDateColumnId(date)
      containers[containerId] = dateTasks.map((t) => t.id)
    }
  }

  return containers
}

/**
 * Given a containers map and date (or null for unscheduled), return the containers for that date.
 * Returns an array of { containerId, priority, taskIds } sorted by priority order.
 */
export function getDateColumnContainers(
  containers: Record<string, string[]>,
  date: string | null,
): Array<{
  containerId: string
  priority: Priority | null
  taskIds: string[]
}> {
  const result: Array<{
    containerId: string
    priority: Priority | null
    taskIds: string[]
  }> = []

  for (const [containerId, taskIds] of Object.entries(containers)) {
    const parsed = parseContainerId(containerId)
    if (!parsed) continue

    if (parsed.type === 'datecol' && parsed.date === date) {
      result.push({ containerId, priority: null, taskIds })
    } else if (parsed.type === 'dategrp' && parsed.date === date) {
      result.push({ containerId, priority: parsed.priority, taskIds })
    }
  }

  return result.sort((a, b) => {
    if (a.priority === null && b.priority === null) return 0
    if (a.priority === null) return 1
    if (b.priority === null) return -1
    return PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority)
  })
}
