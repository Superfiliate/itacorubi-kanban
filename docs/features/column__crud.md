# Feature: Columns

## Overview

Columns represent workflow stages within a board (e.g., "To do", "Doing", "Done"). Tasks live inside columns and can be moved between them.

## User Flows

### Add Column

- Click the `+` icon after the last column
- New column created at the end with "{emoji} New column" title

### Rename Column

- Click on column name
- Edit inline
- Auto-saves after 1 second or on Enter/blur

### Reorder Columns

- Drag column header horizontally
- Drop to new position
- Optimistic UI updates for smooth animation

### Collapse Column

- Click the minimize icon (`Minimize2`) on the right side of column header
- Collapsed view shows:
  - Rotated title (vertical text)
  - Task count badge
  - Narrow width

### Expand Column

- Click the maximize icon (`Maximize2`) on collapsed column header
- Returns to full width with all tasks visible

### Delete Column

- Only available when column has 0 tasks
- Click trash icon (`Trash2`) left of task count
- Confirmation dialog appears (per ADR 007 destructive pattern)
- If the column has tasks, deletion is blocked and an error toast explains why

## Notes

- Columns cannot be deleted if they contain tasks — move or delete tasks first
- New boards start with 4 default columns: "📥 To do", "🔄 Doing", "✅ Done", and "📦 Archive" (collapsed by default)
