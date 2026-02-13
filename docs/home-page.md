# Home Page -- Task Management UI

> The Home page (`/home`) is the main task workspace. It displays the authenticated user's active tasks (incomplete tasks plus recently completed tasks from the last month) in three switchable views (Work, Week, Completed) and provides a smart input for creating tasks with inline token detection. All data flows through RTK Query hooks backed by Firestore.

## Overview

After signing in, the user lands on the Home page. The page fetches all **active tasks** for the current user (incomplete tasks plus tasks completed within the last month) and renders them inside the active view. A Tiptap-based smart input at the top auto-detects inline tokens (dates, priorities, categories, tags) and highlights them with colored marks as you type. The form expands on focus to reveal additional fields for manual overrides and description. A segmented view switcher toggles between three layouts: Work (kanban), Week (calendar columns), and Completed (searchable archive of all done tasks).

## Key Files

| File                                                                       | Role                                                                                                                                              |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/HomePage.tsx`                                                   | Page component -- fetches tasks + profile, wires up mutations, manages active view, auto-updates profile on task creation                         |
| `src/components/task-editor/TaskCreationForm.tsx`                          | Form wrapper -- SmartInput + expandable manual fields, merges parsed and manual data on submit                                                    |
| `src/components/task-editor/SmartInput/SmartInput.tsx`                     | Tiptap editor wrapper -- keyboard handling, extension setup, imperative ref, accepts suggested categories                                         |
| `src/components/task-editor/SmartInput/marks/DateMark.ts`                  | ProseMirror plugin for natural language date highlighting (chrono-node)                                                                           |
| `src/components/task-editor/SmartInput/marks/PriorityMark.ts`              | ProseMirror plugin for `P0`–`P4` priority token highlighting                                                                                      |
| `src/components/task-editor/SmartInput/marks/CategoryMark.ts`              | Tiptap mark extension for `@category` tokens                                                                                                      |
| `src/components/task-editor/SmartInput/suggestions/CategorySuggestion.ts`  | Suggestion factory for `@` trigger -- returns profile categories only                                                                             |
| `src/components/task-editor/SmartInput/suggestions/SuggestionDropdown.tsx` | Shared dropdown UI for autocomplete popups                                                                                                        |
| `src/components/task-editor/SmartInput/suggestions/renderSuggestion.tsx`   | Tiptap suggestion render bridge (creates a portal-based dropdown)                                                                                 |
| `src/components/task-editor/EditTaskModal.tsx`                             | Modal form for editing all task properties (zod + react-hook-form + delete confirmation)                                                          |
| `src/components/settings/SettingsModal.tsx`                                | Settings modal for viewing and managing profile categories (add/delete)                                                                           |
| `src/lib/tokenRegistry.ts`                                                 | Token config array, `extractFieldsFromText()`, `getCleanTitle()`, color mappings                                                                  |
| `src/lib/types.ts`                                                         | `Task` and `ParsedTaskFields` type definitions                                                                                                    |
| `src/components/tasks/TaskCard.tsx`                                        | Interactive task card -- checkbox, edit button, drag handle                                                                                       |
| `src/components/tasks/TaskColumn.tsx`                                      | Dual-mode column: static (WeekView) or DnD-enabled (WorkView via `groups` prop); includes `DoneSection` for completed tasks                       |
| `src/components/tasks/SortableTaskCard.tsx`                                | Wraps TaskCard with dnd-kit's `useSortable` hook for drag-and-drop reordering                                                                     |
| `src/components/tasks/SortableGroup.tsx`                                   | `useDroppable` + `SortableContext` wrapper for priority groups within a column                                                                    |
| `src/lib/dnd.ts`                                                           | Container ID builders/parsers, task sorting by order, container map for multi-container DnD                                                       |
| `src/components/tasks/UnscheduledSection.tsx`                              | Collapsible section for tasks with no due date                                                                                                    |
| `src/components/views/ViewSwitcher.tsx`                                    | Segmented control to switch between Work / Week / Completed views                                                                                 |
| `src/components/views/WorkView.tsx`                                        | 3-column kanban with drag-and-drop (DndContext, sensors, drag state, batch updates)                                                               |
| `src/components/views/WeekView.tsx`                                        | 7-day columns (Mon-Sun) filtered by `dueDate`                                                                                                     |
| `src/components/views/CompletedView.tsx`                                   | Searchable flat list of all completed tasks with cursor-based pagination                                                                          |
| `src/store/todosApi.ts`                                                    | RTK Query endpoints -- `listActiveTasks`, `listInactiveTasks`, `listCompletedTasks`, `createTask`, `updateTask`, `deleteTask`, `batchUpdateTasks` |
| `src/lib/dayjs.ts`                                                         | Date utilities -- `getWeekDays()`, `getMonthGrid()`, `isToday()`                                                                                  |

## Task Data Model

The `Task` type is defined in `src/lib/types.ts`:

| Field         | Type                      | Description                                                               |
| ------------- | ------------------------- | ------------------------------------------------------------------------- |
| `id`          | `string`                  | Prefixed nanoid (`task-...`), generated by `src/lib/id.ts`                |
| `userId`      | `string`                  | Firebase Auth UID of the task owner                                       |
| `title`       | `string`                  | Task title (cleaned of token syntax before storage)                       |
| `description` | `string`                  | Optional description (defaults to `""`)                                   |
| `isDone`      | `boolean`                 | Completion status                                                         |
| `category`    | `string \| null`          | Optional category label                                                   |
| `queue`       | `'day' \| 'week' \| null` | Work queue assignment (Today / This Week / unassigned)                    |
| `priority`    | `Priority \| null`        | Optional priority level (see Priority type below)                         |
| `order`       | `number \| null`          | Sort position within a column/group (dense integer, set by drag-and-drop) |
| `dueDate`     | `string \| null`          | Due date in `YYYY-MM-DD` format                                           |
| `createdAt`   | `number`                  | Timestamp in milliseconds                                                 |
| `updatedAt`   | `number`                  | Timestamp in milliseconds                                                 |

The `Priority` type is a string union exported from `src/lib/types.ts`, with a companion `PRIORITIES` constant array that defines the canonical order:

| Index | Value              |
| ----- | ------------------ |
| 0     | `'P0 - Critical'`  |
| 1     | `'P1 - Important'` |
| 2     | `'P2 - Standard'`  |
| 3     | `'P3 - Optional'`  |
| 4     | `'P4 - Later'`     |

The `ParsedTaskFields` type (also in `src/lib/types.ts`) represents the structured data extracted from the SmartInput editor text:

| Field      | Type               |
| ---------- | ------------------ |
| `category` | `string \| null`   |
| `priority` | `Priority \| null` |
| `dueDate`  | `string \| null`   |

## How It Works

### Page Layout and Data Flow

1. `HomePage` (`src/pages/HomePage.tsx`) reads the current user from `useAuth()` and asserts `user!.uid` (the page is wrapped in `ProtectedRoute`, so `user` is guaranteed non-null).
2. `useGetProfileQuery(userId)` fetches the user's profile, which contains their category history for autocomplete suggestions. See [User Profiles](./user-profiles.md) for details.
3. `useListActiveTasksQuery(userId)` fetches **active tasks** from Firestore -- this includes all incomplete tasks (`isDone === false`, ordered by `createdAt` descending) plus recently completed tasks (done within the last month, based on `updatedAt >= oneMonthAgo`, ordered by `updatedAt` descending). The endpoint runs two parallel Firestore queries and merges the results.
4. Four mutation hooks are initialized: `useCreateTaskMutation`, `useUpdateTaskMutation`, `useDeleteTaskMutation`, `useBatchUpdateTasksMutation`.
5. One profile mutation hook is initialized: `useUpdateProfileMutation`.
6. The page renders a stacked layout: `TaskCreationForm` (full-width card) on top, a row containing `ViewSwitcher` and an optional category filter below, and then the active view.
7. The active view is tracked in local state: `useState<View>('work')`. Defaults to the Work view.
8. **Category filter:** A `SegmentedControl` next to the view switcher lets the user filter active tasks by category. Options are "All" plus every category from the user's profile. The filter is hidden when the Completed view is active (the Completed view has its own search). If the selected category is removed from the profile, the filter resets to "All". The filter applies to the `tasks` array passed to the Work and Week views only.
9. The Work and Week views receive the filtered `tasks` array plus `onUpdate`, `onDelete`, `onEdit`, and `onBatchUpdate` callbacks. The **Completed view** is different: it receives `userId` directly and manages its own data fetching internally (it does not use the shared `listActiveTasks` data). It still receives `onUpdate`, `onDelete`, and `onEdit` callbacks so that task mutations route through the same `HomePage` handlers.
10. An `editingTask` state (`useState<Task | null>(null)`) tracks which task is currently being edited. When non-null, `EditTaskModal` is rendered conditionally at the bottom of the page layout.

### Task Creation

Task creation is handled by two components working together: **SmartInput** (the Tiptap editor) handles inline text parsing and token highlighting, while **TaskCreationForm** wraps the SmartInput and provides expandable manual-override fields.

#### SmartInput (Tiptap Editor)

**File:** `src/components/task-editor/SmartInput/SmartInput.tsx`

The SmartInput is a single-line Tiptap editor that detects and highlights tokens as the user types. It uses `forwardRef` to expose an imperative `SmartInputRef` with `clearContent()`, `focus()`, `getText()`, and `isDetectionEnabled()` methods. It accepts an optional `suggestedCategories` prop that populates the autocomplete dropdown (profile-only, no hardcoded defaults).

**Tiptap extensions loaded:**

| Extension                       | Source                                       | Purpose                                          |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------ |
| `Document`, `Paragraph`, `Text` | `@tiptap/extension-*`                        | Core ProseMirror schema                          |
| `Placeholder`                   | `@tiptap/extension-placeholder`              | "Add a task..." placeholder text                 |
| `PriorityMark`                  | `./marks/PriorityMark.ts`                    | Highlights `P0`–`P4` priority tokens             |
| `CategoryMark`                  | `./marks/CategoryMark.ts`                    | Highlights `@category` tokens                    |
| `DateMark`                      | `./marks/DateMark.ts`                        | Highlights natural-language date expressions     |
| `KeyboardShortcutsExtension`    | Inline                                       | Enter/Cmd+Enter submit, Escape toggles detection |
| Category suggestion             | Inline `createCategorySuggestionExtension()` | Autocomplete popup for `@` trigger               |

**Callbacks:** On every text update (`onUpdate`), the editor calls `extractFieldsFromText()` from `src/lib/tokenRegistry.ts` and passes the results up via `onFieldsChange`. `onFocus` and `onBlur` are forwarded to the parent for expansion control.

#### Token Registry

**File:** `src/lib/tokenRegistry.ts`

Central configuration for all inline token types. Exports:

- **`extractFieldsFromText(text)`** -- Parses raw editor text and returns a `ParsedTaskFields` object with detected priority, category, and due date.
- **`getCleanTitle(text)`** -- Strips all detected token syntax from the text to produce a clean task title for storage. Removes priority tokens, category prefixes, and chrono-detected date text, then collapses whitespace.

**Token detection patterns:**

| Token    | Syntax                       | Example              | Detection                                                                      |
| -------- | ---------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| Priority | `P0`, `P1`, `P2`, `P3`, `P4` | "Fix login P0"       | Regex `/\b[Pp][0-4]\b/g` -- maps to full `Priority` string via `PRIORITIES[n]` |
| Category | `@name`                      | "Fix login @work"    | Regex `/@([\w][\w-]*)(?:\s\|$)/g`                                              |
| Date     | Natural language             | "Fix login tomorrow" | [chrono-node](https://github.com/wanasit/chrono) with `forwardDate: true`      |

#### Mark Extensions

Each mark extension applies colored inline styling to matched tokens in the editor.

**CategoryMark** (`src/components/task-editor/SmartInput/marks/CategoryMark.ts`) is a Tiptap `Mark` extension. It uses `markInputRule()` to detect tokens when the user types a space after the token text. It renders a `<span>` with semantic color classes:

| Mark       | Classes                          | Trigger pattern                 |
| ---------- | -------------------------------- | ------------------------------- |
| `category` | `bg-warning-subtle text-warning` | `/(?:^\|\s)(@([\w][\w-]*))\s$/` |

**PriorityMark** (`PriorityMark.ts`) is a ProseMirror `Plugin` (not a Tiptap Mark) that creates inline `Decoration` objects -- the same approach used by DateMark. On every document change, it scans the text with `/\bP[0-4]\b/g` and highlights only the **last** match with `bg-error-subtle text-error rounded px-0.5` classes plus a `data-priority` attribute. Only the last priority token is highlighted because a task can have only one priority, and last-match-wins is the extraction rule.

**DateMark** (`DateMark.ts`) works the same way -- it is a ProseMirror `Plugin` that creates inline `Decoration` objects. On every document change, it runs `chrono.parse()` on the full document text and highlights matched date expressions with `bg-accent-subtle text-accent-text` classes. It supports dismissal: pressing Escape while the cursor is inside a date highlight adds the text to a `dismissedSet`, removing the highlight until the text changes.

#### Autocomplete Suggestions

A suggestion factory provides dropdown autocomplete when the user types `@`. Suggestions come exclusively from the user's profile -- there are no hardcoded defaults. If the profile has no matching items, the dropdown renders nothing (`SuggestionDropdown` returns `null` for an empty items list).

**CategorySuggestion** (`src/components/task-editor/SmartInput/suggestions/CategorySuggestion.ts`):

- Factory function: `createCategorySuggestion(getItems: () => string[])`
- Trigger character: `@`
- Items source: `getItems()` callback, which reads the user's profile categories
- Filters by prefix match (case-insensitive), limited to 8 results
- On selection: inserts `@category ` with the `category` mark applied

**How SmartInput wires suggestions:** The component receives `suggestedCategories` from `TaskCreationForm`, stores it in a ref (`categoriesRef`), and creates the suggestion extension with a `() => ref.current` callback. This ref pattern ensures the Tiptap extension reads fresh profile data on every keystroke without requiring editor recreation. See [User Profiles](./user-profiles.md) for the full data flow.

**SuggestionDropdown** (`SuggestionDropdown.tsx`) is the shared UI component for both dropdowns. It renders a `listbox` with `option` buttons, supports keyboard navigation (ArrowUp/ArrowDown to move, Enter to select), and uses `forwardRef` with `useImperativeHandle` to expose an `onKeyDown` handler to the Tiptap suggestion system.

**renderSuggestion** (`renderSuggestion.tsx`) is the bridge between Tiptap's suggestion API and React. It creates a positioned `<div>` portal appended to `document.body`, renders `SuggestionDropdown` into it via `createRoot`, and manages lifecycle (onStart, onUpdate, onKeyDown, onExit). Escape dismisses the dropdown.

#### TaskCreationForm

**File:** `src/components/task-editor/TaskCreationForm.tsx`

A card-style form that wraps the SmartInput and adds an expandable dropdown panel of manual-override fields. It uses `react-hook-form` with `zod` validation internally. It exports the `TaskCreationData` type alongside the component.

**Collapsed state (default):** Only the SmartInput is visible -- a single-line text input inside a rounded card.

**Expanded state (on focus):** An absolute-positioned dropdown panel appears below the input bar, visually attached via matching borders and background. The panel contains:

1. **Category + Priority + Due date + Queue** -- `TextSuggestion` for category (with profile-based autocomplete), `Select` for priority, `DateInput` for due date, `Select` for queue (None / Today / This week) -- laid out in a 4-column grid
2. **Description** -- `TextArea` (2 rows)
3. **Actions** -- "Cancel" (ghost) and "Add task" (primary) buttons, centered

**Expansion logic:** The form tracks `isExpanded` state. It expands on any `focus` event within the container. It collapses when the user clicks outside the container (mousedown listener on document) or clicks "Cancel". The "Cancel" button also resets all form fields.

**Field merging:** On submit, manual fields override parsed fields with this priority:

| Field         | Merge rule                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `category`    | Manual value if non-empty, otherwise parsed value                                                                              |
| `priority`    | Manual select value if explicitly set, otherwise parsed value                                                                  |
| `dueDate`     | Manual date if set, otherwise parsed date from chrono-node                                                                     |
| `queue`       | Manual select value if set, otherwise auto-derived from effective due date (today = 'day', this week = 'week', otherwise null) |
| `description` | Manual only                                                                                                                    |

**`TaskCreationData` type:**

| Field         | Type                      | Description                                |
| ------------- | ------------------------- | ------------------------------------------ |
| `title`       | `string`                  | Clean title with all token syntax stripped |
| `description` | `string`                  | Optional description text                  |
| `category`    | `string \| null`          | Merged category                            |
| `queue`       | `'day' \| 'week' \| null` | Queue assignment (auto-derived or manual)  |
| `priority`    | `Priority \| null`        | Merged priority value                      |
| `dueDate`     | `string \| null`          | Merged due date in `YYYY-MM-DD` format     |

**Submit flow:**

1. User types in the SmartInput (e.g., "Buy groceries tomorrow @personal P2" -- the `P2` maps to `'P2 - Standard'`)
2. As they type, tokens are highlighted inline and `ParsedTaskFields` is updated in real time
3. User optionally expands the form and fills in overrides (description, due date, queue, etc.)
4. User presses Enter in the SmartInput or clicks "Add task"
5. `handleSubmit()` re-extracts fields from the raw text (checking `isDetectionEnabled` -- if Escape was pressed, detection is off and raw text is used as-is), checks that the clean title is non-empty, merges parsed + form fields, calls `onSubmit(data)`, and resets all state including clearing the editor via `smartInputRef.current.clearContent()`
6. `HomePage.handleAdd` spreads the `TaskCreationData` into `createTask({ userId, ...data })`
7. The `createTask` mutation generates a prefixed ID, fills defaults, writes to Firestore, and invalidates cache
8. `HomePage.handleAdd` compares the task's category against the user's profile and calls `updateProfile()` to append any new values (see [User Profiles](./user-profiles.md))

### Task Editing (Edit Task Modal)

**File:** `src/components/task-editor/EditTaskModal.tsx`

Clicking the pencil icon on any `TaskCard` opens a modal form for editing all task properties. The modal uses `react-hook-form` with `Controller` components and `zod` validation (via `@hookform/resolvers/zod`).

**Props:**

| Prop                  | Type                               | Description                                               |
| --------------------- | ---------------------------------- | --------------------------------------------------------- |
| `task`                | `Task`                             | The task being edited (populates default values)          |
| `onClose`             | `() => void`                       | Closes the modal                                          |
| `onSave`              | `(updates: Partial<Task>) => void` | Saves the changed fields                                  |
| `onDelete`            | `() => void`                       | Deletes the task                                          |
| `suggestedCategories` | `string[]` (optional)              | Profile categories for autocomplete on the category field |

**Form fields:**

| Field       | Component        | Notes                                                                                       |
| ----------- | ---------------- | ------------------------------------------------------------------------------------------- |
| Title       | `TextInput`      | Required (zod: `z.string().trim().min(1)`)                                                  |
| Description | `TextArea`       | 3 rows                                                                                      |
| Category    | `TextSuggestion` | Free-text with profile-based autocomplete suggestions                                       |
| Priority    | `Select`         | Options: None / P0 - Critical / P1 - Important / P2 - Standard / P3 - Optional / P4 - Later |
| Queue       | `Select`         | Options: None / Today / This Week                                                           |
| Due Date    | `DateInput`      | Date picker                                                                                 |

The form fields are laid out as: title (full width), description (full width), then two 2-column rows -- category + priority, then queue + due date.

**Validation schema:** All fields are strings internally. Empty strings for `category`, `priority`, `queue`, and `dueDate` are converted to `null` before saving. The schema validates that `title` is a non-empty trimmed string.

**Dirty-checking on save:** The `onSubmit` handler compares each field against the original `task` values and builds a `Partial<Task>` containing only the fields that actually changed. If nothing changed, `onSave` is not called but the modal still closes.

**Delete confirmation flow:** The modal footer has two states:

1. **Default state:** "Delete" button (left-aligned, error-styled ghost), "Cancel" button, "Save" button (primary)
2. **Confirming state:** After clicking "Delete", the footer switches to "Cancel" and "Confirm Delete" (error-styled primary). This prevents accidental deletion without a separate confirmation dialog.

**Data flow:**

1. User clicks the pencil icon on a `TaskCard` -- calls `onEdit()`, which propagates up to `HomePage.handleEdit(task)`
2. `handleEdit` sets `editingTask` state to the clicked task
3. `EditTaskModal` renders with the task's current values as form defaults
4. User edits fields and clicks "Save" (or presses Enter in the form)
5. `EditTaskModal.onSubmit` diffs the form values against the original task and calls `onSave(updates)` with only changed fields
6. `HomePage.handleEditSave` calls `updateTask({ userId, id, ...updates })` and syncs any new category to the profile (same logic as task creation -- appends to `profile.categories` if the category is new)
7. `handleEditSave` sets `editingTask` to `null`, closing the modal

For deletion, the flow is: user clicks "Delete" -> "Confirm Delete" -> `EditTaskModal` calls `onDelete()` then `onClose()` -> `HomePage.handleEditDelete` calls `deleteTask({ userId, id })` and sets `editingTask` to `null`.

**How `onEdit` propagates through the component tree:**

- `HomePage` defines `handleEdit(task: Task)` and passes it as `onEdit` to both views
- Each view (`WorkView`, `WeekView`) passes `onEdit` down to `TaskColumn` / `UnscheduledSection` / `WeekDayColumn`
- `TaskColumn` passes `onEdit` to both `SortableTaskCard` (DnD mode) and `TaskCard` (static mode), and also to `DoneSection`
- `SortableTaskCard` passes `onEdit` through to `TaskCard`
- `TaskCard` renders a pencil icon (`PencilSimpleIcon`) that calls `onEdit()` on click

### Task Updates

`TaskCard` (`src/components/tasks/TaskCard.tsx`) supports one inline update interaction:

- **Checkbox toggle** -- Calls `onUpdate({ isDone: !task.isDone })`. The `updateTask` mutation patches the document and, because `isDone` is in the patch, invalidates both `ACTIVE_LIST` and `INACTIVE_LIST` tags.

All other task property updates (title, description, category, priority, queue, due date) go through the [Edit Task Modal](#task-editing-edit-task-modal).

In addition, the Work view supports **drag-and-drop updates** that can change a task's `queue`, `priority`, and `order` in a single operation. These go through `handleBatchUpdate` in `HomePage`, which calls `batchUpdateTasks({ userId, updates })`. See the [Work View](#work-view) section for details on the drag-and-drop architecture.

### Task Deletion

Task deletion is handled through the [Edit Task Modal](#task-editing-edit-task-modal). The modal's footer includes a "Delete" button with a two-step confirmation flow. `HomePage.handleEditDelete` calls `deleteTask({ userId, id })`, which removes the Firestore document and invalidates tags for the specific task, `ACTIVE_LIST`, and `INACTIVE_LIST`.

## Views

### Work View

**File:** `src/components/views/WorkView.tsx`

A 3-column kanban layout (`grid-cols-3`) that filters tasks by the `queue` field and supports full drag-and-drop reordering:

| Column    | Filter             | Meaning                            |
| --------- | ------------------ | ---------------------------------- |
| Backlog   | `queue === null`   | Tasks not assigned to a time queue |
| Today     | `queue === 'day'`  | Tasks queued for today             |
| This Week | `queue === 'week'` | Tasks queued for the current week  |

Each column uses `TaskColumn` in DnD mode (with `groups` prop). Users can move tasks between columns by dragging (changes `queue`), between priority groups (changes `priority`), or reorder within a group (changes `order`). Queue and priority can also be changed via the Edit Task Modal.

#### Done Sublist

Each column separates completed tasks into a dedicated "Done" section at the bottom, visually divided from active tasks by a thin border. Key behaviors:

- **Filtering:** `computeColumnGroups()` in `WorkView.tsx` excludes `isDone: true` tasks from the DnD group data. `buildContainerMap()` in `src/lib/dnd.ts` also filters out done tasks, so they never enter the drag-and-drop system (cannot be dragged or used as drop targets).
- **Done tasks helper:** `getDoneTasks(tasks, queue)` in `WorkView.tsx` returns done tasks for a given queue, sorted by `updatedAt` descending (most recently completed first).
- **Column header count:** `getColumnCount()` excludes done tasks -- the count reflects only active (incomplete) tasks.
- **Rendering:** `TaskColumn` receives a `doneTasks` prop and renders a `DoneSection` component below the active task list. `DoneSection` (defined in `TaskColumn.tsx`) shows a "Done (N)" label with the count and renders plain `TaskCard` components (no drag handles, no sortable wrappers). It returns `null` when the list is empty.
- **Unchecking:** Toggling a done task's checkbox (`isDone: false`) moves it back to the active area of its column. The `updateTask` mutation invalidates both list tags, which triggers a refetch and the task reappears in the DnD system.
- **"No tasks" placeholder:** The empty state message only appears when both the active task list and the done task list are empty for that column.

#### Drag-and-Drop Architecture

The Work view wraps its columns in a `DndContext` (from `@dnd-kit/core`) with `closestCenter` collision detection and two sensors:

- **PointerSensor** -- activated after 5px of movement (`activationConstraint: { distance: 5 }`) to avoid accidental drags on click
- **KeyboardSensor** -- uses `sortableKeyboardCoordinates` for accessible keyboard-based reordering

**Container ID scheme** (defined in `src/lib/dnd.ts`):

| Pattern                      | Example                     | Meaning                          |
| ---------------------------- | --------------------------- | -------------------------------- |
| `column::<queue>`            | `column::day`               | A column container (ungrouped)   |
| `group::<queue>::<priority>` | `group::day::P0 - Critical` | A priority group within a column |
| `item::<taskId>`             | `item::task-abc123`         | A draggable task item            |

Columns use `column::` IDs when no tasks have priorities; when any task in a column has a priority, that column's tasks are organized into `group::` containers instead. The `parseContainerId()`, `getQueueFromContainerId()`, and `getPriorityFromContainerId()` helpers extract queue/priority values from these IDs.

#### Drag State Management

During a drag, `WorkView` maintains local `dragState` (type `DragState`) containing:

- `activeTask` -- the task being dragged
- `containers` -- a `Record<string, string[]>` mapping container IDs to ordered arrays of task IDs

The container map is built from the full task list at drag start via `buildContainerMap()` (`src/lib/dnd.ts`). During drag, the map is updated optimistically to reflect visual position changes.

**Event flow:**

1. **`onDragStart`** -- Looks up the active task and snapshots the current container map via `buildContainerMap(tasks)`.
2. **`onDragOver`** -- Fires when dragging over a new container or item. Moves the task ID from the source container to the destination container in state. If dragging onto a column that uses group containers, the task is redirected to the "No priority" group. New group containers are created on-the-fly if needed.
3. **`onDragEnd`** -- Finalizes the position. For same-container reorders, splices the task to its final index. For cross-container moves, ensures correct placement. Then calls `computeUpdates()` to build the batch update array and dispatches `onBatchUpdate`.

**`DragOverlay`** renders a rotated, elevated clone of the dragged `TaskCard` for visual feedback (`rotate-[2deg] opacity-95 shadow-lg`).

#### Order Assignment

On drop, `computeUpdates()` iterates over affected containers and assigns **dense integer `order` values** (0, 1, 2, ...) based on position. It compares each task's current `queue`, `priority`, and `order` against the new values and only includes tasks that actually changed in the batch update array. This means a simple reorder within a 3-item group produces at most 3 update records.

#### Container Map Utilities

`src/lib/dnd.ts` exports these helpers used by `WorkView`:

| Function                                     | Purpose                                                                                      |
| -------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `buildContainerMap(tasks)`                   | Creates the initial container map from a flat task array, sorted by `order` then `createdAt` |
| `buildColumnId(queue)`                       | Builds a `column::<queue>` container ID                                                      |
| `buildGroupId(queue, priority)`              | Builds a `group::<queue>::<priority>` container ID                                           |
| `buildItemId(taskId)`                        | Builds an `item::<taskId>` item ID                                                           |
| `parseContainerId(id)`                       | Parses any container ID into a typed object (`ParsedColumn`, `ParsedGroup`, or `ParsedItem`) |
| `findContainer(map, taskId)`                 | Finds which container a task ID belongs to                                                   |
| `getColumnContainers(map, queue)`            | Returns all containers for a given queue, sorted by priority order                           |
| `getOrCreateContainer(map, queue, priority)` | Finds or creates the correct container for a queue/priority combo                            |
| `sortTasks(tasks)`                           | Sorts by `order` ascending (null last), then `createdAt` descending for null-order tasks     |

#### SortableTaskCard

**File:** `src/components/tasks/SortableTaskCard.tsx`

A thin wrapper that connects `TaskCard` to dnd-kit's `useSortable` hook. It builds the sortable item ID via `buildItemId(task.id)`, applies CSS transforms during drag, and passes `isDragging`, `dragHandleListeners`, and `dragHandleAttributes` down to `TaskCard`.

#### SortableGroup

**File:** `src/components/tasks/SortableGroup.tsx`

Wraps a priority group's content with `useDroppable` (makes the group a valid drop target) and `SortableContext` with `verticalListSortingStrategy`. When a task is being dragged over the group, applies `bg-surface-hover/50` for visual feedback.

### Week View

**File:** `src/components/views/WeekView.tsx`

A column grid layout showing the days of a navigable week, with a collapsible weekend section.

1. Local state tracks `weekOffset` (initialized to 0). `getWeekDays(dayjs().add(weekOffset, 'week'))` returns 7 dayjs objects starting from Monday of the target ISO week.
2. The weekdays (Mon--Fri) are always shown in 5 columns. The weekend (Sat--Sun) is hidden behind a collapsible separator by default.
3. Each column (`WeekDayColumn` component) filters tasks where `task.dueDate === toISODate(day)` and renders them as `TaskCard` components.
4. Today's column header is highlighted with `text-accent` styling.
5. An `UnscheduledSection` appears above the columns, showing tasks where `dueDate` is null. This section is collapsible (starts collapsed) and hides entirely when empty.
6. Navigation: prev/next week buttons (ghost `Button` with caret icons) and a "Today" button (outline, only shown when `weekOffset !== 0`) to return to the current week. The week range label (e.g., "Feb 9 -- Feb 15") is displayed between the navigation buttons.
7. The weekend separator is a clickable vertical divider that toggles `isWeekendExpanded`. When collapsed, it shows a vertical "Weekend" label and a badge with the weekend task count (if > 0). When expanded, the separator shows a collapse caret and the two weekend day columns appear.

### Completed View

**File:** `src/components/views/CompletedView.tsx`

A searchable, paginated flat list of all completed tasks. Unlike the Work and Week views, the Completed view does not receive the shared `tasks` array from `HomePage`. Instead, it fetches its own data using `useLazyListCompletedTasksQuery` and manages the task list in local state.

**Props:**

| Prop       | Type                                           | Description                                                         |
| ---------- | ---------------------------------------------- | ------------------------------------------------------------------- |
| `userId`   | `string`                                       | Current user's ID (passed for data fetching)                        |
| `onUpdate` | `(id: string, updates: Partial<Task>) => void` | Callback for task updates (routes to `handleUpdate` in `HomePage`)  |
| `onDelete` | `(id: string) => void`                         | Callback for task deletion (routes to `handleDelete` in `HomePage`) |
| `onEdit`   | `(task: Task) => void`                         | Opens the Edit Task Modal                                           |

**Data fetching:** On mount, the component triggers `listCompletedTasks({ userId })` to load the first page of completed tasks (100 items). The result is stored in local state (`tasks`, `hasMore`). An `isInitialLoad` flag shows a loading message until the first fetch completes.

**Pagination:** Cursor-based using `afterUpdatedAt`. When the user clicks "Load more", the component passes the `updatedAt` value of the last task in the current list as the cursor. New results are appended to the existing list. The "Load more" button is hidden when `hasMore` is false or when a search is active.

**Search:** A `TextInput` at the top provides client-side filtering on the already-fetched tasks. The filter is case-insensitive and matches against both `title` and `description`. Search is local only -- it does not trigger new Firestore queries. When a search query is active, the "Load more" button is hidden because pagination cursors would not align with filtered results.

**Optimistic removal:** Two interactions remove tasks from the local list immediately without waiting for a refetch:

1. **Uncompleting a task** (toggling `isDone` to `false`) -- calls `onUpdate` to persist the change and removes the task from the local `tasks` array via `setTasks(prev => prev.filter(...))`. The task reappears in the Work/Week views after the RTK Query cache is invalidated.
2. **Deleting a task** -- calls `onDelete` to persist the deletion and removes the task from the local `tasks` array the same way.

**Layout:** No drag-and-drop, no columns, no priority grouping. Tasks render as a flat vertical list of `TaskCard` components (static mode, no drag handles). An empty state shows a `MagnifyingGlassIcon` with contextual text ("No completed tasks yet" vs. "No tasks match your search").

## Shared Components

### TaskColumn

**File:** `src/components/tasks/TaskColumn.tsx`

A vertical column with a header (title + task count) and a scrollable list of task cards. Shows "No tasks" placeholder when the list is empty (both active and done). Accepts a `className` prop for per-instance styling (used by WeekView to highlight today).

**Dual-mode rendering:** TaskColumn operates in one of two modes, selected via a discriminated union prop type:

1. **Static mode** (`tasks` prop) -- Used by WeekView. Renders plain `TaskCard` components. When any task has a non-null `priority`, activates priority grouping via a local `groupByPriority()` helper. Tasks are grouped by `Priority` value, sorted by `PRIORITIES` index (P0 first, null last). Group labels are the full priority string (e.g., "P0 - Critical") or "No priority". When no tasks have a priority set, grouping is skipped and tasks render as a flat list.

2. **DnD mode** (`groups` + `queue` + `totalCount` props) -- Used by WorkView. The `groups` prop is an array of `TaskColumnGroup` objects, each containing a `containerId`, `label`, `tasks`, and `itemIds`. Each group is wrapped in a `SortableGroup` component (which provides `useDroppable` + `SortableContext`), and tasks are rendered as `SortableTaskCard` components. Empty groups show a "Drop here" dashed placeholder. The column itself is also a droppable target (via `useDroppable` on the column ID) to allow drops into empty columns.

**Done section:** Both modes accept an optional `doneTasks` prop (an array of completed `Task` objects). When provided and non-empty, a `DoneSection` component renders below the active task list. `DoneSection` displays a border divider (`border-t`), a collapsible "Done (N)" label with a caret toggle (`CaretRightIcon` that rotates 90 degrees when expanded), and plain `TaskCard` components (no drag handles). The done section **starts collapsed** by default -- users must click the header to reveal completed tasks. Done tasks retain their existing `isDone` styling (strikethrough, muted text) and include an edit button for opening the Edit Task Modal. See the [Work View Done Sublist](#done-sublist) section for the full data flow.

The `TaskColumnGroup` type is exported from this file:

| Field         | Type             | Description                                              |
| ------------- | ---------------- | -------------------------------------------------------- |
| `containerId` | `string`         | dnd-kit container ID (e.g., `group::day::P0 - Critical`) |
| `label`       | `string \| null` | Group header text, or `null` for ungrouped columns       |
| `tasks`       | `Task[]`         | Tasks in this group, in display order                    |
| `itemIds`     | `string[]`       | Item IDs (prefixed with `item::`) for `SortableContext`  |

### UnscheduledSection

**File:** `src/components/tasks/UnscheduledSection.tsx`

A collapsible section that renders tasks with no `dueDate`. Uses `CaretDownIcon` / `CaretRightIcon` for the toggle indicator. Starts collapsed by default. Returns `null` when there are no unscheduled tasks (does not render at all).

### ViewSwitcher

**File:** `src/components/views/ViewSwitcher.tsx`

A segmented control with three options (Work, Week, Completed). Uses the `SegmentedControl` component from `src/components/common/SegmentedControl.tsx`. Each option has an icon and a text label:

| Option    | Icon               | Description                      |
| --------- | ------------------ | -------------------------------- |
| Work      | `ListBulletsIcon`  | Kanban board with drag-and-drop  |
| Week      | `CalendarDotsIcon` | Calendar columns for the week    |
| Completed | `CheckCircleIcon`  | Searchable archive of done tasks |

Exports the `View` type (`'work' | 'week' | 'completed'`).

### TaskCard

**File:** `src/components/tasks/TaskCard.tsx`

An interactive card displaying a single task. Layout:

- **Far left (DnD mode only):** Drag handle (`DotsSixVerticalIcon`), visible on hover with `cursor-grab` / `cursor-grabbing` states. Only rendered when `dragHandleListeners` prop is provided.
- **Left:** Checkbox for toggling `isDone`
- **Center:** Task title (with strikethrough when done), optional description preview (truncated, one line), and optional metadata row showing category (`TagIcon` + label) and priority (`Pill` with short label like "P0"). The metadata row is separated by a top border and only rendered when category or priority is non-null.
- **Right (hover-only):** Edit button (`PencilSimpleIcon`) that calls `onEdit()` to open the Edit Task Modal

The edit button uses `opacity-0 group-hover:opacity-100` with `transition-smooth` for a fade-in effect, and is also visible on keyboard focus (`focus-visible:opacity-100`).

**Drag-and-drop props:** TaskCard accepts optional `isDragging`, `dragHandleListeners`, and `dragHandleAttributes` props. When `isDragging` is true, the card renders with `border-dashed opacity-50` as a placeholder. These props are passed through from `SortableTaskCard` in DnD contexts (Work view) and omitted in static contexts (Week view, Done sections).

## RTK Query Endpoints

Task endpoints are defined in `src/store/todosApi.ts` and profile endpoints are in `src/store/profileApi.ts`, both using `api.injectEndpoints()`. See [State Management](./state-management.md) for the overall RTK Query architecture.

### Task Endpoints

| Hook                                | Type       | Firestore Operation                                                                                                                                                              | Cache Tags                                                                                                         |
| ----------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `useListActiveTasksQuery(userId)`   | Query      | Two parallel queries: (1) `isDone == false` ordered by `createdAt desc`, (2) `isDone == true` AND `updatedAt >= oneMonthAgo` ordered by `updatedAt desc`. Results merged.        | Provides `Task:{id}` per result + `Task:ACTIVE_LIST`                                                               |
| `useListInactiveTasksQuery(userId)` | Query      | `getDocs` with `isDone == true` AND `updatedAt < oneMonthAgo`, ordered by `updatedAt desc`                                                                                       | Provides `Task:{id}` per result + `Task:INACTIVE_LIST`                                                             |
| `useLazyListCompletedTasksQuery`    | Lazy query | `getDocs` with `isDone == true`, ordered by `updatedAt desc`, limit-based pagination (100 per page). Uses `startAfter(afterUpdatedAt)` for cursor. Returns `{ tasks, hasMore }`. | Provides `Task:{id}` per result + `Task:COMPLETED_LIST`                                                            |
| `useCreateTaskMutation`             | Mutation   | `setDoc` to `users/{userId}/tasks/{taskId}`                                                                                                                                      | Invalidates `Task:ACTIVE_LIST`                                                                                     |
| `useUpdateTaskMutation`             | Mutation   | `updateDoc` on `users/{userId}/tasks/{id}`                                                                                                                                       | Invalidates `Task:{id}`; also invalidates `ACTIVE_LIST`, `INACTIVE_LIST`, and `COMPLETED_LIST` if `isDone` changed |
| `useDeleteTaskMutation`             | Mutation   | `deleteDoc` on `users/{userId}/tasks/{id}`                                                                                                                                       | Invalidates `Task:{id}`, `Task:ACTIVE_LIST`, `Task:INACTIVE_LIST`, `Task:COMPLETED_LIST`                           |
| `useBatchUpdateTasksMutation`       | Mutation   | `writeBatch` updating multiple `users/{userId}/tasks/{id}` docs                                                                                                                  | Optimistic cache update on `listActiveTasks`; no tag invalidation (relies on optimistic update)                    |

The Firestore collection path is `users/{userId}/tasks`. Helper functions `tasksCollection(userId)` and `taskDoc(userId, taskId)` build the collection/document references.

**`listCompletedTasks` details:** Used exclusively by the Completed view. Accepts `{ userId, afterUpdatedAt? }`. Queries Firestore for all `isDone: true` tasks ordered by `updatedAt desc` with a limit of 101 (page size + 1). If 101 results come back, `hasMore` is `true` and the extra result is trimmed. For subsequent pages, `startAfter(afterUpdatedAt)` is used as a cursor. The `useLazyListCompletedTasksQuery` hook (lazy variant) is used so the query only fires when the Completed tab is active, not on initial page load. Cache tag `Task:COMPLETED_LIST` is invalidated when `updateTask` changes `isDone` or when `deleteTask` runs, ensuring the Completed view stays in sync after mutations.

**`batchUpdateTasks` details:** Used exclusively by the Work view drag-and-drop system. Accepts `{ userId, updates }` where `updates` is an array of `{ id, queue?, priority?, order? }` patches. Uses Firestore `writeBatch` to atomically update all affected tasks in a single round-trip. The mutation implements **optimistic updates** via `onQueryStarted`: it immediately patches the `listActiveTasks` cache with the new values and rolls back (`patchResult.undo`) if the batch write fails. This is defined in a second `injectEndpoints()` call in `todosApi.ts` so it can reference the first injection's `listActiveTasks` endpoint for the cache update.

### Profile Endpoints

| Hook                         | Type     | Firestore Operation                                             | Cache Tags                     |
| ---------------------------- | -------- | --------------------------------------------------------------- | ------------------------------ |
| `useGetProfileQuery(userId)` | Query    | `getDoc` on `users/{userId}`, auto-creates default if not found | Provides `Profile:{userId}`    |
| `useUpdateProfileMutation`   | Mutation | `updateDoc` on `users/{userId}` with timestamp auto-update      | Invalidates `Profile:{userId}` |

See [User Profiles](./user-profiles.md) for full details on how profiles power autocomplete suggestions.

## Date Utilities

The Week view and other components depend on helpers exported from `src/lib/dayjs.ts`:

- **`getWeekDays(date)`** -- Returns 7 dayjs objects (Mon-Sun) for the ISO week containing `date`. Uses the `isoWeek` plugin.
- **`getMonthGrid(year, month)`** -- Returns 42 `{ date, isCurrentMonth }` objects for a 6-row calendar grid. The grid starts from the Monday of the week containing the 1st of the given month. Used by the `DateInput` component's calendar popup.
- **`isToday(date)`** -- Returns `true` if the given date matches today (day-level comparison).
- **`toISODate(date)`** -- Formats any date input to `YYYY-MM-DD` string, used to match tasks to calendar cells.

## Dependencies

The SmartInput and drag-and-drop features introduce these dependencies:

| Package                         | Purpose                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| `@tiptap/core`                  | Tiptap editor framework core                                                           |
| `@tiptap/react`                 | React bindings (`useEditor`, `EditorContent`)                                          |
| `@tiptap/pm`                    | ProseMirror types and utilities (`Plugin`, `PluginKey`, `Decoration`, `DecorationSet`) |
| `@tiptap/extension-document`    | Document node extension                                                                |
| `@tiptap/extension-paragraph`   | Paragraph node extension                                                               |
| `@tiptap/extension-text`        | Text node extension                                                                    |
| `@tiptap/extension-placeholder` | Placeholder text support                                                               |
| `@tiptap/suggestion`            | Suggestion/autocomplete plugin framework                                               |
| `chrono-node`                   | Natural language date parsing                                                          |
| `@dnd-kit/core`                 | Core drag-and-drop framework (DndContext, sensors, collision detection, DragOverlay)   |
| `@dnd-kit/sortable`             | Sortable preset (useSortable, SortableContext, verticalListSortingStrategy)            |
| `@dnd-kit/utilities`            | CSS transform utilities for sortable items                                             |
| `react-hook-form`               | Form state management for the Edit Task Modal                                          |
| `@hookform/resolvers`           | Zod resolver adapter for react-hook-form validation                                    |
| `zod`                           | Schema validation for Edit Task Modal form data                                        |

## CSS

The Tiptap placeholder requires a CSS rule in `src/styles/index.css` (inside `@layer base`):

```css
.tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: var(--color-text-tertiary);
  pointer-events: none;
  height: 0;
}
```

The SmartInput component also applies inline styles via Tiptap's `editorProps.attributes.class` and Tailwind utility classes on the `EditorContent` wrapper, including `focus-within:ring-2` for focus indication.

## Edge Cases and Important Notes

- **The Work and Week views show active tasks.** `useListActiveTasksQuery` returns all incomplete tasks plus recently completed tasks (done within the last month). This means completed tasks remain visible in these views for up to a month after completion, giving users time to undo or review recent work. The **Completed view** shows all completed tasks (regardless of age) via `listCompletedTasks`, which queries all `isDone: true` tasks with cursor-based pagination.
- **The "one month" threshold is computed at query time.** `dayjs().subtract(1, 'month').valueOf()` is evaluated when the query runs, not stored on the task. This means the boundary shifts forward over time -- a task completed 29 days ago is active today but may become inactive tomorrow.
- **Composite Firestore indexes are required.** The active/inactive queries filter on `isDone` and sort/filter on `updatedAt` or `createdAt`, which requires composite indexes. These are defined in `firestore.indexes.json`: `isDone + updatedAt` (descending) and `isDone + createdAt` (descending).
- **Done tasks are excluded from drag-and-drop.** In the Work view, `buildContainerMap()` and `computeColumnGroups()` both filter out `isDone: true` tasks, so they never participate in the DnD system. Done tasks appear in a collapsible "Done" section at the bottom of each column (collapsed by default) and can interact via the checkbox (to uncheck) or the edit button (to open the Edit Task Modal).
- **Drag-and-drop is Work view only.** The Week view uses the static (non-DnD) `TaskColumn` mode. Only the Work view wraps columns in a `DndContext`.
- **Drag activation requires 5px of movement.** The `PointerSensor` has a `distance: 5` activation constraint. This prevents accidental drags when clicking buttons (checkbox, edit) inside the card.
- **Dense integer ordering.** On every drop, all tasks in affected containers receive fresh dense integer `order` values (0, 1, 2, ...). Tasks that have never been reordered have `order: null`, which sorts after all ordered tasks (falling back to `createdAt` descending).
- **Optimistic batch updates.** The `batchUpdateTasks` mutation patches the RTK Query cache immediately on drag end, so the UI never flickers. If the Firestore write fails, the cache is rolled back automatically.
- **Cross-container drops to grouped columns.** When dragging a task into a column that uses priority groups, the task lands in the group matching its current priority. If dropped on the column itself (not a specific group), it lands in the "No priority" group.
- **Priority groups are created dynamically.** If a task is dragged into a column where its priority group does not yet exist, the group is created on-the-fly in the container map.
- **Week view has navigation.** `weekOffset` state (default 0) shifts the displayed week forward or backward. A "Today" button resets to the current week. The weekend columns are collapsible and hidden by default.
- **Unscheduled tasks** in the Week view are tasks where `dueDate` is `null`. This is different from the Work view's "Backlog" column, which filters on `queue === null`.
- **Completed view manages its own task list.** Unlike Work/Week (which share the `listActiveTasks` data from `HomePage`), the Completed view calls `useLazyListCompletedTasksQuery` and stores results in local component state. This means uncompleting or deleting a task requires optimistic removal from the local list (`setTasks(prev => prev.filter(...))`) in addition to dispatching the mutation via the parent callbacks.
- **Completed view search is client-side only.** The search filters the already-fetched tasks in memory. If the user has loaded 100 tasks and searches for a term that only matches task #200, they will not find it until they paginate further. The "Load more" button is hidden during search to avoid cursor misalignment.
- **Category filter is hidden on the Completed tab.** The Completed view has its own search input, so the category filter `SegmentedControl` next to the `ViewSwitcher` is conditionally hidden when `activeView === 'completed'`.
- **Edit modal only sends changed fields.** The `EditTaskModal` diffs form values against the original task and only includes fields that actually changed in the `Partial<Task>` update. If the user opens the modal and clicks "Save" without changing anything, no mutation is dispatched.
- **Edit modal delete requires confirmation.** Clicking "Delete" in the modal does not immediately delete the task. The footer switches to a confirmation state with "Cancel" and "Confirm Delete" buttons. This two-step flow prevents accidental deletions.
- **Edit modal category autocomplete uses `TextSuggestion`.** Unlike the SmartInput's Tiptap-based suggestion system, the edit modal uses the `TextSuggestion` component (a plain text input with a dropdown) for category autocomplete. The suggestions come from the same `profile.categories` data.
- **Token title stripping.** `getCleanTitle()` removes all detected tokens (priority, category, date text) from the raw editor text before using it as the task title. The stored `title` field never contains token syntax.
- **Chrono-node uses `forwardDate: true`**, so "Friday" always means the upcoming Friday, not a past one.
- **Detection toggle via Escape.** Pressing Escape in the SmartInput toggles detection off: all highlights are removed, parsed fields are cleared to empty, and the raw text is used as-is for the title on submit. Detection re-enables when the editor is cleared (e.g., after submission).
- **Suggestion dropdowns are portal-based.** `renderSuggestion` appends a positioned `<div>` to `document.body` and renders the dropdown via `createRoot`. This avoids overflow clipping from the form container.
- **Suggestions are profile-only.** The autocomplete dropdown shows only categories from the user's profile -- there are no hardcoded defaults. A new user with an empty profile will see no suggestions until they create tasks with categories. See [User Profiles](./user-profiles.md) for the suggestion data flow.
- **Profile is auto-updated on task creation and editing.** When a user creates or edits a task with a new category, `HomePage` automatically appends it to the profile for future autocomplete suggestions. This happens after the task is written to Firestore.
- **Click outside collapses and resets.** Clicking outside the form container collapses the expanded panel and resets all form fields. Unlike a blur-based approach, this is triggered by a mousedown listener on the document.
- **Manual fields override parsed fields.** If the user types `@work` in the SmartInput AND also types "personal" in the Category text input, the manual value ("personal") wins.
- **Queue auto-derives from due date.** When a due date is set (parsed or manual), the queue field is automatically set: today's date maps to 'day', a date in the current ISO week maps to 'week', otherwise null. The user can override this via the Queue select.
- **The old `TaskInput` component** has been removed from the codebase. It was fully replaced by `TaskCreationForm` + `SmartInput`.
- **`user!.uid` assertion** in HomePage is safe because the page is wrapped in `ProtectedRoute`, which guarantees an authenticated user.

## Related Documentation

- [User Profiles](./user-profiles.md) -- Profile data model, how autocomplete suggestions are personalized, profile auto-update flow
- [State Management](./state-management.md) -- RTK Query architecture, endpoint injection pattern, Firestore integration
- [Routing](./routing.md) -- Route table, `ProtectedRoute` wrapping `/home`
- [Firebase Auth](./firebase-auth.md) -- `AuthProvider`, `useAuth()` hook
- [Design System](./design-system.md) -- `Button`, `TextArea`, `TextSuggestion`, `Select`, `DateInput`, `Modal` components used by task UI
