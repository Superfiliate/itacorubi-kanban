"use client"

import { cn } from "@/lib/utils"
import { contributorColorStyles } from "@/lib/contributor-colors"
import type { ContributorColor } from "@/db/schema"

interface ContributorBadgeProps {
  name: string
  color: ContributorColor
  className?: string
  onRemove?: () => void
}

export function ContributorBadge({ name, color, className, onRemove }: ContributorBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        contributorColorStyles[color],
        className
      )}
    >
      {name}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
          aria-label={`Remove ${name}`}
          title={`Remove ${name}`}
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
