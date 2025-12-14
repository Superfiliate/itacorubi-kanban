"use client"

import { create } from "zustand"
import type { ContributorColor, TaskPriority } from "@/db/schema"
import type { BoardData, BoardTask, BoardColumn } from "@/hooks/use-board"
import type { TaskComment, TaskWithComments } from "@/hooks/use-task"

export type ColumnEntity = {
  id: string
  name: string
  position: number
  isCollapsed: boolean
}

export type TaskEntity = {
  id: string
  title: string
  priority: TaskPriority
  columnId: string
  createdAt: Date | null
}

export type ContributorEntity = {
  id: string
  name: string
  color: ContributorColor
}

export type CommentMeta = {
  count: number
  lastCreatedAt: Date | null
}

export type OutboxItem =
  | {
      id: string
      type: "createTask"
      boardId: string
      payload: { taskId: string; columnId: string; title: string; createdAt: Date | null }
      createdAt: number
    }
  | {
      id: string
      type: "createAndAssignContributor"
      boardId: string
      payload: {
        taskId: string
        contributorId: string
        name: string
        color: ContributorColor
      }
      createdAt: number
    }
  | {
      id: string
      type: "createComment"
      boardId: string
      payload: { taskId: string; commentId: string; authorId: string; content: string; createdAt: Date }
      createdAt: number
    }
  | {
      id: string
      type: "updateComment"
      boardId: string
      payload: { taskId: string; commentId: string; authorId: string; content: string }
      createdAt: number
    }
  | {
      id: string
      type: "deleteComment"
      boardId: string
      payload: { taskId: string; commentId: string }
      createdAt: number
    }
  | {
      id: string
      type: "updateContributor"
      boardId: string
      payload: { contributorId: string; name?: string; color?: ContributorColor }
      createdAt: number
    }
  | {
      id: string
      type: "createContributor"
      boardId: string
      payload: { contributorId: string; name: string; color: ContributorColor }
      createdAt: number
    }
  | {
      id: string
      type: "deleteContributor"
      boardId: string
      payload: { contributorId: string }
      createdAt: number
    }

export type NormalizedBoardState = {
  boardId: string

  columnsById: Record<string, ColumnEntity>
  columnOrder: string[]

  tasksById: Record<string, TaskEntity>
  tasksByColumnId: Record<string, string[]>

  contributorsById: Record<string, ContributorEntity>
  contributorOrder: string[]

  assigneeIdsByTaskId: Record<string, string[]>
  commentMetaByTaskId: Record<string, CommentMeta>
  taskDetailsById: Record<string, TaskWithComments>

  outbox: OutboxItem[]
  isFlushing: boolean

  lastLocalActivityAt: number
  lastRemoteHydrateAt: number
}

type BoardsById = Record<string, NormalizedBoardState | undefined>

type BoardStoreState = {
  boardsById: BoardsById

  ensureBoard: (boardId: string) => NormalizedBoardState

  hydrateBoardFromServer: (boardId: string, boardData: BoardData) => void
  hydrateTaskFromServer: (boardId: string, task: TaskWithComments) => void

  touch: (boardId: string) => void

  // Local-first mutations
  createTaskLocal: (args: {
    boardId: string
    taskId: string
    columnId: string
    title: string
    priority?: TaskPriority
    createdAt: Date | null
  }) => void

  updateContributorLocal: (args: {
    boardId: string
    contributorId: string
    name?: string
    color?: ContributorColor
  }) => void

  createContributorLocal: (args: {
    boardId: string
    contributorId: string
    name: string
    color: ContributorColor
  }) => void

  deleteContributorLocal: (args: { boardId: string; contributorId: string }) => void

  addAssigneeLocal: (args: { boardId: string; taskId: string; contributorId: string }) => void
  removeAssigneeLocal: (args: { boardId: string; taskId: string; contributorId: string }) => void

  // Task title update (for sidebar consistency)
  updateTaskTitleLocal: (args: { boardId: string; taskId: string; title: string }) => void

  // Task priority update (for sidebar consistency)
  updateTaskPriorityLocal: (args: { boardId: string; taskId: string; priority: TaskPriority }) => void

  // DnD mutations
  moveTaskLocal: (args: {
    boardId: string
    taskId: string
    toColumnId: string
    toIndex: number
  }) => void

  reorderColumnsLocal: (args: {
    boardId: string
    columnId: string
    toIndex: number
  }) => void

  // Comments (local-first)
  createCommentLocal: (args: { boardId: string; taskId: string; comment: TaskComment }) => void
  updateCommentLocal: (args: {
    boardId: string
    taskId: string
    commentId: string
    author?: { id: string; name: string; color: ContributorColor }
    content: string
  }) => void
  deleteCommentLocal: (args: { boardId: string; taskId: string; commentId: string }) => void

  // Outbox
  enqueue: (item: Omit<OutboxItem, "id" | "createdAt"> & { id?: string; createdAt?: number }) => void
  popOutbox: (boardId: string, itemId: string) => void
  setFlushing: (boardId: string, isFlushing: boolean) => void
}

function makeEmptyBoard(boardId: string): NormalizedBoardState {
  const now = Date.now()
  return {
    boardId,
    columnsById: {},
    columnOrder: [],
    tasksById: {},
    tasksByColumnId: {},
    contributorsById: {},
    contributorOrder: [],
    assigneeIdsByTaskId: {},
    commentMetaByTaskId: {},
    taskDetailsById: {},
    outbox: [],
    isFlushing: false,
    lastLocalActivityAt: now,
    lastRemoteHydrateAt: 0,
  }
}

function normalizeBoard(boardId: string, board: BoardData): NormalizedBoardState {
  const state = makeEmptyBoard(boardId)
  state.lastRemoteHydrateAt = Date.now()

  // Contributors
  for (const c of board.contributors) {
    state.contributorsById[c.id] = { id: c.id, name: c.name, color: c.color }
    state.contributorOrder.push(c.id)
  }

  // Columns + tasks
  for (const col of board.columns) {
    const colCollapsed = col.isCollapsed ?? false
    state.columnsById[col.id] = {
      id: col.id,
      name: col.name,
      position: col.position,
      isCollapsed: colCollapsed,
    }
    state.columnOrder.push(col.id)
    state.tasksByColumnId[col.id] = []

    for (const t of col.tasks) {
      state.tasksById[t.id] = {
        id: t.id,
        title: t.title,
        priority: t.priority ?? "none",
        columnId: col.id,
        createdAt: t.createdAt,
      }
      state.tasksByColumnId[col.id].push(t.id)

      // Assignees
      state.assigneeIdsByTaskId[t.id] = t.assignees.map((a) => a.contributor.id)

      // Comment meta for cards
      const count = t.comments.length
      const lastCreatedAt = count > 0 ? t.comments[0]?.createdAt ?? null : null
      state.commentMetaByTaskId[t.id] = { count, lastCreatedAt }
    }
  }

  // Ensure deterministic ordering
  state.columnOrder.sort((a, b) => (state.columnsById[a]?.position ?? 0) - (state.columnsById[b]?.position ?? 0))
  for (const colId of state.columnOrder) {
    const ids = state.tasksByColumnId[colId] ?? []
    ids.sort((a, b) => {
      const ta = state.tasksById[a]
      const tb = state.tasksById[b]
      // Preserve existing relative order if unknown
      if (!ta || !tb) return 0
      // We don't persist full position here; board query already ordered by position.
      // Keep current array order as-is.
      return 0
    })
  }

  return state
}

function buildTaskDetails(board: NormalizedBoardState, taskId: string): TaskWithComments | undefined {
  const task = board.tasksById[taskId]
  if (!task) return undefined
  const col = board.columnsById[task.columnId]
  const assigneeIds = board.assigneeIdsByTaskId[taskId] ?? []
  const assignees = assigneeIds
    .map((cid) => board.contributorsById[cid])
    .filter(Boolean)
    .map((c) => ({ contributor: { id: c.id, name: c.name, color: c.color } }))

  return {
    id: task.id,
    title: task.title,
    priority: task.priority,
    columnId: task.columnId,
    boardId: board.boardId,
    createdAt: task.createdAt,
    column: { id: task.columnId, name: col?.name ?? "" },
    assignees,
    comments: [],
  }
}

export const useBoardStore = create<BoardStoreState>((set, get) => ({
  boardsById: {},

  ensureBoard: (boardId) => {
    const existing = get().boardsById[boardId]
    if (existing) return existing
    const created = makeEmptyBoard(boardId)
    set((s) => ({ boardsById: { ...s.boardsById, [boardId]: created } }))
    return created
  },

  hydrateBoardFromServer: (boardId, boardData) => {
    set((s) => {
      const current = s.boardsById[boardId]
      // Do not overwrite while local changes are pending/in flight
      if (current && (current.isFlushing || current.outbox.length > 0)) {
        return s
      }
      const normalized = normalizeBoard(boardId, boardData)
      // Preserve taskDetailsById from previous state - these are fetched separately
      // and should not be wiped when board polling refreshes board-level data
      if (current?.taskDetailsById && Object.keys(current.taskDetailsById).length > 0) {
        normalized.taskDetailsById = { ...current.taskDetailsById }
      }
      return { boardsById: { ...s.boardsById, [boardId]: normalized } }
    })
  },

  hydrateTaskFromServer: (boardId, task) => {
    set((s) => {
      const board = s.boardsById[boardId] ?? makeEmptyBoard(boardId)
      // Same reconcile rule: don't overwrite while dirty
      if (board.isFlushing || board.outbox.length > 0) {
        return { boardsById: { ...s.boardsById, [boardId]: board } }
      }
      return {
        boardsById: {
          ...s.boardsById,
          [boardId]: {
            ...board,
            taskDetailsById: { ...board.taskDetailsById, [task.id]: task },
            lastRemoteHydrateAt: Date.now(),
          },
        },
      }
    })
  },

  touch: (boardId) => {
    set((s) => {
      const board = s.boardsById[boardId] ?? makeEmptyBoard(boardId)
      return {
        boardsById: {
          ...s.boardsById,
          [boardId]: { ...board, lastLocalActivityAt: Date.now() },
        },
      }
    })
  },

  createTaskLocal: ({ boardId, taskId, columnId, title, priority, createdAt }) => {
    set((s) => {
      const board = s.boardsById[boardId] ?? makeEmptyBoard(boardId)
      const tasksByColumn = { ...board.tasksByColumnId }
      const existingIds = tasksByColumn[columnId] ? [...tasksByColumn[columnId]] : []
      if (!existingIds.includes(taskId)) existingIds.push(taskId)
      tasksByColumn[columnId] = existingIds

      return {
        boardsById: {
          ...s.boardsById,
          [boardId]: {
            ...board,
            tasksById: {
              ...board.tasksById,
              [taskId]: { id: taskId, title, priority: priority ?? "none", columnId, createdAt },
            },
            tasksByColumnId: tasksByColumn,
            assigneeIdsByTaskId: { ...board.assigneeIdsByTaskId, [taskId]: board.assigneeIdsByTaskId[taskId] ?? [] },
            commentMetaByTaskId: { ...board.commentMetaByTaskId, [taskId]: { count: 0, lastCreatedAt: null } },
            lastLocalActivityAt: Date.now(),
          },
        },
      }
    })
  },

  updateContributorLocal: ({ boardId, contributorId, name, color }) => {
    set((s) => {
      const board = s.boardsById[boardId] ?? makeEmptyBoard(boardId)
      const existing = board.contributorsById[contributorId]
      if (!existing) return { boardsById: { ...s.boardsById, [boardId]: board } }
      return {
        boardsById: {
          ...s.boardsById,
          [boardId]: {
            ...board,
            contributorsById: {
              ...board.contributorsById,
              [contributorId]: {
                ...existing,
                ...(name !== undefined ? { name } : null),
                ...(color !== undefined ? { color } : null),
              },
            },
            lastLocalActivityAt: Date.now(),
          },
        },
      }
    })
  },

  createContributorLocal: ({ boardId, contributorId, name, color }) => {
    set((s) => {
      const board = s.boardsById[boardId] ?? makeEmptyBoard(boardId)
      if (board.contributorsById[contributorId]) return { boardsById: { ...s.boardsById, [boardId]: board } }
      return {
        boardsById: {
          ...s.boardsById,
          [boardId]: {
            ...board,
            contributorsById: {
              ...board.contributorsById,
              [contributorId]: { id: contributorId, name, color },
            },
            contributorOrder: [...board.contributorOrder, contributorId],
            lastLocalActivityAt: Date.now(),
          },
        },
      }
    })
  },

  deleteContributorLocal: ({ boardId, contributorId }) => {
    set((s) => {
      const board = s.boardsById[boardId] ?? makeEmptyBoard(boardId)
      if (!board.contributorsById[contributorId]) return { boardsById: { ...s.boardsById, [boardId]: board } }

      const { [contributorId]: _deleted, ...rest } = board.contributorsById
      const assigneeIdsByTaskId: Record<string, string[]> = {}
      for (const [taskId, ids] of Object.entries(board.assigneeIdsByTaskId)) {
        assigneeIdsByTaskId[taskId] = ids.filter((id) => id !== contributorId)
      }

      return {
        boardsById: {
          ...s.boardsById,
          [boardId]: {
            ...board,
            contributorsById: rest,
            contributorOrder: board.contributorOrder.filter((id) => id !== contributorId),
            assigneeIdsByTaskId,
            lastLocalActivityAt: Date.now(),
          },
        },
      }
    })
  },

  addAssigneeLocal: ({ boardId, taskId, contributorId }) => {
    set((s) => {
      const board = s.boardsById[boardId] ?? makeEmptyBoard(boardId)
      const current = board.assigneeIdsByTaskId[taskId] ?? []
      if (current.includes(contributorId)) {
        return { boardsById: { ...s.boardsById, [boardId]: board } }
      }
      const contributor = board.contributorsById[contributorId]

      // Also update taskDetailsById if it exists (so sidebar shows new assignee)
      let updatedTaskDetails = board.taskDetailsById
      const existingDetails = board.taskDetailsById[taskId]
      if (existingDetails && contributor) {
        const newAssignee = { contributor: { id: contributor.id, name: contributor.name, color: contributor.color } }
        updatedTaskDetails = {
          ...board.taskDetailsById,
          [taskId]: {
            ...existingDetails,
            assignees: [...existingDetails.assignees, newAssignee],
          },
        }
      }

      return {
        boardsById: {
          ...s.boardsById,
          [boardId]: {
            ...board,
            assigneeIdsByTaskId: {
              ...board.assigneeIdsByTaskId,
              [taskId]: [...current, contributorId],
            },
            taskDetailsById: updatedTaskDetails,
            lastLocalActivityAt: Date.now(),
          },
        },
      }
    })
  },

  updateTaskTitleLocal: ({ boardId, taskId, title }) => {
    set((s) => {
      const board = s.boardsById[boardId] ?? makeEmptyBoard(boardId)
      const task = board.tasksById[taskId]
      if (!task) return { boardsById: { ...s.boardsById, [boardId]: board } }

      // Also update taskDetailsById if it exists (so sidebar shows new title)
      let updatedTaskDetails = board.taskDetailsById
      const existingDetails = board.taskDetailsById[taskId]
      if (existingDetails) {
        updatedTaskDetails = {
          ...board.taskDetailsById,
          [taskId]: { ...existingDetails, title },
        }
      }

      return {
        boardsById: {
          ...s.boardsById,
          [boardId]: {
            ...board,
            tasksById: { ...board.tasksById, [taskId]: { ...task, title } },
            taskDetailsById: updatedTaskDetails,
            lastLocalActivityAt: Date.now(),
          },
        },
      }
    })
  },

  updateTaskPriorityLocal: ({ boardId, taskId, priority }) => {
    set((s) => {
      const board = s.boardsById[boardId] ?? makeEmptyBoard(boardId)
      const task = board.tasksById[taskId]
      if (!task) return { boardsById: { ...s.boardsById, [boardId]: board } }

      // Also update taskDetailsById if it exists (so sidebar shows updated priority)
      let updatedTaskDetails = board.taskDetailsById
      const existingDetails = board.taskDetailsById[taskId]
      if (existingDetails) {
        updatedTaskDetails = {
          ...board.taskDetailsById,
          [taskId]: { ...existingDetails, priority },
        }
      }

      return {
        boardsById: {
          ...s.boardsById,
          [boardId]: {
            ...board,
            tasksById: { ...board.tasksById, [taskId]: { ...task, priority } },
            taskDetailsById: updatedTaskDetails,
            lastLocalActivityAt: Date.now(),
          },
        },
      }
    })
  },

  moveTaskLocal: ({ boardId, taskId, toColumnId, toIndex }) => {
    set((s) => {
      const board = s.boardsById[boardId] ?? makeEmptyBoard(boardId)
      const task = board.tasksById[taskId]
      if (!task) return { boardsById: { ...s.boardsById, [boardId]: board } }

      const fromColumnId = task.columnId
      const tasksByColumnId = { ...board.tasksByColumnId }

      // Remove from source column
      const sourceIds = [...(tasksByColumnId[fromColumnId] ?? [])]
      const sourceIndex = sourceIds.indexOf(taskId)
      if (sourceIndex !== -1) {
        sourceIds.splice(sourceIndex, 1)
      }
      tasksByColumnId[fromColumnId] = sourceIds

      // Add to target column at specified index
      const targetIds = [...(tasksByColumnId[toColumnId] ?? [])]
      // If moving within same column and target index is after source, adjust
      if (fromColumnId === toColumnId && sourceIndex < toIndex) {
        targetIds.splice(toIndex, 0, taskId)
      } else {
        targetIds.splice(toIndex, 0, taskId)
      }
      tasksByColumnId[toColumnId] = targetIds

      // Update task's columnId
      const updatedTask = { ...task, columnId: toColumnId }

      return {
        boardsById: {
          ...s.boardsById,
          [boardId]: {
            ...board,
            tasksById: { ...board.tasksById, [taskId]: updatedTask },
            tasksByColumnId,
            lastLocalActivityAt: Date.now(),
          },
        },
      }
    })
  },

  reorderColumnsLocal: ({ boardId, columnId, toIndex }) => {
    set((s) => {
      const board = s.boardsById[boardId] ?? makeEmptyBoard(boardId)
      const columnOrder = [...board.columnOrder]

      const fromIndex = columnOrder.indexOf(columnId)
      if (fromIndex === -1) return { boardsById: { ...s.boardsById, [boardId]: board } }

      // Remove from current position and insert at new position
      columnOrder.splice(fromIndex, 1)
      columnOrder.splice(toIndex, 0, columnId)

      return {
        boardsById: {
          ...s.boardsById,
          [boardId]: {
            ...board,
            columnOrder,
            lastLocalActivityAt: Date.now(),
          },
        },
      }
    })
  },

  removeAssigneeLocal: ({ boardId, taskId, contributorId }) => {
    set((s) => {
      const board = s.boardsById[boardId] ?? makeEmptyBoard(boardId)
      const current = board.assigneeIdsByTaskId[taskId] ?? []
      if (!current.includes(contributorId)) {
        return { boardsById: { ...s.boardsById, [boardId]: board } }
      }

      // Also update taskDetailsById if it exists (so sidebar reflects removal)
      let updatedTaskDetails = board.taskDetailsById
      const existingDetails = board.taskDetailsById[taskId]
      if (existingDetails) {
        updatedTaskDetails = {
          ...board.taskDetailsById,
          [taskId]: {
            ...existingDetails,
            assignees: existingDetails.assignees.filter((a) => a.contributor.id !== contributorId),
          },
        }
      }

      return {
        boardsById: {
          ...s.boardsById,
          [boardId]: {
            ...board,
            assigneeIdsByTaskId: {
              ...board.assigneeIdsByTaskId,
              [taskId]: current.filter((id) => id !== contributorId),
            },
            taskDetailsById: updatedTaskDetails,
            lastLocalActivityAt: Date.now(),
          },
        },
      }
    })
  },

  createCommentLocal: ({ boardId, taskId, comment }) => {
    set((s) => {
      const board = s.boardsById[boardId] ?? makeEmptyBoard(boardId)
      const existing = board.taskDetailsById[taskId] ?? buildTaskDetails(board, taskId)
      if (!existing) return { boardsById: { ...s.boardsById, [boardId]: board } }

      // Keep comments ordered ASC (getTask returns ASC)
      const comments = [...existing.comments, comment].sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      })

      const prevMeta = board.commentMetaByTaskId[taskId] ?? { count: 0, lastCreatedAt: null }
      const nextMeta: CommentMeta = {
        count: prevMeta.count + 1,
        lastCreatedAt: comment.createdAt ?? prevMeta.lastCreatedAt,
      }

      return {
        boardsById: {
          ...s.boardsById,
          [boardId]: {
            ...board,
            taskDetailsById: { ...board.taskDetailsById, [taskId]: { ...existing, comments } },
            commentMetaByTaskId: { ...board.commentMetaByTaskId, [taskId]: nextMeta },
            lastLocalActivityAt: Date.now(),
          },
        },
      }
    })
  },

  updateCommentLocal: ({ boardId, taskId, commentId, author, content }) => {
    set((s) => {
      const board = s.boardsById[boardId] ?? makeEmptyBoard(boardId)
      const existing = board.taskDetailsById[taskId]
      if (!existing) return { boardsById: { ...s.boardsById, [boardId]: board } }

      const comments = existing.comments.map((c) =>
        c.id === commentId
          ? {
              ...c,
              content,
              author: author ?? c.author,
            }
          : c
      )

      return {
        boardsById: {
          ...s.boardsById,
          [boardId]: {
            ...board,
            taskDetailsById: { ...board.taskDetailsById, [taskId]: { ...existing, comments } },
            lastLocalActivityAt: Date.now(),
          },
        },
      }
    })
  },

  deleteCommentLocal: ({ boardId, taskId, commentId }) => {
    set((s) => {
      const board = s.boardsById[boardId] ?? makeEmptyBoard(boardId)
      const existing = board.taskDetailsById[taskId]
      if (!existing) return { boardsById: { ...s.boardsById, [boardId]: board } }

      const comments = existing.comments.filter((c) => c.id !== commentId)
      const lastCreatedAt = comments.length > 0 ? comments[comments.length - 1]?.createdAt ?? null : null
      const prevMeta = board.commentMetaByTaskId[taskId] ?? { count: 0, lastCreatedAt: null }
      const nextMeta: CommentMeta = {
        count: Math.max(0, prevMeta.count - 1),
        lastCreatedAt,
      }

      return {
        boardsById: {
          ...s.boardsById,
          [boardId]: {
            ...board,
            taskDetailsById: { ...board.taskDetailsById, [taskId]: { ...existing, comments } },
            commentMetaByTaskId: { ...board.commentMetaByTaskId, [taskId]: nextMeta },
            lastLocalActivityAt: Date.now(),
          },
        },
      }
    })
  },

  enqueue: (item) => {
    set((s) => {
      const boardId = item.boardId
      const board = s.boardsById[boardId] ?? makeEmptyBoard(boardId)
      const outboxItem: OutboxItem = {
        ...(item as any),
        id: item.id ?? crypto.randomUUID(),
        createdAt: item.createdAt ?? Date.now(),
      }
      return {
        boardsById: {
          ...s.boardsById,
          [boardId]: {
            ...board,
            outbox: [...board.outbox, outboxItem],
            lastLocalActivityAt: Date.now(),
          },
        },
      }
    })
  },

  popOutbox: (boardId, itemId) => {
    set((s) => {
      const board = s.boardsById[boardId]
      if (!board) return s
      return {
        boardsById: {
          ...s.boardsById,
          [boardId]: { ...board, outbox: board.outbox.filter((i) => i.id !== itemId) },
        },
      }
    })
  },

  setFlushing: (boardId, isFlushing) => {
    set((s) => {
      const board = s.boardsById[boardId] ?? makeEmptyBoard(boardId)
      return {
        boardsById: {
          ...s.boardsById,
          [boardId]: { ...board, isFlushing },
        },
      }
    })
  },
}))

// ---------- Selector helpers ----------

export type TaskCardVM = {
  id: string
  title: string
  priority: TaskPriority
  assignees: Array<{ id: string; name: string; color: ContributorColor }>
  commentCount: number
  lastCommentCreatedAt: Date | null
}

export type ColumnVM = {
  id: string
  name: string
  isCollapsed: boolean
  tasks: TaskCardVM[]
}

export function selectBoard(boardId: string) {
  return (s: BoardStoreState) => s.boardsById[boardId]
}

export function selectColumnsVM(boardId: string) {
  return (s: BoardStoreState): ColumnVM[] => {
    const board = s.boardsById[boardId]
    if (!board) return []

    return board.columnOrder.map((colId) => {
      const col = board.columnsById[colId]
      const taskIds = board.tasksByColumnId[colId] ?? []
      const tasks: TaskCardVM[] = taskIds
        .map((taskId) => {
          const task = board.tasksById[taskId]
          if (!task) return null
          const assigneeIds = board.assigneeIdsByTaskId[taskId] ?? []
          const assignees = assigneeIds
            .map((cid) => board.contributorsById[cid])
            .filter(Boolean)
            .map((c) => ({ id: c.id, name: c.name, color: c.color }))

          const meta = board.commentMetaByTaskId[taskId] ?? { count: 0, lastCreatedAt: null }
          return {
            id: task.id,
            title: task.title,
            priority: task.priority,
            assignees,
            commentCount: meta.count,
            lastCommentCreatedAt: meta.lastCreatedAt,
          }
        })
        .filter((x): x is TaskCardVM => x !== null)

      return { id: colId, name: col?.name ?? "", isCollapsed: col?.isCollapsed ?? false, tasks }
    })
  }
}

export function selectTaskDetails(boardId: string, taskId: string | null) {
  return (s: BoardStoreState) => {
    if (!taskId) return undefined
    const board = s.boardsById[boardId]
    return board?.taskDetailsById[taskId]
  }
}

export function selectOutboxStatus(boardId: string) {
  return (s: BoardStoreState) => {
    const board = s.boardsById[boardId]
    return {
      pending: (board?.outbox.length ?? 0) > 0,
      isFlushing: board?.isFlushing ?? false,
      lastLocalActivityAt: board?.lastLocalActivityAt ?? 0,
    }
  }
}
