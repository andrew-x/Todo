import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

export default function SortableGroup(props: {
  id: string
  items: string[]
  children: React.ReactNode
}) {
  const { id, items, children } = props
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
