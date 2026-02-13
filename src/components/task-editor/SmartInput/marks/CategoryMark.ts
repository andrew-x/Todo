import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

const CATEGORY_RE = /@([\w][\w-]*)(?:\s|$)/g
const categoryPluginKey = new PluginKey('categoryHighlight')

/**
 * Category highlighting extension using ProseMirror decorations.
 * Only the last @category in the text is highlighted.
 *
 * Accepts a ref that controls whether detection is active.
 */
function createCategoryMark(enabledRef: { current: boolean }) {
  return Extension.create({
    name: 'categoryHighlight',

    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: categoryPluginKey,
          state: {
            init(_, state) {
              return buildDecorations(state.doc, enabledRef)
            },
            apply(tr, oldDecorations) {
              if (!tr.docChanged && !tr.getMeta('detectionToggled'))
                return oldDecorations
              return buildDecorations(tr.doc, enabledRef)
            },
          },
          props: {
            decorations(state) {
              return this.getState(state) ?? DecorationSet.empty
            },
          },
        }),
      ]
    },
  })
}

function buildDecorations(
  doc: Parameters<typeof DecorationSet.create>[0],
  enabledRef: { current: boolean },
): DecorationSet {
  if (!enabledRef.current) return DecorationSet.empty

  const text = doc.textContent
  if (!text.trim()) return DecorationSet.empty

  // Find the last category match
  let lastMatch: RegExpExecArray | null = null
  let match: RegExpExecArray | null
  while ((match = CATEGORY_RE.exec(text)) !== null) {
    lastMatch = match
  }
  CATEGORY_RE.lastIndex = 0

  if (!lastMatch) return DecorationSet.empty

  // +1 for ProseMirror paragraph offset (single-paragraph document)
  // Highlight only the @name portion, not the trailing space
  const from = lastMatch.index + 1
  const to = from + 1 + lastMatch[1].length // : + captured name

  return DecorationSet.create(doc, [
    Decoration.inline(from, to, {
      class: 'bg-warning-subtle text-warning rounded px-0.5',
      'data-category': 'true',
    }),
  ])
}

export { createCategoryMark }
