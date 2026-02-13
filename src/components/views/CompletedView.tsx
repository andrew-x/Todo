import { MagnifyingGlassIcon } from '@phosphor-icons/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import Button from '@/components/common/Button'
import TextInput from '@/components/common/TextInput'
import TaskCard from '@/components/tasks/TaskCard'
import dayjs from '@/lib/dayjs'
import logger from '@/lib/logger'
import type { Task } from '@/lib/types'
import { useLazyListCompletedTasksQuery } from '@/store/todosApi'

type MonthGroup = {
  key: string
  label: string
  tasks: Task[]
}

function groupByMonth(tasks: Task[]): MonthGroup[] {
  const groups: MonthGroup[] = []
  let current: MonthGroup | null = null

  for (const task of tasks) {
    const d = dayjs(task.updatedAt)
    const key = d.format('YYYY-MM')

    if (!current || current.key !== key) {
      current = { key, label: d.format('MMMM YYYY'), tasks: [] }
      groups.push(current)
    }
    current.tasks.push(task)
  }

  return groups
}

export type CompletedViewProps = {
  userId: string
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
}

export default function CompletedView({
  userId,
  onUpdate,
  onDelete,
  onEdit,
}: CompletedViewProps) {
  const [trigger, { isFetching }] = useLazyListCompletedTasksQuery()

  const [tasks, setTasks] = useState<Task[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const tasksRef = useRef(tasks)
  tasksRef.current = tasks

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const result = await trigger({ userId }).unwrap()
        if (cancelled) return
        setTasks(result.tasks)
        setHasMore(result.hasMore)
        setError(null)
      } catch (e) {
        if (cancelled) return
        logger.error('Failed to load completed tasks', e)
        setError('Failed to load completed tasks')
      } finally {
        if (!cancelled) setIsInitialLoad(false)
      }
    }
    load()

    return () => {
      cancelled = true
    }
  }, [trigger, userId])

  const handleLoadMore = useCallback(async () => {
    const lastTask = tasksRef.current[tasksRef.current.length - 1]
    if (!lastTask) return

    try {
      const result = await trigger({
        userId,
        afterUpdatedAt: lastTask.updatedAt,
      }).unwrap()

      setTasks((prev) => [...prev, ...result.tasks])
      setHasMore(result.hasMore)
    } catch (e) {
      logger.error('Failed to load more completed tasks', e)
    }
  }, [trigger, userId])

  function handleUncomplete(id: string) {
    onUpdate(id, { isDone: false })
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  function handleDelete(id: string) {
    onDelete(id)
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const isSearching = searchQuery.length > 0
  const query = searchQuery.toLowerCase()
  const filteredTasks = isSearching
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query),
      )
    : tasks

  const monthGroups = useMemo(
    () => groupByMonth(filteredTasks),
    [filteredTasks],
  )

  if (isInitialLoad) {
    return (
      <div className="center-col flex-1">
        <p className="text-text-tertiary text-sm">Loading completed tasks...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="center-col flex-1">
        <p className="text-error text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="stack flex-1 gap-4">
      <TextInput
        size="sm"
        placeholder="Search completed tasks..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {monthGroups.length === 0 ? (
        <div className="center-col flex-1 py-12">
          <MagnifyingGlassIcon size={32} className="text-text-disabled mb-2" />
          <p className="text-text-tertiary text-sm">
            {isSearching
              ? 'No tasks match your search'
              : 'No completed tasks yet'}
          </p>
        </div>
      ) : (
        <div className="stack gap-6">
          {monthGroups.map((group) => (
            <section key={group.key} className="stack gap-2">
              <h3 className="text-text-tertiary text-xs font-medium">
                {group.label}
              </h3>
              {group.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={(updates) => {
                    if ('isDone' in updates && updates.isDone === false) {
                      handleUncomplete(task.id)
                    } else {
                      onUpdate(task.id, updates)
                    }
                  }}
                  onDelete={() => handleDelete(task.id)}
                  onEdit={() => onEdit(task)}
                />
              ))}
            </section>
          ))}
        </div>
      )}

      {hasMore && !isSearching && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleLoadMore}
          isLoading={isFetching}
          className="self-center"
        >
          Load more
        </Button>
      )}
    </div>
  )
}
