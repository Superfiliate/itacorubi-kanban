# Feature: Boards

## Overview

Boards are the top-level container for organizing work. Each board has its own columns, tasks, and contributors. Boards are password-protected — a password is required to access board content.

## User Flows

### Create a Board

- Click "Create a Board" button on homepage
- Dialog appears with title and password fields (both prefilled with suggestions)
- Password field has eye icon to toggle visibility
- User can use suggested values or enter custom title/password
- Both fields are required — cannot be empty
- Board is created and user is redirected to the board

### Access a Board

- Direct link format: `/boards/{uuid}`
- If password cookie is not set, redirects to `/boards/{uuid}/unlock`
- Password entry page prompts for password
- On correct password, cookie is set and user is redirected to board
- On incorrect password, error message is shown

### Unlock a Board

- Navigate to `/boards/{uuid}/unlock`
- Enter board password (eye icon to toggle visibility)
- Password can be prefilled via query parameter: `/boards/{uuid}/unlock?password={password}`
- Password is verified against the board’s stored password hash
- On success: cookie is set, redirect to board
- On failure: error message displayed
- User must click "Unlock Board" button to proceed (no auto-unlock)

### Share a Board

- Click "Share" button in board header (next to Contributors)
- Share dialog shows two sections:

**Share with Password:**
- Board URL (copy button)
- Password field (hidden by default, eye icon to reveal, copy button)
- Password fetched from HTTP-only cookie via API

**Public Link:**
- URL format: `/boards/{uuid}/unlock?password={password}`
- Clicking this link opens unlock page with password prefilled
- User must still click "Unlock Board" button to access the board
- Description: "Anyone with this link will have the password prefilled, but still needs to click unlock"

### Rename a Board

- Click on board title in the header
- Edit inline
- Auto-saves after 1 second or on Enter/blur
- Title is saved in plaintext
