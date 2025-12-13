# Feature: Homepage

## Overview

The landing page where users can create new boards and access recently visited boards.

## User Flows

### Create a New Board

- User visits homepage (`/`)
- Clicks "Create a Board" button
- New board created with default columns: "📥 To do", "🔄 Doing", "✅ Done", and "📦 Archive" (collapsed by default)
- Board title defaults to "{emoji} New board" with a random emoji prefix
- User automatically redirected to new board (`/boards/{uuid}`)

### Recent Boards

- When a user visits any board, it is saved to localStorage
- On the homepage, a "Recent Boards" section displays previously visited boards
- Boards are sorted by most recently visited
- Maximum of 20 boards stored
- If no boards have been visited, the section is hidden

## Technical Notes

- Recent boards are stored in localStorage under the key `itacorubi:visited-boards`
- Structure: `Array<{ id: string, title: string, visitedAt: string }>`
- The `TrackBoardVisit` client component handles saving on board load
- The `RecentBoards` client component reads and displays the list on homepage
- Hook: `useVisitedBoards()` in `src/lib/use-visited-boards.ts`
