"use client"

import { useState } from "react"
import { Users, Trash2, ChevronDown, ChevronRight, Plus } from "lucide-react"
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
  createContributor,
  updateContributor,
  deleteContributor,
  type ContributorWithStats,
} from "@/actions/contributors"
import { toast } from "sonner"

// Color styles matching contributor-badge.tsx
const colorStyles: Record<ContributorColor, string> = {
  rose: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  pink: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  fuchsia: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300",
  purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  violet: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  indigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  sky: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  cyan: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  teal: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  lime: "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300",
  yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  orange: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
}

// Solid color swatches for the picker
const colorSwatches: Record<ContributorColor, string> = {
  rose: "bg-rose-500",
  pink: "bg-pink-500",
  fuchsia: "bg-fuchsia-500",
  purple: "bg-purple-500",
  violet: "bg-violet-500",
  indigo: "bg-indigo-500",
  blue: "bg-blue-500",
  sky: "bg-sky-500",
  cyan: "bg-cyan-500",
  teal: "bg-teal-500",
  emerald: "bg-emerald-500",
  green: "bg-green-500",
  lime: "bg-lime-500",
  yellow: "bg-yellow-500",
  amber: "bg-amber-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
}

interface ContributorsDialogProps {
  boardId: string
  contributors: ContributorWithStats[]
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
            colorSwatches[currentColor],
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
                colorSwatches[color],
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

function ContributorRow({
  contributor,
  boardId,
}: {
  contributor: ContributorWithStats
  boardId: string
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const canDelete = contributor.taskCount === 0 && contributor.commentCount === 0
  const hasActivity = contributor.taskCount > 0 || contributor.commentCount > 0

  const handleNameSave = async (name: string) => {
    await updateContributor(contributor.id, boardId, { name })
    toast.success("Contributor updated")
  }

  const handleColorChange = async (color: ContributorColor) => {
    await updateContributor(contributor.id, boardId, { color })
    toast.success("Contributor updated")
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteContributor(contributor.id, boardId)
      toast.success("Contributor deleted")
      setIsDeleteDialogOpen(false)
    } catch {
      toast.error("Failed to delete contributor")
    } finally {
      setIsDeleting(false)
    }
  }

  const statsText = `${contributor.taskCount} task${contributor.taskCount !== 1 ? "s" : ""} · ${contributor.commentCount} comment${contributor.commentCount !== 1 ? "s" : ""}`

  return (
    <div className="border-b border-border last:border-b-0">
      <div className="flex items-center gap-3 py-3">
        {/* Color selector */}
        <ColorSelector
          currentColor={contributor.color}
          onSelect={handleColorChange}
        />

        {/* Name (editable) */}
        <div className="flex-1 min-w-0">
          <EditableText
            value={contributor.name}
            onSave={handleNameSave}
            className={cn(
              "inline-flex items-center rounded-md px-2 py-0.5 text-sm font-medium",
              colorStyles[contributor.color]
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
              ? "Delete contributor"
              : "Cannot delete: has tasks or comments"
          }
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Expanded stats */}
      {isExpanded && hasActivity && (
        <div className="pb-3 pl-9 text-xs text-muted-foreground space-y-1">
          {contributor.tasksByColumn
            .filter((col) => col.count > 0)
            .map((col) => (
              <div key={col.columnId}>
                {col.count} in {col.columnName}
              </div>
            ))}
          {contributor.commentCount > 0 && (
            <div>{contributor.commentCount} comments made</div>
          )}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contributor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{contributor.name}&quot;? This action
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
      <Users className="h-16 w-16 text-muted-foreground/50" />
      <div className="text-center">
        <h3 className="text-lg font-medium">No contributors yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Add contributors to assign them to tasks and track comments
        </p>
      </div>
    </div>
  )
}

function AddContributorForm({ boardId }: { boardId: string }) {
  const [name, setName] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return

    setIsAdding(true)
    try {
      await createContributor(boardId, trimmedName)
      setName("")
      toast.success("Contributor added")
    } catch {
      toast.error("Failed to add contributor")
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 pt-4 border-t border-border">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New contributor name..."
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

export type { ContributorWithStats }

export function ContributorsDialog({
  boardId,
  contributors,
  open,
  onOpenChange,
}: ContributorsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contributors
          </DialogTitle>
          <DialogDescription>
            Manage the contributors for this board. Contributors can be assigned
            to tasks and make comments.
          </DialogDescription>
        </DialogHeader>

        {contributors.length === 0 ? (
          <EmptyState />
        ) : (
          <ScrollArea className="max-h-[400px] -mx-6 px-6">
            {contributors.map((contributor) => (
              <ContributorRow
                key={contributor.id}
                contributor={contributor}
                boardId={boardId}
              />
            ))}
          </ScrollArea>
        )}

        <AddContributorForm boardId={boardId} />
      </DialogContent>
    </Dialog>
  )
}
