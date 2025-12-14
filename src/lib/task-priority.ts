import type { LucideIcon } from "lucide-react"
import { ArrowDown, ArrowUp, Equal, Flame, Minus } from "lucide-react"
import type { TaskPriority } from "@/db/schema"

export type TaskPriorityMeta = {
  value: TaskPriority
  label: string
  Icon: LucideIcon
  iconClassName: string
  /** Combined card styling: border accent + optional background tint */
  cardClassName: string
}

export const TASK_PRIORITY_META: Record<TaskPriority, TaskPriorityMeta> = {
  none: {
    value: "none",
    label: "No priority",
    Icon: Minus,
    iconClassName: "text-muted-foreground/70",
    cardClassName: "",
  },
  low: {
    value: "low",
    label: "Low",
    Icon: ArrowDown,
    iconClassName: "text-sky-400",
    cardClassName: "border-l-2 border-l-sky-300/40",
  },
  medium: {
    value: "medium",
    label: "Medium",
    Icon: Equal,
    iconClassName: "text-amber-500",
    cardClassName: "border-l-2 border-l-amber-400/60",
  },
  high: {
    value: "high",
    label: "High",
    Icon: ArrowUp,
    iconClassName: "text-orange-600",
    cardClassName: "border-l-2 border-l-orange-500/70 bg-orange-500/5",
  },
  urgent: {
    value: "urgent",
    label: "Urgent",
    Icon: Flame,
    iconClassName: "text-red-500",
    cardClassName: "border-l-2 border-l-red-500/80 bg-red-500/8",
  },
}

export const TASK_PRIORITY_OPTIONS: TaskPriorityMeta[] = [
  TASK_PRIORITY_META.none,
  TASK_PRIORITY_META.low,
  TASK_PRIORITY_META.medium,
  TASK_PRIORITY_META.high,
  TASK_PRIORITY_META.urgent,
]
