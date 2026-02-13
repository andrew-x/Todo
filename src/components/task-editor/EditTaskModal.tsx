import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import Button from '@/components/common/Button'
import DateInput from '@/components/common/DateInput'
import Modal from '@/components/common/Modal'
import Select from '@/components/common/Select'
import TextArea from '@/components/common/TextArea'
import TextInput from '@/components/common/TextInput'
import TextSuggestion from '@/components/common/TextSuggestion'
import type { Priority, Task } from '@/lib/types'
import { PRIORITIES } from '@/lib/types'

export type EditTaskModalProps = {
  task: Task
  onClose: () => void
  onSave: (updates: Partial<Task>) => void
  onDelete: () => void
  suggestedCategories?: string[]
}

const editTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string(),
  category: z.string(),
  priority: z.string(),
  queue: z.string(),
  dueDate: z.string(),
})

type EditTaskFormData = z.infer<typeof editTaskSchema>

const PRIORITY_OPTIONS = [
  { value: '', label: 'None' },
  ...PRIORITIES.map((p) => ({ value: p, label: p })),
]

const QUEUE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This Week' },
]

export default function EditTaskModal({
  task,
  onClose,
  onSave,
  onDelete,
  suggestedCategories = [],
}: EditTaskModalProps) {
  const [isDone, setIsDone] = useState(task.isDone)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  const { control, handleSubmit } = useForm<EditTaskFormData>({
    resolver: zodResolver(editTaskSchema),
    defaultValues: {
      title: task.title,
      description: task.description,
      category: task.category ?? '',
      priority: task.priority ?? '',
      queue: task.queue ?? '',
      dueDate: task.dueDate ?? '',
    },
  })

  function onSubmit(data: EditTaskFormData) {
    const updates: Partial<Task> = {}

    if (isDone !== task.isDone) updates.isDone = isDone
    if (data.title !== task.title) updates.title = data.title
    if (data.description !== task.description)
      updates.description = data.description

    const category = data.category || null
    if (category !== task.category) updates.category = category

    const priority: Priority | null =
      PRIORITIES.find((p) => p === data.priority) ?? null
    if (priority !== task.priority) updates.priority = priority

    const queue: Task['queue'] =
      data.queue === 'day' || data.queue === 'week' ? data.queue : null
    if (queue !== task.queue) updates.queue = queue

    const dueDate = data.dueDate || null
    if (dueDate !== task.dueDate) updates.dueDate = dueDate

    if (Object.keys(updates).length > 0) {
      onSave(updates)
    }
    onClose()
  }

  function handleDelete() {
    onDelete()
    onClose()
  }

  const footer = isConfirmingDelete ? (
    <>
      <Button variant="ghost" onClick={() => setIsConfirmingDelete(false)}>
        Cancel
      </Button>
      <Button variant="danger" onClick={handleDelete}>
        Confirm Delete
      </Button>
    </>
  ) : (
    <>
      <Button
        variant="ghost"
        className="text-error hover:text-error hover:bg-error-subtle mr-auto"
        onClick={() => setIsConfirmingDelete(true)}
      >
        Delete
      </Button>
      <Button variant="ghost" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSubmit(onSubmit)}>
        Save
      </Button>
    </>
  )

  return (
    <Modal open onClose={onClose} title="Edit Task" size="lg" footer={footer}>
      <form onSubmit={handleSubmit(onSubmit)} className="stack gap-4">
        <Controller
          name="title"
          control={control}
          render={({ field, fieldState }) => (
            <div className="flex items-end gap-3">
              <input
                type="checkbox"
                checked={isDone}
                onChange={() => setIsDone(!isDone)}
                aria-label={`Mark as ${isDone ? 'not done' : 'done'}`}
                className="accent-accent mb-2.5 h-4 w-4 shrink-0 cursor-pointer"
              />
              <TextInput
                className="flex-1"
                label="Title"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            </div>
          )}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextArea
              label="Description"
              rows={3}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <TextSuggestion
                label="Category"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                onSelect={(val) => field.onChange(val)}
                suggestions={suggestedCategories}
              />
            )}
          />

          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <Select
                label="Priority"
                options={PRIORITY_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Controller
            name="queue"
            control={control}
            render={({ field }) => (
              <Select
                label="Queue"
                options={QUEUE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />

          <Controller
            name="dueDate"
            control={control}
            render={({ field }) => (
              <DateInput
                label="Due Date"
                value={field.value}
                onChange={(val) => field.onChange(val)}
              />
            )}
          />
        </div>
      </form>
    </Modal>
  )
}
