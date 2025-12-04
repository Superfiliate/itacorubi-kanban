"use client"

import { cn } from "@/lib/utils"
import type { ContributorColor } from "@/db/schema"

interface ContributorBadgeProps {
  name: string
  color: ContributorColor
  className?: string
  onRemove?: () => void
}

const colorStyles: Record<ContributorColor, string> = {
  rose: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  pink: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  fuchsia: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300",
  purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  violet: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  indigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  sky: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  cyan: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  teal: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  lime: "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300",
  yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  orange: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
}

export function ContributorBadge({ name, color, className, onRemove }: ContributorBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        colorStyles[color],
        className
      )}
    >
      {name}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}
    </span>
  )
}
