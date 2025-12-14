"use server"

import { db } from "@/db"
import { contributors, taskAssignees, comments, columns, tasks, CONTRIBUTOR_COLORS, type ContributorColor } from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getBoardPasswordOptional, requireBoardAccess } from "@/lib/secure-board"
import { getRandomContributorColor } from "@/lib/contributor-colors"

export async function createContributor(
  boardId: string,
  name: string,
  opts?: { id?: string; color?: ContributorColor }
) {
  await requireBoardAccess(boardId)

  const id = opts?.id ?? crypto.randomUUID()
  const color =
    opts?.color && CONTRIBUTOR_COLORS.includes(opts.color)
      ? opts.color
      : getRandomContributorColor()

  await db.insert(contributors).values({
    id,
    boardId,
    name,
    color,
  })

  revalidatePath(`/boards/${boardId}`)
  return id
}

export async function getContributors(boardId: string) {
  const password = await getBoardPasswordOptional(boardId)
  if (!password) {
    return []
  }

  const contributorsList = await db.query.contributors.findMany({
    where: eq(contributors.boardId, boardId),
  })

  return contributorsList
}

export async function addAssignee(taskId: string, contributorId: string, boardId: string) {
  await requireBoardAccess(boardId)

  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) })
  if (!task || task.boardId !== boardId) {
    throw new Error("Task not found")
  }

  const contributor = await db.query.contributors.findFirst({ where: eq(contributors.id, contributorId) })
  if (!contributor || contributor.boardId !== boardId) {
    throw new Error("Contributor not found")
  }

  // Check if already assigned
  const existing = await db.query.taskAssignees.findFirst({
    where: and(
      eq(taskAssignees.taskId, taskId),
      eq(taskAssignees.contributorId, contributorId)
    ),
  })

  if (existing) return

  await db.insert(taskAssignees).values({
    taskId,
    contributorId,
  })

  revalidatePath(`/boards/${boardId}`)
}

export async function removeAssignee(taskId: string, contributorId: string, boardId: string) {
  await requireBoardAccess(boardId)

  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) })
  if (!task || task.boardId !== boardId) {
    throw new Error("Task not found")
  }

  const contributor = await db.query.contributors.findFirst({ where: eq(contributors.id, contributorId) })
  if (!contributor || contributor.boardId !== boardId) {
    throw new Error("Contributor not found")
  }

  await db.delete(taskAssignees).where(
    and(
      eq(taskAssignees.taskId, taskId),
      eq(taskAssignees.contributorId, contributorId)
    )
  )

  revalidatePath(`/boards/${boardId}`)
}

export async function createAndAssignContributor(
  taskId: string,
  boardId: string,
  name: string,
  opts?: { id?: string; color?: ContributorColor }
) {
  const contributorId = await createContributor(boardId, name, opts)
  await addAssignee(taskId, contributorId, boardId)
  return contributorId
}

export async function updateContributor(
  id: string,
  boardId: string,
  updates: { name?: string; color?: ContributorColor }
) {
  await requireBoardAccess(boardId)

  const contributor = await db.query.contributors.findFirst({ where: eq(contributors.id, id) })
  if (!contributor || contributor.boardId !== boardId) {
    throw new Error("Contributor not found")
  }

  const updateData: { name?: string; color?: ContributorColor } = {}
  if (updates.color !== undefined) {
    updateData.color = updates.color
  }
  if (updates.name !== undefined) {
    updateData.name = updates.name
  }

  await db.update(contributors)
    .set(updateData)
    .where(eq(contributors.id, id))

  revalidatePath(`/boards/${boardId}`)
}

export async function deleteContributor(id: string, boardId: string) {
  await requireBoardAccess(boardId)

  const contributor = await db.query.contributors.findFirst({ where: eq(contributors.id, id) })
  if (!contributor || contributor.boardId !== boardId) {
    throw new Error("Contributor not found")
  }

  // Check if contributor has any task assignments
  const assignmentCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(taskAssignees)
    .where(eq(taskAssignees.contributorId, id))
    .then(rows => rows[0]?.count ?? 0)

  if (assignmentCount > 0) {
    throw new Error("Cannot delete contributor with task assignments")
  }

  // Check if contributor has any comments
  const commentCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(comments)
    .where(eq(comments.authorId, id))
    .then(rows => rows[0]?.count ?? 0)

  if (commentCount > 0) {
    throw new Error("Cannot delete contributor with comments")
  }

  await db.delete(contributors).where(eq(contributors.id, id))
  revalidatePath(`/boards/${boardId}`)
}

export type ContributorWithStats = {
  id: string
  name: string
  color: ContributorColor
  boardId: string
  taskCount: number
  commentCount: number
  tasksByColumn: Array<{
    columnId: string
    columnName: string
    count: number
  }>
}

export async function getContributorsWithStats(boardId: string): Promise<ContributorWithStats[]> {
  const password = await getBoardPasswordOptional(boardId)
  if (!password) {
    return []
  }

  // Get all contributors for this board
  const allContributors = await db.query.contributors.findMany({
    where: eq(contributors.boardId, boardId),
  })

  // Get all columns for this board (for the breakdown)
  const boardColumns = await db.query.columns.findMany({
    where: eq(columns.boardId, boardId),
    orderBy: columns.position,
  })

  // Get task assignments with task column info
  const assignmentsWithColumns = await db
    .select({
      contributorId: taskAssignees.contributorId,
      columnId: tasks.columnId,
    })
    .from(taskAssignees)
    .innerJoin(tasks, eq(taskAssignees.taskId, tasks.id))
    .where(eq(tasks.boardId, boardId))

  // Get comment counts per contributor
  const commentCounts = await db
    .select({
      authorId: comments.authorId,
      count: sql<number>`count(*)`,
    })
    .from(comments)
    .where(eq(comments.boardId, boardId))
    .groupBy(comments.authorId)

  // Build the result
  return allContributors.map(contributor => {

    // Count tasks per column for this contributor
    const contributorAssignments = assignmentsWithColumns.filter(
      a => a.contributorId === contributor.id
    )

    const tasksByColumn = boardColumns.map(col => ({
      columnId: col.id,
      columnName: col.name,
      count: contributorAssignments.filter(a => a.columnId === col.id).length,
    }))

    const commentEntry = commentCounts.find(c => c.authorId === contributor.id)

    return {
      id: contributor.id,
      name: contributor.name,
      color: contributor.color,
      boardId: contributor.boardId,
      taskCount: contributorAssignments.length,
      commentCount: commentEntry?.count ?? 0,
      tasksByColumn,
    }
  })
}
