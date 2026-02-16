# Design System

> Reusable UI components in `src/components/common/`. All components use CVA for type-safe variants, the `cn` utility for class merging, and the project's semantic color tokens. This is the foundation for building consistent, accessible UI across the app. Components: Button, IconButton, TextInput, TextArea, Pill, PillInput, Select, DateInput, TextSuggestion, Modal, Popover.

## Overview

The design system provides eleven components that cover the most common interactive UI needs: buttons (text and icon-only), text inputs, textareas, tags/badges, multi-value tag inputs, a select dropdown, a date picker, an autocomplete text input, a modal dialog, and a popover. They share consistent patterns, follow accessibility best practices, and are styled exclusively with the semantic tokens defined in the [theme](../src/styles/index.css).

Components are not exported through a barrel file. Import each component directly from its file:

```ts
import Button from '@/components/common/Button'
import DateInput from '@/components/common/DateInput'
import IconButton from '@/components/common/IconButton'
import Modal from '@/components/common/Modal'
import Pill from '@/components/common/Pill'
import PillInput from '@/components/common/PillInput'
import Popover from '@/components/common/Popover'
import Select from '@/components/common/Select'
import TextArea from '@/components/common/TextArea'
import TextInput from '@/components/common/TextInput'
import TextSuggestion from '@/components/common/TextSuggestion'
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

| Size | Height | Text      | Padding-X | Border Radius | Gap     |
| ---- | ------ | --------- | --------- | ------------- | ------- |
| xs   | h-6    | text-xs   | px-2      | rounded       | gap-1   |
| sm   | h-8    | text-sm   | px-3      | rounded-md    | gap-1.5 |
| md   | h-10   | text-sm   | px-4      | rounded-lg    | gap-2   |
| lg   | h-12   | text-base | px-5      | rounded-lg    | gap-2.5 |
| xl   | h-14   | text-lg   | px-6      | rounded-xl    | gap-3   |

TextArea uses `py-*` padding instead of fixed heights since textareas grow vertically.

## Components

### Button

**File:** `src/components/common/Button.tsx`

A polymorphic button that renders as `<button>` by default or as `<a>` when an `href` prop is provided. Type discrimination ensures the correct HTML attributes are available for each element.

**Props:**

| Prop        | Type                                                       | Default     | Description                                                                                    |
| ----------- | ---------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------- |
| `variant`   | `'default' \| 'primary' \| 'outline' \| 'ghost' \| 'link'` | `'default'` | Visual style                                                                                   |
| `size`      | `Size`                                                     | `'md'`      | Size from the shared scale                                                                     |
| `isLoading` | `boolean`                                                  | `false`     | Shows a spinner (`CircleNotch` from Phosphor Icons), disables the button, and sets `aria-busy` |
| `href`      | `string`                                                   | --          | When provided, renders as `<a>` instead of `<button>`                                          |
| `className` | `string`                                                   | --          | Additional classes (merged last)                                                               |

**Variant styles:**

| Variant | Background                            | Text                  | Hover                                      |
| ------- | ------------------------------------- | --------------------- | ------------------------------------------ |
| default | `bg-surface`                          | `text-text-secondary` | `bg-surface-hover`, `text-text-primary`    |
| primary | `bg-accent`                           | `text-white`          | `bg-accent-hover`                          |
| outline | transparent + `border-border-default` | `text-text-secondary` | `border-border-hover`, `text-text-primary` |
| ghost   | transparent                           | `text-text-secondary` | `bg-surface-hover`, `text-text-primary`    |
| link    | transparent                           | `text-accent-text`    | underline                                  |

**Accessibility:** Disabled buttons get `pointer-events-none` and `opacity-50`. Loading state adds `aria-busy="true"` and disables the button. All buttons include `focus-ring`.

### IconButton

**File:** `src/components/common/IconButton.tsx`

A square button for icon-only actions. Uses the same variant system as Button but with square dimensions (via `size-*` utilities) instead of rectangular aspect ratios. Always renders as a `<button>` element (not polymorphic like Button).

**Props:**

| Prop        | Type                                                                   | Default     | Description                                                                                        |
| ----------- | ---------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------- |
| `variant`   | `'default' \| 'primary' \| 'danger' \| 'outline' \| 'ghost' \| 'link'` | `'default'` | Visual style (same variants as Button)                                                             |
| `size`      | `Size`                                                                 | `'md'`      | Size from the shared scale                                                                         |
| `label`     | `string`                                                               | --          | **Required.** Sets both `aria-label` and `data-tooltip` for accessibility and hover tooltips       |
| `isLoading` | `boolean`                                                              | `false`     | Shows a spinner (`CircleNotchIcon` from Phosphor Icons), disables the button, and sets `aria-busy` |
| `className` | `string`                                                               | --          | Additional classes (merged last)                                                                   |

Plus all native `<button>` attributes except `aria-label` (which is overridden by the `label` prop).

**Size scale:**

| Size | Dimensions | Text      | Rounded    |
| ---- | ---------- | --------- | ---------- |
| xs   | size-6     | text-xs   | rounded-sm |
| sm   | size-8     | text-sm   | rounded    |
| md   | size-10    | text-sm   | rounded-md |
| lg   | size-12    | text-base | rounded-md |
| xl   | size-14    | text-lg   | rounded-lg |

**Variant styles:** Same as Button -- see variant table above.

**Tooltip:** The `label` prop is used to populate `data-tooltip`, which works with the `tooltip` CSS utility class (`src/styles/utilities.css`). The tooltip appears below the button on hover/focus-visible with a 4px gap, using `bg-overlay`, `text-primary`, and the extra-small font size.

**Accessibility:** Same patterns as Button -- disabled state uses `pointer-events-none` and `opacity-50`, loading state adds `aria-busy="true"` and disables the button. The `label` prop is required and sets `aria-label` for screen readers. All icon buttons include `focus-ring`.

**Implementation notes:**

- Uses CVA with the same variant names as Button but a different size scale (square vs. rectangular).
- The `tooltip` class is automatically included in the CVA base classes so tooltips work out of the box.
- The `label` prop is enforced at the type level by omitting `aria-label` from the spread attributes and making `label` a required prop.

### TextInput

**File:** `src/components/common/TextInput.tsx`

A text input with optional label and error message. Wraps a native `<input>` element.

**Props:**

| Prop        | Type     | Default | Description                                                    |
| ----------- | -------- | ------- | -------------------------------------------------------------- |
| `size`      | `Size`   | `'md'`  | Size from the shared scale                                     |
| `label`     | `string` | --      | Renders a `<label>` above the input, linked via `htmlFor`/`id` |
| `error`     | `string` | --      | Renders an error message below the input, adds `border-error`  |
| `className` | `string` | --      | Applied to the wrapper `<div>`, not the input itself           |

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

| Prop        | Type           | Default     | Description                                          |
| ----------- | -------------- | ----------- | ---------------------------------------------------- |
| `color`     | `Color`        | `'default'` | Color variant                                        |
| `size`      | `'sm' \| 'md'` | `'sm'`      | Only two sizes (not the full size scale)             |
| `onRemove`  | `() => void`   | --          | When provided, renders an `X` button inside the pill |
| `className` | `string`       | --          | Additional classes                                   |

**Color variants:**

| Color     | Background          | Text                  |
| --------- | ------------------- | --------------------- |
| default   | `bg-surface`        | `text-text-secondary` |
| primary   | `bg-accent`         | `text-white`          |
| secondary | `bg-accent-subtle`  | `text-accent-text`    |
| success   | `bg-success-subtle` | `text-success`        |
| warning   | `bg-warning-subtle` | `text-warning`        |
| error     | `bg-error-subtle`   | `text-error`          |

**Remove button:** Uses Phosphor Icons `X` at size 12 with `weight="bold"`. Has `aria-label="Remove"` for accessibility.

### PillInput

**File:** `src/components/common/PillInput.tsx`

A controlled multi-value input that creates Pill components from typed text. This is the only component that directly composes another design system component (Pill).

**Props:**

| Prop             | Type                         | Default | Description                                   |
| ---------------- | ---------------------------- | ------- | --------------------------------------------- |
| `values`         | `string[]`                   | --      | Current list of values (controlled)           |
| `onValuesChange` | `(values: string[]) => void` | --      | Callback when values change                   |
| `size`           | `Size`                       | `'md'`  | Size from the shared scale                    |
| `label`          | `string`                     | --      | Renders a `<label>` above the input           |
| `error`          | `string`                     | --      | Renders an error message, adds `border-error` |
| `placeholder`    | `string`                     | --      | Shown only when `values` is empty             |
| `disabled`       | `boolean`                    | `false` | Disables the entire input                     |
| `className`      | `string`                     | --      | Applied to the wrapper `<div>`                |

**Interaction behavior:**

1. **Enter or comma** -- commits the current text as a new pill (prevents duplicates)
2. **Paste** -- splits pasted text on commas, creates pills for each value (prevents duplicates)
3. **Backspace on empty input** -- removes the last pill
4. **Blur** -- commits any remaining text as a pill

**Implementation note:** PillInput does not use CVA. Instead, it uses a plain `Record<string, string>` map (`containerSizeClasses`) for size styling, since it needs to coordinate sizing between the container, the inline input, and the Pill children.

**Accessibility:** Uses `useId()` for label association. Focus ring uses `has-[:focus-visible]` on the container so the outer border highlights when the inner input receives focus.

### Select

**File:** `src/components/common/Select.tsx`

A styled native `<select>` dropdown with a custom caret icon. Wraps the native element for full browser accessibility and form integration while matching the design system's visual style.

**Props:**

| Prop          | Type             | Default | Description                                                     |
| ------------- | ---------------- | ------- | --------------------------------------------------------------- |
| `size`        | `Size`           | `'md'`  | Size from the shared scale                                      |
| `options`     | `SelectOption[]` | --      | Array of `{ value: string; label: string }` objects             |
| `placeholder` | `string`         | --      | When provided, renders a disabled placeholder `<option>`        |
| `label`       | `string`         | --      | Renders a `<label>` above the select, linked via `htmlFor`/`id` |
| `error`       | `string`         | --      | Renders an error message below the select, adds `border-error`  |
| `className`   | `string`         | --      | Applied to the wrapper `<div>`, not the select itself           |

Plus all native `<select>` attributes except `size` (which is overridden by the CVA size variant).

**Implementation notes:**

- Uses `appearance-none` to hide the browser's default caret, then overlays a custom `CaretDownIcon` (Phosphor Icons) positioned with size-dependent offsets (`right-1.5` through `right-4`). The icon has `pointer-events-none` so clicks pass through to the `<select>`.
- Uses left-only padding (`pl-*`) rather than symmetric `px-*` because the right side is reserved for the caret icon (`pr-8` constant across all sizes).
- Icon sizes scale with the component: 12px (xs) through 20px (xl).
- Exports both `SelectProps` and `SelectOption` as named types.

**Accessibility:** Uses `useId()` for auto-generated IDs. Error state follows the standard pattern: `aria-invalid="true"` and `aria-describedby` linking to the error message element.

### TextSuggestion

**File:** `src/components/common/TextSuggestion.tsx`

An autocomplete/combobox-style text input that shows filtered suggestions in a dropdown as the user types. Accepts a full list of suggestions and filters them internally by case-insensitive prefix match. Supports both controlled (`value`/`onChange`) and uncontrolled modes.

**Props:**

| Prop          | Type                      | Default | Description                                                              |
| ------------- | ------------------------- | ------- | ------------------------------------------------------------------------ |
| `size`        | `Size`                    | `'md'`  | Size from the shared scale                                               |
| `suggestions` | `string[]`                | --      | Full list of suggestions; component filters internally                   |
| `onSelect`    | `(value: string) => void` | --      | Callback fired when a suggestion is picked (keyboard or click)           |
| `value`       | `string`                  | --      | Controlled value (when provided, component is controlled)                |
| `onChange`    | input change handler      | --      | Standard input onChange; works in both controlled and uncontrolled modes |
| `label`       | `string`                  | --      | Renders a `<label>` above the input, linked via `htmlFor`/`id`           |
| `error`       | `string`                  | --      | Renders an error message below the input, adds `border-error`            |
| `className`   | `string`                  | --      | Applied to the wrapper `<div>`, not the input itself                     |

Plus all native `<input>` attributes except `size` (which is overridden by the CVA size variant).

**Filtering behavior:**

1. As the user types, the component filters `suggestions` by case-insensitive prefix match against the current input value.
2. The dropdown opens automatically when the input has matches and closes when there are no matches or the input is empty.
3. Re-focusing the input reopens the dropdown if the current value has matches.

**Keyboard navigation:**

| Key        | Action                                               |
| ---------- | ---------------------------------------------------- |
| Arrow Down | Open dropdown (if closed) or move to next suggestion |
| Arrow Up   | Move to previous suggestion (wraps around)           |
| Enter      | Select the highlighted suggestion                    |
| Escape     | Close the dropdown                                   |

Arrow navigation wraps around -- pressing Down on the last item moves to the first, and pressing Up on the first moves to the last.

**Selection behavior:**

- When a suggestion is selected (via Enter or click), the input value updates, `onSelect` fires, and focus returns to the input.
- In controlled mode, selection dispatches a synthetic `input` event on the native element so that the parent's `onChange` handler fires with the new value.
- In uncontrolled mode, internal state updates directly.

**Close mechanisms:**

1. **Escape key** -- closes the dropdown
2. **Click outside** -- mousedown listener on `document` (same pattern as DateInput)
3. **Blur** -- uses a `setTimeout(0)` to check if focus moved outside the container, avoiding premature close when clicking a suggestion

**ARIA:** The input has `role="combobox"` with `aria-expanded`, `aria-controls` pointing to the listbox, `aria-activedescendant` pointing to the highlighted option, and `aria-autocomplete="list"`. The dropdown is a `<ul>` with `role="listbox"`. Each suggestion is a `<li>` with `role="option"` and `aria-selected` for the active item.

**Implementation notes:**

- Redefines `inputVariants` locally (same CVA definition as TextInput) rather than importing, due to React Refresh restrictions on exporting variant definitions.
- The listbox ID is derived from the input ID: `${inputId}-listbox`. Individual option IDs follow the pattern `${listboxId}-option-${index}`.
- Uses `useMemo` for filtering to avoid recomputing on every render.
- `activeIndex` is clamped against the current `filteredSuggestions` length to handle cases where the suggestions prop changes while the dropdown is open.
- Dropdown items use `onMouseDown` with `e.preventDefault()` (not `onClick`) to prevent the input from losing focus when clicking a suggestion.

### DateInput

**File:** `src/components/common/DateInput.tsx`

A date picker that combines a free-text input (YYYY-MM-DD format) with a calendar popup. This is a controlled component following the same value/onChange pattern as PillInput -- it does not spread native input attributes.

**Props:**

| Prop          | Type                      | Default        | Description                                                      |
| ------------- | ------------------------- | -------------- | ---------------------------------------------------------------- |
| `value`       | `string`                  | --             | Current date as a `YYYY-MM-DD` string (empty string for no date) |
| `onChange`    | `(value: string) => void` | --             | Callback when the date changes                                   |
| `size`        | `Size`                    | `'md'`         | Size from the shared scale                                       |
| `label`       | `string`                  | --             | Renders a `<label>` above the input                              |
| `error`       | `string`                  | --             | Renders an error message, adds `border-error`                    |
| `placeholder` | `string`                  | `'YYYY-MM-DD'` | Placeholder text for the text input                              |
| `disabled`    | `boolean`                 | `false`        | Disables the entire component                                    |
| `id`          | `string`                  | --             | Custom ID (falls back to `useId()`)                              |
| `className`   | `string`                  | --             | Applied to the wrapper `<div>`                                   |

**Text input behavior:**

1. The user types a date string directly into the text field.
2. On **blur** (if focus leaves the container entirely) or **Enter**, the value is validated.
3. If the string is a valid `YYYY-MM-DD` date, `onChange` fires with the new value.
4. If the string is empty, `onChange` fires with `''` (clearing the date).
5. If the string is invalid, the input reverts to the last valid value.

**Calendar popup behavior:**

1. Clicking the calendar icon (`CalendarBlankIcon` from Phosphor Icons) toggles the popup.
2. The popup opens to the month of the current value, or the current month if no value is set.
3. Month navigation via prev/next buttons (`CaretLeftIcon` / `CaretRightIcon`).
4. Clicking a date selects it, closes the popup, and returns focus to the text input.
5. Clicking outside the container closes the popup.

**Keyboard navigation in the calendar:**

| Key              | Action                                 |
| ---------------- | -------------------------------------- |
| Arrow Left/Right | Move focus by 1 day                    |
| Arrow Up/Down    | Move focus by 1 week                   |
| Enter / Space    | Select the focused date                |
| Escape           | Close the popup, return focus to input |

When keyboard navigation moves past the edge of the visible month, the calendar view automatically advances to the next/previous month.

**Calendar grid:** Uses `getMonthGrid()` from `src/lib/dayjs.ts` to generate 42 cells (6 rows x 7 columns, Mon-Sun). Today is highlighted with `text-accent-text font-medium`. The selected date gets `bg-accent text-text-inverse`. Days outside the current month use `text-text-disabled`.

**ARIA:** The text input has `role="combobox"` with `aria-expanded`, `aria-haspopup="dialog"`, and `aria-controls` pointing to the calendar dialog. The calendar popup has `role="dialog"` with `aria-label="Choose date"`. Each calendar cell has `aria-label` with the full date (e.g., "February 12, 2026") and `aria-pressed` for the selected state.

**Implementation notes:**

- Uses `fromISODate()` and `toISODate()` from `@/lib/dayjs` for date parsing and formatting.
- The calendar toggle button has `tabIndex={-1}` so it doesn't interrupt the natural tab order.
- Focus management within the calendar grid uses `data-date` attributes and `useEffect` to programmatically focus cells when `focusedDate` changes.
- The container-level blur handler checks `e.relatedTarget` against `containerRef` to avoid committing the value when focus moves between the input and the calendar.

### Modal

**File:** `src/components/common/Modal.tsx`

A dialog overlay rendered via `createPortal` to `document.body`. Supports an optional title header, custom footer, and three width sizes. The modal locks body scroll while open and provides multiple close mechanisms.

**Props:**

| Prop        | Type                   | Default | Description                                                          |
| ----------- | ---------------------- | ------- | -------------------------------------------------------------------- |
| `open`      | `boolean`              | --      | Controls visibility (when `false`, renders nothing)                  |
| `onClose`   | `() => void`           | --      | Called on backdrop click, Escape key, or X button click              |
| `title`     | `string`               | --      | When provided, renders a header with the title and an X close button |
| `footer`    | `React.ReactNode`      | --      | When provided, renders a right-aligned footer area                   |
| `size`      | `'sm' \| 'md' \| 'lg'` | `'md'`  | Panel max-width                                                      |
| `children`  | `React.ReactNode`      | --      | Body content                                                         |
| `className` | `string`               | --      | Additional classes applied to the panel (merged last)                |

**Size variants:**

| Size | Max Width  | Pixels |
| ---- | ---------- | ------ |
| sm   | `max-w-sm` | 384px  |
| md   | `max-w-md` | 448px  |
| lg   | `max-w-lg` | 512px  |

**Close mechanisms:**

1. **Backdrop click** -- clicking the dark overlay behind the panel calls `onClose`
2. **Escape key** -- a `keydown` listener on `document` calls `onClose` while the modal is open
3. **X button** -- rendered in the header only when a `title` prop is provided; uses `XIcon` from Phosphor Icons with `aria-label="Close"`

**Visual structure:**

- **Overlay:** fixed full-screen `bg-black/50` backdrop, centered with the `center-all` utility
- **Panel:** `bg-bg-overlay` background, `border-border-default` border, `rounded-lg`, `shadow-xl`, full width up to the size cap
- **Header** (optional): title in `text-lg font-semibold text-text-primary` + X close button in `text-text-tertiary` with hover to `text-text-primary`, padding `p-5 pb-0`
- **Body:** children wrapped in `text-text-secondary p-5`
- **Footer** (optional): `flex justify-end gap-3 px-5 pb-5` -- typically used for action buttons

**Body scroll lock:** While `open` is `true`, the component sets `document.body.style.overflow = 'hidden'` and restores the original value on close or unmount.

**Implementation notes:**

- Uses `createPortal` to render outside the React component tree, avoiding z-index and overflow clipping issues from parent containers.
- Click propagation on the panel is stopped (`e.stopPropagation()`) so clicks inside the dialog don't trigger the backdrop's `onClose`.
- The Escape key listener and scroll lock are managed via separate `useEffect` hooks that only activate when `open` is `true`.
- Uses CVA for size variants, consistent with other design system components.
- Unlike input components, Modal does not use `useId()`, labels, or error states -- it follows a different pattern as an overlay component.

### Popover

**File:** `src/components/common/Popover.tsx`

A controlled popover that positions floating content relative to a trigger element. Unlike Modal, which overlays the entire viewport, Popover renders inline content anchored to its trigger with automatic flip-up detection when there is not enough room below.

**Props:**

| Prop           | Type                        | Default   | Description                                                  |
| -------------- | --------------------------- | --------- | ------------------------------------------------------------ |
| `trigger`      | `React.ReactNode`           | --        | The element that visually anchors the popover                |
| `children`     | `React.ReactNode`           | --        | Content rendered inside the floating panel                   |
| `open`         | `boolean`                   | --        | Controls visibility (when `false`, panel is not rendered)    |
| `onOpenChange` | `(open: boolean) => void`   | --        | Called on close events (click outside, Escape key)           |
| `align`        | `'start' \| 'end'`          | `'start'` | Horizontal alignment -- `start` aligns left, `end` aligns right |
| `className`    | `string`                    | --        | Additional classes applied to the floating panel             |

**Flip-up detection:** When the popover opens, it measures the distance from the trigger's bottom edge to the viewport bottom. If a panel of estimated height (360px) would overflow, the panel renders above the trigger (`bottom-full mb-1`) instead of below (`top-full mt-1`). This measurement runs on every open via a `useEffect`.

**Close mechanisms:**

1. **Click outside** -- a `mousedown` listener on `document` checks if the click target is outside `containerRef` and calls `onOpenChange(false)`
2. **Escape key** -- a `keydown` listener on `document` calls `onOpenChange(false)` when Escape is pressed

Both listeners are registered only while `open` is `true` and cleaned up when the popover closes.

**Visual structure:**

- **Container:** `relative` positioned `<div>` wrapping both trigger and panel
- **Panel:** `absolute z-50`, `bg-bg-overlay` background, `border-border-default` border, `rounded-md`, `shadow-lg`
- **Alignment:** `left-0` for `start`, `right-0` for `end`

**Implementation notes:**

- Popover does not use CVA -- it has no size or variant system. Sizing and padding are controlled entirely by the `className` prop and the content rendered as `children`.
- Popover does not use `createPortal` (unlike Modal). The panel renders inside the relative container, so it participates in the normal DOM flow. This keeps it simple but means parent overflow clipping could affect visibility in some layouts.
- The `trigger` prop is rendered as-is (not cloned or wrapped with event handlers). The consumer is responsible for wiring click/toggle behavior on the trigger element and calling `onOpenChange`.
- Popover does not manage focus trapping or body scroll lock -- it is lightweight by design. For full dialog behavior, use Modal instead.

## Architecture

### Dependencies

```
PillInput
  |-- Pill (composition)
  |-- @/lib/types (Size type)
  |-- @/lib/classnames (cn)

DateInput
  |-- class-variance-authority (CVA)
  |-- @/lib/classnames (cn)
  |-- @/lib/dayjs (fromISODate, toISODate, getMonthGrid, isToday)
  |-- @phosphor-icons/react (CalendarBlankIcon, CaretLeftIcon, CaretRightIcon)

Modal
  |-- react-dom (createPortal)
  |-- class-variance-authority (CVA)
  |-- @/lib/classnames (cn)
  |-- @phosphor-icons/react (XIcon)

Popover
  |-- @/lib/classnames (cn)

TextSuggestion
  |-- class-variance-authority (CVA)
  |-- @/lib/classnames (cn)

Select
  |-- class-variance-authority (CVA)
  |-- @/lib/classnames (cn)
  |-- @phosphor-icons/react (CaretDownIcon)

Button, IconButton, TextInput, TextArea, Pill
  |-- class-variance-authority (CVA)
  |-- @/lib/classnames (cn)

Button, IconButton
  |-- @phosphor-icons/react (CircleNotchIcon spinner)

Pill
  |-- @phosphor-icons/react (XIcon)
```

### Common Patterns Across Components

1. **Wrapper structure** -- TextInput, TextArea, PillInput, Select, DateInput, and TextSuggestion all use a `<div className="stack gap-1.5">` wrapper containing label, input element, and error message in that order.

2. **Error state** -- All input components follow the same error pattern:
   - `border-error` class on the input/container
   - `aria-invalid="true"` on the input element
   - `aria-describedby` linking to a `<p id="...-error">` element
   - Error message rendered in `text-error text-sm`

3. **ID generation** -- All input components call `useId()` and fall back to it only when no `id` prop is provided (`props.id ?? id`). DateInput also derives a secondary ID (`${inputId}-calendar`) for the popup `aria-controls` linkage.

4. **Export pattern** -- Each file uses `export default function ComponentName()` for the component and a named type export (`export type { ComponentNameProps }`) for props. Popover exports its type inline (`export type PopoverProps = { ... }`).

## Related Documentation

- [Theme & Styling](../.claude/rules/theme.md) -- semantic color tokens, custom utilities, and transition/focus patterns
- [Design System Reference](../.claude/rules/design-system.md) -- quick-reference table for Claude agents working on components
