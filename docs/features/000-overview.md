# Kanban Board — Overview

## Description

A collaborative Kanban board application where users can create and manage multiple boards, each with customizable columns and tasks.

## Data Model

- **Board**: UUID, title, timestamps
- **Column**: UUID, board reference, name, position, collapsed state
- **Task**: UUID, board reference, column reference, title, position, timestamps
- **Contributor**: UUID, board reference, name, color
- **TaskAssignee**: Many-to-many between tasks and contributors
- **Comment**: UUID, task reference, board reference, author (contributor), content, timestamps

## Visual Design

### Random Emojis

New boards, columns, and tasks are prefixed with a random emoji from a curated list of ~35 cool emojis (🚀, ⚡, 🎯, 💡, 🔥, etc.)

### Contributor Color Palette

17 colors available: rose, pink, fuchsia, purple, violet, indigo, blue, sky, cyan, teal, emerald, green, lime, yellow, amber, orange, red

### Contributor Management

Contributors are managed via a modal accessible from the board header (Users icon). Features:
- View all contributors with usage stats (tasks assigned, comments made)
- Add new contributors (also possible inline when assigning tasks)
- Edit contributor name and color
- Delete contributors (only if they have no tasks or comments)
- Expandable stats showing task breakdown per column

### Icons

Using Lucide React icons throughout:

- `Minimize2` / `Maximize2` for column collapse/expand
- `Plus` for add actions
- `Trash2` for delete actions

### Theme Support

Light, dark, and system-based themes. Toggle via dropdown in the board header.

### Glassmorphism Styling

The app uses a light glassmorphism aesthetic (soft blur, translucent surfaces, subtle borders/shadows) with a supportive gradient mesh background. See `docs/features/008-glassmorphism.md` for guidance.

### Mobile Responsiveness

The app is fully responsive and usable on mobile devices:
- Board view works on narrow screens
- Task sidebar stacks vertically on mobile (details first, then comments)
- See `docs/adrs/006-mobile-responsiveness.md` for patterns

### User Feedback

- **Toast notifications** (via Sonner) for action confirmations (create, delete)
- **Confirmation dialogs** for destructive actions (delete task, column, comment)
- **Empty states** with helpful prompts when boards have no columns
- See `docs/adrs/007-user-feedback-patterns.md` for patterns

## Technical Notes

- All data persists to SQLite (local) / Turso (production)
- Server Components for initial data loading
- Server Actions for all mutations
- Real-time updates via `revalidatePath`
- Optimistic updates with local state for drag-and-drop
- Drag-and-drop powered by `@dnd-kit` with `rectIntersection` collision detection
- UI components from shadcn/ui
- Theme switching via `next-themes`
- Security headers configured in `next.config.ts` (see `docs/adrs/008-security-headers.md`)
