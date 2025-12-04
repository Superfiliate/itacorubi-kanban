"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import Link from "next/link"
import { MessageSquare } from "lucide-react"
import { ContributorBadge } from "@/components/contributor-badge"
import { cn } from "@/lib/utils"
import type { ContributorColor } from "@/db/schema"

interface TaskCardProps {
  id: string
  boardId: string
  title: string
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
  // 0-10 days: transition from green to yellow
  // 10-20 days: transition from yellow to red
  // >20 days: red

  if (daysSinceLastComment <= 0) {
    return "text-emerald-600"
  }

  if (daysSinceLastComment <= 10) {
    // Interpolate from green (emerald) to yellow
    const ratio = daysSinceLastComment / 10
    if (ratio < 0.5) {
      return "text-emerald-500"
    }
    return "text-yellow-500"
  }

  if (daysSinceLastComment <= 15) {
    // Interpolate from yellow to orange
    return "text-amber-500"
  }

  if (daysSinceLastComment <= 20) {
    // Interpolate from orange to red
    return "text-orange-500"
  }

  // >20 days: red
  return "text-red-500"
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

export function TaskCard({ id, boardId, title, assignees, comments }: TaskCardProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
        isDragging && "opacity-50 shadow-lg"
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

      {/* Comments and Assignees row */}
      <div className="mt-2 flex items-center justify-between gap-2">
        {/* Comment info */}
        {comments.length > 0 ? (
          <div className={cn("flex items-center gap-1 text-xs", commentAgeColor)}>
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{comments.length}</span>
            {commentAgeText && (
              <span className="text-muted-foreground">· {commentAgeText}</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-muted-foreground/50">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>0</span>
          </div>
        )}

        {/* Assignees */}
        {assignees.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-end">
            {assignees.map(({ contributor }) => (
              <ContributorBadge
                key={contributor.id}
                name={contributor.name}
                color={contributor.color}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
