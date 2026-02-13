---
paths:
  - 'src/components/common/**'
---

# Design System

## Stack

- **CVA** (`class-variance-authority`) for type-safe variant definitions
- **cn** (`@/lib/classnames`) for merging classes — `className` is always last so consumer overrides win

## Components (`src/components/common/`)

| Component   | File            | Variants / Props                                                                                               |
| ----------- | --------------- | -------------------------------------------------------------------------------------------------------------- |
| `Button`    | `Button.tsx`    | `variant`: default, primary, danger, outline, ghost, link · `size`: xs–xl · `isLoading` · polymorphic (`href` → `<a>`) |
| `TextInput` | `TextInput.tsx` | `size`: xs–xl · `label` · `error`                                                                              |
| `TextArea`  | `TextArea.tsx`  | `size`: xs–xl · `label` · `error`                                                                              |
| `Pill`      | `Pill.tsx`      | `color`: default, primary, secondary, success, warning, error · `size`: sm, md · `onRemove`                    |
| `PillInput` | `PillInput.tsx` | `size`: xs–xl · `values` / `onValuesChange` · `label` · `error`                                                |
| `Select`    | `Select.tsx`    | `size`: xs–xl · `options` · `label` · `error` · `placeholder` · custom caret icon                              |
| `DateInput`       | `DateInput.tsx`       | `size`: xs–xl · `value` / `onChange` (YYYY-MM-DD) · `label` · `error` · calendar popup with keyboard nav       |
| `TextSuggestion`  | `TextSuggestion.tsx`  | `size`: xs–xl · `suggestions` · `onSelect` · `label` · `error` · controlled & uncontrolled · combobox dropdown with keyboard nav |
| `Modal`           | `Modal.tsx`           | `size`: sm, md, lg · `open` / `onClose` · `title` · `footer` · portal to body · Escape/backdrop close · scroll lock |
| `IconButton`       | `IconButton.tsx`       | `variant`: default–link · `size`: xs–xl · `label` (required, tooltip + aria-label) · `isLoading`                     |
| `SegmentedControl` | `SegmentedControl.tsx` | Generic `<T extends string>` · `options` (value, label, icon?) · `value` / `onChange` · `size`: xs–xl · tablist a11y |

## Size Scale

| Size | Height | Text      | Padding-X | Rounded    | Gap     |
| ---- | ------ | --------- | --------- | ---------- | ------- |
| xs   | h-6    | text-xs   | px-2      | rounded-sm | gap-1   |
| sm   | h-8    | text-sm   | px-3      | rounded    | gap-1.5 |
| md   | h-10   | text-sm   | px-4      | rounded-md | gap-2   |
| lg   | h-12   | text-base | px-5      | rounded-md | gap-2.5 |
| xl   | h-14   | text-lg   | px-6      | rounded-lg | gap-3   |

## Color Variants (Pill/Button)

| Color     | Background        | Text                |
| --------- | ----------------- | ------------------- |
| default   | bg-surface        | text-text-secondary |
| primary   | bg-accent         | text-white          |
| secondary | bg-accent-subtle  | text-accent-text    |
| success   | bg-success-subtle | text-success        |
| warning   | bg-warning-subtle | text-warning        |
| error     | bg-error-subtle   | text-error          |

## Patterns

- All components accept `className` for overrides (last in `cn()`)
- Input/TextArea/PillInput/Select/DateInput/TextSuggestion use `useId()` for accessible label association
- Error state: `border-error` + `aria-invalid` + `aria-describedby`
- Shared types: `Size`, `Color` from `@/lib/types.ts`
- Variant definitions are not exported (React Refresh restriction) — kept internal to each component file
- Modal uses `role="dialog"` + `aria-modal` + `aria-labelledby` + portal to `document.body` + body scroll lock
