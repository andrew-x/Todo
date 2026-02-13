# Project Structure

## Imports

- Always use the `@/*` path alias for imports (maps to `src/*`)
- Never use relative imports that traverse up directories (`../`)
- Relative imports within the same directory (`./sibling`) are fine

  ```ts
  // Correct
  import { Button } from '@/components/common/Button'

  // Wrong
  import { Button } from '../../components/common/Button'
  ```

## File Organization

- Pages live in `pages/`
- Components live in `components/` organized by feature area (e.g., `components/auth/`, `components/tasks/`, `components/views/`)
- Design system and shared components live in `components/common/`
- RTK Query endpoint files live in `store/` (e.g., `store/todosApi.ts`)
- Utility functions live in `lib/util.ts`
- No barrel files (`index.ts` re-exports) — import directly from the source file

## When Creating New Files

- Place components in the correct feature directory under `components/`
- If a component is reused across features, move it to `components/common/`
- Don't create new directories without a clear reason
- Don't create `index.ts` files for re-exporting
