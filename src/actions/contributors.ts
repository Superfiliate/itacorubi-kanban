"use server"

import { db } from "@/db"
import { contributors, taskAssignees } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function createContributor(boardId: string, name: string) {
  const id = crypto.randomUUID()
  await db.insert(contributors).values({
    id,
    boardId,
    name,
  })

  revalidatePath(`/boards/${boardId}`)
  return id
}

export async function getContributors(boardId: string) {
  return db.query.contributors.findMany({
    where: eq(contributors.boardId, boardId),
  })
}

export async function addAssignee(taskId: string, contributorId: string, boardId: string) {
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
  await db.delete(taskAssignees).where(
    and(
      eq(taskAssignees.taskId, taskId),
      eq(taskAssignees.contributorId, contributorId)
    )
  )

  revalidatePath(`/boards/${boardId}`)
}

export async function createAndAssignContributor(taskId: string, boardId: string, name: string) {
  const contributorId = await createContributor(boardId, name)
  await addAssignee(taskId, contributorId, boardId)
  return contributorId
}
