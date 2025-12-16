"use client"

import { updateBoardTitle } from "@/actions/boards"
import {
  createColumn,
  updateColumnName,
  toggleColumnCollapsed,
  deleteColumn,
  reorderColumns,
} from "@/actions/columns"
import {
  createTask,
  updateTaskTitle,
  updateTaskPriority,
  updateTaskCreatedAt,
  updateTaskColumn,
  deleteTask,
} from "@/actions/tasks"
import {
  createContributor,
  createAndAssignContributor,
  updateContributor,
  deleteContributor,
  addAssignee,
  removeAssignee,
  addStakeholder,
  removeStakeholder,
  createAndAddStakeholder,
} from "@/actions/contributors"
import {
  createTag,
  updateTag,
  deleteTag,
  addTagToTask,
  removeTagFromTask,
  createAndAddTag,
} from "@/actions/tags"
import { createComment, updateComment, deleteComment } from "@/actions/comments"
import { useBoardStore, type OutboxItem } from "@/stores/board-store"

async function executeOutboxItem(item: OutboxItem): Promise<void> {
  switch (item.type) {
    // Task operations
    case "createTask": {
      const { taskId, columnId, title, createdAt } = item.payload
      await createTask(item.boardId, columnId, title, taskId, createdAt ?? undefined)
      return
    }
    case "updateTaskTitle": {
      const { taskId, title } = item.payload
      await updateTaskTitle(taskId, title, item.boardId)
      return
    }
    case "updateTaskPriority": {
      const { taskId, priority } = item.payload
      await updateTaskPriority(taskId, priority, item.boardId)
      return
    }
    case "updateTaskCreatedAt": {
      const { taskId, createdAt } = item.payload
      await updateTaskCreatedAt(taskId, createdAt, item.boardId)
      return
    }
    case "updateTaskColumn": {
      const { taskId, columnId, position } = item.payload
      await updateTaskColumn(taskId, columnId, item.boardId, position)
      return
    }
    case "deleteTask": {
      await deleteTask(item.payload.taskId, item.boardId)
      return
    }

    // Contributor operations
    case "createContributor": {
      const { contributorId, name, color } = item.payload
      await createContributor(item.boardId, name, { id: contributorId, color })
      return
    }
    case "createAndAssignContributor": {
      const { taskId, contributorId, name, color } = item.payload
      await createAndAssignContributor(taskId, item.boardId, name, { id: contributorId, color })
      return
    }
    case "updateContributor": {
      const { contributorId, name, color } = item.payload
      await updateContributor(contributorId, item.boardId, { name, color })
      return
    }
    case "deleteContributor": {
      await deleteContributor(item.payload.contributorId, item.boardId)
      return
    }

    // Assignee operations
    case "addAssignee": {
      const { taskId, contributorId } = item.payload
      await addAssignee(taskId, contributorId, item.boardId)
      return
    }
    case "removeAssignee": {
      const { taskId, contributorId } = item.payload
      await removeAssignee(taskId, contributorId, item.boardId)
      return
    }

    // Stakeholder operations
    case "addStakeholder": {
      const { taskId, contributorId } = item.payload
      await addStakeholder(taskId, contributorId, item.boardId)
      return
    }
    case "removeStakeholder": {
      const { taskId, contributorId } = item.payload
      await removeStakeholder(taskId, contributorId, item.boardId)
      return
    }
    case "createAndAddStakeholder": {
      const { taskId, contributorId, name, color } = item.payload
      await createAndAddStakeholder(taskId, item.boardId, name, { id: contributorId, color })
      return
    }

    // Tag operations
    case "createTag": {
      const { tagId, name, color } = item.payload
      await createTag(item.boardId, name, { id: tagId, color })
      return
    }
    case "updateTag": {
      const { tagId, name, color } = item.payload
      await updateTag(tagId, item.boardId, { name, color })
      return
    }
    case "deleteTag": {
      await deleteTag(item.payload.tagId, item.boardId)
      return
    }
    case "addTag": {
      const { taskId, tagId } = item.payload
      await addTagToTask(taskId, tagId, item.boardId)
      return
    }
    case "removeTag": {
      const { taskId, tagId } = item.payload
      await removeTagFromTask(taskId, tagId, item.boardId)
      return
    }
    case "createAndAddTag": {
      const { taskId, tagId, name, color } = item.payload
      await createAndAddTag(taskId, item.boardId, name, { id: tagId, color })
      return
    }

    // Comment operations
    case "createComment": {
      const { taskId, commentId, authorId, content, createdAt, stakeholderId } = item.payload
      await createComment(taskId, item.boardId, authorId, content, commentId, createdAt, stakeholderId)
      return
    }
    case "updateComment": {
      const { commentId, authorId, content, stakeholderId } = item.payload
      await updateComment(commentId, authorId, content, item.boardId, stakeholderId)
      return
    }
    case "deleteComment": {
      await deleteComment(item.payload.commentId, item.boardId)
      return
    }

    // Board operations
    case "updateBoardTitle": {
      await updateBoardTitle(item.boardId, item.payload.title)
      return
    }

    // Column operations
    case "createColumn": {
      await createColumn(item.boardId, item.payload.columnId)
      return
    }
    case "updateColumnName": {
      const { columnId, name } = item.payload
      await updateColumnName(columnId, name, item.boardId)
      return
    }
    case "toggleColumnCollapsed": {
      await toggleColumnCollapsed(item.payload.columnId, item.boardId)
      return
    }
    case "deleteColumn": {
      await deleteColumn(item.payload.columnId, item.boardId)
      return
    }
    case "reorderColumns": {
      const { columnId, newPosition } = item.payload
      await reorderColumns(item.boardId, columnId, newPosition)
      return
    }

    default: {
      // Exhaustive check
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _never: never = item
    }
  }
}

/**
 * Flushes a board outbox sequentially.
 *
 * If an item fails (e.g. bad password), we drop it to avoid blocking all future work.
 * This aligns with the "optimize for good actors" approach.
 */
export async function flushBoardOutbox(boardId: string): Promise<void> {
  const store = useBoardStore.getState()
  store.ensureBoard(boardId)

  const initial = useBoardStore.getState().boardsById[boardId]
  if (!initial) return
  if (initial.isFlushing) return

  store.setFlushing(boardId, true)
  try {
    // Drain until empty (or until concurrent enqueue adds more; loop handles it)
    while (true) {
      const board = useBoardStore.getState().boardsById[boardId]
      const item = board?.outbox[0]
      if (!item) break

      try {
        await executeOutboxItem(item)
      } catch {
        // Intentionally ignore; we'll drop the item below.
      } finally {
        useBoardStore.getState().popOutbox(boardId, item.id)
      }
    }
  } finally {
    useBoardStore.getState().setFlushing(boardId, false)
  }

  // Check for items added during the race window between the loop deciding to
  // exit (outbox appeared empty) and the finally block clearing isFlushing.
  // Any flushBoardOutbox calls during that window returned early, so we must
  // re-trigger a flush to process those stragglers.
  const finalBoard = useBoardStore.getState().boardsById[boardId]
  if (finalBoard && finalBoard.outbox.length > 0 && !finalBoard.isFlushing) {
    queueMicrotask(() => void flushBoardOutbox(boardId))
  }
}
