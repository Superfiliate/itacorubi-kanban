"use client";

import { cn } from "@/lib/utils";
import { tagColorStyles } from "@/lib/tag-colors";
import type { ContributorColor } from "@/db/schema";

interface TagBadgeProps {
  name: string;
  color: ContributorColor;
  variant?: "default" | "compact";
  className?: string;
  onRemove?: () => void;
}

export function TagBadge({ name, color, variant = "default", className, onRemove }: TagBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-1 rounded-md text-xs font-medium",
        variant === "compact" ? "px-1.5 py-0" : "px-2 py-0.5",
        tagColorStyles[color],
        className,
      )}
      title={name}
    >
      <span className={cn("truncate", variant === "compact" && "max-w-[8.5rem]")}>{name}</span>
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
  );
}
