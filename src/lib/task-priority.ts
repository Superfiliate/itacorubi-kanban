import React from "react";
import type { LucideIcon } from "lucide-react";
import { CircleDashed, Flame, SignalHigh } from "lucide-react";
import type { TaskPriority } from "@/db/schema";
import { SignalLowWithBackground, SignalMediumWithBackground } from "@/components/priority-icons";

export type TaskPriorityMeta = {
  value: TaskPriority;
  label: string;
  Icon: LucideIcon | React.ComponentType<{ className?: string }>;
  iconClassName: string;
  /** Combined card styling: border accent + optional background tint */
  cardClassName: string;
};

export const TASK_PRIORITY_META: Record<TaskPriority, TaskPriorityMeta> = {
  none: {
    value: "none",
    label: "No priority",
    Icon: CircleDashed,
    iconClassName: "text-muted-foreground/70",
    cardClassName: "",
  },
  low: {
    value: "low",
    label: "Low",
    Icon: SignalLowWithBackground,
    iconClassName: "",
    cardClassName: "border-l-2 border-l-teal-300/40",
  },
  medium: {
    value: "medium",
    label: "Medium",
    Icon: SignalMediumWithBackground,
    iconClassName: "",
    cardClassName: "border-l-2 border-l-indigo-400/60",
  },
  high: {
    value: "high",
    label: "High",
    Icon: SignalHigh,
    iconClassName: "text-amber-500",
    cardClassName: "border-l-2 border-l-amber-400/70 bg-amber-500/5",
  },
  urgent: {
    value: "urgent",
    label: "Urgent",
    Icon: Flame,
    iconClassName: "text-red-500",
    cardClassName: "border-l-2 border-l-red-500/80 bg-red-500/8",
  },
};

export const TASK_PRIORITY_OPTIONS: TaskPriorityMeta[] = [
  TASK_PRIORITY_META.none,
  TASK_PRIORITY_META.low,
  TASK_PRIORITY_META.medium,
  TASK_PRIORITY_META.high,
  TASK_PRIORITY_META.urgent,
];
