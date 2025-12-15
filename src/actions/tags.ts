"use server"

import { db } from "@/db"
import { tags, taskTags, tasks, columns, CONTRIBUTOR_COLORS, type ContributorColor } from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getBoardPasswordOptional, requireBoardAccess } from "@/lib/secure-board"
import { getRandomTagColor } from "@/lib/tag-colors"

export async function createTag(
  boardId: string,
  name: string,
  opts?: { id?: string; color?: ContributorColor }
) {
  await requireBoardAccess(boardId)

  const id = opts?.id ?? crypto.randomUUID()
  const color =
    opts?.color && CONTRIBUTOR_COLORS.includes(opts.color)
      ? opts.color
      : getRandomTagColor()

  await db.insert(tags).values({
    id,
    boardId,
    name,
    color,
  })

  revalidatePath(`/boards/${boardId}`)
  return id
}

export async function getTags(boardId: string) {
  const password = await getBoardPasswordOptional(boardId)
  if (!password) {
    return []
  }

  const tagsList = await db.query.tags.findMany({
    where: eq(tags.boardId, boardId),
  })

  return tagsList
}

export async function addTagToTask(taskId: string, tagId: string, boardId: string) {
  await requireBoardAccess(boardId)

  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) })
  if (!task || task.boardId !== boardId) {
    throw new Error("Task not found")
  }

  const tag = await db.query.tags.findFirst({ where: eq(tags.id, tagId) })
  if (!tag || tag.boardId !== boardId) {
    throw new Error("Tag not found")
  }

  // Check if already assigned
  const existing = await db.query.taskTags.findFirst({
    where: and(
      eq(taskTags.taskId, taskId),
      eq(taskTags.tagId, tagId)
    ),
  })

  if (existing) return

  await db.insert(taskTags).values({
    taskId,
    tagId,
  })

  revalidatePath(`/boards/${boardId}`)
}

export async function removeTagFromTask(taskId: string, tagId: string, boardId: string) {
  await requireBoardAccess(boardId)

  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) })
  if (!task || task.boardId !== boardId) {
    throw new Error("Task not found")
  }

  const tag = await db.query.tags.findFirst({ where: eq(tags.id, tagId) })
  if (!tag || tag.boardId !== boardId) {
    throw new Error("Tag not found")
  }

  await db.delete(taskTags).where(
    and(
      eq(taskTags.taskId, taskId),
      eq(taskTags.tagId, tagId)
    )
  )

  revalidatePath(`/boards/${boardId}`)
}

export async function createAndAddTag(
  taskId: string,
  boardId: string,
  name: string,
  opts?: { id?: string; color?: ContributorColor }
) {
  const tagId = await createTag(boardId, name, opts)
  await addTagToTask(taskId, tagId, boardId)
  return tagId
}

export async function updateTag(
  id: string,
  boardId: string,
  updates: { name?: string; color?: ContributorColor }
) {
  await requireBoardAccess(boardId)

  const tag = await db.query.tags.findFirst({ where: eq(tags.id, id) })
  if (!tag || tag.boardId !== boardId) {
    throw new Error("Tag not found")
  }

  const updateData: { name?: string; color?: ContributorColor } = {}
  if (updates.color !== undefined) {
    updateData.color = updates.color
  }
  if (updates.name !== undefined) {
    updateData.name = updates.name
  }

  await db.update(tags)
    .set(updateData)
    .where(eq(tags.id, id))

  revalidatePath(`/boards/${boardId}`)
}

export async function deleteTag(id: string, boardId: string) {
  await requireBoardAccess(boardId)

  const tag = await db.query.tags.findFirst({ where: eq(tags.id, id) })
  if (!tag || tag.boardId !== boardId) {
    throw new Error("Tag not found")
  }

  // Check if tag has any task assignments
  const assignmentCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(taskTags)
    .where(eq(taskTags.tagId, id))
    .then(rows => rows[0]?.count ?? 0)

  if (assignmentCount > 0) {
    throw new Error("Cannot delete tag with task assignments")
  }

  await db.delete(tags).where(eq(tags.id, id))
  revalidatePath(`/boards/${boardId}`)
}

export type TagWithStats = {
  id: string
  name: string
  color: ContributorColor
  boardId: string
  taskCount: number
  tasksByColumn: Array<{
    columnId: string
    columnName: string
    count: number
  }>
}

export async function getTagsWithStats(boardId: string): Promise<TagWithStats[]> {
  const password = await getBoardPasswordOptional(boardId)
  if (!password) {
    return []
  }

  // Get all tags for this board
  const allTags = await db.query.tags.findMany({
    where: eq(tags.boardId, boardId),
  })

  // Get all columns for this board (for the breakdown)
  const boardColumns = await db.query.columns.findMany({
    where: eq(columns.boardId, boardId),
    orderBy: columns.position,
  })

  // Get task assignments with task column info
  const assignmentsWithColumns = await db
    .select({
      tagId: taskTags.tagId,
      columnId: tasks.columnId,
    })
    .from(taskTags)
    .innerJoin(tasks, eq(taskTags.taskId, tasks.id))
    .where(eq(tasks.boardId, boardId))

  // Build the result
  return allTags.map(tag => {
    // Count tasks per column for this tag
    const tagAssignments = assignmentsWithColumns.filter(
      a => a.tagId === tag.id
    )

    const tasksByColumn = boardColumns.map(col => ({
      columnId: col.id,
      columnName: col.name,
      count: tagAssignments.filter(a => a.columnId === col.id).length,
    }))

    return {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      boardId: tag.boardId,
      taskCount: tagAssignments.length,
      tasksByColumn,
    }
  })
}
