# Feature: User Feedback

## Overview

Ensure users understand the outcome of their actions (create, update, delete) with clear, timely feedback.

## Patterns

- Toasts: quick confirmations/errors; fire after sync completes. Optimistic UI updates first; toast confirms persistence.
- Confirmation dialogs: required for destructive/irreversible actions; disable buttons while submitting.
- Empty states: explain what to do next and offer a clear action.

## Examples

- Success toast: `toast.success("Task created")` after mutation settles
- Destructive dialog: destructive button, disabled while pending, message explains the irreversible action

## Links
- Toast host: `src/components/ui/sonner.tsx`
