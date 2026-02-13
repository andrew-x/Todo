# Design System Specialist Memory

## Component Inventory (src/components/common/)

- **Button** — polymorphic (href -> anchor), CVA variants + VariantProps, focus-ring, transition-smooth
- **TextInput** — useId() for label binding, error state pattern (border-error + aria-invalid + aria-describedby)
- **TextArea** — same field pattern as TextInput
- **Pill** — color variants (default/primary/secondary/success/warning/error), size sm/md, onRemove
- **PillInput** — controlled values/onValuesChange, Enter/comma/paste to add, backspace to remove
- **Select** — native select with custom caret icon, useId(), error pattern
- **DateInput** — calendar popup, YYYY-MM-DD value format, keyboard nav
- **Modal** — portal to body, role="dialog" + aria-modal, size sm/md/lg, scroll lock, Escape/backdrop close

## Established Patterns

- CVA variants are NEVER exported (react-refresh/only-export-components rule)
- Types use `VariantProps<typeof variants>` to stay in sync with CVA definitions
- `cn()` always has `className` last for consumer overrides
- Export pattern: `export default function Component` + `export type { ComponentProps }`
- All interactive elements need `focus-ring` and `transition-smooth`
- Form components use `useId()` for accessible label association
- Semantic tokens only (never raw Tailwind colors) — see theme.md
- Icon imports use `Icon` suffix (e.g., `XIcon`, `CaretDownIcon`)

## Accessibility Patterns

- Form fields: `aria-invalid` + `aria-describedby` pointing to error message element
- Modal/dialog: `role="dialog"` + `aria-modal="true"` + `aria-labelledby` + focus management
- Buttons: `aria-busy` when loading, `aria-label` for icon-only buttons

## Known Gaps / Future Work

- Modal does not have a focus trap (Tab can escape to browser chrome)
- Modal close button only renders when `title` is provided — headless modals need alternate close affordance
- No Tooltip, Popover, or Dropdown menu components yet
