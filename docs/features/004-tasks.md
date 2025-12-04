# Feature: Tasks

## Overview

Tasks are the individual work items that live within columns. Each task can have a title, multiple assignees, a creation date, and comments.

## User Flows

### Create Task

- Click "Add task" button at top of column
- Task created with "{emoji} New task" title
- Sidebar automatically opens for editing
- URL updates to `/boards/{boardId}?task={taskId}`
- Created at date is set automatically

### View Task

- Click on task card in the board
- Sidebar opens with task details
- URL updates to `/boards/{boardId}?task={taskId}`
- **Desktop**: 70/30 split layout (comments left, details right), each panel scrolls independently
- **Mobile**: Full-width sidebar, stacked vertically (details first, then comments), scrolls as one unit

### Edit Task

- Open task sidebar (click on task card)
- Editable fields (right panel):
  - **Title**: Click to edit, auto-saves after 1 second or on Enter/blur
  - **Status**: Dropdown to move between columns
  - **Assignees**: Multi-select with ability to create new contributors
  - **Created at**: Date picker to view/change creation date

### Move Task (Drag & Drop)

- Drag task card from one column to another
- Can drop into empty columns
- Optimistic UI updates for smooth animation

### Move Task (Sidebar)

- Open task sidebar
- Use Status dropdown to select target column
- Task moves immediately

### Delete Task

- Open task sidebar
- Click trash icon (`Trash2`) in bottom right corner (subtle)
- Confirmation dialog appears
- Confirm to delete

## Notes

- Tasks can be dropped into collapsed columns
- Task position within a column is determined by drop location
- Task cards show comment count and days since last comment
- Comment age indicator uses color coding (green → yellow → red)
- Adding a comment moves the task to the top of its column
- See `006-comments.md` for full comment documentation
