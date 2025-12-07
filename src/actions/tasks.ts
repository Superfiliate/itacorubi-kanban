"use server"

import { db } from "@/db"
import { tasks, taskAssignees, comments } from "@/db/schema"
import { eq, and, gt, gte, lt, lte, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { decryptRequired, decryptWithFallback, encryptForBoard, getBoardPasswordOptional } from "@/lib/secure-board"

export async function createTask(boardId: string, columnId: string, title: string) {
  // Get the max position for this column
  const maxPositionResult = await db
    .select({ maxPosition: sql<number>`COALESCE(MAX(${tasks.position}), -1)` })
    .from(tasks)
    .where(eq(tasks.columnId, columnId))

  const maxPosition = maxPositionResult[0]?.maxPosition ?? -1

  const id = crypto.randomUUID()
  const encryptedTitle = await encryptForBoard(boardId, title)

  await db.insert(tasks).values({
    id,
    boardId,
    columnId,
    title: encryptedTitle,
    position: maxPosition + 1,
  })

  revalidatePath(`/boards/${boardId}`)
  return id
}

export async function getTask(id: string) {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, id),
    with: {
      column: true,
      assignees: {
        with: {
          contributor: true,
        },
      },
      comments: {
        orderBy: (comments, { asc }) => [asc(comments.createdAt)],
        with: {
          author: true,
        },
      },
    },
  })

  if (!task) {
    return null
  }

  const password = await getBoardPasswordOptional(task.boardId)
  if (!password) {
    // Password not set
    return null
  }

  // Decrypt task title
  const decryptedTitle = await decryptRequired(task.title, password)
  if (!decryptedTitle) {
    return null
  }
  task.title = decryptedTitle

  // Decrypt comment content
  for (const comment of task.comments) {
    comment.content = await decryptWithFallback(comment.content, password)
  }

  // Decrypt contributor names
  for (const assignee of task.assignees) {
    assignee.contributor.name = await decryptWithFallback(assignee.contributor.name, password)
  }

  // Decrypt comment author names
  for (const comment of task.comments) {
    comment.author.name = await decryptWithFallback(comment.author.name, password)
  }

  return task
}

export async function updateTaskTitle(id: string, title: string, boardId: string) {
  const encryptedTitle = await encryptForBoard(boardId, title)
  await db.update(tasks).set({ title: encryptedTitle }).where(eq(tasks.id, id))
  revalidatePath(`/boards/${boardId}`)
}

export async function updateTaskCreatedAt(id: string, createdAt: Date, boardId: string) {
  await db.update(tasks).set({ createdAt }).where(eq(tasks.id, id))
  revalidatePath(`/boards/${boardId}`)
}

export async function updateTaskColumn(id: string, newColumnId: string, boardId: string, newPosition?: number) {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, id),
  })

  if (!task) return

  const oldColumnId = task.columnId
  const oldPosition = task.position

  // If moving to same column at same position, do nothing
  if (oldColumnId === newColumnId && (newPosition === undefined || newPosition === oldPosition)) {
    return
  }

  // Get max position in new column if newPosition not provided
  if (newPosition === undefined) {
    const maxPositionResult = await db
      .select({ maxPosition: sql<number>`COALESCE(MAX(${tasks.position}), -1)` })
      .from(tasks)
      .where(eq(tasks.columnId, newColumnId))
    newPosition = (maxPositionResult[0]?.maxPosition ?? -1) + 1
  }

  if (oldColumnId === newColumnId) {
    // Same column reorder
    if (oldPosition < newPosition) {
      await db.update(tasks)
        .set({ position: sql`${tasks.position} - 1` })
        .where(and(
          eq(tasks.columnId, oldColumnId),
          gt(tasks.position, oldPosition),
          lte(tasks.position, newPosition)
        ))
    } else {
      await db.update(tasks)
        .set({ position: sql`${tasks.position} + 1` })
        .where(and(
          eq(tasks.columnId, oldColumnId),
          gte(tasks.position, newPosition),
          lt(tasks.position, oldPosition)
        ))
    }
  } else {
    // Different column - update old column positions
    await db.update(tasks)
      .set({ position: sql`${tasks.position} - 1` })
      .where(and(
        eq(tasks.columnId, oldColumnId),
        gt(tasks.position, oldPosition)
      ))

    // Update new column positions
    await db.update(tasks)
      .set({ position: sql`${tasks.position} + 1` })
      .where(and(
        eq(tasks.columnId, newColumnId),
        gte(tasks.position, newPosition)
      ))
  }

  await db.update(tasks)
    .set({ columnId: newColumnId, position: newPosition })
    .where(eq(tasks.id, id))

  revalidatePath(`/boards/${boardId}`)
}

export async function deleteTask(id: string, boardId: string) {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, id),
  })

  if (!task) return

  // Delete assignees first
  await db.delete(taskAssignees).where(eq(taskAssignees.taskId, id))

  // Delete comments before removing the task to honor restrict FKs
  await db.delete(comments).where(eq(comments.taskId, id))

  await db.delete(tasks).where(eq(tasks.id, id))

  // Update positions
  await db.update(tasks)
    .set({ position: sql`${tasks.position} - 1` })
    .where(and(
      eq(tasks.columnId, task.columnId),
      gt(tasks.position, task.position)
    ))

  revalidatePath(`/boards/${boardId}`)
}
