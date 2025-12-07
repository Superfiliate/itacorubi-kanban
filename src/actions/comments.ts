"use server"

import { db } from "@/db"
import { comments, tasks } from "@/db/schema"
import { eq, and, lt, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { encryptForBoard } from "@/lib/secure-board"

export async function createComment(
  taskId: string,
  boardId: string,
  authorId: string,
  content: string
) {
  const id = crypto.randomUUID()
  const encryptedContent = await encryptForBoard(boardId, content)

  await db.insert(comments).values({
    id,
    taskId,
    boardId,
    authorId,
    content: encryptedContent,
  })

  // Move task to position 0 (top of column)
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
  })

  if (task && task.position > 0) {
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
  return id
}

export async function updateComment(
  commentId: string,
  authorId: string,
  content: string,
  boardId: string
) {
  const encryptedContent = await encryptForBoard(boardId, content)
  await db.update(comments)
    .set({ authorId, content: encryptedContent })
    .where(eq(comments.id, commentId))

  revalidatePath(`/boards/${boardId}`)
}

export async function deleteComment(commentId: string, boardId: string) {
  await db.delete(comments).where(eq(comments.id, commentId))
  revalidatePath(`/boards/${boardId}`)
}
