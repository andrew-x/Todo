import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import TaskCard from '@/components/tasks/TaskCard'
import { buildItemId } from '@/lib/dnd'
import type { Task } from '@/lib/types'

export type SortableTaskCardProps = {
  task: Task
  onUpdate: (updates: Partial<Task>) => void
  onDelete: () => void
  onEdit?: () => void
}

export default function SortableTaskCard({
  task,
  onUpdate,
  onDelete,
  onEdit,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: buildItemId(task.id) })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <TaskCard
        task={task}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onEdit={onEdit}
        isDragging={isDragging}
        dragHandleListeners={listeners}
        dragHandleAttributes={attributes}
      />
    </div>
  )
}
