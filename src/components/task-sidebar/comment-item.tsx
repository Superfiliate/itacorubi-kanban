"use client"

import { useState } from "react"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { RichTextEditor, isRichTextEmpty } from "@/components/ui/rich-text-editor"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ContributorBadge } from "@/components/contributor-badge"
import { AuthorSelect } from "./author-select"
import { updateComment, deleteComment } from "@/actions/comments"
import type { ContributorColor } from "@/db/schema"

interface CommentItemProps {
  comment: {
    id: string
    content: string
    createdAt: Date | null
    author: {
      id: string
      name: string
      color: ContributorColor
    }
  }
  boardId: string
  contributors: Array<{
    id: string
    name: string
    color: ContributorColor
  }>
}

export function CommentItem({ comment, boardId, contributors }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [editAuthorId, setEditAuthorId] = useState(comment.author.id)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async () => {
    if (isRichTextEmpty(editContent)) return

    setIsSubmitting(true)
    await updateComment(comment.id, editAuthorId, editContent, boardId)
    setIsSubmitting(false)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditContent(comment.content)
    setEditAuthorId(comment.author.id)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    setIsSubmitting(true)
    await deleteComment(comment.id, boardId)
    setIsSubmitting(false)
    setIsDeleteDialogOpen(false)
  }

  const formattedDate = comment.createdAt
    ? formatDistanceToNow(comment.createdAt, { addSuffix: true })
    : "Unknown date"

  const localTime = comment.createdAt
    ? comment.createdAt.toLocaleString()
    : ""

  if (isEditing) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Author</label>
          <AuthorSelect
            boardId={boardId}
            selectedAuthorId={editAuthorId}
            onAuthorChange={setEditAuthorId}
            contributors={contributors}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Content</label>
          <RichTextEditor
            content={editContent}
            onChange={setEditContent}
            placeholder="Write your comment..."
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSubmitting || isRichTextEmpty(editContent)}
          >
            Save
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="group rounded-lg border border-border bg-card p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <ContributorBadge
              name={comment.author.name}
              color={comment.author.color}
            />
            <span
              className="text-xs text-muted-foreground"
              title={localTime}
            >
              {formattedDate}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-2 text-body">
          <RichTextEditor content={comment.content} editable={false} />
        </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
