# Design System

> Reusable UI components in `src/components/common/`. All components use CVA for type-safe variants, the `cn` utility for class merging, and the project's semantic color tokens. This is the foundation for building consistent, accessible UI across the app.

## Overview

The design system provides five components that cover the most common interactive UI needs: buttons, text inputs, textareas, tags/badges, and multi-value tag inputs. They share a consistent size scale, follow the same accessibility patterns, and are styled exclusively with the semantic tokens defined in the [theme](../src/styles/index.css).

Components are not exported through a barrel file. Import each component directly from its file:

```ts
import { Button } from '@/components/common/Button'
import { TextInput } from '@/components/common/TextInput'
import { TextArea } from '@/components/common/TextArea'
import { Pill } from '@/components/common/Pill'
import { PillInput } from '@/components/common/PillInput'
```

## Key Concepts

### Variant Architecture (CVA)

Every component defines its variants using `class-variance-authority` (CVA). This gives full TypeScript inference for variant props and keeps the Tailwind class logic declarative. Variant definitions are **not exported** from component files due to React Refresh restrictions -- they are internal to each file.

### Class Merging (`cn`)

The `cn` utility (`src/lib/classnames.ts`) wraps `clsx` + `tailwind-merge`. Every component accepts a `className` prop, which is always passed **last** to `cn()` so consumer overrides win over default styles.

### Shared Types

`src/lib/types.ts` exports two union types used across components:

- `Size` -- `'xs' | 'sm' | 'md' | 'lg' | 'xl'`
- `Color` -- `'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'`

### Size Scale

All components that accept a `size` prop follow a consistent scale. The default size is `md`.

| Size | Height | Text | Padding-X | Border Radius | Gap |
|------|--------|------|-----------|---------------|-----|
| xs | h-6 | text-xs | px-2 | rounded | gap-1 |
| sm | h-8 | text-sm | px-3 | rounded-md | gap-1.5 |
| md | h-10 | text-sm | px-4 | rounded-lg | gap-2 |
| lg | h-12 | text-base | px-5 | rounded-lg | gap-2.5 |
| xl | h-14 | text-lg | px-6 | rounded-xl | gap-3 |

TextArea uses `py-*` padding instead of fixed heights since textareas grow vertically.

## Components

### Button

**File:** `src/components/common/Button.tsx`

A polymorphic button that renders as `<button>` by default or as `<a>` when an `href` prop is provided. Type discrimination ensures the correct HTML attributes are available for each element.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'primary' \| 'outline' \| 'ghost' \| 'link'` | `'default'` | Visual style |
| `size` | `Size` | `'md'` | Size from the shared scale |
| `isLoading` | `boolean` | `false` | Shows a spinner (`CircleNotch` from Phosphor Icons), disables the button, and sets `aria-busy` |
| `href` | `string` | -- | When provided, renders as `<a>` instead of `<button>` |
| `className` | `string` | -- | Additional classes (merged last) |

**Variant styles:**

| Variant | Background | Text | Hover |
|---------|-----------|------|-------|
| default | `bg-surface` | `text-text-secondary` | `bg-surface-hover`, `text-text-primary` |
| primary | `bg-accent` | `text-white` | `bg-accent-hover` |
| outline | transparent + `border-border-default` | `text-text-secondary` | `border-border-hover`, `text-text-primary` |
| ghost | transparent | `text-text-secondary` | `bg-surface-hover`, `text-text-primary` |
| link | transparent | `text-accent-text` | underline |

**Accessibility:** Disabled buttons get `pointer-events-none` and `opacity-50`. Loading state adds `aria-busy="true"` and disables the button. All buttons include `focus-ring`.

### TextInput

**File:** `src/components/common/TextInput.tsx`

A text input with optional label and error message. Wraps a native `<input>` element.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `Size` | `'md'` | Size from the shared scale |
| `label` | `string` | -- | Renders a `<label>` above the input, linked via `htmlFor`/`id` |
| `error` | `string` | -- | Renders an error message below the input, adds `border-error` |
| `className` | `string` | -- | Applied to the wrapper `<div>`, not the input itself |

Plus all native `<input>` attributes except `size` (which is overridden by the CVA size variant).

**Accessibility:** Uses `useId()` for auto-generated IDs when no `id` prop is provided. Error state sets `aria-invalid="true"` and `aria-describedby` pointing to the error message element.

### TextArea

**File:** `src/components/common/TextArea.tsx`

Same pattern as TextInput but wraps a native `<textarea>`. Uses vertical padding instead of fixed height so the element can grow.

**Props:** Identical to TextInput, but accepts native `<textarea>` attributes instead of `<input>` attributes.

### Pill

**File:** `src/components/common/Pill.tsx`

A colored tag/badge rendered as a `<span>`. Optionally includes a remove button.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | `Color` | `'default'` | Color variant |
| `size` | `'sm' \| 'md'` | `'sm'` | Only two sizes (not the full size scale) |
| `onRemove` | `() => void` | -- | When provided, renders an `X` button inside the pill |
| `className` | `string` | -- | Additional classes |

**Color variants:**

| Color | Background | Text |
|-------|-----------|------|
| default | `bg-surface` | `text-text-secondary` |
| primary | `bg-accent` | `text-white` |
| secondary | `bg-accent-subtle` | `text-accent-text` |
| success | `bg-success-subtle` | `text-success` |
| warning | `bg-warning-subtle` | `text-warning` |
| error | `bg-error-subtle` | `text-error` |

**Remove button:** Uses Phosphor Icons `X` at size 12 with `weight="bold"`. Has `aria-label="Remove"` for accessibility.

### PillInput

**File:** `src/components/common/PillInput.tsx`

A controlled multi-value input that creates Pill components from typed text. This is the only component that directly composes another design system component (Pill).

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `values` | `string[]` | -- | Current list of values (controlled) |
| `onValuesChange` | `(values: string[]) => void` | -- | Callback when values change |
| `size` | `Size` | `'md'` | Size from the shared scale |
| `label` | `string` | -- | Renders a `<label>` above the input |
| `error` | `string` | -- | Renders an error message, adds `border-error` |
| `placeholder` | `string` | -- | Shown only when `values` is empty |
| `disabled` | `boolean` | `false` | Disables the entire input |
| `className` | `string` | -- | Applied to the wrapper `<div>` |

**Interaction behavior:**

1. **Enter or comma** -- commits the current text as a new pill (prevents duplicates)
2. **Paste** -- splits pasted text on commas, creates pills for each value (prevents duplicates)
3. **Backspace on empty input** -- removes the last pill
4. **Blur** -- commits any remaining text as a pill

**Implementation note:** PillInput does not use CVA. Instead, it uses a plain `Record<string, string>` map (`containerSizeClasses`) for size styling, since it needs to coordinate sizing between the container, the inline input, and the Pill children.

**Accessibility:** Uses `useId()` for label association. Focus ring uses `has-[:focus-visible]` on the container so the outer border highlights when the inner input receives focus.

## Architecture

### Dependencies

```
PillInput
  |-- Pill (composition)
  |-- @/lib/types (Size type)
  |-- @/lib/classnames (cn)

Button, TextInput, TextArea, Pill
  |-- class-variance-authority (CVA)
  |-- @/lib/classnames (cn)

Button
  |-- @phosphor-icons/react (CircleNotch spinner)

Pill
  |-- @phosphor-icons/react (X icon)
```

### Common Patterns Across Components

1. **Wrapper structure** -- TextInput, TextArea, and PillInput all use a `<div className="stack gap-1.5">` wrapper containing label, input element, and error message in that order.

2. **Error state** -- All input components follow the same error pattern:
   - `border-error` class on the input/container
   - `aria-invalid="true"` on the input element
   - `aria-describedby` linking to a `<p id="...-error">` element
   - Error message rendered in `text-error text-sm`

3. **ID generation** -- All input components call `useId()` and fall back to it only when no `id` prop is provided (`props.id ?? id`).

4. **Export pattern** -- Each file exports the component function and its props type as named exports. No default exports.

## Related Documentation

- [Theme & Styling](../.claude/rules/theme.md) -- semantic color tokens, custom utilities, and transition/focus patterns
- [Design System Reference](../.claude/rules/design-system.md) -- quick-reference table for Claude agents working on components
