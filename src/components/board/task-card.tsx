"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import Link from "next/link"
import { MessageSquare, User } from "lucide-react"
import { ContributorBadge } from "@/components/contributor-badge"
import { cn } from "@/lib/utils"
import type { ContributorColor, TaskPriority } from "@/db/schema"
import { TASK_PRIORITY_META } from "@/lib/task-priority"

interface TaskCardProps {
  id: string
  boardId: string
  title: string
  priority: TaskPriority
  assignees: Array<{
    contributor: {
      id: string
      name: string
      color: ContributorColor
    }
  }>
  comments: Array<{
    id: string
    createdAt: Date | null
  }>
}

function getCommentAgeColor(daysSinceLastComment: number): string {
  // Smooth transition: green → yellow (0-10 days) → red (10-20 days)
  // Using more granular steps for smoother visual transition

  if (daysSinceLastComment <= 0) {
    return "text-emerald-600"
  }
  if (daysSinceLastComment <= 2) {
    return "text-emerald-500"
  }
  if (daysSinceLastComment <= 4) {
    return "text-green-500"
  }
  if (daysSinceLastComment <= 6) {
    return "text-lime-500"
  }
  if (daysSinceLastComment <= 8) {
    return "text-yellow-500"
  }
  if (daysSinceLastComment <= 10) {
    return "text-yellow-600"
  }
  if (daysSinceLastComment <= 12) {
    return "text-amber-500"
  }
  if (daysSinceLastComment <= 14) {
    return "text-amber-600"
  }
  if (daysSinceLastComment <= 16) {
    return "text-orange-500"
  }
  if (daysSinceLastComment <= 18) {
    return "text-orange-600"
  }
  if (daysSinceLastComment <= 20) {
    return "text-red-500"
  }
  // >20 days: deep red
  return "text-red-600"
}

function getDaysSinceLastComment(comments: Array<{ createdAt: Date | null }>): number | null {
  if (comments.length === 0) return null

  // Comments are already ordered by createdAt DESC from getBoard
  const lastComment = comments[0]
  if (!lastComment.createdAt) return null

  const now = new Date()
  const lastCommentDate = new Date(lastComment.createdAt)
  const diffTime = now.getTime() - lastCommentDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

export function TaskCard({ id, boardId, title, priority, assignees, comments }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { type: "task" } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const daysSinceLastComment = getDaysSinceLastComment(comments)
  const commentAgeColor = daysSinceLastComment !== null
    ? getCommentAgeColor(daysSinceLastComment)
    : "text-muted-foreground"

  const commentAgeText = daysSinceLastComment !== null
    ? daysSinceLastComment === 0
      ? "today"
      : daysSinceLastComment === 1
        ? "1 day ago"
        : `${daysSinceLastComment} days ago`
    : null

  const { cardClassName, Icon: PriorityIcon, iconClassName } = TASK_PRIORITY_META[priority]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative glass rounded-lg p-3 transition-all hover:shadow-lg hover:scale-[1.02]",
        isDragging && "opacity-50 shadow-xl scale-105",
        cardClassName
      )}
      {...attributes}
      {...listeners}
    >
      <Link
        href={`/boards/${boardId}?task=${id}`}
        className="absolute inset-0 z-10"
        onClick={(e) => {
          // Prevent navigation when dragging
          if (isDragging) {
            e.preventDefault()
          }
        }}
      />
      <h4 className="text-sm font-medium text-foreground">
        {title}
      </h4>

      {/* Priority, Comments and Assignees row */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Priority icon */}
          {priority !== "none" && (
            <PriorityIcon className={cn("h-3.5 w-3.5", iconClassName)} />
          )}

          {/* Comment info */}
          {comments.length > 0 ? (
            <div className={cn("flex items-center gap-1 text-xs", commentAgeColor)}>
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{comments.length}</span>
              {commentAgeText && (
                <span className="opacity-80">· {commentAgeText}</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-muted-foreground/50">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>0</span>
            </div>
          )}
        </div>

        {/* Assignees */}
        {assignees.length > 0 ? (
          <div className="flex flex-wrap gap-1 justify-end">
            {assignees.map(({ contributor }) => (
              <ContributorBadge
                key={contributor.id}
                name={contributor.name}
                color={contributor.color}
              />
            ))}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-muted-foreground/40 px-2 py-0.5 text-xs text-muted-foreground/60">
            <User className="h-3 w-3" />
          </span>
        )}
      </div>
    </div>
  )
}
