import type { SuggestionOptions } from '@tiptap/suggestion'

import { renderSuggestion } from './renderSuggestion'

function createCategorySuggestion(
  getItems: () => string[],
): Omit<SuggestionOptions, 'editor'> {
  return {
    char: '@',
    items: ({ query }) => {
      return getItems()
        .filter((c) => c.toLowerCase().startsWith(query.toLowerCase()))
        .slice(0, 8)
    },
    render: renderSuggestion,
    command: ({ editor, range, props }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent(`@${props.label} `)
        .run()
    },
  }
}

export { createCategorySuggestion }
