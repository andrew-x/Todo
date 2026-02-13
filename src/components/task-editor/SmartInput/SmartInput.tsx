import { Extension } from '@tiptap/core'
import type { Editor } from '@tiptap/core'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Placeholder from '@tiptap/extension-placeholder'
import Text from '@tiptap/extension-text'
import { PluginKey } from '@tiptap/pm/state'
import { EditorContent, useEditor } from '@tiptap/react'
import Suggestion from '@tiptap/suggestion'
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type RefObject,
} from 'react'

import cn from '@/lib/classnames'
import { extractFieldsFromText } from '@/lib/tokenRegistry'
import type { ParsedTaskFields } from '@/lib/types'

import { createCategoryMark } from './marks/CategoryMark'
import { createDateMark } from './marks/DateMark'
import { createPriorityMark } from './marks/PriorityMark'
import { createCategorySuggestion } from './suggestions/CategorySuggestion'

const EMPTY_FIELDS: ParsedTaskFields = {
  category: null,
  priority: null,
  dueDate: null,
}

/** Update keyboard shortcut callbacks and refs in Tiptap extensionStorage. */
function syncCallbacks(
  editor: Editor,
  callbacks: {
    onSubmit: () => void
    onFieldsChange: (f: ParsedTaskFields) => void
  },
  detectionEnabledRef: RefObject<boolean>,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storage = (editor.extensionStorage as any).keyboardShortcuts
  storage.onSubmit = callbacks.onSubmit
  storage.onFieldsChange = callbacks.onFieldsChange
  storage.detectionEnabledRef = detectionEnabledRef
}

type SmartInputProps = {
  onFieldsChange: (fields: ParsedTaskFields) => void
  onSubmit: () => void
  onFocus?: () => void
  onBlur?: () => void
  suggestedCategories?: string[]
  className?: string
}

export type SmartInputRef = {
  clearContent: () => void
  focus: () => void
  getText: () => string
  isDetectionEnabled: () => boolean
}

/**
 * Keyboard shortcut extension: Enter submits, Escape toggles detection.
 * Uses extensionStorage for callbacks to avoid stale closures.
 */
const KeyboardShortcutsExtension = Extension.create({
  name: 'keyboardShortcuts',

  addStorage() {
    return {
      onSubmit: () => {},
      onFieldsChange: () => {},
      detectionEnabledRef: { current: true } as { current: boolean },
    }
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        this.storage.onSubmit()
        return true
      },
      'Mod-Enter': () => {
        this.storage.onSubmit()
        return true
      },
      Escape: () => {
        const ref = this.storage.detectionEnabledRef
        if (!ref.current) return false // already off, let the event propagate

        ref.current = false

        // Send empty parsed fields
        this.storage.onFieldsChange(EMPTY_FIELDS)

        // Dispatch a no-op transaction with meta to trigger decoration rebuilds
        const { tr } = this.editor.state
        this.editor.view.dispatch(tr.setMeta('detectionToggled', true))

        return true
      },
    }
  },
})

/** Extension to wire up category suggestion on the CategoryMark */
function createCategorySuggestionExtension(getItems: () => string[]) {
  return Extension.create({
    name: 'categorySuggestion',
    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          pluginKey: new PluginKey('categorySuggestion'),
          ...createCategorySuggestion(getItems),
        }),
      ]
    },
  })
}

const SmartInput = forwardRef<SmartInputRef, SmartInputProps>(
  (
    {
      onFieldsChange,
      onSubmit,
      onFocus,
      onBlur,
      suggestedCategories = [],
      className,
    },
    ref,
  ) => {
    // Refs let the Tiptap items() callback read fresh data
    // even though the extensions are created once.
    const categoriesRef = useRef(suggestedCategories)
    const detectionEnabledRef = useRef(true)

    useEffect(() => {
      categoriesRef.current = suggestedCategories
    }, [suggestedCategories])

    // Refs are captured by ProseMirror plugin closures, not read during render.
    /* eslint-disable react-hooks/refs */
    const editor = useEditor({
      extensions: [
        Document,
        Paragraph,
        Text,
        Placeholder.configure({ placeholder: 'Add a task...' }),
        createPriorityMark(detectionEnabledRef),
        createCategoryMark(detectionEnabledRef),
        createDateMark(detectionEnabledRef),
        KeyboardShortcutsExtension,
        createCategorySuggestionExtension(() => categoriesRef.current),
      ],
      /* eslint-enable react-hooks/refs */
      editorProps: {
        attributes: {
          class: 'outline-none',
        },
      },
      onUpdate: ({ editor }) => {
        if (detectionEnabledRef.current) {
          onFieldsChange(extractFieldsFromText(editor.getText()))
        }
      },
      onFocus: () => onFocus?.(),
      onBlur: () => onBlur?.(),
    })

    // Keep callbacks and the detection ref in extensionStorage up to date
    useEffect(() => {
      if (editor) {
        syncCallbacks(editor, { onSubmit, onFieldsChange }, detectionEnabledRef)
      }
    })

    // Expose imperative methods
    useImperativeHandle(
      ref,
      () => ({
        clearContent: () => {
          detectionEnabledRef.current = true
          editor?.commands.clearContent(true)
        },
        focus: () => {
          editor?.commands.focus()
        },
        getText: () => editor?.getText() ?? '',
        isDetectionEnabled: () => detectionEnabledRef.current,
      }),
      [editor],
    )

    return (
      <EditorContent
        editor={editor}
        className={cn(
          'smart-input border-border-default bg-bg-base text-text-primary h-10 rounded-md border px-4 text-sm',
          'focus-within:ring-ring focus-within:ring-2',
          'flex items-center',
          '[&_.tiptap]:w-full [&_.tiptap]:outline-none',
          '[&_.tiptap_p]:m-0',
          className,
        )}
      />
    )
  },
)

SmartInput.displayName = 'SmartInput'

export { SmartInput }
