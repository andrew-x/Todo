import { useEffect, useState } from 'react'

import { useAuth } from '@/components/auth/AuthProvider'
import SegmentedControl, {
  type Option,
} from '@/components/common/SegmentedControl'
import EditTaskModal from '@/components/task-editor/EditTaskModal'
import TaskCreationForm, {
  type TaskCreationData,
} from '@/components/task-editor/TaskCreationForm'
import CompletedView from '@/components/views/CompletedView'
import ViewSwitcher, { type View } from '@/components/views/ViewSwitcher'
import WeekView from '@/components/views/WeekView'
import WorkView from '@/components/views/WorkView'
import logger from '@/lib/logger'
import type { Task } from '@/lib/types'
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
} from '@/store/profileApi'
import {
  useBatchUpdateTasksMutation,
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useListActiveTasksQuery,
  useUpdateTaskMutation,
} from '@/store/todosApi'

export default function HomePage() {
  const { user } = useAuth()
  const userId = user!.uid

  const { data: profile } = useGetProfileQuery(userId)
  const { data: tasks = [], isLoading, error } = useListActiveTasksQuery(userId)
  const [createTask] = useCreateTaskMutation()
  const [updateTask] = useUpdateTaskMutation()
  const [deleteTask] = useDeleteTaskMutation()
  const [batchUpdateTasks] = useBatchUpdateTasksMutation()
  const [updateProfile] = useUpdateProfileMutation()

  const [activeView, setActiveView] = useState<View>('work')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  useEffect(() => {
    if (!mutationError) return
    const timer = setTimeout(() => setMutationError(null), 5000)
    return () => clearTimeout(timer)
  }, [mutationError])

  function handleMutationError(action: string) {
    return (e: unknown) => {
      logger.error(`${action} failed`, e)
      setMutationError(`Failed to ${action}. Please try again.`)
    }
  }

  const categoryOptions: Option<string>[] = [
    { value: 'all', label: 'All' },
    ...(profile?.categories ?? []).map((c) => ({ value: c, label: c })),
  ]

  // Reset filter if selected category no longer exists
  if (
    categoryFilter !== 'all' &&
    profile &&
    !profile.categories.includes(categoryFilter)
  ) {
    setCategoryFilter('all')
  }

  const filteredTasks =
    categoryFilter === 'all'
      ? tasks
      : tasks.filter((t) => t.category === categoryFilter)

  function handleAdd(data: TaskCreationData) {
    createTask({ userId, ...data })
      .unwrap()
      .catch(handleMutationError('create task'))

    // Add any new categories to the user's profile
    if (profile) {
      const newCategory =
        data.category && !profile.categories.includes(data.category)
          ? data.category
          : null

      if (newCategory) {
        updateProfile({
          userId,
          categories: [...profile.categories, newCategory],
        })
          .unwrap()
          .catch(handleMutationError('update categories'))
      }
    }
  }

  function handleUpdate(id: string, updates: Partial<Task>) {
    updateTask({ userId, id, ...updates })
      .unwrap()
      .catch(handleMutationError('update task'))
  }

  function handleDelete(id: string) {
    deleteTask({ userId, id })
      .unwrap()
      .catch(handleMutationError('delete task'))
  }

  function handleBatchUpdate(
    updates: Array<
      { id: string } & Partial<
        Pick<Task, 'queue' | 'priority' | 'order' | 'dueDate'>
      >
    >,
  ) {
    batchUpdateTasks({ userId, updates })
      .unwrap()
      .catch(handleMutationError('update tasks'))
  }

  function handleEdit(task: Task) {
    setEditingTask(task)
  }

  function handleEditSave(updates: Partial<Task>) {
    updateTask({ userId, id: editingTask!.id, ...updates })
      .unwrap()
      .catch(handleMutationError('update task'))

    if (profile && updates.category) {
      const isNew = !profile.categories.includes(updates.category)
      if (isNew) {
        updateProfile({
          userId,
          categories: [...profile.categories, updates.category],
        })
          .unwrap()
          .catch(handleMutationError('update categories'))
      }
    }

    setEditingTask(null)
  }

  function handleEditDelete() {
    deleteTask({ userId, id: editingTask!.id })
      .unwrap()
      .catch(handleMutationError('delete task'))
    setEditingTask(null)
  }

  if (isLoading) {
    return (
      <div className="center-col flex-1">
        <p className="text-text-tertiary text-sm">Loading tasks...</p>
      </div>
    )
  }

  const errorDetail = error
    ? error && typeof error === 'object' && 'message' in error
      ? (error as { message: string }).message
      : null
    : null

  return (
    <div className="stack flex-1 gap-6 p-6">
      {error && (
        <div className="bg-error-subtle stack gap-2 rounded-md px-4 py-3 text-sm">
          <p className="text-error font-medium">Unexpected error</p>
          {errorDetail && (
            <pre className="text-error/70 break-all whitespace-pre-wrap">
              {errorDetail}
            </pre>
          )}
        </div>
      )}
      {mutationError && (
        <div className="bg-error-subtle flex items-center justify-between rounded-md px-4 py-3 text-sm">
          <p className="text-error font-medium">{mutationError}</p>
          <button
            onClick={() => setMutationError(null)}
            className="text-error/70 hover:text-error ml-4 text-lg leading-none"
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      )}

      <TaskCreationForm
        onSubmit={handleAdd}
        suggestedCategories={profile?.categories}
      />

      <div className="flex items-center gap-4">
        <ViewSwitcher activeView={activeView} onViewChange={setActiveView} />
        {activeView !== 'completed' && categoryOptions.length > 1 && (
          <SegmentedControl
            options={categoryOptions}
            value={categoryFilter}
            onChange={setCategoryFilter}
            size="sm"
          />
        )}
      </div>

      {activeView === 'work' && (
        <WorkView
          tasks={filteredTasks}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onBatchUpdate={handleBatchUpdate}
        />
      )}
      {activeView === 'week' && (
        <WeekView
          tasks={filteredTasks}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onBatchUpdate={handleBatchUpdate}
        />
      )}
      {activeView === 'completed' && (
        <CompletedView
          userId={userId}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      )}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleEditSave}
          onDelete={handleEditDelete}
          suggestedCategories={profile?.categories}
        />
      )}
    </div>
  )
}
