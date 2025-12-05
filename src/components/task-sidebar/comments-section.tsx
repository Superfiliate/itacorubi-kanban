"use client"

import { useState, useEffect } from "react"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RichTextEditor, isRichTextEmpty } from "@/components/ui/rich-text-editor"
import { AuthorSelect, getRememberedAuthor } from "./author-select"
import { CommentItem } from "./comment-item"
import { createComment } from "@/actions/comments"
import { toast } from "sonner"
import type { ContributorColor } from "@/db/schema"

interface CommentsSectionProps {
  taskId: string
  boardId: string
  comments: Array<{
    id: string
    content: string
    createdAt: Date | null
    author: {
      id: string
      name: string
      color: ContributorColor
    }
  }>
  contributors: Array<{
    id: string
    name: string
    color: ContributorColor
  }>
}

export function CommentsSection({
  taskId,
  boardId,
  comments,
  contributors,
}: CommentsSectionProps) {
  const [newCommentContent, setNewCommentContent] = useState("")
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize author from localStorage on mount
  useEffect(() => {
    const rememberedAuthor = getRememberedAuthor(boardId)
    if (rememberedAuthor && contributors.some((c) => c.id === rememberedAuthor)) {
      setSelectedAuthorId(rememberedAuthor)
    }
  }, [boardId, contributors])

  const handleSubmit = async () => {
    if (isRichTextEmpty(newCommentContent) || !selectedAuthorId) return

    setIsSubmitting(true)
    await createComment(taskId, boardId, selectedAuthorId, newCommentContent)
    setNewCommentContent("")
    setIsSubmitting(false)
    toast.success("Comment added")
  }

  const canSubmit = !isRichTextEmpty(newCommentContent) && selectedAuthorId && !isSubmitting

  return (
    <div className="space-y-3 p-6">
      <h3 className="text-sm font-medium text-foreground">Comments</h3>

      {comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            No comments yet
          </p>
          <p className="text-xs text-muted-foreground/70">
            Be the first to add a comment
          </p>
        </div>
      ) : (
        comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            boardId={boardId}
            contributors={contributors}
          />
        ))
      )}

      {/* New comment form at the bottom */}
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 space-y-3 mt-6">
        <h4 className="text-xs font-medium text-muted-foreground">Add a comment</h4>
        <div className="space-y-2">
          <AuthorSelect
            boardId={boardId}
            selectedAuthorId={selectedAuthorId}
            onAuthorChange={setSelectedAuthorId}
            contributors={contributors}
            placeholder="Who are you?"
          />
        </div>
        <div className="space-y-2">
          <RichTextEditor
            content={newCommentContent}
            onChange={setNewCommentContent}
            placeholder="Write your comment..."
          />
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            size="sm"
          >
            Add Comment
          </Button>
        </div>
      </div>
    </div>
  )
}
