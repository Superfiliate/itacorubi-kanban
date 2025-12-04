# Feature: Boards

## Overview

Boards are the top-level container for organizing work. Each board has its own columns, tasks, and contributors. Boards are accessed via a unique UUID — no authentication required.

## User Flows

### Access a Board

- Anyone with the board UUID can access it
- No authentication required — URL is the "password"
- Direct link format: `/boards/{uuid}`

### Rename a Board

- Click on board title in the header
- Edit inline
- Auto-saves after 1 second or on Enter/blur
