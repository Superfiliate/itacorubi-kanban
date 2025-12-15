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
    id: string
    name: string
    color: ContributorColor
  }>
  commentCount: number
  lastCommentCreatedAt: Date | null
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

function getDaysSinceLastComment(lastCommentCreatedAt: Date | null): number | null {
  if (!lastCommentCreatedAt) return null

  const now = new Date()
  const lastCommentDate = new Date(lastCommentCreatedAt)
  const diffTime = now.getTime() - lastCommentDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

export function TaskCard({ id, boardId, title, priority, assignees, commentCount, lastCommentCreatedAt }: TaskCardProps) {
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

  const daysSinceLastComment = getDaysSinceLastComment(lastCommentCreatedAt)
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
        "group relative glass rounded-lg px-3 py-2 transition-all hover:shadow-lg hover:scale-[1.01]",
        isDragging && "opacity-50 shadow-xl scale-[1.03]",
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
      <h4 className="text-heading-sm text-foreground leading-snug">
        {title}
      </h4>

      {/* Priority + comments meta row */}
      <div className="mt-1.5 flex items-center gap-2">
        <PriorityIcon className={cn("h-3 w-3 shrink-0", iconClassName)} />

        {commentCount > 0 ? (
          <div className={cn("flex min-w-0 items-center gap-1 text-[11px] leading-4", commentAgeColor)}>
            <MessageSquare className="h-3 w-3 shrink-0" />
            <span className="shrink-0">{commentCount}</span>
            {commentAgeText && (
              <span className="truncate opacity-80">· {commentAgeText}</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[11px] leading-4 text-muted-foreground/50">
            <MessageSquare className="h-3 w-3 shrink-0" />
            <span>0</span>
          </div>
        )}
      </div>

      {/* Assignees row (separate so wrapping doesn't misalign meta) */}
      <div className="mt-1.5 flex items-start justify-end">
        {assignees.length > 0 ? (
          <div className="flex flex-wrap justify-end gap-1">
            {assignees.map((assignee) => (
              <ContributorBadge
                key={assignee.id}
                name={assignee.name}
                color={assignee.color}
                variant="compact"
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
