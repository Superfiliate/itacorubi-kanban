# ADR 007: User Feedback Patterns

Keep user feedback predictable across the app (toasts, confirmations, empty states).

- Toasts: fire on mutation settle; optimistic UI shows intent first
- Destructive actions: require confirmation and disabled state while pending
- Copy: short, action-oriented; make the next step obvious
- Empty states: explain what to do next and give one primary action

If we need a strict implementation pattern, prefer creating a reusable component over expanding this ADR.
