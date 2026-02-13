/* eslint-disable react-hooks/incompatible-library */
import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import Button from '@/components/common/Button'
import DateInput from '@/components/common/DateInput'
import Select from '@/components/common/Select'
import TextArea from '@/components/common/TextArea'
import TextSuggestion from '@/components/common/TextSuggestion'
import cn from '@/lib/classnames'
import dayjs, { fromISODate } from '@/lib/dayjs'
import { extractFieldsFromText, getCleanTitle } from '@/lib/tokenRegistry'
import { PRIORITIES } from '@/lib/types'
import type { ParsedTaskFields, Priority, Task } from '@/lib/types'

import { SmartInput, type SmartInputRef } from './SmartInput/SmartInput'

const QUEUE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This week' },
]

function deriveQueue(dueDate: string | null): Task['queue'] {
  if (!dueDate) return null
  const due = fromISODate(dueDate)
  const today = dayjs()
  if (due.isSame(today, 'day')) return 'day'
  if (due.isSame(today, 'isoWeek')) return 'week'
  return null
}

export type TaskCreationData = {
  title: string
  description: string
  category: string | null
  queue: Task['queue']
  priority: Priority | null
  dueDate: string | null
}

const PRIORITY_OPTIONS = [
  { value: '', label: 'None' },
  ...PRIORITIES.map((p) => ({ value: p, label: p })),
]

const taskFormSchema = z.object({
  category: z.string(),
  priority: z.string(),
  dueDate: z.string(),
  queue: z.string(),
  description: z.string(),
})

type TaskFormValues = z.infer<typeof taskFormSchema>

const DEFAULT_VALUES: TaskFormValues = {
  category: '',
  priority: '',
  dueDate: '',
  queue: '',
  description: '',
}

export default function TaskCreationForm(props: {
  onSubmit: (data: TaskCreationData) => void
  suggestedCategories?: string[]
  className?: string
}) {
  const { onSubmit, suggestedCategories, className } = props
  const smartInputRef = useRef<SmartInputRef>(null)

  const [parsedFields, setParsedFields] = useState<ParsedTaskFields>({
    category: null,
    priority: null,
    dueDate: null,
  })

  const {
    setValue,
    watch,
    reset: resetForm,
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const category = watch('category')
  const priority = watch('priority')
  const dueDate = watch('dueDate')
  const queue = watch('queue')
  const description = watch('description')

  // SmartInput parsed values push into form fields
  useEffect(() => {
    if (parsedFields.category !== null)
      setValue('category', parsedFields.category)
  }, [parsedFields.category, setValue])

  useEffect(() => {
    if (parsedFields.priority !== null)
      setValue('priority', parsedFields.priority)
  }, [parsedFields.priority, setValue])

  useEffect(() => {
    if (parsedFields.dueDate !== null) setValue('dueDate', parsedFields.dueDate)
  }, [parsedFields.dueDate, setValue])

  // Auto-derive queue when effective due date changes
  const effectiveDueDate = dueDate || parsedFields.dueDate
  useEffect(() => {
    const derived = deriveQueue(effectiveDueDate)
    setValue('queue', derived ?? '')
  }, [effectiveDueDate, setValue])

  // Expansion state
  const [isExpanded, setIsExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleFocusIn = useCallback(() => {
    setIsExpanded(true)
  }, [])

  const resetAll = useCallback(() => {
    setParsedFields({
      category: null,
      priority: null,
      dueDate: null,
    })
    resetForm(DEFAULT_VALUES)
    smartInputRef.current?.clearContent()
  }, [resetForm])

  const handleCancel = useCallback(() => {
    resetAll()
    setIsExpanded(false)
  }, [resetAll])

  // Click outside to close
  useEffect(() => {
    if (!isExpanded) return

    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        handleCancel()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isExpanded, handleCancel])

  function handleSubmit() {
    const rawText = smartInputRef.current?.getText() ?? ''
    const isDetecting = smartInputRef.current?.isDetectionEnabled() ?? true

    // When detection is off, use raw text as-is; otherwise extract & clean
    const freshFields = isDetecting
      ? extractFieldsFromText(rawText)
      : { category: null, priority: null, dueDate: null }
    const title = isDetecting ? getCleanTitle(rawText).trim() : rawText.trim()

    if (!title) return

    // Merge parsed + form fields
    const mergedCategory = category || freshFields.category
    const mergedPriority =
      priority !== '' ? (priority as Priority) : freshFields.priority
    const mergedDueDate = dueDate || freshFields.dueDate

    const finalQueue: Task['queue'] = queue
      ? (queue as Task['queue'])
      : deriveQueue(mergedDueDate)

    onSubmit({
      title,
      description,
      category: mergedCategory,
      queue: finalQueue,
      priority: mergedPriority,
      dueDate: mergedDueDate,
    })

    resetAll()
    setIsExpanded(false)
  }

  return (
    <div
      ref={containerRef}
      onFocus={handleFocusIn}
      className={cn('relative', className)}
    >
      {/* Input bar */}
      <div
        className={cn(
          'border-border-default bg-bg-raised border p-3',
          isExpanded ? 'rounded-t-lg' : 'rounded-lg',
        )}
      >
        <SmartInput
          ref={smartInputRef}
          onFieldsChange={setParsedFields}
          onSubmit={handleSubmit}
          suggestedCategories={suggestedCategories}
        />
      </div>

      {/* Overlay dropdown — visually attached to input */}
      {isExpanded && (
        <div className="border-border-default bg-bg-raised absolute right-0 left-0 z-30 rounded-b-lg border-x border-b p-3 shadow-lg">
          <div className="stack gap-3 pt-2">
            <div className="grid grid-cols-4 gap-3">
              <TextSuggestion
                label="Category"
                placeholder="e.g. work, personal"
                suggestions={suggestedCategories ?? []}
                value={category || parsedFields.category || ''}
                onChange={(e) => setValue('category', e.target.value)}
              />
              <Select
                label="Priority"
                options={PRIORITY_OPTIONS}
                value={
                  priority !== '' ? priority : (parsedFields.priority ?? '')
                }
                onChange={(e) => setValue('priority', e.target.value)}
              />
              <DateInput
                label="Due date"
                value={dueDate || parsedFields.dueDate || ''}
                onChange={(v) => setValue('dueDate', v)}
              />
              <Select
                label="Queue"
                options={QUEUE_OPTIONS}
                value={queue}
                onChange={(e) => setValue('queue', e.target.value)}
              />
            </div>

            <TextArea
              label="Description"
              placeholder="Add details..."
              value={description}
              onChange={(e) => setValue('description', e.target.value)}
              rows={2}
            />

            <div className="flex justify-center gap-2 pt-2">
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={handleSubmit}>
                Add task
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
