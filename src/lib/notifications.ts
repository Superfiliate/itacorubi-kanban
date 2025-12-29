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
 */
export async function queueCommentNotification(params: {
  boardId: string;
  taskId: string;
  authorId: string;
  commentContent: string;
}): Promise<void> {
  const { boardId, taskId, authorId, commentContent } = params;

  const recipientIds = await getTaskRecipients(taskId);

  // Extract first 100 chars as preview
  let commentPreview = "";
  try {
    const parsed = JSON.parse(commentContent);
    // Extract text from Tiptap JSON content
    const extractText = (nodes: unknown[]): string => {
      let text = "";
      for (const node of nodes) {
        if (typeof node !== "object" || node === null) continue;
        const n = node as { type?: string; text?: string; content?: unknown[] };
        if (n.text) {
          text += n.text;
        }
        if (n.content && Array.isArray(n.content)) {
          text += extractText(n.content);
        }
      }
      return text;
    };
    if (parsed.content) {
      commentPreview = extractText(parsed.content).slice(0, 100);
    }
  } catch {
    // If not JSON, use as-is
    commentPreview = commentContent.slice(0, 100);
  }

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


