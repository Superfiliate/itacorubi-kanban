# Feature: Comments

## Overview

Comments allow team members to discuss tasks and track progress. Each comment has an author (a contributor), optional stakeholder (also a contributor), and rich-text content. Comments are displayed chronologically in the task sidebar.

## Rich-Text Formatting

Comments support rich-text formatting via a WYSIWYG editor powered by Tiptap. The toolbar provides the following formatting options:

### Text Formatting

- **Bold** (Ctrl+B)
- _Italic_ (Ctrl+I)
- ~~Strikethrough~~
- `Inline code`

### Structure

- Heading 1 (H1)
- Heading 2 (H2)
- Heading 3 (H3)
- Bullet lists
- Numbered lists
- Blockquotes
- Code blocks (multi-line)
- Horizontal rule

### Other

- Undo/Redo (Ctrl+Z / Ctrl+Shift+Z)

### Video Embeds

Pasting a video URL from supported platforms automatically transforms the link into an embedded player:

- **Loom**: `https://www.loom.com/share/{videoId}` or `https://loom.com/share/{videoId}`
- **YouTube**: `https://www.youtube.com/watch?v={videoId}`, `https://youtu.be/{videoId}`, or `https://youtube.com/embed/{videoId}`

Embed features:

- Responsive 16:9 aspect ratio player
- Hover actions: Open in new tab, Delete (edit mode only)
- Stored as custom nodes in Tiptap JSON content

### Technical Details

- Content is stored as JSON (Tiptap's native format) in the database
- The same editor component is used for creating, editing, and displaying comments
- Display mode renders content as read-only without the toolbar

## User Flows

### View Comments

- Open task sidebar (click on task card)
- Left panel (70%) shows comments section
- Comments are displayed earliest-to-latest from top to bottom
- Empty state shown when no comments exist

### Add Comment

- Open task sidebar
- Scroll to bottom of comments section
- Select yourself from the author dropdown (or create a new contributor)
- Optionally select a stakeholder from the stakeholder dropdown (or create a new contributor)
- Write your comment in the rich-text editor (use toolbar for formatting)
- Click "Add Comment" button
- Your author selection is remembered per board (via localStorage)
- Task automatically moves to top of its column

### Edit Comment

- Hover over a comment to reveal the "..." menu
- Click "Edit" option
- Modify the author, stakeholder (optional), and/or content
- Click "Save" to apply changes

### Delete Comment

- Hover over a comment to reveal the "..." menu
- Click "Delete" option
- Confirm deletion in the dialog
- Comment is permanently removed

### Author Memory

- When you select an author to post a comment, that choice is saved
- Stored in localStorage as `kanban-author-${boardId}`
- Next time you add a comment on the same board, your author is pre-selected
- Different boards can have different remembered authors

## Task Card Indicators

Each task card displays:

- Comment icon with count
- Time since last comment ("X days ago")

### Color Coding

The comment age indicator uses color to show urgency:

- **Green (emerald)**: Recent comments (0-5 days)
- **Yellow**: Comments aging (5-10 days)
- **Amber/Orange**: Comments getting stale (10-20 days)
- **Red**: No recent activity (20+ days)

## Sidebar Layout

The task sidebar is divided into two columns:

### Left Column (70%)

- Comments list (scrollable)
- Empty state when no comments
- Add comment form at the bottom

### Right Column (30%)

- Task title (editable)
- Status/column selector
- Assignees selector
- Stakeholders selector
- Created at date picker
- Delete task button

## Notes

- Comments are ordered by creation date (earliest first)
- Deleting a comment requires confirmation
- Anyone can edit or delete any comment (collaborative editing)
- Adding a comment moves the task to the top of its column
- The task "created at" date can be manually edited via date picker

## Ordering Contract

- Task sidebar: oldest → newest to preserve conversation flow
- Task cards: newest comment timestamp drives the age badge; keep comment lists newest-first in card caches
- Optimistic updates must preserve these orders (append for sidebar data, prepend or sort desc for card data) to avoid stale age indicators
