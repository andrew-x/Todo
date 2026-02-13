import { TrashIcon } from '@phosphor-icons/react'
import { useState } from 'react'

import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import TextInput from '@/components/common/TextInput'
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
} from '@/store/profileApi'

export type SettingsModalProps = {
  userId: string
  open: boolean
  onClose: () => void
}

export default function SettingsModal({
  userId,
  open,
  onClose,
}: SettingsModalProps) {
  const { data: profile } = useGetProfileQuery(userId)
  const [updateProfile] = useUpdateProfileMutation()
  const [newCategory, setNewCategory] = useState('')

  const categories = profile?.categories ?? []

  function handleAdd() {
    const trimmed = newCategory.trim()
    if (!trimmed) return
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase()))
      return

    updateProfile({
      userId,
      categories: [...categories, trimmed],
    })
    setNewCategory('')
  }

  function handleDelete(category: string) {
    updateProfile({
      userId,
      categories: categories.filter((c) => c !== category),
    })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Settings" size="sm">
      <div className="stack gap-4">
        <div className="stack gap-2">
          <h3 className="text-text-tertiary text-xs font-medium tracking-wider uppercase">
            Categories
          </h3>

          {categories.length === 0 ? (
            <p className="text-text-tertiary border-border-default rounded-md border border-dashed px-3 py-4 text-center text-sm">
              No categories yet
            </p>
          ) : (
            <ul className="border-border-default divide-border-default divide-y overflow-hidden rounded-md border">
              {categories.map((category) => (
                <li
                  key={category}
                  className="group transition-smooth hover:bg-surface-hover flex items-center justify-between px-3 py-2"
                >
                  <span className="text-text-primary text-sm">{category}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(category)}
                    className="transition-smooth group-hover:text-text-tertiary hover:!text-error cursor-pointer rounded p-0.5 text-transparent"
                    aria-label={`Delete ${category}`}
                  >
                    <TrashIcon size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-start gap-2">
          <TextInput
            size="sm"
            placeholder="Add a category…"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button size="sm" variant="ghost" onClick={handleAdd}>
            Add
          </Button>
        </div>
      </div>
    </Modal>
  )
}
