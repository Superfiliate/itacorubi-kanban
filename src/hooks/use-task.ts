"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createTask,
  getTask,
  updateTaskTitle,
  updateTaskPriority,
  updateTaskCreatedAt,
  updateTaskColumn,
  deleteTask,
} from "@/actions/tasks"
import {
  addAssignee,
  removeAssignee,
  createAndAssignContributor,
} from "@/actions/contributors"
import { createComment, updateComment, deleteComment } from "@/actions/comments"
import { getRandomEmoji } from "@/lib/emojis"
import { boardKeys, type BoardData, type BoardTask } from "./use-board"
import type { ContributorColor, TaskPriority } from "@/db/schema"
import { CONTRIBUTOR_COLORS } from "@/db/schema"
import { useBoardStore } from "@/stores/board-store"
import { flushBoardOutbox } from "@/lib/outbox/flush"

// Types for full task with comments
export interface TaskComment {
  id: string
  content: string
  createdAt: Date | null
  author: {
    id: string
    name: string
    color: ContributorColor
  }
}

export interface TaskWithComments {
  id: string
  title: string
  priority: TaskPriority
  columnId: string
  boardId: string
  createdAt: Date | null
  column: {
    id: string
    name: string
  }
  assignees: Array<{
    contributor: {
      id: string
      name: string
      color: ContributorColor
    }
  }>
  comments: TaskComment[]
}

// Query keys
export const taskKeys = {
  all: ["tasks"] as const,
  detail: (id: string) => ["tasks", id] as const,
}

// Hook to get full task details (for sidebar)
export function useTaskQuery(taskId: string | null) {
  return useQuery({
    queryKey: taskKeys.detail(taskId ?? ""),
    queryFn: () => (taskId ? getTask(taskId) as Promise<TaskWithComments | undefined> : undefined),
    enabled: !!taskId,
    refetchOnWindowFocus: false,
  })
}

// Hook to create a task with optimistic update
export function useCreateTask(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ columnId, title }: { columnId: string; title: string }) =>
      createTask(boardId, columnId, title),
    onMutate: async ({ columnId, title }) => {
      await queryClient.cancelQueries({ queryKey: boardKeys.detail(boardId) })

      const previous = queryClient.getQueryData<BoardData>(boardKeys.detail(boardId))
      const optimisticId = crypto.randomUUID()

      const newTask: BoardTask = {
        id: optimisticId,
        boardId,
        columnId,
        title,
        priority: "none",
        position: 0,
        createdAt: new Date(),
        assignees: [],
        comments: [],
      }

      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old

        return {
          ...old,
          columns: old.columns.map((col) => {
            if (col.id !== columnId) return col

            // Get the max position + 1
            const maxPosition = col.tasks.length > 0
              ? Math.max(...col.tasks.map((t) => t.position))
              : -1

            return {
              ...col,
              tasks: [...col.tasks, { ...newTask, position: maxPosition + 1 }],
            }
          }),
        }
      })

      return { previous, optimisticId, optimisticTask: newTask }
    },
    onSuccess: (serverId, _, context) => {
      // Replace optimistic ID with server ID in board cache
      // The title already matches since we passed it to the server
      if (context?.optimisticId && serverId !== context.optimisticId) {
        queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
          if (!old) return old
          return {
            ...old,
            columns: old.columns.map((col) => ({
              ...col,
              tasks: col.tasks.map((task) =>
                task.id === context.optimisticId ? { ...task, id: serverId } : task
              ),
            })),
          }
        })
      }
    },
    onError: (_err, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(boardKeys.detail(boardId), context.previous)
      }
    },
  })
}

// Hook to update task title
export function useUpdateTaskTitle(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title: string }) =>
      updateTaskTitle(taskId, title, boardId),
    onMutate: async ({ taskId, title }) => {
      await queryClient.cancelQueries({ queryKey: boardKeys.detail(boardId) })
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(taskId) })

      const previousBoard = queryClient.getQueryData<BoardData>(boardKeys.detail(boardId))
      const previousTask = queryClient.getQueryData<TaskWithComments>(taskKeys.detail(taskId))

      // Update local store (for sidebar)
      useBoardStore.getState().updateTaskTitleLocal({ boardId, taskId, title })

      // Update board cache
      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old
        return {
          ...old,
          columns: old.columns.map((col) => ({
            ...col,
            tasks: col.tasks.map((task) =>
              task.id === taskId ? { ...task, title } : task
            ),
          })),
        }
      })

      // Update task cache
      queryClient.setQueryData<TaskWithComments>(taskKeys.detail(taskId), (old) => {
        if (!old) return old
        return { ...old, title }
      })

      return { previousBoard, previousTask }
    },
    onError: (_err, { taskId }, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(boardKeys.detail(boardId), context.previousBoard)
      }
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(taskId), context.previousTask)
      }
    },
  })
}

// Hook to update task priority
export function useUpdateTaskPriority(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, priority }: { taskId: string; priority: TaskPriority }) =>
      updateTaskPriority(taskId, priority, boardId),
    onMutate: async ({ taskId, priority }) => {
      await queryClient.cancelQueries({ queryKey: boardKeys.detail(boardId) })
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(taskId) })

      const previousBoard = queryClient.getQueryData<BoardData>(boardKeys.detail(boardId))
      const previousTask = queryClient.getQueryData<TaskWithComments>(taskKeys.detail(taskId))

      // Update local store (for sidebar)
      useBoardStore.getState().updateTaskPriorityLocal({ boardId, taskId, priority })

      // Update board cache (cards)
      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old
        return {
          ...old,
          columns: old.columns.map((col) => ({
            ...col,
            tasks: col.tasks.map((task) =>
              task.id === taskId ? { ...task, priority } : task
            ),
          })),
        }
      })

      // Update task cache (sidebar)
      queryClient.setQueryData<TaskWithComments>(taskKeys.detail(taskId), (old) => {
        if (!old) return old
        return { ...old, priority }
      })

      return { previousBoard, previousTask }
    },
    onError: (_err, { taskId }, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(boardKeys.detail(boardId), context.previousBoard)
      }
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(taskId), context.previousTask)
      }
    },
  })
}

// Hook to update task created at
export function useUpdateTaskCreatedAt(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, createdAt }: { taskId: string; createdAt: Date }) =>
      updateTaskCreatedAt(taskId, createdAt, boardId),
    onMutate: async ({ taskId, createdAt }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(taskId) })

      const previousTask = queryClient.getQueryData<TaskWithComments>(taskKeys.detail(taskId))

      queryClient.setQueryData<TaskWithComments>(taskKeys.detail(taskId), (old) => {
        if (!old) return old
        return { ...old, createdAt }
      })

      return { previousTask }
    },
    onError: (_err, { taskId }, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(taskId), context.previousTask)
      }
    },
  })
}

// Hook to move task to another column
export function useUpdateTaskColumn(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      taskId,
      newColumnId,
      newPosition,
    }: {
      taskId: string
      newColumnId: string
      newPosition?: number
    }) => updateTaskColumn(taskId, newColumnId, boardId, newPosition),
    onMutate: async ({ taskId, newColumnId, newPosition }) => {
      await queryClient.cancelQueries({ queryKey: boardKeys.detail(boardId) })
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(taskId) })

      const previousBoard = queryClient.getQueryData<BoardData>(boardKeys.detail(boardId))
      const previousTask = queryClient.getQueryData<TaskWithComments>(taskKeys.detail(taskId))

      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old

        // Find the task
        let task: BoardTask | undefined
        let oldColumnId: string | undefined

        for (const col of old.columns) {
          const found = col.tasks.find((t) => t.id === taskId)
          if (found) {
            task = found
            oldColumnId = col.id
            break
          }
        }

        if (!task || !oldColumnId) return old

        // Skip if task is already in the correct position (handleDragOver already updated it)
        if (oldColumnId === newColumnId && task.position === newPosition) return old
        if (oldColumnId === newColumnId && newPosition === undefined) return old

        // Calculate new position if not provided
        const targetColumn = old.columns.find((c) => c.id === newColumnId)
        const finalPosition = newPosition ??
          (targetColumn ? Math.max(...targetColumn.tasks.map((t) => t.position), -1) + 1 : 0)

        return {
          ...old,
          columns: old.columns.map((col) => {
            if (col.id === oldColumnId && col.id !== newColumnId) {
              // Remove from old column and update positions
              const filtered = col.tasks.filter((t) => t.id !== taskId)
              return {
                ...col,
                tasks: filtered.map((t, i) => ({ ...t, position: i })),
              }
            }
            if (col.id === newColumnId) {
              // Add to new column
              const movedTask = { ...task!, columnId: newColumnId, position: finalPosition }
              const existingTasks = col.id === oldColumnId
                ? col.tasks.filter((t) => t.id !== taskId)
                : col.tasks

              const newTasks = [...existingTasks.map((t) =>
                t.position >= finalPosition ? { ...t, position: t.position + 1 } : t
              ), movedTask].sort((a, b) => a.position - b.position)

              // Normalize positions to be sequential (0, 1, 2, ...)
              return {
                ...col,
                tasks: newTasks.map((t, i) => ({ ...t, position: i })),
              }
            }
            return col
          }),
        }
      })

      // Update task cache with new column
      queryClient.setQueryData<TaskWithComments>(taskKeys.detail(taskId), (old) => {
        if (!old) return old
        const board = queryClient.getQueryData<BoardData>(boardKeys.detail(boardId))
        const newColumn = board?.columns.find((c) => c.id === newColumnId)
        return {
          ...old,
          columnId: newColumnId,
          column: newColumn ? { id: newColumn.id, name: newColumn.name } : old.column,
        }
      })

      return { previousBoard, previousTask }
    },
    onError: (_err, { taskId }, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(boardKeys.detail(boardId), context.previousBoard)
      }
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(taskId), context.previousTask)
      }
    },
  })
}

// Hook to delete a task
export function useDeleteTask(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId, boardId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: boardKeys.detail(boardId) })
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(taskId) })

      const previousBoard = queryClient.getQueryData<BoardData>(boardKeys.detail(boardId))

      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old

        let deletedTask: BoardTask | undefined
        let columnId: string | undefined

        for (const col of old.columns) {
          const found = col.tasks.find((t) => t.id === taskId)
          if (found) {
            deletedTask = found
            columnId = col.id
            break
          }
        }

        if (!deletedTask || !columnId) return old

        return {
          ...old,
          columns: old.columns.map((col) => {
            if (col.id !== columnId) return col
            return {
              ...col,
              tasks: col.tasks
                .filter((t) => t.id !== taskId)
                .map((t) =>
                  t.position > deletedTask!.position
                    ? { ...t, position: t.position - 1 }
                    : t
                ),
            }
          }),
        }
      })

      // Remove task from cache
      queryClient.removeQueries({ queryKey: taskKeys.detail(taskId) })

      return { previousBoard }
    },
    onError: (_err, _, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(boardKeys.detail(boardId), context.previousBoard)
      }
    },
  })
}

// Hook to add assignee to task
export function useAddAssignee(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, contributorId }: { taskId: string; contributorId: string }) =>
      addAssignee(taskId, contributorId, boardId),
    onMutate: async ({ taskId, contributorId }) => {
      await queryClient.cancelQueries({ queryKey: boardKeys.detail(boardId) })
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(taskId) })

      const previousBoard = queryClient.getQueryData<BoardData>(boardKeys.detail(boardId))
      const previousTask = queryClient.getQueryData<TaskWithComments>(taskKeys.detail(taskId))

      // Find contributor info
      const contributor = previousBoard?.contributors.find((c) => c.id === contributorId)
      if (!contributor) return { previousBoard, previousTask }

      const newAssignee = {
        contributor: {
          id: contributor.id,
          name: contributor.name,
          color: contributor.color,
        },
      }

      // Update local store (for sidebar)
      useBoardStore.getState().addAssigneeLocal({ boardId, taskId, contributorId })

      // Update board cache
      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old
        return {
          ...old,
          columns: old.columns.map((col) => ({
            ...col,
            tasks: col.tasks.map((task) =>
              task.id === taskId
                ? { ...task, assignees: [...task.assignees, newAssignee] }
                : task
            ),
          })),
        }
      })

      // Update task cache
      queryClient.setQueryData<TaskWithComments>(taskKeys.detail(taskId), (old) => {
        if (!old) return old
        return { ...old, assignees: [...old.assignees, newAssignee] }
      })

      return { previousBoard, previousTask }
    },
    onError: (_err, { taskId }, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(boardKeys.detail(boardId), context.previousBoard)
      }
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(taskId), context.previousTask)
      }
    },
  })
}

// Hook to remove assignee from task
export function useRemoveAssignee(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, contributorId }: { taskId: string; contributorId: string }) =>
      removeAssignee(taskId, contributorId, boardId),
    onMutate: async ({ taskId, contributorId }) => {
      await queryClient.cancelQueries({ queryKey: boardKeys.detail(boardId) })
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(taskId) })

      const previousBoard = queryClient.getQueryData<BoardData>(boardKeys.detail(boardId))
      const previousTask = queryClient.getQueryData<TaskWithComments>(taskKeys.detail(taskId))

      // Update local store (for sidebar)
      useBoardStore.getState().removeAssigneeLocal({ boardId, taskId, contributorId })

      // Update board cache
      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old
        return {
          ...old,
          columns: old.columns.map((col) => ({
            ...col,
            tasks: col.tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    assignees: task.assignees.filter(
                      (a) => a.contributor.id !== contributorId
                    ),
                  }
                : task
            ),
          })),
        }
      })

      // Update task cache
      queryClient.setQueryData<TaskWithComments>(taskKeys.detail(taskId), (old) => {
        if (!old) return old
        return {
          ...old,
          assignees: old.assignees.filter((a) => a.contributor.id !== contributorId),
        }
      })

      return { previousBoard, previousTask }
    },
    onError: (_err, { taskId }, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(boardKeys.detail(boardId), context.previousBoard)
      }
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(taskId), context.previousTask)
      }
    },
  })
}

// Hook to create and assign a new contributor
export function useCreateAndAssignContributor(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, name }: { taskId: string; name: string }) => {
      // Local-first: pick stable values on the client
      const contributorId = crypto.randomUUID()
      const color = CONTRIBUTOR_COLORS[Math.floor(Math.random() * CONTRIBUTOR_COLORS.length)]

      // Update local store immediately (single source for contributor identity)
      useBoardStore.getState().createContributorLocal({
        boardId,
        contributorId,
        name,
        color,
      })
      useBoardStore.getState().addAssigneeLocal({ boardId, taskId, contributorId })

      // Update TanStack caches for current UI (board cards + sidebar task cache)
      await queryClient.cancelQueries({ queryKey: boardKeys.detail(boardId) })
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(taskId) })

      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old
        const optimisticContributor = { id: contributorId, name, color, boardId }
        return {
          ...old,
          contributors: [...old.contributors, optimisticContributor],
          columns: old.columns.map((col) => ({
            ...col,
            tasks: col.tasks.map((t) => {
              if (t.id !== taskId) return t
              return {
                ...t,
                assignees: [
                  ...t.assignees,
                  { contributor: { id: contributorId, name, color } },
                ],
              }
            }),
          })),
        }
      })

      queryClient.setQueryData<TaskWithComments>(taskKeys.detail(taskId), (old) => {
        if (!old) return old
        return {
          ...old,
          assignees: [
            ...old.assignees,
            { contributor: { id: contributorId, name, color } },
          ],
        }
      })

      // Background sync via outbox (no placeholder color, no flicker)
      useBoardStore.getState().enqueue({
        type: "createAndAssignContributor",
        boardId,
        payload: { taskId, contributorId, name, color },
      })
      void flushBoardOutbox(boardId)

      return contributorId
    },
    onMutate: async () => {
      // mutationFn performs local-first work; keep onMutate as a no-op placeholder
      return {}
    },
    onSuccess: () => {
      // No invalidation needed; server stores client-chosen id/color.
    },
    onError: () => {
      // We optimize for good actors; errors are acceptable divergence.
    },
  })
}

// Hook to add a comment
export function useCreateComment(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      authorId,
      content,
    }: {
      taskId: string
      authorId: string
      content: string
    }) => {
      const board = useBoardStore.getState().boardsById[boardId]
      const authorFromStore = board?.contributorsById[authorId]
      const authorFromCache = queryClient
        .getQueryData<BoardData>(boardKeys.detail(boardId))
        ?.contributors.find((c) => c.id === authorId)

      const author = authorFromStore ?? authorFromCache
      if (!author) throw new Error("Author not found")

      const commentId = crypto.randomUUID()
      const createdAt = new Date()

      const newComment: TaskComment = {
        id: commentId,
        content,
        createdAt,
        author: { id: author.id, name: author.name, color: author.color },
      }

      // Local-first store (drives sidebar UI)
      useBoardStore.getState().createCommentLocal({ boardId, taskId, comment: newComment })

      // TanStack caches (board card meta + task query if present)
      queryClient.setQueryData<TaskWithComments>(taskKeys.detail(taskId), (old) => {
        if (!old) return old
        return { ...old, comments: [...old.comments, newComment] }
      })

      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old
        return {
          ...old,
          columns: old.columns.map((col) => ({
            ...col,
            tasks: col.tasks.map((task) => {
              if (task.id !== taskId) return task
              const newCommentMeta = { id: commentId, createdAt }
              const comments = [newCommentMeta, ...task.comments].sort((a, b) => {
                if (!a.createdAt || !b.createdAt) return 0
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              })
              return { ...task, comments }
            }),
          })),
        }
      })

      // Outbox sync (ensures ordering behind task creation)
      useBoardStore.getState().enqueue({
        type: "createComment",
        boardId,
        payload: { taskId, commentId, authorId, content, createdAt },
      })
      void flushBoardOutbox(boardId)

      return commentId
    },
  })
}

// Hook to update a comment
export function useUpdateComment(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      commentId,
      taskId,
      authorId,
      content,
    }: {
      commentId: string
      taskId: string
      authorId: string
      content: string
    }) => {
      const board = useBoardStore.getState().boardsById[boardId]
      const authorFromStore = board?.contributorsById[authorId]
      const authorFromCache = queryClient
        .getQueryData<BoardData>(boardKeys.detail(boardId))
        ?.contributors.find((c) => c.id === authorId)
      const author = authorFromStore ?? authorFromCache

      useBoardStore.getState().updateCommentLocal({
        boardId,
        taskId,
        commentId,
        author: author ? { id: author.id, name: author.name, color: author.color } : undefined,
        content,
      })

      queryClient.setQueryData<TaskWithComments>(taskKeys.detail(taskId), (old) => {
        if (!old) return old
        return {
          ...old,
          comments: old.comments.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  content,
                  author: author ? { id: author.id, name: author.name, color: author.color } : c.author,
                }
              : c
          ),
        }
      })

      useBoardStore.getState().enqueue({
        type: "updateComment",
        boardId,
        payload: { taskId, commentId, authorId, content },
      })
      void flushBoardOutbox(boardId)
    },
    onMutate: async ({ commentId, taskId, authorId, content }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(taskId) })

      const previousTask = queryClient.getQueryData<TaskWithComments>(taskKeys.detail(taskId))
      const board = queryClient.getQueryData<BoardData>(boardKeys.detail(boardId))

      // Find author info
      const author = board?.contributors.find((c) => c.id === authorId)

      queryClient.setQueryData<TaskWithComments>(taskKeys.detail(taskId), (old) => {
        if (!old) return old
        return {
          ...old,
          comments: old.comments.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  content,
                  author: author
                    ? { id: author.id, name: author.name, color: author.color }
                    : c.author,
                }
              : c
          ),
        }
      })

      return { previousTask }
    },
    onError: (_err, { taskId }, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(taskId), context.previousTask)
      }
    },
  })
}

// Hook to delete a comment
export function useDeleteComment(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ commentId, taskId }: { commentId: string; taskId: string }) => {
      useBoardStore.getState().deleteCommentLocal({ boardId, taskId, commentId })

      queryClient.setQueryData<TaskWithComments>(taskKeys.detail(taskId), (old) => {
        if (!old) return old
        return { ...old, comments: old.comments.filter((c) => c.id !== commentId) }
      })

      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old
        return {
          ...old,
          columns: old.columns.map((col) => ({
            ...col,
            tasks: col.tasks.map((task) =>
              task.id === taskId
                ? { ...task, comments: task.comments.filter((c) => c.id !== commentId) }
                : task
            ),
          })),
        }
      })

      useBoardStore.getState().enqueue({
        type: "deleteComment",
        boardId,
        payload: { taskId, commentId },
      })
      void flushBoardOutbox(boardId)
    },
    onMutate: async ({ commentId, taskId }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(taskId) })
      await queryClient.cancelQueries({ queryKey: boardKeys.detail(boardId) })

      const previousTask = queryClient.getQueryData<TaskWithComments>(taskKeys.detail(taskId))
      const previousBoard = queryClient.getQueryData<BoardData>(boardKeys.detail(boardId))

      // Update task cache
      queryClient.setQueryData<TaskWithComments>(taskKeys.detail(taskId), (old) => {
        if (!old) return old
        return { ...old, comments: old.comments.filter((c) => c.id !== commentId) }
      })

      // Update board cache
      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old
        return {
          ...old,
          columns: old.columns.map((col) => ({
            ...col,
            tasks: col.tasks.map((task) =>
              task.id === taskId
                ? { ...task, comments: task.comments.filter((c) => c.id !== commentId) }
                : task
            ),
          })),
        }
      })

      return { previousTask, previousBoard }
    },
    onError: (_err, { taskId }, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(taskId), context.previousTask)
      }
      if (context?.previousBoard) {
        queryClient.setQueryData(boardKeys.detail(boardId), context.previousBoard)
      }
    },
  })
}

// Hook for optimistic task updates in board view (for drag and drop)
export function useOptimisticTasksUpdate(boardId: string) {
  const queryClient = useQueryClient()

  return {
    setTasks: (columnId: string, updater: (tasks: BoardTask[]) => BoardTask[]) => {
      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old
        return {
          ...old,
          columns: old.columns.map((col) =>
            col.id === columnId ? { ...col, tasks: updater(col.tasks) } : col
          ),
        }
      })
    },
    moveTask: (taskId: string, fromColumnId: string, toColumnId: string, toPosition: number) => {
      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old

        let task: BoardTask | undefined
        for (const col of old.columns) {
          const found = col.tasks.find((t) => t.id === taskId)
          if (found) {
            task = found
            break
          }
        }

        if (!task) return old

        return {
          ...old,
          columns: old.columns.map((col) => {
            if (col.id === fromColumnId && col.id !== toColumnId) {
              return {
                ...col,
                tasks: col.tasks.filter((t) => t.id !== taskId),
              }
            }
            if (col.id === toColumnId) {
              const existingTasks = col.id === fromColumnId
                ? col.tasks.filter((t) => t.id !== taskId)
                : col.tasks
              const movedTask = { ...task!, columnId: toColumnId, position: toPosition }
              return {
                ...col,
                tasks: [...existingTasks, movedTask].sort((a, b) => a.position - b.position),
              }
            }
            return col
          }),
        }
      })
    },
  }
}
