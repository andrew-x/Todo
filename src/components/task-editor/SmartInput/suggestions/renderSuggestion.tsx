import type { SuggestionOptions } from '@tiptap/suggestion'
import { createRoot, type Root } from 'react-dom/client'

import {
  SuggestionDropdown,
  type SuggestionDropdownRef,
} from './SuggestionDropdown'

type RenderReturn = ReturnType<NonNullable<SuggestionOptions['render']>>

export function renderSuggestion(): RenderReturn {
  let popup: HTMLDivElement | null = null
  let root: Root | null = null
  let componentRef: SuggestionDropdownRef | null = null

  return {
    onStart(props) {
      popup = document.createElement('div')
      popup.style.position = 'fixed'
      popup.style.zIndex = '50'
      document.body.appendChild(popup)

      root = createRoot(popup)

      updatePosition(popup, props.clientRect)
      renderComponent(root, props.items, props.command)
    },

    onUpdate(props) {
      if (!popup || !root) return
      updatePosition(popup, props.clientRect)
      renderComponent(root, props.items, props.command)
    },

    onKeyDown(props) {
      if (props.event.key === 'Escape') {
        cleanup()
        return true
      }
      return componentRef?.onKeyDown(props) ?? false
    },

    onExit() {
      cleanup()
    },
  }

  function renderComponent(
    r: Root,
    items: string[],
    command: (props: { label: string }) => void,
  ) {
    r.render(
      <SuggestionDropdown
        ref={(ref) => {
          componentRef = ref
        }}
        items={items}
        command={(item) => command({ label: item })}
      />,
    )
  }

  function updatePosition(
    el: HTMLDivElement,
    clientRect: (() => DOMRect | null) | null | undefined,
  ) {
    const rect = clientRect?.()
    if (!rect) return
    el.style.left = `${rect.left}px`
    el.style.top = `${rect.bottom + 4}px`
    el.style.width = 'auto'
  }

  function cleanup() {
    root?.unmount()
    root = null
    popup?.remove()
    popup = null
    componentRef = null
  }
}
