import React from "react"
import type { LucideIcon } from "lucide-react"
import { SignalHigh, SignalLow, SignalMedium } from "lucide-react"
import { cn } from "@/lib/utils"

// Composite signal icon component that shows SignalLow/Medium overlapped with gray SignalHigh
function CompositeSignalIcon({
  Icon,
  className,
  iconClassName,
}: {
  Icon: LucideIcon
  className?: string
  iconClassName?: string
}) {
  return (
    <span className={cn("relative inline-flex items-center", className)}>
      <SignalHigh className={cn("absolute text-muted-foreground/30", className)} />
      <Icon className={cn("relative", iconClassName, className)} />
    </span>
  )
}

// Wrapper components for low and medium priorities
export function SignalLowWithBackground({ className }: { className?: string }) {
  return (
    <CompositeSignalIcon
      Icon={SignalLow}
      className={className}
      iconClassName="text-teal-400"
    />
  )
}

export function SignalMediumWithBackground({ className }: { className?: string }) {
  return (
    <CompositeSignalIcon
      Icon={SignalMedium}
      className={className}
      iconClassName="text-indigo-500"
    />
  )
}
