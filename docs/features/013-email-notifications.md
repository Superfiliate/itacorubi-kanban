# Feature: Email Notifications

## Overview

Email notifications keep contributors informed about task updates without requiring them to constantly check the board. Notifications are batched and sent as digest emails to avoid spamming users with frequent updates.

## How It Works

### Contributor Email (Optional)

Contributors can optionally add their email address to receive notifications:

- Open the Contributors dialog from the board header
- Click on "Add email for notifications" under any contributor
- Enter a valid email address
- Email is saved and the contributor will start receiving notifications

**No email = No notifications** — this is the opt-in mechanism.

### Notification Triggers

Notifications are queued when these events occur:

| Event | Recipients | Details |
|-------|------------|---------|
| New comment | Assignees + Stakeholders (except author) | Includes comment preview |
| Task moved | Assignees + Stakeholders | From/to column names |
| Assignee added | The new assignee only | — |
| Priority changed | Assignees + Stakeholders | New priority level |

### Batching

Notifications are **batched** to avoid email spam:

- A cron job runs every 5 minutes
- All pending notifications for a recipient are grouped
- A single **digest email** is sent per recipient
- Notifications are grouped by task within the email

### Digest Email Content

Each digest email includes:

- Recipient name and board title
- List of tasks with updates
- For each task: clickable title + list of changes
- Direct links to view tasks on the board
- Footer explaining how to unsubscribe (remove email)

## User Flows

### Enable Notifications

1. Open board → Click "Contributors" in header
2. Find your contributor entry
3. Click the email field (shows "Add email for notifications")
4. Enter your email address
5. Press Enter or click Save

### Disable Notifications

Remove your email address from the contributor profile:

1. Open board → Click "Contributors" in header
2. Find your contributor entry
3. Click on your email address
4. Clear the field and save

## Technical Notes

### Email Provider: Resend

- Uses [Resend](https://resend.com) for email delivery
- React email templates for consistent rendering
- Requires `RESEND_API_KEY` environment variable

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | Yes (production) | Resend API key for sending emails |
| `CRON_SECRET` | Yes (production) | Secret to authorize cron endpoint |
| `EMAIL_FROM` | No | From address (default: `notifications@resend.dev`) |

### Notification Queue

Notifications are stored in `pending_notifications` table:

- Queued immediately when events occur
- Processed by cron job every 5 minutes
- Deleted after successful delivery
- Notifications for recipients without email are automatically cleaned up

### Cron Job

The notification digest is processed by:

- Endpoint: `/api/cron/send-notifications`
- Schedule: Every 5 minutes (`*/5 * * * *`)
- Configured in `vercel.json`

## Development & Testing

### Email Viewer (Letter Opener Style)

In development and test environments, a "Letter Opener" style UI is available at `/dev/emails`:

- **View all sent emails** — List of all emails that would have been sent
- **Email preview** — Click any email to see its rendered HTML content
- **Process notifications** — Trigger the cron job manually without waiting
- **Clear all** — Remove all captured emails for testing

This is useful for:
- Developing and debugging email templates
- Manual testing of notification flows
- Verifying email content without actually sending

### How It Works

Emails are **always** saved to the `sent_emails` table regardless of environment:

| Environment | Behavior |
|------------|----------|
| Production | Save to DB + Send via Resend |
| Development | Save to DB only (view at `/dev/emails`) |
| Test | Save to DB only (accessible via API for Playwright) |

This ensures:
- Consistent behavior across environments
- Debugging production issues by checking stored emails
- Full E2E testing without external email services

### Playwright Testing

Email notifications can be tested with Playwright:

```typescript
// Clear emails before test
await page.request.delete("/api/dev/emails");

// ... perform actions that trigger notifications ...

// Process notifications
await page.request.post("/api/dev/emails");

// Verify emails were captured
const response = await page.request.get("/api/dev/emails");
const { emails } = await response.json();
expect(emails.length).toBeGreaterThan(0);

// Check email content
const emailResponse = await page.request.get(`/api/dev/emails/${emails[0].id}`);
const { email } = await emailResponse.json();
expect(email.htmlContent).toContain("expected content");
```

### API Endpoints (Dev/Test Only)

These endpoints are only available when `TURSO_DATABASE_URL` starts with `file:` (local SQLite):

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dev/emails` | List all sent emails |
| POST | `/api/dev/emails` | Trigger notification processing |
| DELETE | `/api/dev/emails` | Clear all sent emails |
| GET | `/api/dev/emails/[id]` | Get single email with full HTML content |

## Files

- `src/db/schema.ts` — pendingNotifications + sentEmails table definitions
- `src/lib/notifications.ts` — Queue helper functions
- `src/emails/task-digest.tsx` — Email template component
- `src/app/api/cron/send-notifications/route.ts` — Cron handler
- `src/app/api/dev/emails/route.ts` — Dev email API (list, clear, trigger)
- `src/app/api/dev/emails/[id]/route.ts` — Dev email detail API
- `src/app/dev/emails/page.tsx` — Email viewer UI
- `src/app/dev/emails/[id]/page.tsx` — Single email viewer
- `src/components/board/contributors-dialog.tsx` — Email input UI
- `vercel.json` — Cron configuration
- `playwright/email-notifications.spec.ts` — E2E tests
