# Feature: Tasks

## Overview

Tasks are the individual work items that live within columns. Each task can have a title and multiple assignees.

## User Flows

### Create Task

- Click "Add task" button at top of column
- Task created with "{emoji} New task" title
- Sidebar automatically opens for editing
- URL updates to `/boards/{boardId}/tasks/{taskId}`

### View Task

- Click on task card in the board
- Sidebar opens with task details
- URL updates to `/boards/{boardId}/tasks/{taskId}`

### Edit Task

- Open task sidebar (click on task card)
- Editable fields:
  - **Title**: Click to edit, auto-saves after 1 second or on Enter/blur
  - **Status**: Dropdown to move between columns
  - **Assignees**: Multi-select with ability to create new contributors

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
