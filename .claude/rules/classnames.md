---
paths:
  - 'src/**/*.tsx'
  - 'src/**/*.ts'
---

# Classnames (`cn`)

`cn` combines `clsx` (conditional class construction) with `twMerge` (Tailwind conflict resolution, last wins).

## Import

```ts
import cn from '@/lib/classnames'
```

## Usage

```tsx
// Strings
cn('px-2', 'py-1', 'rounded')

// Conditionals
cn('base', isActive && 'bg-accent')

// Objects
cn('base', { 'bg-accent': isActive, 'opacity-50': isDisabled })

// Override/merge — later classes win conflicts
cn('px-2 py-1', props.className)

// Arrays (supported but prefer variadic)
cn(['foo', 'bar'])
```

## Tailwind-merge behavior

Last conflicting utility wins:

```ts
cn('p-2', 'p-4') // → 'p-4'
cn('px-2 py-1', 'p-3') // → 'p-3'
```

## Key rule

Always use `cn` when combining Tailwind classes that might conflict or when adding conditional classes. Never manually concatenate strings or use template literals for `className`.
