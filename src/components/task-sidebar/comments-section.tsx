"use client"

import { useState, useMemo } from "react"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RichTextEditor, isRichTextEmpty } from "@/components/ui/rich-text-editor"
import { AuthorSelect, getRememberedAuthor } from "./author-select"
import { CommentItem } from "./comment-item"
import { useCreateComment } from "@/hooks/use-task"
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

  // Get initial author from localStorage - memoized to only run once per board
  const initialAuthorId = useMemo(() => {
    const rememberedAuthor = getRememberedAuthor(boardId)
    if (rememberedAuthor && contributors.some((c) => c.id === rememberedAuthor)) {
      return rememberedAuthor
    }
    return null
  }, [boardId, contributors])

  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(initialAuthorId)

  // Mutation
  const createCommentMutation = useCreateComment(boardId)

  const handleSubmit = () => {
    if (isRichTextEmpty(newCommentContent) || !selectedAuthorId) return

    createCommentMutation.mutate(
      { taskId, authorId: selectedAuthorId, content: newCommentContent },
      {
        onSuccess: () => {
          setNewCommentContent("")
          toast.success("Comment added")
        },
        onError: () => {
          toast.error("Failed to add comment")
        },
      }
    )
  }

  const canSubmit =
    !isRichTextEmpty(newCommentContent) &&
    selectedAuthorId &&
    !createCommentMutation.isPending

  return (
    <div className="space-y-3 p-6">
      <h3 className="text-heading-sm">Comments</h3>

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
            taskId={taskId}
            boardId={boardId}
            contributors={contributors}
          />
        ))
      )}

      {/* New comment form at the bottom */}
      <div className="glass-subtle rounded-lg border p-3 space-y-3 mt-6">
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
