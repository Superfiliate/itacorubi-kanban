# Feature: Homepage

## Overview

The landing page where users can create new boards and access the application.

## User Flows

### Create a New Board

- User visits homepage (`/`)
- Clicks "Create New Board" button
- New board created with default columns: "📥 To do", "🔄 Doing", "✅ Done"
- Board title defaults to "{emoji} New board" with a random emoji prefix
- User automatically redirected to new board (`/boards/{uuid}`)
