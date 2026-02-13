import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

export type SortableGroupProps = {
  id: string
  items: string[]
  children: React.ReactNode
}

export default function SortableGroup({
  id,
  items,
  children,
}: SortableGroupProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <SortableContext
      id={id}
      items={items}
      strategy={verticalListSortingStrategy}
    >
      <div
        ref={setNodeRef}
        className={
          isOver ? 'bg-surface-hover/50 rounded-md transition-colors' : ''
        }
      >
        {children}
      </div>
    </SortableContext>
  )
}
