# Spec 002: Kanban Board Implementation

## Overview

Implementation of the core Kanban board functionality with multiple boards, customizable columns, tasks, and contributors.

## Completed Features

### Database Schema

Created tables with Drizzle ORM:
- `boards` - UUID primary key, title, timestamps
- `columns` - UUID, board reference, name, position, collapsed state
- `tasks` - UUID, board and column references, title, position, timestamps
- `contributors` - UUID, board reference, name, **color** (from predefined palette)
- `task_assignees` - Junction table for task-contributor many-to-many

**Contributor Colors**: 17 predefined colors exported as `CONTRIBUTOR_COLORS` constant in schema.

### Server Actions (`src/actions/`)

- **boards.ts**: createBoard (with random emoji prefix), getBoards, getBoard, updateBoardTitle
- **columns.ts**: createColumn (with random emoji prefix), updateColumnName, toggleColumnCollapsed, deleteColumn, reorderColumns
- **tasks.ts**: createTask (with random emoji prefix), getTask, updateTaskTitle, updateTaskColumn, deleteTask
- **contributors.ts**: createContributor (with random color), getContributors, addAssignee, removeAssignee, createAndAssignContributor

### Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `page.tsx` | Homepage with create button + board list |
| `/boards/[boardId]` | `page.tsx` + layout | Board view with columns |
| `/boards/[boardId]/tasks/[taskId]` | `@sidebar/tasks/[taskId]/page.tsx` | Task detail sidebar (parallel route) |

### Components

**Board Components** (`src/components/board/`):
- `board-header.tsx` - Editable board title with back navigation
- `board-client.tsx` - DnD context with optimistic state management
- `column.tsx` - Column with collapse, rename, delete, task list (using Lucide icons)
- `task-card.tsx` - Draggable task preview with colored assignee badges
- `add-column-button.tsx` - Creates new column at end

**Task Sidebar** (`src/components/task-sidebar/`):
- `task-sidebar.tsx` - Sheet with task editing form and subtle delete button
- `status-select.tsx` - Column/status dropdown
- `assignees-select.tsx` - Multi-select with create contributor and colored badges

**Shared**:
- `editable-text.tsx` - Click-to-edit with auto-save
- `contributor-badge.tsx` - Colored badge component for contributors

**Utilities** (`src/lib/`):
- `emojis.ts` - Random emoji picker from curated list of ~35 emojis

### UI Libraries

- **shadcn/ui** components: button, input, sheet, select, command, popover, badge, dialog
- **@dnd-kit**: core, sortable, utilities for drag-and-drop
- **lucide-react**: Icons (Minimize2, Maximize2, Plus, Trash2, etc.)

## Technical Decisions

1. **Parallel Routes for Sidebar**: Used Next.js parallel routes (`@sidebar`) to keep board visible while viewing task details. URL reflects current state.

2. **Server Actions with revalidatePath**: All mutations use server actions with `revalidatePath` for immediate UI updates without full page refresh.

3. **Optimistic UI for Drag-and-Drop**:
   - Local state management with `useState` synced via `useEffect`
   - `arrayMove` for immediate visual feedback
   - Server update happens after optimistic UI update
   - Uses `rectIntersection` collision detection for better empty column support

4. **UUID Generation**: Using `crypto.randomUUID()` for all entity IDs, stored as TEXT in SQLite.

5. **Auto-save Pattern**: EditableText component debounces changes (1s delay) and saves on blur/Enter.

6. **Random Emojis**: New entities get random emoji prefixes from a curated list in `src/lib/emojis.ts`.

7. **Contributor Colors**: Random color assignment from 17-color palette, displayed consistently across all badge instances.

8. **Cursor Pointer**: Added `cursor-pointer` to Button and CommandItem components for better UX.

## Files Created

```
src/
├── actions/
│   ├── boards.ts
│   ├── columns.ts
│   ├── contributors.ts
│   └── tasks.ts
├── app/
│   ├── page.tsx (updated)
│   └── boards/
│       └── [boardId]/
│           ├── layout.tsx
│           ├── page.tsx
│           └── @sidebar/
│               ├── default.tsx
│               └── tasks/[taskId]/page.tsx
├── components/
│   ├── editable-text.tsx
│   ├── contributor-badge.tsx
│   ├── board/
│   │   ├── add-column-button.tsx
│   │   ├── board-client.tsx
│   │   ├── board-header.tsx
│   │   ├── column.tsx
│   │   └── task-card.tsx
│   └── task-sidebar/
│       ├── assignees-select.tsx
│       ├── status-select.tsx
│       └── task-sidebar.tsx
├── db/
│   └── schema.ts (updated with colors)
└── lib/
    └── emojis.ts
```

## NPM Scripts

- `dev` - Run dev server on port 5800
- `kill` - Kill process on port 5800
- `db:reset` - Delete local.db and recreate from schema

## Status

✅ Complete - All planned features implemented and build passing.
