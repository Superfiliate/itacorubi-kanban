# Feature: Comments

## Overview

Comments allow team members to discuss tasks and track progress. Each comment has an author (a contributor) and content. Comments are displayed chronologically in the task sidebar.

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
- Write your comment in the textarea
- Click "Add Comment" button
- Your author selection is remembered per board (via localStorage)
- Task automatically moves to top of its column

### Edit Comment

- Hover over a comment to reveal the "..." menu
- Click "Edit" option
- Modify the author and/or content
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
- Created at date picker
- Delete task button

## Notes

- Comments are ordered by creation date (earliest first)
- Deleting a comment requires confirmation
- Anyone can edit or delete any comment (collaborative editing)
- Adding a comment moves the task to the top of its column
- The task "created at" date can be manually edited via date picker
