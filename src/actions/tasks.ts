"use server"

import { db } from "@/db"
import { tasks, taskAssignees, comments } from "@/db/schema"
import { eq, and, gt, gte, lt, lte, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function createTask(boardId: string, columnId: string, title: string) {
  const { getBoardPassword } = await import("@/lib/board-password")
  const { encrypt } = await import("@/lib/encryption")

  const password = await getBoardPassword(boardId)
  if (!password) {
    throw new Error("Board password not set")
  }

  // Get the max position for this column
  const maxPositionResult = await db
    .select({ maxPosition: sql<number>`COALESCE(MAX(${tasks.position}), -1)` })
    .from(tasks)
    .where(eq(tasks.columnId, columnId))

  const maxPosition = maxPositionResult[0]?.maxPosition ?? -1

  const id = crypto.randomUUID()
  const encryptedTitle = await encrypt(title, password)

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
  const { getBoardPassword } = await import("@/lib/board-password")
  const { decrypt } = await import("@/lib/encryption")

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

  const password = await getBoardPassword(task.boardId)
  if (!password) {
    // Password not set
    return null
  }

  // Decrypt task title
  try {
    task.title = await decrypt(task.title, password)
  } catch (error) {
    task.title = "❌ Decryption Error"
  }

  // Decrypt comment content
  for (const comment of task.comments) {
    try {
      comment.content = await decrypt(comment.content, password)
    } catch (error) {
      comment.content = "❌ Decryption Error"
    }
  }

  // Decrypt contributor names
  for (const assignee of task.assignees) {
    try {
      assignee.contributor.name = await decrypt(assignee.contributor.name, password)
    } catch (error) {
      assignee.contributor.name = "❌ Decryption Error"
    }
  }

  // Decrypt comment author names
  for (const comment of task.comments) {
    try {
      comment.author.name = await decrypt(comment.author.name, password)
    } catch (error) {
      comment.author.name = "❌ Decryption Error"
    }
  }

  return task
}

export async function updateTaskTitle(id: string, title: string, boardId: string) {
  const { getBoardPassword } = await import("@/lib/board-password")
  const { encrypt } = await import("@/lib/encryption")

  const password = await getBoardPassword(boardId)
  if (!password) {
    throw new Error("Board password not set")
  }

  const encryptedTitle = await encrypt(title, password)
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
