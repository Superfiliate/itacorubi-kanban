"use server"

import { db } from "@/db"
import { comments, tasks, uploadedFiles } from "@/db/schema"
import { eq, and, lt, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireBoardAccess } from "@/lib/secure-board"
import { deleteFile } from "@/lib/storage"

export async function createComment(
  taskId: string,
  boardId: string,
  authorId: string,
  content: string,
  id?: string,
  createdAt?: Date,
  stakeholderId?: string | null
) {
  await requireBoardAccess(boardId)

  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) })
  if (!task || task.boardId !== boardId) {
    throw new Error("Task not found")
  }

  // Validate stakeholder if provided
  if (stakeholderId) {
    const { contributors } = await import("@/db/schema")
    const stakeholder = await db.query.contributors.findFirst({
      where: eq(contributors.id, stakeholderId)
    })
    if (!stakeholder || stakeholder.boardId !== boardId) {
      throw new Error("Stakeholder not found or does not belong to board")
    }
  }

  const commentId = id ?? crypto.randomUUID()

  await db.insert(comments).values({
    id: commentId,
    taskId,
    boardId,
    authorId,
    content,
    stakeholderId: stakeholderId ?? null,
    ...(createdAt ? { createdAt } : null),
  })

  // Move task to position 0 (top of column)
  if (task.position > 0) {
    // Shift all tasks that are above this task (lower position) down by 1
    await db.update(tasks)
      .set({ position: sql`${tasks.position} + 1` })
      .where(and(
        eq(tasks.columnId, task.columnId),
        lt(tasks.position, task.position)
      ))

    // Move this task to position 0
    await db.update(tasks)
      .set({ position: 0 })
      .where(eq(tasks.id, taskId))
  }

  revalidatePath(`/boards/${boardId}`)
  return commentId
}

export async function updateComment(
  commentId: string,
  authorId: string,
  content: string,
  boardId: string,
  stakeholderId?: string | null
) {
  await requireBoardAccess(boardId)

  const existing = await db.query.comments.findFirst({ where: eq(comments.id, commentId) })
  if (!existing || existing.boardId !== boardId) {
    throw new Error("Comment not found")
  }

  // Validate stakeholder if provided
  if (stakeholderId) {
    const { contributors } = await import("@/db/schema")
    const stakeholder = await db.query.contributors.findFirst({
      where: eq(contributors.id, stakeholderId)
    })
    if (!stakeholder || stakeholder.boardId !== boardId) {
      throw new Error("Stakeholder not found or does not belong to board")
    }
  }

  await db.update(comments)
    .set({
      authorId,
      content,
      stakeholderId: stakeholderId ?? null,
    })
    .where(eq(comments.id, commentId))

  revalidatePath(`/boards/${boardId}`)
}

export async function deleteComment(commentId: string, boardId: string) {
  await requireBoardAccess(boardId)
  const existing = await db.query.comments.findFirst({ where: eq(comments.id, commentId) })
  if (!existing || existing.boardId !== boardId) {
    throw new Error("Comment not found")
  }

  // Get all files associated with this comment
  const files = await db.query.uploadedFiles.findMany({
    where: eq(uploadedFiles.commentId, commentId),
  })

  // Delete files from storage
  for (const file of files) {
    try {
      await deleteFile(file.url)
    } catch (error) {
      // Log but don't fail - file might already be deleted
      console.error(`Failed to delete file ${file.url}:`, error)
    }
  }

  // Delete file records from database
  if (files.length > 0) {
    await db.delete(uploadedFiles).where(eq(uploadedFiles.commentId, commentId))
  }

  // Delete the comment
  await db.delete(comments).where(eq(comments.id, commentId))
  revalidatePath(`/boards/${boardId}`)
}
