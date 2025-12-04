# Kanban Board — Overview

## Description

A collaborative Kanban board application where users can create and manage multiple boards, each with customizable columns and tasks.

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
