# Feature: Kanban Board

## Overview

A collaborative Kanban board application where users can create and manage multiple boards, each with customizable columns and tasks.

## User Flows

### Board Management

1. **Create a Board**
   - User visits homepage (`/`)
   - Clicks "Create New Board"
   - Automatically redirected to new board (`/boards/{uuid}`)
   - Board created with default columns: "To do", "Doing", "Done"
   - Board title defaults to "New board" (click to edit)

2. **Access a Board**
   - Anyone with the board UUID can access it
   - No authentication required - URL is the "password"
   - Direct link format: `/boards/{uuid}`

### Column Management

1. **Add Column**
   - Click the `+` icon after the last column
   - New column created at the end with placeholder name "New column"

2. **Rename Column**
   - Click on column name
   - Edit inline
   - Auto-saves after 1 second or on Enter/blur

3. **Reorder Columns**
   - Drag column header horizontally
   - Drop to new position

4. **Collapse/Expand Column**
   - Click the chevron icon next to column name
   - Collapsed: shows vertical title, task count
   - Expanded: shows all tasks

5. **Delete Column**
   - Only visible when column has 0 tasks
   - Click trash icon
   - Immediate deletion (no confirmation)

### Task Management

1. **Create Task**
   - Click "Add task" button at top of column
   - Task created with title "New task"
   - Sidebar automatically opens for editing

2. **View/Edit Task**
   - Click on task card
   - Opens sidebar with task details
   - URL updates to `/boards/{boardId}/tasks/{taskId}`
   - Editable fields:
     - Title (click to edit, auto-save)
     - Status (dropdown to move between columns)
     - Assignees (multi-select with create)

3. **Move Task**
   - Drag task card between columns
   - Or use Status dropdown in sidebar

4. **Delete Task**
   - Open task sidebar
   - Click "Delete Task" button
   - Confirmation required

### Contributor/Assignee Management

1. **Assign Existing Contributor**
   - Open task sidebar
   - Click assignees dropdown
   - Select from existing contributors
   - Checkbox toggles assignment

2. **Create and Assign New Contributor**
   - Open task sidebar
   - Click assignees dropdown
   - Type new name
   - Press Enter or click "Create" option
   - Contributor created and assigned

3. **Remove Assignee**
   - Click X on assignee badge in sidebar
   - Or uncheck in dropdown

## Data Model

- **Board**: UUID, title, timestamps
- **Column**: UUID, board reference, name, position, collapsed state
- **Task**: UUID, board reference, column reference, title, position, timestamps
- **Contributor**: UUID, board reference, name
- **TaskAssignee**: Many-to-many between tasks and contributors

## Technical Notes

- All data persists to SQLite (local) / Turso (production)
- Server Components for initial data loading
- Server Actions for all mutations
- Real-time updates via `revalidatePath`
- Drag-and-drop powered by `@dnd-kit`
- UI components from shadcn/ui
