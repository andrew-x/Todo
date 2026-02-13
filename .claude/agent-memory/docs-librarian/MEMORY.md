# Docs Librarian Memory

## Project Overview

- Todo app: React 19 + TypeScript 5.9 + Vite 7 + Tailwind 4
- Package manager: bun
- Path alias: `@/*` -> `src/*`

## /docs Folder Structure

- `docs/README.md` -- index/table of contents for all documentation
- `docs/design-system.md` -- reusable UI components, variant architecture, size scale, accessibility
- `docs/firebase-auth.md` -- Firebase Auth with Google sign-in, AuthProvider context, route protection
- `docs/home-page.md` -- Home page: SmartInput (Tiptap), TaskCreationForm, Work/Week/Completed views, task CRUD, profile-driven suggestions
- `docs/user-profiles.md` -- User profile data model, profile-driven autocomplete, auto-update flow
- `docs/routing.md` -- React Router v7 declarative routing setup
- `docs/state-management.md` -- Redux store, RTK Query architecture, Firestore integration

## Architecture Notes

- **Routing**: React Router v7 (^7.13.0), library/declarative mode, single `react-router` package
- **App shell**: `src/App.tsx` has RootLayout + route table; `src/main.tsx` is entry point
- **Entry point**: `src/main.tsx` -> `Provider` -> `App` -> `BrowserRouter` -> Routes
- Routes: `/` (LandingPage), `/home` (HomePage -- task management UI with 3 views: Work + Week + Completed)
- **State**: RTK + RTK Query; single `createApi` in `src/store/api.ts` with `fakeBaseQuery()`
- **Store files**: `src/store/store.ts` (configureStore), `src/store/hooks.ts` (typed hooks), `src/store/api.ts`, `src/store/todosApi.ts` (Task endpoints), `src/store/profileApi.ts` (Profile endpoints)
- **Endpoint pattern**: `api.injectEndpoints()` in `*Api.ts` files in `src/store/` (NOT colocated with feature components)
- **Firestore integration**: `queryFn` inside each endpoint calls Firestore SDK directly; no HTTP
- **Cache tags**: `'Task'` and `'Profile'` registered in `src/store/api.ts`
- **setupListeners** enabled for refetchOnFocus/reconnect support
- Dependencies: `@reduxjs/toolkit` ^2.11.2, `react-redux` ^9.2.0

## Component Directory Structure

Components are organized by feature area under `src/components/`:

- `src/components/auth/` -- AuthProvider, ProtectedRoute, GoogleSignInButton
- `src/components/common/` -- Design system (Button, TextInput, TextArea, Pill, PillInput, Select, DateInput, TextSuggestion, Modal, SegmentedControl)
- `src/components/tasks/` -- TaskCard, SortableTaskCard, TaskColumn, SortableGroup, UnscheduledSection
- `src/components/views/` -- WorkView, WeekView, CompletedView, ViewSwitcher
- `src/components/task-editor/` -- TaskCreationForm, EditTaskModal, SmartInput/
- `src/components/settings/` -- SettingsModal

NOTE: The old `src/components/home/` directory no longer exists. It was split into tasks/, views/, task-editor/, and settings/ directories.

## Design System

- Components in `src/components/common/`: Button, TextInput, TextArea, Pill, PillInput, Select, DateInput, TextSuggestion, Modal, SegmentedControl
- CVA for type-safe variants; `cn` (`clsx` + `tailwind-merge`) for class merging
- Shared types in `src/lib/types.ts`: `Size` ('xs'-'xl'), `Color` (6 values), `Priority` (string union), `PRIORITIES` (ordered array), `ParsedTaskFields`, `Profile`, `Task`
- Consistent size scale (xs-xl) across components; Pill only supports sm/md
- PillInput composes Pill; DateInput uses dayjs helpers; Modal uses createPortal; TextSuggestion is standalone with combobox ARIA; all other components are standalone
- Error pattern: `border-error` + `aria-invalid` + `aria-describedby`
- No barrel files; import directly from component files

## Theme & Styling

- Dark-only theme in `src/styles/index.css` via Tailwind v4 `@theme`
- Custom utilities in `src/styles/utilities.css` (center-all, stack, transition-smooth, focus-ring)
- Tiptap placeholder CSS rule in `src/styles/index.css` (`@layer base`)
- Semantic tokens only -- never raw Tailwind colors
- Color palette: zinc (neutrals) + indigo (accent), oklch values

## SmartInput / Task Creation (Tiptap)

- **SmartInput**: Tiptap editor in `src/components/task-editor/SmartInput/SmartInput.tsx`
- **Token Registry**: `src/lib/tokenRegistry.ts` -- extractFieldsFromText(), getCleanTitle()
- **Mark extensions**: CategoryMark (@name) -- uses markInputRule
- **PriorityMark**: ProseMirror Plugin using decorations; highlights last P0-P4 match only
- **DateMark**: ProseMirror Plugin using chrono-node decorations
- **Priority system**: `Priority` string union type ('P0 - Critical' through 'P4 - Later'), `PRIORITIES` array for ordering
- **Suggestions**: `createCategorySuggestion()` factory returns profile categories only (no hardcoded defaults)
- **Suggestion data flow**: Profile -> HomePage -> TaskCreationForm -> SmartInput (via ref) -> Tiptap extension
- **Ref pattern**: SmartInput stores categories in ref (`categoriesRef`) for lazy evaluation by Tiptap extension
- **renderSuggestion**: Bridge between Tiptap suggestion API and React; portal-based dropdown via createRoot
- **TaskCreationForm**: `src/components/task-editor/TaskCreationForm.tsx` -- wraps SmartInput, expandable fields (react-hook-form + zod), accepts `suggestedCategories` prop
- **Field merging**: form fields override parsed fields; queue auto-derived from due date
- **Detection toggle**: Escape key disables token detection; raw text used as-is on submit
- **Dependencies**: @tiptap/core, @tiptap/react, @tiptap/pm, @tiptap/extension-\*, @tiptap/suggestion, chrono-node

## Home Page Feature

- Task components in `src/components/tasks/`: TaskCard, SortableTaskCard, SortableGroup, TaskColumn, UnscheduledSection
- View components in `src/components/views/`: WorkView, WeekView, CompletedView, ViewSwitcher
- Editor components in `src/components/task-editor/`: TaskCreationForm, EditTaskModal, SmartInput/
- Settings in `src/components/settings/`: SettingsModal
- HomePage fetches active tasks (`useListActiveTasksQuery`) and profile (`useGetProfileQuery`)
- Task list queries: `listActiveTasks` (ACTIVE_LIST tag), `listInactiveTasks` (INACTIVE_LIST tag), `listCompletedTasks` (COMPLETED_LIST tag, lazy, cursor-based pagination)
- Active tasks = two parallel Firestore queries merged: (1) isDone==false by createdAt, (2) isDone==true + updatedAt>=oneMonthAgo by updatedAt
- Composite Firestore indexes required: `isDone + updatedAt` and `isDone + createdAt` (defined in `firestore.indexes.json`)
- **EditTaskModal**: `src/components/task-editor/EditTaskModal.tsx` -- react-hook-form + zod + Controller; edits title/description/category/priority/queue/dueDate; delete with confirmation; dirty-checking
- **TaskCard**: pencil icon (PencilSimpleIcon) for edit; onEdit prop
- **onEdit prop chain**: HomePage -> Views -> TaskColumn/UnscheduledSection -> SortableTaskCard -> TaskCard
- Profile data powers autocomplete suggestions; new categories auto-update profile on task creation and editing
- View state managed locally in HomePage (`useState<View>('work')`)
- WorkView: kanban with drag-and-drop (dnd-kit); filters by `queue` field
- WeekView: filters by `dueDate`, uses `getWeekDays()`, has week navigation, collapsible weekend
- Task type in `src/lib/types.ts` -- key fields: userId, queue, dueDate, isDone, priority (Priority | null), category (no tags, no subTasks)
- `src/lib/dnd.ts`: container ID scheme, buildContainerMap, sortTasks, findContainer
- DnD dependencies: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
- `src/lib/dayjs.ts` has calendar helpers: `getWeekDays()`, `getMonthGrid()`, `isToday()`

## User Profiles

- Profile document: `/users/{userId}` in Firestore (top-level, not subcollection)
- Profile type in `src/lib/types.ts`: `id`, `categories`, `createdAt`, `updatedAt` (no tags field)
- Auto-created on first login by `getProfile` query with empty categories array
- Append-only updates: new categories from tasks are added to profile after task creation
- Manual category management: SettingsModal (`src/components/settings/SettingsModal.tsx`) allows viewing, adding, and deleting categories
- `src/store/profileApi.ts`: `getProfile` (query with auto-create), `updateProfile` (mutation with auto-timestamp)
- Cache tag: `Profile:{userId}` invalidated on profile updates
- Profile queries called by HomePage (autocomplete) and SettingsModal (category management); RTK Query deduplicates

## Conventions

- Doc filenames: lowercase, hyphen-separated (e.g., `routing.md`)
- Every new doc must be added to the `docs/README.md` table
- Auth: Firebase Auth + Google sign-in; React Context (not Redux); `AuthProvider` + `useAuth` hook
- Route protection: `ProtectedRoute` wrapper redirects to `/` if unauthenticated
- RTK Query: `src/store/todosApi.ts` has Task endpoints; `src/store/profileApi.ts` has Profile endpoints; all `*Api.ts` files in `src/store/`
- No barrel files anywhere in the project
