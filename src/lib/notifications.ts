import { db } from "@/db";
import {
  pendingNotifications,
  taskAssignees,
  taskStakeholders,
  type NotificationType,
} from "@/db/schema";
import { eq } from "drizzle-orm";

export type NotificationMetadata = {
  fromColumn?: string;
  toColumn?: string;
  priority?: string;
  commentPreview?: string;
};

/**
 * Get all recipient IDs for a task (assignees + stakeholders)
 */
export async function getTaskRecipients(taskId: string): Promise<string[]> {
  const [assignees, stakeholders] = await Promise.all([
    db.query.taskAssignees.findMany({
      where: eq(taskAssignees.taskId, taskId),
    }),
    db.query.taskStakeholders.findMany({
      where: eq(taskStakeholders.taskId, taskId),
    }),
  ]);

  // Use Set to deduplicate (someone might be both assignee and stakeholder)
  const recipientIds = new Set<string>();
  for (const a of assignees) {
    recipientIds.add(a.contributorId);
  }
  for (const s of stakeholders) {
    recipientIds.add(s.contributorId);
  }

  return Array.from(recipientIds);
}

/**
 * Queue notifications for multiple recipients.
 * Automatically filters out the triggeredBy person (don't notify yourself).
 */
export async function queueNotifications(params: {
  boardId: string;
  taskId: string;
  recipientIds: string[];
  type: NotificationType;
  triggeredById?: string;
  metadata?: NotificationMetadata;
}): Promise<void> {
  const { boardId, taskId, recipientIds, type, triggeredById, metadata } = params;

  // Filter out the person who triggered the notification
  const filteredRecipients = recipientIds.filter((id) => id !== triggeredById);

  if (filteredRecipients.length === 0) {
    return;
  }

  const notifications = filteredRecipients.map((recipientId) => ({
    id: crypto.randomUUID(),
    boardId,
    taskId,
    recipientId,
    type,
    triggeredById: triggeredById ?? null,
    metadata: metadata ? JSON.stringify(metadata) : null,
  }));

  await db.insert(pendingNotifications).values(notifications);
}

/**
 * Queue a notification when a new comment is added.
 * Optionally exclude certain user IDs (e.g., mentioned users who get their own notification).
 */
export async function queueCommentNotification(params: {
  boardId: string;
  taskId: string;
  authorId: string;
  commentContent: string;
  excludeIds?: string[];
}): Promise<void> {
  const { boardId, taskId, authorId, commentContent, excludeIds = [] } = params;

  let recipientIds = await getTaskRecipients(taskId);

  // Exclude mentioned users (they get a more specific "mention" notification)
  if (excludeIds.length > 0) {
    const excludeSet = new Set(excludeIds);
    recipientIds = recipientIds.filter((id) => !excludeSet.has(id));
  }

  const commentPreview = extractCommentPreview(commentContent);

  await queueNotifications({
    boardId,
    taskId,
    recipientIds,
    type: "comment",
    triggeredById: authorId,
    metadata: { commentPreview },
  });
}

/**
 * Queue a notification when a task is moved to a different column.
 */
export async function queueMoveNotification(params: {
  boardId: string;
  taskId: string;
  fromColumnName: string;
  toColumnName: string;
  movedById?: string;
}): Promise<void> {
  const { boardId, taskId, fromColumnName, toColumnName, movedById } = params;

  const recipientIds = await getTaskRecipients(taskId);

  await queueNotifications({
    boardId,
    taskId,
    recipientIds,
    type: "move",
    triggeredById: movedById,
    metadata: { fromColumn: fromColumnName, toColumn: toColumnName },
  });
}

/**
 * Queue a notification when someone is assigned to a task.
 */
export async function queueAssignNotification(params: {
  boardId: string;
  taskId: string;
  assigneeId: string;
  assignedById?: string;
}): Promise<void> {
  const { boardId, taskId, assigneeId, assignedById } = params;

  // Only notify the new assignee
  await queueNotifications({
    boardId,
    taskId,
    recipientIds: [assigneeId],
    type: "assign",
    triggeredById: assignedById,
  });
}

/**
 * Queue a notification when task priority changes.
 */
export async function queuePriorityNotification(params: {
  boardId: string;
  taskId: string;
  priority: string;
  changedById?: string;
}): Promise<void> {
  const { boardId, taskId, priority, changedById } = params;

  const recipientIds = await getTaskRecipients(taskId);

  await queueNotifications({
    boardId,
    taskId,
    recipientIds,
    type: "priority",
    triggeredById: changedById,
    metadata: { priority },
  });
}

/**
 * Extract all mention IDs from Tiptap JSON content.
 * Walks the content tree and collects IDs from mention nodes.
 */
export function extractMentionIds(content: string): string[] {
  try {
    const parsed = JSON.parse(content);
    const mentionIds: string[] = [];

    function walkNodes(nodes: unknown[] | undefined) {
      if (!nodes || !Array.isArray(nodes)) return;

      for (const node of nodes) {
        if (typeof node !== "object" || node === null) continue;

        const n = node as { type?: string; attrs?: { id?: string }; content?: unknown[] };

        // Mention nodes have type "mention" and attrs.id
        if (n.type === "mention" && n.attrs?.id) {
          mentionIds.push(n.attrs.id);
        }

        // Recursively walk child nodes
        if (n.content) {
          walkNodes(n.content);
        }
      }
    }

    walkNodes(parsed.content);
    return mentionIds;
  } catch {
    // If content is not valid JSON, return empty array
    return [];
  }
}

/**
 * Extract comment preview text from Tiptap JSON content.
 * Skips mention node labels to avoid duplication.
 */
function extractCommentPreview(content: string, maxLength = 100): string {
  try {
    const parsed = JSON.parse(content);

    function extractText(nodes: unknown[]): string {
      let text = "";
      for (const node of nodes) {
        if (typeof node !== "object" || node === null) continue;
        const n = node as {
          type?: string;
          text?: string;
          attrs?: { label?: string };
          content?: unknown[];
        };

        // For mention nodes, include "@name" format
        if (n.type === "mention" && n.attrs?.label) {
          text += `@${n.attrs.label}`;
          continue;
        }

        if (n.text) {
          text += n.text;
        }
        if (n.content && Array.isArray(n.content)) {
          text += extractText(n.content);
        }
      }
      return text;
    }

    if (parsed.content) {
      return extractText(parsed.content).slice(0, maxLength);
    }
    return "";
  } catch {
    return content.slice(0, maxLength);
  }
}

/**
 * Queue notifications for @mentioned contributors.
 * Mentioned contributors receive notifications regardless of assignee/stakeholder status.
 */
export async function queueMentionNotifications(params: {
  boardId: string;
  taskId: string;
  mentionedIds: string[];
  authorId: string;
  commentContent: string;
}): Promise<void> {
  const { boardId, taskId, mentionedIds, authorId, commentContent } = params;

  // Deduplicate mention IDs (in case same person is mentioned multiple times)
  const uniqueMentionIds = [...new Set(mentionedIds)];

  if (uniqueMentionIds.length === 0) {
    return;
  }

  const commentPreview = extractCommentPreview(commentContent);

  await queueNotifications({
    boardId,
    taskId,
    recipientIds: uniqueMentionIds,
    type: "mention",
    triggeredById: authorId,
    metadata: { commentPreview },
  });
}
