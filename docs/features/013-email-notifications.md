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

| Event            | Recipients                                   | Details                  |
| ---------------- | -------------------------------------------- | ------------------------ |
| New comment      | Assignees + Stakeholders (except author)     | Includes comment preview |
| @Mention         | Mentioned contributor (except author)        | Includes comment preview |
| Task moved       | Assignees + Stakeholders                     | From/to column names     |
| Assignee added   | The new assignee only                        | —                        |
| Priority changed | Assignees + Stakeholders                     | New priority level       |

**Note:** @Mentioned contributors receive notifications regardless of whether they are assignees or stakeholders. This allows notifying anyone on the board, even if they're not directly involved with the task.

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

### View Email History

All board members can view the history of notification emails sent for their board:

1. Open the board
2. Click the mail icon (📧) in the board header
3. Browse the list of sent emails
4. Click any email to view its full rendered content

## Technical Notes

### Email Provider: Resend

- Uses [Resend](https://resend.com) for email delivery
- React email templates for consistent rendering
- Emails are sent via Resend whenever `RESEND_API_KEY` is present (any environment)

### Environment Variables

| Variable         | Required         | Description                                             |
| ---------------- | ---------------- | ------------------------------------------------------- |
| `RESEND_API_KEY` | No               | Resend API key — if present, emails are sent via Resend |
| `CRON_SECRET`    | Yes (production) | Secret to authorize cron endpoint                       |

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

## Email History

### Overview

The email history feature allows board members to view all notification emails that have been sent for their board. This is useful for:

- Verifying notifications were sent correctly
- Debugging notification issues
- Reviewing what updates were communicated

### Access Control

Email history is protected by board authentication:

- Users must have unlocked the board (entered the password)
- Each board's email history is separate and isolated
- Users can see all emails for the board, not just their own

### User Interface

Access email history via the mail icon in the board header:

- **Email list** — Shows all sent emails with recipient, subject, and timestamp
- **Email detail** — Click any email to view its full rendered HTML content
- **Process notifications** — Manually trigger notification processing (useful for testing)

### How It Works

Emails are **always** saved to the `sent_emails` table regardless of environment:

| RESEND_API_KEY | Behavior                     |
| -------------- | ---------------------------- |
| Present        | Save to DB + Send via Resend |
| Not present    | Save to DB only              |

This ensures:

- Consistent behavior across environments
- Debugging production issues by checking stored emails
- Full E2E testing without external email services
- Flexibility to test Resend integration in development if desired

### API Endpoints

Board-scoped email API (requires board authentication):

| Method | Endpoint                            | Description                        |
| ------ | ----------------------------------- | ---------------------------------- |
| GET    | `/api/boards/[boardId]/emails`      | List emails for this board         |
| POST   | `/api/boards/[boardId]/emails`      | Process pending notifications      |
| GET    | `/api/boards/[boardId]/emails/[id]` | Get single email with HTML content |

### Playwright Testing

Email notifications can be tested with Playwright:

```typescript
// Extract boardId from URL after creating board
const boardId = page.url().match(/\/boards\/([^/]+)/)?.[1];

// Perform actions that trigger notifications...

// Process notifications
await page.request.post(`/api/boards/${boardId}/emails`);

// Verify emails were captured
const response = await page.request.get(`/api/boards/${boardId}/emails`);
const { emails } = await response.json();
expect(emails.length).toBeGreaterThan(0);

// Check email content
const emailResponse = await page.request.get(`/api/boards/${boardId}/emails/${emails[0].id}`);
const { email } = await emailResponse.json();
expect(email.htmlContent).toContain("expected content");
```

## Files

- `src/db/schema.ts` — pendingNotifications + sentEmails table definitions
- `src/lib/notifications.ts` — Queue helper functions
- `src/lib/process-board-notifications.ts` — Shared processing logic for board notifications
- `src/emails/task-digest.tsx` — Email template component
- `src/app/api/cron/send-notifications/route.ts` — Cron handler (processes all boards)
- `src/app/api/boards/[boardId]/emails/route.ts` — Board email API (list, process)
- `src/app/api/boards/[boardId]/emails/[id]/route.ts` — Board email detail API
- `src/app/boards/[boardId]/emails/page.tsx` — Email history UI
- `src/app/boards/[boardId]/emails/[id]/page.tsx` — Single email viewer
- `src/components/board/contributors-dialog.tsx` — Email input UI
- `src/components/board/board-header.tsx` — Email history link
- `vercel.json` — Cron configuration
- `playwright/email-notifications.spec.ts` — E2E tests
