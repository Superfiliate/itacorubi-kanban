# Feature: Boards

## Overview

Boards are the top-level container for organizing work. Each board has its own columns, tasks, and contributors. Boards are password-protected and encrypted — a password is required to access board content.

## User Flows

### Create a Board

- Click "Create a Board" button on homepage
- Password dialog appears with suggested password
- User can use suggested password or enter custom password
- Password is required — cannot be empty
- Board is created and user is redirected to the board

### Access a Board

- Direct link format: `/boards/{uuid}`
- If password cookie is not set, redirects to `/boards/{uuid}/unlock`
- Password entry page prompts for password
- On correct password, cookie is set and user is redirected to board
- On incorrect password, error message is shown

### Unlock a Board

- Navigate to `/boards/{uuid}/unlock`
- Enter board password
- Password is verified by decrypting verification string
- On success: cookie is set, redirect to board
- On failure: error message displayed

### Share a Board

- Click "Share" button in board header (next to Contributors)
- Share dialog shows two sections:

**Share with Password:**
- Board URL (copy button)
- Password field (hidden by default, eye icon to reveal, copy button)
- Password fetched from HTTP-only cookie via API

**Public Link:**
- URL format: `/boards/{uuid}/public/{password}`
- Clicking this link sets password cookie and redirects to board
- Warning: "Anyone with this link can access the board"

### Rename a Board

- Click on board title in the header
- Edit inline
- Auto-saves after 1 second or on Enter/blur
- Title is encrypted before saving
