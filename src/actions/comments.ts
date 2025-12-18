"use server"

import { db } from "@/db"
import { comments, tasks, uploadedFiles } from "@/db/schema"
import { eq, and, lt, sql, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireBoardAccess } from "@/lib/secure-board"
import { deleteFile } from "@/lib/storage"

/**
 * Extract all file URLs from Tiptap JSON content.
 * Walks the content tree and collects:
 * - `src` from `image` nodes
 * - `url` from `fileAttachment` nodes
 */
function extractFileUrlsFromContent(content: string): string[] {
  try {
    const json = JSON.parse(content)
    const urls: string[] = []

    function walkNodes(nodes: unknown[] | undefined) {
      if (!nodes || !Array.isArray(nodes)) return

      for (const node of nodes) {
        if (typeof node !== "object" || node === null) continue

        const n = node as { type?: string; attrs?: Record<string, unknown>; content?: unknown[] }

        // Image nodes have src attribute
        if (n.type === "image" && n.attrs?.src && typeof n.attrs.src === "string") {
          urls.push(n.attrs.src)
        }

        // FileAttachment nodes have url attribute
        if (n.type === "fileAttachment" && n.attrs?.url && typeof n.attrs.url === "string") {
          urls.push(n.attrs.url)
        }

        // Recursively walk child nodes
        if (n.content) {
          walkNodes(n.content)
        }
      }
    }

    walkNodes(json.content)
    return urls
  } catch {
    // If content is not valid JSON, return empty array
    return []
  }
}

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

  // Clean up orphaned files (files in DB but not in the new content)
  const filesInDb = await db.query.uploadedFiles.findMany({
    where: eq(uploadedFiles.commentId, commentId),
  })

  if (filesInDb.length > 0) {
    const urlsInContent = new Set(extractFileUrlsFromContent(content))
    const orphanedFiles = filesInDb.filter((file) => !urlsInContent.has(file.url))

    // Delete orphaned files from storage and database
    for (const file of orphanedFiles) {
      try {
        await deleteFile(file.url)
      } catch (error) {
        // Log but don't fail - file might already be deleted
        console.error(`Failed to delete orphaned file ${file.url}:`, error)
      }
    }

    if (orphanedFiles.length > 0) {
      await db.delete(uploadedFiles).where(
        inArray(
          uploadedFiles.id,
          orphanedFiles.map((f) => f.id)
        )
      )
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
