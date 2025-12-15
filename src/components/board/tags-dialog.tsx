"use client"

import { useMemo, useState } from "react"
import { Tag, Trash2, ChevronDown, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EditableText } from "@/components/editable-text"
import { cn } from "@/lib/utils"
import { CONTRIBUTOR_COLORS, type ContributorColor } from "@/db/schema"
import {
  type TagWithStats,
} from "@/actions/tags"
import { toast } from "sonner"
import { useBoardStore, selectBoard } from "@/stores/board-store"
import { flushBoardOutbox } from "@/lib/outbox/flush"
import { useQueryClient } from "@tanstack/react-query"
import { boardKeys, type BoardData } from "@/hooks/use-board"
import {
  tagColorStyles,
  tagColorSwatches,
  getRandomTagColor,
} from "@/lib/tag-colors"

interface TagsDialogProps {
  boardId: string
  tags: TagWithStats[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ColorSelector({
  currentColor,
  onSelect,
}: {
  currentColor: ContributorColor
  onSelect: (color: ContributorColor) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-background transition-all hover:scale-110",
            tagColorSwatches[currentColor],
            "ring-transparent hover:ring-muted-foreground/50"
          )}
          title="Change color"
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="grid grid-cols-6 gap-2">
          {CONTRIBUTOR_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => {
                onSelect(color)
                setOpen(false)
              }}
              className={cn(
                "h-6 w-6 rounded-full transition-all hover:scale-110",
                tagColorSwatches[color],
                currentColor === color && "ring-2 ring-foreground ring-offset-2 ring-offset-background"
              )}
              title={color}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function TagRow({
  tag,
  boardId,
}: {
  tag: TagWithStats
  boardId: string
}) {
  const queryClient = useQueryClient()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const canDelete = tag.taskCount === 0
  const hasActivity = tag.taskCount > 0
  const localBoard = useBoardStore(selectBoard(boardId))
  const localTag = localBoard?.tagsById[tag.id]

  const displayName = localTag?.name ?? tag.name
  const displayColor = localTag?.color ?? tag.color

  const handleNameSave = async (name: string) => {
    // Update normalized store
    useBoardStore.getState().updateTagLocal({ boardId, tagId: tag.id, name })

    // Also update TanStack Query cache for tags list
    queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
      if (!old) return old
      return {
        ...old,
        tags: old.tags.map((t) => (t.id === tag.id ? { ...t, name } : t)),
      }
    })

    useBoardStore.getState().enqueue({
      type: "updateTag",
      boardId,
      payload: { tagId: tag.id, name },
    })
    void flushBoardOutbox(boardId)

    toast.success("Tag updated")
  }

  const handleColorChange = async (color: ContributorColor) => {
    // Update normalized store
    useBoardStore.getState().updateTagLocal({ boardId, tagId: tag.id, color })

    // Also update TanStack Query cache for tags list
    queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
      if (!old) return old
      return {
        ...old,
        tags: old.tags.map((t) => (t.id === tag.id ? { ...t, color } : t)),
      }
    })

    useBoardStore.getState().enqueue({
      type: "updateTag",
      boardId,
      payload: { tagId: tag.id, color },
    })
    void flushBoardOutbox(boardId)

    toast.success("Tag updated")
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      // Update normalized store
      useBoardStore.getState().deleteTagLocal({ boardId, tagId: tag.id })

      // Also update TanStack Query cache for tags list
      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old
        return {
          ...old,
          tags: old.tags.filter((t) => t.id !== tag.id),
        }
      })

      useBoardStore.getState().enqueue({
        type: "deleteTag",
        boardId,
        payload: { tagId: tag.id },
      })
      void flushBoardOutbox(boardId)

      toast.success("Tag deleted")
      setIsDeleteDialogOpen(false)
    } catch {
      toast.error("Failed to delete tag")
    } finally {
      setIsDeleting(false)
    }
  }

  const statsText = `${tag.taskCount} task${tag.taskCount !== 1 ? "s" : ""}`

  return (
    <div className="border-b border-border last:border-b-0">
      <div className="flex items-center gap-3 py-3">
        {/* Color selector */}
        <ColorSelector
          currentColor={displayColor}
          onSelect={handleColorChange}
        />

        {/* Name (editable) */}
        <div className="flex-1 min-w-0">
          <EditableText
            value={displayName}
            onSave={handleNameSave}
            className={cn(
              "inline-flex items-center rounded-md px-2 py-0.5 text-sm font-medium",
                tagColorStyles[displayColor]
            )}
            inputClassName="text-sm"
          />
        </div>

        {/* Stats (expandable) */}
        {hasActivity ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            <span>{statsText}</span>
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">{statsText}</span>
        )}

        {/* Delete button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => setIsDeleteDialogOpen(true)}
          disabled={!canDelete}
          title={
            canDelete
              ? "Delete tag"
              : "Cannot delete: has task assignments"
          }
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Expanded stats */}
      {isExpanded && hasActivity && (
        <div className="pb-3 pl-9 text-xs text-muted-foreground space-y-1">
          {tag.tasksByColumn
            .filter((col) => col.count > 0)
            .map((col) => (
              <div key={col.columnId}>
                {col.count} in {col.columnName}
              </div>
            ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{displayName}&quot;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <Tag className="h-16 w-16 text-muted-foreground/50" />
      <div className="text-center">
        <h3 className="text-heading">No tags yet</h3>
        <p className="mt-1 text-muted">
          Add tags to categorize and organize your tasks
        </p>
      </div>
    </div>
  )
}

function AddTagForm({ boardId }: { boardId: string }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return

    setIsAdding(true)
    try {
      const tagId = crypto.randomUUID()
      const color = getRandomTagColor()

      useBoardStore.getState().createTagLocal({
        boardId,
        tagId,
        name: trimmedName,
        color,
      })

      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old
        return {
          ...old,
          tags: [...old.tags, { id: tagId, boardId, name: trimmedName, color }],
        }
      })

      useBoardStore.getState().enqueue({
        type: "createTag",
        boardId,
        payload: { tagId, name: trimmedName, color },
      })
      void flushBoardOutbox(boardId)

      setName("")
      toast.success("Tag added")
    } catch {
      toast.error("Failed to add tag")
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 pt-4 border-t border-border">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New tag name..."
        disabled={isAdding}
        className="flex-1"
      />
      <Button type="submit" disabled={!name.trim() || isAdding} size="sm">
        <Plus className="h-4 w-4 mr-1" />
        Add
      </Button>
    </form>
  )
}

export type { TagWithStats }

export function TagsDialog({
  boardId,
  tags,
  open,
  onOpenChange,
}: TagsDialogProps) {
  const localBoard = useBoardStore(selectBoard(boardId))

  const displayTags = useMemo<TagWithStats[]>(() => {
    const byId = new Map<string, TagWithStats>()

    // Start from server-provided stats, but overlay name/color from local store if present.
    for (const t of tags) {
      const local = localBoard?.tagsById[t.id]
      byId.set(t.id, {
        ...t,
        name: local?.name ?? t.name,
        color: local?.color ?? t.color,
      })
    }

    // Append local-only tags (created locally) with empty stats.
    for (const id of localBoard?.tagOrder ?? []) {
      if (byId.has(id)) continue
      const t = localBoard?.tagsById[id]
      if (!t) continue
      byId.set(id, {
        id: t.id,
        name: t.name,
        color: t.color,
        boardId,
        taskCount: 0,
        tasksByColumn: [],
      })
    }

    return Array.from(byId.values())
  }, [tags, localBoard, boardId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tags
          </DialogTitle>
          <DialogDescription>
            Manage the tags for this board. Tags can be assigned to tasks to
            categorize and organize your work.
          </DialogDescription>
        </DialogHeader>

        {displayTags.length === 0 ? (
          <EmptyState />
        ) : (
          <ScrollArea className="max-h-[400px] -mx-6 px-6">
            {displayTags.map((tag) => (
              <TagRow
                key={tag.id}
                tag={tag}
                boardId={boardId}
              />
            ))}
          </ScrollArea>
        )}

        <AddTagForm boardId={boardId} />
      </DialogContent>
    </Dialog>
  )
}
