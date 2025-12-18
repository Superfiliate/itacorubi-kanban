"use server";

import { db } from "@/db";
import { columns, tasks, taskAssignees, taskTags, comments } from "@/db/schema";
import { eq, and, gt, gte, lt, lte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getBoardPasswordOptional, requireBoardAccess } from "@/lib/secure-board";
import { TASK_PRIORITIES, type TaskPriority } from "@/db/schema";

export async function createTask(
  boardId: string,
  columnId: string,
  title: string,
  id?: string,
  createdAt?: Date,
) {
  await requireBoardAccess(boardId);

  const column = await db.query.columns.findFirst({ where: eq(columns.id, columnId) });
  if (!column || column.boardId !== boardId) {
    throw new Error("Invalid column");
  }

  // Get the max position for this column
  const maxPositionResult = await db
    .select({ maxPosition: sql<number>`COALESCE(MAX(${tasks.position}), -1)` })
    .from(tasks)
    .where(eq(tasks.columnId, columnId));

  const maxPosition = maxPositionResult[0]?.maxPosition ?? -1;

  const taskId = id ?? crypto.randomUUID();

  await db.insert(tasks).values({
    id: taskId,
    boardId,
    columnId,
    title,
    position: maxPosition + 1,
    ...(createdAt ? { createdAt } : null),
  });

  revalidatePath(`/boards/${boardId}`);
  return taskId;
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
      stakeholders: {
        with: {
          contributor: true,
        },
      },
      tags: {
        with: {
          tag: true,
        },
      },
      comments: {
        orderBy: (comments, { asc }) => [asc(comments.createdAt)],
        with: {
          author: true,
          stakeholder: true,
        },
      },
    },
  });

  if (!task) {
    return null;
  }

  const passwordOk = await getBoardPasswordOptional(task.boardId);
  if (!passwordOk) {
    return null;
  }

  return task;
}

export async function updateTaskTitle(id: string, title: string, boardId: string) {
  await requireBoardAccess(boardId);
  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, id) });
  if (!task || task.boardId !== boardId) {
    throw new Error("Task not found");
  }

  await db.update(tasks).set({ title }).where(eq(tasks.id, id));
  revalidatePath(`/boards/${boardId}`);
}

export async function updateTaskCreatedAt(id: string, createdAt: Date, boardId: string) {
  await requireBoardAccess(boardId);
  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, id) });
  if (!task || task.boardId !== boardId) {
    throw new Error("Task not found");
  }

  await db.update(tasks).set({ createdAt }).where(eq(tasks.id, id));
  revalidatePath(`/boards/${boardId}`);
}

export async function updateTaskPriority(id: string, priority: TaskPriority, boardId: string) {
  await requireBoardAccess(boardId);

  if (!TASK_PRIORITIES.includes(priority)) {
    throw new Error("Invalid priority");
  }

  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, id) });
  if (!task || task.boardId !== boardId) {
    throw new Error("Task not found");
  }

  await db.update(tasks).set({ priority }).where(eq(tasks.id, id));
  revalidatePath(`/boards/${boardId}`);
}

export async function updateTaskColumn(
  id: string,
  newColumnId: string,
  boardId: string,
  newPosition?: number,
) {
  await requireBoardAccess(boardId);

  const newColumn = await db.query.columns.findFirst({ where: eq(columns.id, newColumnId) });
  if (!newColumn || newColumn.boardId !== boardId) {
    throw new Error("Invalid column");
  }

  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, id),
  });

  if (!task) return;
  if (task.boardId !== boardId) {
    throw new Error("Task not found");
  }

  const oldColumnId = task.columnId;
  const oldPosition = task.position;

  // If moving to same column at same position, do nothing
  if (oldColumnId === newColumnId && (newPosition === undefined || newPosition === oldPosition)) {
    return;
  }

  // Get max position in new column if newPosition not provided
  if (newPosition === undefined) {
    const maxPositionResult = await db
      .select({ maxPosition: sql<number>`COALESCE(MAX(${tasks.position}), -1)` })
      .from(tasks)
      .where(eq(tasks.columnId, newColumnId));
    newPosition = (maxPositionResult[0]?.maxPosition ?? -1) + 1;
  }

  if (oldColumnId === newColumnId) {
    // Same column reorder
    if (oldPosition < newPosition) {
      await db
        .update(tasks)
        .set({ position: sql`${tasks.position} - 1` })
        .where(
          and(
            eq(tasks.columnId, oldColumnId),
            gt(tasks.position, oldPosition),
            lte(tasks.position, newPosition),
          ),
        );
    } else {
      await db
        .update(tasks)
        .set({ position: sql`${tasks.position} + 1` })
        .where(
          and(
            eq(tasks.columnId, oldColumnId),
            gte(tasks.position, newPosition),
            lt(tasks.position, oldPosition),
          ),
        );
    }
  } else {
    // Different column - update old column positions
    await db
      .update(tasks)
      .set({ position: sql`${tasks.position} - 1` })
      .where(and(eq(tasks.columnId, oldColumnId), gt(tasks.position, oldPosition)));

    // Update new column positions
    await db
      .update(tasks)
      .set({ position: sql`${tasks.position} + 1` })
      .where(and(eq(tasks.columnId, newColumnId), gte(tasks.position, newPosition)));
  }

  await db
    .update(tasks)
    .set({ columnId: newColumnId, position: newPosition })
    .where(eq(tasks.id, id));

  revalidatePath(`/boards/${boardId}`);
}

export async function deleteTask(id: string, boardId: string) {
  await requireBoardAccess(boardId);
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, id),
  });

  if (!task) return;
  if (task.boardId !== boardId) {
    throw new Error("Task not found");
  }

  // Delete assignees first
  await db.delete(taskAssignees).where(eq(taskAssignees.taskId, id));

  // Delete stakeholders
  const { taskStakeholders } = await import("@/db/schema");
  await db.delete(taskStakeholders).where(eq(taskStakeholders.taskId, id));

  // Delete tags
  await db.delete(taskTags).where(eq(taskTags.taskId, id));

  // Delete comments before removing the task to honor restrict FKs
  await db.delete(comments).where(eq(comments.taskId, id));

  await db.delete(tasks).where(eq(tasks.id, id));

  // Update positions
  await db
    .update(tasks)
    .set({ position: sql`${tasks.position} - 1` })
    .where(and(eq(tasks.columnId, task.columnId), gt(tasks.position, task.position)));

  revalidatePath(`/boards/${boardId}`);
}
