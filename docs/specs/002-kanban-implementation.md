# Spec 002: Kanban Board Implementation

## Overview

Implementation of the core Kanban board functionality with multiple boards, customizable columns, tasks, and contributors.

## Completed Features

### Database Schema

Created tables with Drizzle ORM:
- `boards` - UUID primary key, title, timestamps
- `columns` - UUID, board reference, name, position, collapsed state
- `tasks` - UUID, board and column references, title, position, timestamps
- `contributors` - UUID, board reference, name
- `task_assignees` - Junction table for task-contributor many-to-many

### Server Actions (`src/actions/`)

- **boards.ts**: createBoard, getBoards, getBoard, updateBoardTitle
- **columns.ts**: createColumn, updateColumnName, toggleColumnCollapsed, deleteColumn, reorderColumns
- **tasks.ts**: createTask, getTask, updateTaskTitle, updateTaskColumn, deleteTask
- **contributors.ts**: createContributor, getContributors, addAssignee, removeAssignee, createAndAssignContributor

### Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `page.tsx` | Homepage with create button + board list |
| `/boards/[boardId]` | `page.tsx` + layout | Board view with columns |
| `/boards/[boardId]/tasks/[taskId]` | `@sidebar/tasks/[taskId]/page.tsx` | Task detail sidebar (parallel route) |

### Components

**Board Components** (`src/components/board/`):
- `board-header.tsx` - Editable board title with back navigation
- `board-client.tsx` - DnD context wrapper for columns and tasks
- `column.tsx` - Column with collapse, rename, delete, task list
- `task-card.tsx` - Draggable task preview with assignee badges
- `add-column-button.tsx` - Creates new column at end

**Task Sidebar** (`src/components/task-sidebar/`):
- `task-sidebar.tsx` - Sheet with task editing form
- `status-select.tsx` - Column/status dropdown
- `assignees-select.tsx` - Multi-select with create contributor

**Shared**:
- `editable-text.tsx` - Click-to-edit with auto-save

### UI Libraries

- **shadcn/ui** components: button, input, sheet, select, command, popover, badge, dialog
- **@dnd-kit**: core, sortable, utilities for drag-and-drop

## Technical Decisions

1. **Parallel Routes for Sidebar**: Used Next.js parallel routes (`@sidebar`) to keep board visible while viewing task details. URL reflects current state.

2. **Server Actions with revalidatePath**: All mutations use server actions with `revalidatePath` for immediate UI updates without full page refresh.

3. **Optimistic Position Updates**: Column and task positions managed with integer positions, reordering updates all affected positions in transaction.

4. **UUID Generation**: Using `crypto.randomUUID()` for all entity IDs, stored as TEXT in SQLite.

5. **Auto-save Pattern**: EditableText component debounces changes (1s delay) and saves on blur/Enter.

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
└── db/
    └── schema.ts (updated)
```

## Status

✅ Complete - All planned features implemented and build passing.
