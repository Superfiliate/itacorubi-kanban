# ADR 017: Polling Strategy

Use **adaptive polling with exponential backoff** to sync board data from the server, balancing real-time feel for active users against Vercel free-tier function invocation limits.

- No WebSockets needed for our low-traffic collaborative use case
- Active users get responsive 1-3s updates; idle users back off to 10 minutes
- Hidden/unfocused tabs immediately jump to ≥60s to minimize background requests

## Backoff Behavior

| User State                                | Polling Interval                              |
| ----------------------------------------- | --------------------------------------------- |
| Active + visible (within 60s of activity) | 1-3s                                          |
| Visible but idle                          | Gradual backoff: 5s → 10s → 30s → ... → 10min |
| Hidden or unfocused tab                   | Immediately ≥60s, then backoff                |
| Tab becomes visible/focused               | Reset to 1s                                   |

## Current Backoff Steps

```
1s, 1s, 2s, 2s, 3s, 3s, 5s, 10s, 30s, 60s, 120s, 300s, 600s
```

The repeated early steps (1s, 1s, 2s, 2s, 3s, 3s) ensure active users stay at fast polling for a longer period before experiencing any slowdown.

## Activity Detection

Activity is tracked via:

- `pointerdown`, `keydown`, `scroll` events
- Local mutations (outbox enqueues update `lastLocalActivityAt`)
- Window `focus` and `visibilitychange` events

## Reconciliation Rules

Remote snapshots are **only applied when the local store is clean** (outbox empty, no flush in progress). This prevents overwriting local edits that haven't synced yet.

## Future Considerations

- **Server-Sent Events (SSE)**: If we need true real-time updates without user-initiated polling, SSE would be lighter than WebSockets and work well with Vercel serverless.
- **ETag/If-None-Match**: Could reduce bandwidth by returning 304 when board hasn't changed, though function invocations still count.
- **Per-board activity tracking**: Currently all boards share the same activity state; multi-board scenarios could benefit from independent tracking.
- **Vercel limits monitoring**: Keep an eye on function invocations as user count grows; may need to increase backoff or implement smarter strategies.
