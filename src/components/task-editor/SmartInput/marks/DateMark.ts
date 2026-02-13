import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import * as chrono from 'chrono-node'

const datePluginKey = new PluginKey('dateHighlight')

/**
 * Date highlighting extension using ProseMirror decorations.
 * Runs chrono-node on the full document text after each transaction
 * and applies inline decorations at matched positions.
 *
 * Accepts a ref that controls whether detection is active.
 * When disabled, all decorations are removed.
 */
function createDateMark(enabledRef: { current: boolean }) {
  return Extension.create({
    name: 'dateHighlight',

    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: datePluginKey,
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

  const decorations: Decoration[] = []
  const text = doc.textContent

  if (!text.trim()) return DecorationSet.empty

  const results = chrono.parse(text, new Date(), { forwardDate: true })

  // Only highlight the last date
  const lastResult = results.length > 0 ? results[results.length - 1] : null
  if (lastResult) {
    // SAFETY: This assumes a single-paragraph document (newlines are blocked
    // by the keyboard extension). If multi-block support is added, this
    // position mapping must be updated to walk document nodes.
    // chrono gives us index relative to the full text, but ProseMirror
    // doc positions start at 1 (the paragraph node opening)
    const from = lastResult.index + 1
    const to = from + lastResult.text.length

    decorations.push(
      Decoration.inline(from, to, {
        class: 'bg-accent-subtle text-accent-text rounded px-0.5',
        'data-date': 'true',
      }),
    )
  }

  return DecorationSet.create(doc, decorations)
}

export { createDateMark }
