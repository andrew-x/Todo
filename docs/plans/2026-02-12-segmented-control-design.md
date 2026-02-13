# SegmentedControl Design

Generic segmented control extracted from `ViewSwitcher.tsx`.

## API

```tsx
type Option<T extends string> = {
  value: T
  label: string
  icon?: React.ElementType
}

type SegmentedControlProps<T extends string> = {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  size?: Size // default 'md'
  className?: string
}
```

## Decisions

- Generic `T extends string` for type-safe value unions
- CVA for size variants following the design system size scale
- `role="tablist"` / `role="tab"` + `aria-selected` for accessibility
- Container: `bg-bg-raised`, active segment: `bg-surface-selected text-text-primary`
- Icon is optional per option
- `className` on outer container for consumer overrides

## Implementation

1. Create `src/components/common/SegmentedControl.tsx`
2. Refactor `ViewSwitcher.tsx` to use `SegmentedControl`
3. Update design system docs
