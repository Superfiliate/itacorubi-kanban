import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: React.ReactNode;
  iconSize?: "sm" | "lg";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  iconSize = "lg",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <Icon
        className={cn("text-muted-foreground", iconSize === "sm" ? "h-12 w-12" : "h-16 w-16")}
      />
      <div>
        <h3 className="text-heading">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
