# Feature: @Mentions

## Overview

Contributors can be @mentioned in comments to directly notify them about specific discussions. Mentioned contributors receive email notifications regardless of whether they are assigned to or stakeholders on the task.

## How It Works

### Mentioning Someone

1. While writing a comment, type `@` followed by the contributor's name
2. A dropdown appears showing matching contributors
3. Select a contributor from the dropdown (keyboard or click)
4. The mention is inserted as a styled badge in the comment

### Mention Suggestions

The dropdown shows:

- Contributor name with their color badge
- "No email" indicator (crossed-out mail icon) for contributors without email configured

The "no email" indicator helps users understand that the mentioned person won't receive a notification, preventing repeated attempts to notify someone who can't receive emails.

### Notifications

When a comment with @mentions is posted:

- Each mentioned contributor receives a notification
- Notifications are batched with other updates in the digest email
- The email shows "X mentioned you: {preview}"
- Contributors without email configured are silently skipped

**Important:** Mention notifications are sent even if the contributor is not an assignee or stakeholder on the task.

### Editing Comments

When a comment is edited and new @mentions are added:

- Only the newly added mentions trigger notifications
- Re-mentioning someone already in the original comment doesn't send duplicate notifications

## User Flows

### Mention a Contributor

1. Open task sidebar
2. Start writing a comment
3. Type `@` and start typing a name
4. Select from the dropdown (arrow keys + Enter, or click)
5. Continue writing and submit the comment

### Understanding the "No Email" Indicator

When you see the crossed-out mail icon next to a contributor in the mention dropdown:

- That contributor has not configured an email address
- They will NOT receive a notification if you mention them
- Consider asking them to add their email in the Contributors dialog

## Data Model

### Storage

Mentions are stored in the comment content as Tiptap JSON nodes:

```json
{
  "type": "mention",
  "attrs": {
    "id": "contributor-uuid",
    "label": "John Doe"
  }
}
```

- `id`: The contributor's UUID (used for notifications and lookups)
- `label`: The name at the time of mention (fallback if contributor is deleted)

### Dynamic Name Updates

When a contributor's name is edited:

- All existing mentions automatically display the updated name
- The stored `label` is only used as a fallback if the contributor is deleted
- This follows the same pattern as author/stakeholder badges

## Styling

Mentions are displayed as inline badges:

- Primary color background with contrasting text
- Prefixed with `@` symbol
- Inline with surrounding text

## Technical Notes

### Implementation

- Uses `@tiptap/extension-mention` for the editor integration
- Custom suggestion UI using Radix primitives for consistency
- Mention IDs are extracted server-side for notification queuing

### Files

- `src/components/ui/tiptap-extensions/mention-extension.tsx` — Mention extension configuration
- `src/components/ui/tiptap-extensions/mention-list.tsx` — Suggestion dropdown UI
- `src/components/ui/rich-text-editor.tsx` — Editor integration
- `src/lib/notifications.ts` — `extractMentionIds` and `queueMentionNotifications`
- `src/actions/comments.ts` — Queue mention notifications on create/update
- `src/styles/tiptap.css` — Mention badge styling
