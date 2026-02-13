import { forwardRef, useImperativeHandle, useState } from 'react'

import cn from '@/lib/classnames'

export type SuggestionDropdownRef = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

const SuggestionDropdown = forwardRef<
  SuggestionDropdownRef,
  { items: string[]; command: (item: string) => void }
>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [prevItems, setPrevItems] = useState(items)

  // Reset selection when items change (React-approved sync derivation)
  if (prevItems !== items) {
    setPrevItems(items)
    setSelectedIndex(0)
  }

  useImperativeHandle(ref, () => ({
    onKeyDown({ event }) {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length)
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((prev) => (prev + 1) % items.length)
        return true
      }
      if (event.key === 'Enter') {
        if (items[selectedIndex]) {
          command(items[selectedIndex])
        }
        return true
      }
      return false
    },
  }))

  if (items.length === 0) return null

  return (
    <div
      role="listbox"
      className="bg-bg-overlay border-border-default flex max-h-48 flex-col overflow-y-auto rounded-md border py-1 shadow-lg"
    >
      {items.map((item, index) => (
        <button
          key={item}
          type="button"
          role="option"
          aria-selected={index === selectedIndex}
          onClick={() => command(item)}
          className={cn(
            'text-text-secondary transition-smooth px-3 py-1.5 text-left text-sm',
            index === selectedIndex && 'bg-surface-selected text-text-primary',
            index !== selectedIndex && 'hover:bg-surface-hover',
          )}
        >
          {item}
        </button>
      ))}
    </div>
  )
})

SuggestionDropdown.displayName = 'SuggestionDropdown'

export { SuggestionDropdown }
