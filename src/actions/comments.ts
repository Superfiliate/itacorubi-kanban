"use server";

import { db } from "@/db";
import { comments, tasks, uploadedFiles } from "@/db/schema";
import { eq, and, lt, sql, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireBoardAccess } from "@/lib/secure-board";
import { deleteFilesWithTolerance } from "@/lib/storage";
import {
  queueCommentNotification,
  queueMentionNotifications,
  extractMentionIds,
} from "@/lib/notifications";
import { requireTask, requireComment, requireContributor } from "@/lib/require-resource";

/**
 * Extract all file URLs from Tiptap JSON content.
 * Walks the content tree and collects:
 * - `src` from `image` nodes
 * - `url` from `fileAttachment` nodes
 */
function extractFileUrlsFromContent(content: string): string[] {
  try {
    const json = JSON.parse(content);
    const urls: string[] = [];

    function walkNodes(nodes: unknown[] | undefined) {
      if (!nodes || !Array.isArray(nodes)) return;

      for (const node of nodes) {
        if (typeof node !== "object" || node === null) continue;

        const n = node as { type?: string; attrs?: Record<string, unknown>; content?: unknown[] };

        // Image nodes have src attribute
        if (n.type === "image" && n.attrs?.src && typeof n.attrs.src === "string") {
          urls.push(n.attrs.src);
        }

        // FileAttachment nodes have url attribute
        if (n.type === "fileAttachment" && n.attrs?.url && typeof n.attrs.url === "string") {
          urls.push(n.attrs.url);
        }

        // Recursively walk child nodes
        if (n.content) {
          walkNodes(n.content);
        }
      }
    }

    walkNodes(json.content);
    return urls;
  } catch {
    // If content is not valid JSON, return empty array
    return [];
  }
}

export async function createComment(
  taskId: string,
  boardId: string,
  authorId: string,
  content: string,
  id: string,
  createdAt?: Date,
  stakeholderId?: string | null,
) {
  await requireBoardAccess(boardId);

  const task = await requireTask(taskId, boardId);

  // Validate author belongs to this board
  await requireContributor(authorId, boardId);

  // Validate stakeholder if provided
  if (stakeholderId) {
    await requireContributor(stakeholderId, boardId);
  }

  await db.insert(comments).values({
    id,
    taskId,
    boardId,
    authorId,
    content,
    stakeholderId: stakeholderId ?? null,
    ...(createdAt ? { createdAt } : null),
  });

  // Move task to position 0 (top of column)
  if (task.position > 0) {
    // Shift all tasks that are above this task (lower position) down by 1
    await db
      .update(tasks)
      .set({ position: sql`${tasks.position} + 1` })
      .where(and(eq(tasks.columnId, task.columnId), lt(tasks.position, task.position)));

    // Move this task to position 0
    await db.update(tasks).set({ position: 0 }).where(eq(tasks.id, taskId));
  }

  // Queue notification for assignees and stakeholders (except the comment author)
  await queueCommentNotification({
    boardId,
    taskId,
    authorId,
    commentContent: content,
  });

  // Queue mention notifications for @mentioned contributors
  const mentionedIds = extractMentionIds(content);
  if (mentionedIds.length > 0) {
    await queueMentionNotifications({
      boardId,
      taskId,
      mentionedIds,
      authorId,
      commentContent: content,
    });
  }

  revalidatePath(`/boards/${boardId}`);
  return id;
}

export async function updateComment(
  commentId: string,
  authorId: string,
  content: string,
  boardId: string,
  stakeholderId?: string | null,
) {
  await requireBoardAccess(boardId);
  const existingComment = await requireComment(commentId, boardId);

  // Validate author belongs to this board
  await requireContributor(authorId, boardId);

  // Validate stakeholder if provided
  if (stakeholderId) {
    await requireContributor(stakeholderId, boardId);
  }

  // Clean up orphaned files (files in DB but not in the new content)
  const filesInDb = await db.query.uploadedFiles.findMany({
    where: eq(uploadedFiles.commentId, commentId),
  });

  if (filesInDb.length > 0) {
    const urlsInContent = new Set(extractFileUrlsFromContent(content));
    const orphanedFiles = filesInDb.filter((file) => !urlsInContent.has(file.url));

    // Delete orphaned files from storage (tolerates individual failures)
    if (orphanedFiles.length > 0) {
      await deleteFilesWithTolerance(orphanedFiles);
      await db.delete(uploadedFiles).where(
        inArray(
          uploadedFiles.id,
          orphanedFiles.map((f) => f.id),
        ),
      );
    }
  }

  // Track new mentions before updating
  const oldMentionIds = new Set(extractMentionIds(existingComment.content));
  const newMentionIds = extractMentionIds(content);
  const addedMentionIds = newMentionIds.filter((id) => !oldMentionIds.has(id));

  await db
    .update(comments)
    .set({
      authorId,
      content,
      stakeholderId: stakeholderId ?? null,
    })
    .where(eq(comments.id, commentId));

  // Queue mention notifications only for newly added mentions
  if (addedMentionIds.length > 0) {
    await queueMentionNotifications({
      boardId,
      taskId: existingComment.taskId,
      mentionedIds: addedMentionIds,
      authorId,
      commentContent: content,
    });
  }

  revalidatePath(`/boards/${boardId}`);
}

export async function deleteComment(commentId: string, boardId: string) {
  await requireBoardAccess(boardId);
  await requireComment(commentId, boardId);

  // Get all files associated with this comment
  const files = await db.query.uploadedFiles.findMany({
    where: eq(uploadedFiles.commentId, commentId),
  });

  // Delete files from storage (tolerates individual failures) and database
  if (files.length > 0) {
    await deleteFilesWithTolerance(files);
    await db.delete(uploadedFiles).where(eq(uploadedFiles.commentId, commentId));
  }

  // Delete the comment
  await db.delete(comments).where(eq(comments.id, commentId));
  revalidatePath(`/boards/${boardId}`);
}
