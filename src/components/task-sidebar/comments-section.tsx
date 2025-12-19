"use client";

import { useState, useMemo } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichTextEditor, isRichTextEmpty } from "@/components/ui/rich-text-editor";
import { AuthorSelect, getRememberedAuthor } from "./author-select";
import { ContributorSelect } from "./contributor-select";
import { CommentItem } from "./comment-item";
import { useCreateComment } from "@/hooks/use-task";
import { toast } from "sonner";
import type { ContributorColor } from "@/db/schema";

interface CommentsSectionProps {
  taskId: string;
  boardId: string;
  comments: Array<{
    id: string;
    content: string;
    createdAt: Date | null;
    author: {
      id: string;
      name: string;
      color: ContributorColor;
    };
    stakeholder?: {
      id: string;
      name: string;
      color: ContributorColor;
    } | null;
  }>;
  contributors: Array<{
    id: string;
    name: string;
    color: ContributorColor;
  }>;
}

export function CommentsSection({ taskId, boardId, comments, contributors }: CommentsSectionProps) {
  const [newCommentContent, setNewCommentContent] = useState("");
  const [selectedStakeholderId, setSelectedStakeholderId] = useState<string | null>(null);
  // Generate a pending comment ID for file uploads - regenerated after each comment submission
  const [pendingCommentId, setPendingCommentId] = useState(() => crypto.randomUUID());
  // Track concurrent upload batches with a counter (not boolean) since multiple batches can overlap
  const [uploadingCount, setUploadingCount] = useState(0);
  const isUploading = uploadingCount > 0;

  // Derive current author data from contributors (normalized source of truth)
  // This ensures comment badges reflect latest contributor name/color
  const enrichedComments = useMemo(() => {
    const contributorsById = new Map(contributors.map((c) => [c.id, c]));
    return comments.map((comment) => {
      const currentAuthor = contributorsById.get(comment.author.id);
      const currentStakeholder = comment.stakeholder?.id
        ? contributorsById.get(comment.stakeholder.id)
        : null;
      return {
        ...comment,
        author: currentAuthor ?? comment.author,
        stakeholder: currentStakeholder ?? comment.stakeholder,
      };
    });
  }, [comments, contributors]);

  // Get initial author from localStorage - memoized to only run once per board
  const initialAuthorId = useMemo(() => {
    const rememberedAuthor = getRememberedAuthor(boardId);
    if (rememberedAuthor && contributors.some((c) => c.id === rememberedAuthor)) {
      return rememberedAuthor;
    }
    return null;
  }, [boardId, contributors]);

  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(initialAuthorId);

  // Mutation
  const createCommentMutation = useCreateComment(boardId);

  const handleSubmit = () => {
    if (isRichTextEmpty(newCommentContent) || !selectedAuthorId) return;

    createCommentMutation.mutate(
      {
        taskId,
        authorId: selectedAuthorId,
        content: newCommentContent,
        stakeholderId: selectedStakeholderId,
        commentId: pendingCommentId, // Use the pending ID so uploaded files are linked
      },
      {
        onSuccess: () => {
          setNewCommentContent("");
          setSelectedStakeholderId(null);
          setPendingCommentId(crypto.randomUUID()); // Generate new ID for next comment
          toast.success("Comment added");
        },
        onError: () => {
          toast.error("Failed to add comment");
        },
      },
    );
  };

  const canSubmit =
    !isRichTextEmpty(newCommentContent) &&
    selectedAuthorId &&
    !createCommentMutation.isPending &&
    !isUploading;

  // Compute reason for disabled state (in priority order)
  const disabledReason = !selectedAuthorId
    ? "Missing an author"
    : isRichTextEmpty(newCommentContent)
      ? "Missing content"
      : isUploading
        ? "Upload in progress..."
        : createCommentMutation.isPending
          ? "Saving..."
          : null;

  return (
    <div className="space-y-3 p-6">
      <h3 className="text-heading-sm">Comments</h3>

      {enrichedComments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">No comments yet</p>
          <p className="text-xs text-muted-foreground/70">Be the first to add a comment</p>
        </div>
      ) : (
        enrichedComments.map((comment) => (
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
        <div className="flex flex-col md:flex-row md:gap-3 space-y-2 md:space-y-0">
          <div className="flex-1 space-y-2">
            <span className="text-label">Author</span>
            <AuthorSelect
              boardId={boardId}
              selectedAuthorId={selectedAuthorId}
              onAuthorChange={setSelectedAuthorId}
              contributors={contributors}
              placeholder="Who are you?"
            />
          </div>
          <div className="flex-1 space-y-2">
            <span className="text-label">Stakeholder (optional)</span>
            <ContributorSelect
              boardId={boardId}
              selectedContributorId={selectedStakeholderId}
              onContributorChange={setSelectedStakeholderId}
              contributors={contributors}
              placeholder="Select stakeholder..."
              allowNone={true}
            />
          </div>
        </div>
        <div className="space-y-2">
          <span className="text-label">Content</span>
          <RichTextEditor
            content={newCommentContent}
            onChange={setNewCommentContent}
            placeholder="Write your comment..."
            boardId={boardId}
            commentId={pendingCommentId}
            onUploadStart={() => setUploadingCount((c) => c + 1)}
            onUploadEnd={() => setUploadingCount((c) => c - 1)}
          />
        </div>
        <div className="flex justify-end items-center gap-3">
          {disabledReason && (
            <span className="text-sm italic text-amber-600/60 dark:text-amber-400/60">
              {disabledReason}
            </span>
          )}
          <Button onClick={handleSubmit} disabled={!canSubmit} size="sm">
            Add Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
