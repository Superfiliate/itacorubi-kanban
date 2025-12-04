# Feature: Kanban Board

## Overview

A collaborative Kanban board application where users can create and manage multiple boards, each with customizable columns and tasks.

## User Flows

### Board Management

1. **Create a Board**
   - User visits homepage (`/`)
   - Clicks "Create New Board"
   - Automatically redirected to new board (`/boards/{uuid}`)
   - Board created with default columns: "📥 To do", "🔄 Doing", "✅ Done"
   - Board title defaults to "{emoji} New board" with a random emoji prefix

2. **Access a Board**
   - Anyone with the board UUID can access it
   - No authentication required - URL is the "password"
   - Direct link format: `/boards/{uuid}`

### Column Management

1. **Add Column**
   - Click the `+` icon after the last column
   - New column created at the end with "{emoji} New column"

2. **Rename Column**
   - Click on column name
   - Edit inline
   - Auto-saves after 1 second or on Enter/blur

3. **Reorder Columns**
   - Drag column header horizontally
   - Drop to new position
   - Optimistic UI updates for smooth animation

4. **Collapse/Expand Column**
   - Click the minimize/maximize icon on the right side of column header
   - Collapsed: shows rotated title with task count, narrow width
   - Expanded: shows all tasks with full width

5. **Delete Column**
   - Only visible when column has 0 tasks
   - Click trash icon (left of task count)
   - Immediate deletion (no confirmation)

### Task Management

1. **Create Task**
   - Click "Add task" button at top of column
   - Task created with "{emoji} New task"
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
   - Drag task card between columns (including empty columns)
   - Or use Status dropdown in sidebar
   - Optimistic UI updates for smooth animation

4. **Delete Task**
   - Open task sidebar
   - Click trash icon (bottom right corner, subtle)
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
   - Contributor created with random color and assigned

3. **Remove Assignee**
   - Click X on assignee badge in sidebar
   - Or uncheck in dropdown

4. **Contributor Colors**
   - Each contributor is assigned a random color from a predefined palette
   - Colors are consistent across all views (task cards, sidebar, dropdowns)
   - Helps visually identify and scan for tasks assigned to specific people

## Data Model

- **Board**: UUID, title, timestamps
- **Column**: UUID, board reference, name, position, collapsed state
- **Task**: UUID, board reference, column reference, title, position, timestamps
- **Contributor**: UUID, board reference, name, color
- **TaskAssignee**: Many-to-many between tasks and contributors

## Visual Design

### Random Emojis
New boards, columns, and tasks are prefixed with a random emoji from a curated list of ~35 cool emojis (🚀, ⚡, 🎯, 💡, 🔥, etc.)

### Contributor Color Palette
17 colors available: rose, pink, fuchsia, purple, violet, indigo, blue, sky, cyan, teal, emerald, green, lime, yellow, amber, orange, red

### Icons
Using Lucide React icons throughout:
- `Minimize2` / `Maximize2` for column collapse/expand
- `Plus` for add actions
- `Trash2` for delete actions

## Technical Notes

- All data persists to SQLite (local) / Turso (production)
- Server Components for initial data loading
- Server Actions for all mutations
- Real-time updates via `revalidatePath`
- Optimistic updates with local state for drag-and-drop
- Drag-and-drop powered by `@dnd-kit` with `rectIntersection` collision detection
- UI components from shadcn/ui
