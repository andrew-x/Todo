import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

const PRIORITY_RE = /\b[Pp][0-4]\b/g
const priorityPluginKey = new PluginKey('priorityHighlight')

/**
 * Priority highlighting extension using ProseMirror decorations.
 * Only the last P0–P4 in the text is highlighted.
 *
 * Accepts a ref that controls whether detection is active.
 */
function createPriorityMark(enabledRef: { current: boolean }) {
  return Extension.create({
    name: 'priorityHighlight',

    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: priorityPluginKey,
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

  // Find the last priority match
  let lastMatch: RegExpExecArray | null = null
  let match: RegExpExecArray | null
  while ((match = PRIORITY_RE.exec(text)) !== null) {
    lastMatch = match
  }
  PRIORITY_RE.lastIndex = 0

  if (!lastMatch) return DecorationSet.empty

  // +1 for ProseMirror paragraph offset (single-paragraph document)
  const from = lastMatch.index + 1
  const to = from + lastMatch[0].length

  return DecorationSet.create(doc, [
    Decoration.inline(from, to, {
      class: 'bg-error-subtle text-error rounded px-0.5',
      'data-priority': 'true',
    }),
  ])
}

export { createPriorityMark }
