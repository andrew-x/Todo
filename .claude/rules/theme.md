---
paths:
  - 'src/**/*.tsx'
  - 'src/**/*.css'
---

# Theme & Styling

## Dark Theme (dark-only)

The app uses a dark-only theme defined in `src/styles/index.css` via Tailwind v4's `@theme` directive. Custom utility classes are in `src/styles/utilities.css`. All color values come from Tailwind's built-in zinc and indigo oklch palettes.

## Typography

The app uses **Inter** (loaded from Google Fonts in `index.html`) as the default sans-serif font, set via `--font-sans` in the theme.

## Semantic Tokens — Always Use These

Never use raw Tailwind color classes (e.g., `bg-zinc-900`, `text-gray-500`). Always use the semantic tokens:

### Backgrounds (elevation via luminance — lighter = higher)

- `bg-bg-base` — page background (zinc-950)
- `bg-bg-raised` — cards, panels, modals, header (zinc-900)
- `bg-bg-overlay` — dropdowns, floating surfaces (zinc-800)

### Surfaces (interactive elements)

- `bg-surface` → `hover:bg-surface-hover` → `active:bg-surface-active`
- `bg-surface-selected` for selected items

### Text (4-tier hierarchy)

- `text-text-primary` — headings, emphasis (zinc-50)
- `text-text-secondary` — body text, default (zinc-400)
- `text-text-tertiary` — metadata, placeholders (zinc-500)
- `text-text-disabled` — disabled state (zinc-600)
- `text-text-inverse` — text on accent backgrounds (zinc-950)

### Borders

- `border-border-default` — standard borders (zinc-800)
- `border-border-hover` — hover state borders (zinc-700)
- `border-border-focus` — focus borders (indigo-400)

### Accent

- `bg-accent` / `hover:bg-accent-hover` — primary buttons
- `bg-accent-subtle` — tinted backgrounds (15% opacity)
- `text-accent-text` — accent-colored text (indigo-400, best contrast on dark)

### Status

- `text-success` / `bg-success-subtle` — green
- `text-warning` / `bg-warning-subtle` — amber
- `text-error` / `bg-error-subtle` — red

### Focus

- `focus-ring` (or manually: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base`)

## Custom Utility Classes (`src/styles/utilities.css`)

| Class               | Expands to                                              | Use case                        |
| ------------------- | ------------------------------------------------------- | ------------------------------- |
| `center-all`        | `flex items-center justify-center`                      | Center children both axes       |
| `center-col`        | `flex flex-col items-center justify-center`             | Centered vertical stack         |
| `center-row`        | `flex flex-row items-center justify-center`             | Centered horizontal row         |
| `stack`             | `flex flex-col`                                         | Vertical flex container         |
| `transition-smooth` | `transition-colors duration-150 ease-smooth`            | Standard interactive transition |
| `focus-ring`        | Focus-visible ring with `bg-base` offset + `ring` color | Standard focus indicator        |
| `tooltip`           | `::after` pseudo-element from `data-tooltip` attr       | Hover/focus tooltip on any element |

## Transitions

All interactive elements should use: `transition-smooth`

The `ease-smooth` custom easing (`cubic-bezier(0.2, 0, 0, 1)`) is defined in the theme.

## Focus

Standard focus style: `focus-ring` (replaces `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base`)

## Common Patterns

**Use design system components** (`src/components/common/`) instead of hand-rolling these:

| Need                        | Component                                                    |
| --------------------------- | ------------------------------------------------------------ |
| Button (any variant)        | `<Button>` — supports `variant`, `size`, `isLoading`, `href` |
| Icon-only button            | `<IconButton>` — square sizing, required `label` (tooltip + aria-label), `isLoading` |
| Text input with label/error | `<TextInput>`                                                |
| Textarea with label/error   | `<TextArea>`                                                 |
| Tag / badge / pill          | `<Pill>` — supports `color`, `size`, `onRemove`              |
| Multi-value tag input       | `<PillInput>`                                                |
| Dropdown select             | `<Select>` — supports `options`, `size`, `placeholder`       |
| Modal / dialog              | `<Modal>` — supports `size`, `title`, `footer`, `open`/`onClose` |

For elements without a component, use semantic tokens directly:

| Element  | Classes                                                |
| -------- | ------------------------------------------------------ |
| Card     | `bg-bg-raised border border-border-default rounded-md` |
| List row | `bg-surface hover:bg-surface-hover transition-smooth`  |
| Link     | `text-accent-text hover:text-accent transition-smooth` |
