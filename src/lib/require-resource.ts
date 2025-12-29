/**
 * Board resource validation helpers.
 *
 * These functions fetch a resource and verify it belongs to the specified board.
 * They throw an error if the resource is not found or doesn't belong to the board.
 *
 * Note: These do NOT check board access (password auth). The caller should call
 * requireBoardAccess() separately before using these helpers.
 */

import { db } from "@/db";
import { tasks, columns, contributors, comments, tags } from "@/db/schema";
import { eq } from "drizzle-orm";

export type Task = typeof tasks.$inferSelect;
export type Column = typeof columns.$inferSelect;
export type Contributor = typeof contributors.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Tag = typeof tags.$inferSelect;

/**
 * Require a task exists and belongs to the specified board.
 * Returns the task if valid, throws if not found or wrong board.
 */
export async function requireTask(taskId: string, boardId: string): Promise<Task> {
  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
  if (!task || task.boardId !== boardId) {
    throw new Error("Task not found");
  }
  return task;
}

/**
 * Require a column exists and belongs to the specified board.
 * Returns the column if valid, throws if not found or wrong board.
 */
export async function requireColumn(columnId: string, boardId: string): Promise<Column> {
  const column = await db.query.columns.findFirst({ where: eq(columns.id, columnId) });
  if (!column || column.boardId !== boardId) {
    throw new Error("Column not found");
  }
  return column;
}

/**
 * Require a contributor exists and belongs to the specified board.
 * Returns the contributor if valid, throws if not found or wrong board.
 */
export async function requireContributor(
  contributorId: string,
  boardId: string,
): Promise<Contributor> {
  const contributor = await db.query.contributors.findFirst({
    where: eq(contributors.id, contributorId),
  });
  if (!contributor || contributor.boardId !== boardId) {
    throw new Error("Contributor not found");
  }
  return contributor;
}

/**
 * Require a comment exists and belongs to the specified board.
 * Returns the comment if valid, throws if not found or wrong board.
 */
export async function requireComment(commentId: string, boardId: string): Promise<Comment> {
  const comment = await db.query.comments.findFirst({ where: eq(comments.id, commentId) });
  if (!comment || comment.boardId !== boardId) {
    throw new Error("Comment not found");
  }
  return comment;
}

/**
 * Require a tag exists and belongs to the specified board.
 * Returns the tag if valid, throws if not found or wrong board.
 */
export async function requireTag(tagId: string, boardId: string): Promise<Tag> {
  const tag = await db.query.tags.findFirst({ where: eq(tags.id, tagId) });
  if (!tag || tag.boardId !== boardId) {
    throw new Error("Tag not found");
  }
  return tag;
}
