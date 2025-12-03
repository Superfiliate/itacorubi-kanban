"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface TaskCardProps {
  id: string
  boardId: string
  title: string
  assignees: Array<{
    contributor: {
      id: string
      name: string
    }
  }>
}

export function TaskCard({ id, boardId, title, assignees }: TaskCardProps) {
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
        href={`/boards/${boardId}/tasks/${id}`}
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
      {assignees.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {assignees.map(({ contributor }) => (
            <Badge
              key={contributor.id}
              variant="secondary"
              className="text-xs"
            >
              {contributor.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
