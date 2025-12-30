"use client";

import { useState, useEffect, useRef } from "react";
import { Check, Cloud, CloudOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useBoardStore,
  selectOutboxStatus,
  selectOutboxItems,
  type OutboxItem,
} from "@/stores/board-store";
import { useShallow } from "zustand/react/shallow";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getOperationLabel } from "@/lib/outbox-labels";

type SyncStatus = "synced" | "syncing" | "pending" | "error";

// Minimum time each status should be displayed (in ms)
const MIN_DISPLAY_TIME = 1000;
const SAVED_DISPLAY_TIME = 2000;

interface SyncStatusPopoverContentProps {
  status: SyncStatus;
  pendingCount: number;
  outboxItems: OutboxItem[];
  hasPendingOps: boolean;
}

function SyncStatusPopoverContent({
  status,
  pendingCount,
  outboxItems,
  hasPendingOps,
}: SyncStatusPopoverContentProps) {
  return (
    <div className="space-y-3">
      <div aria-live="polite">
        <h3 className="font-semibold text-sm mb-2">Sync Status</h3>
        <div className="flex items-center gap-2 text-sm" role="status">
          <StatusIcon status={status} />
          <span>{getStatusLabel(status)}</span>
        </div>
        {hasPendingOps && (
          <p className="text-xs text-muted-foreground mt-1">
            {pendingCount} pending {pendingCount === 1 ? "operation" : "operations"}
          </p>
        )}
      </div>

      {hasPendingOps && outboxItems.length > 0 && (
        <div>
          <h4 className="font-medium text-xs mb-2 text-muted-foreground">Pending:</h4>
          <ul className="space-y-1" aria-label="Pending sync operations">
            {outboxItems.map((item) => (
              <li key={item.id} className="text-xs text-muted-foreground">
                • {getOperationLabel(item)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!hasPendingOps && <p className="text-xs text-muted-foreground">All changes saved</p>}
    </div>
  );
}

interface SyncIndicatorProps {
  boardId: string;
  className?: string;
}

export function SyncIndicator({ boardId, className }: SyncIndicatorProps) {
  const outboxStatus = useBoardStore(useShallow(selectOutboxStatus(boardId)));
  const outboxItems = useBoardStore(useShallow(selectOutboxItems(boardId)));

  // The status we're actually displaying (with debouncing)
  const [displayStatus, setDisplayStatus] = useState<SyncStatus | null>(null);

  // Track timing for debounce
  const statusStartTimeRef = useRef<number>(0);
  const pendingStatusRef = useRef<SyncStatus | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate actual status from outbox state
  const actualStatus: SyncStatus =
    outboxStatus.pending || outboxStatus.isFlushing ? "syncing" : "synced";

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastChange = now - statusStartTimeRef.current;

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Determine what the new display status should be
    let newDisplayStatus: SyncStatus | null = null;

    if (actualStatus === "syncing") {
      // Always show syncing immediately when mutations are happening
      newDisplayStatus = "syncing";
    } else if (actualStatus === "synced" && displayStatus === "syncing") {
      // Transitioning from syncing to synced - show "Saved"
      newDisplayStatus = "synced";
    } else if (actualStatus === "synced" && displayStatus === "synced") {
      // Already showing saved, will hide after timeout
      newDisplayStatus = "synced";
    } else if (actualStatus === "synced" && displayStatus === null) {
      // Was idle, still idle
      newDisplayStatus = null;
    }

    // Check if we need to wait before changing status
    const minTime = displayStatus === "synced" ? SAVED_DISPLAY_TIME : MIN_DISPLAY_TIME;

    if (displayStatus !== null && timeSinceLastChange < minTime) {
      // We haven't shown the current status long enough
      // Schedule the change for later
      pendingStatusRef.current = newDisplayStatus;
      const remainingTime = minTime - timeSinceLastChange;

      timeoutRef.current = setTimeout(() => {
        const pending = pendingStatusRef.current;
        pendingStatusRef.current = null;

        if (pending !== displayStatus) {
          statusStartTimeRef.current = Date.now();
          setDisplayStatus(pending);
        }
      }, remainingTime);
    } else if (newDisplayStatus !== displayStatus) {
      // Can change immediately
      statusStartTimeRef.current = now;
      setDisplayStatus(newDisplayStatus);

      // If showing "Saved", schedule hiding it
      if (newDisplayStatus === "synced") {
        timeoutRef.current = setTimeout(() => {
          // Only hide if we're still showing synced and no new mutations started
          if (pendingStatusRef.current === null) {
            setDisplayStatus(null);
          }
        }, SAVED_DISPLAY_TIME);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [actualStatus, displayStatus]);

  // Don't show anything when idle
  if (displayStatus === null) {
    return null;
  }

  const pendingCount = outboxItems.length;
  const hasPendingOps = pendingCount > 0 || outboxStatus.isFlushing;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          data-testid="sync-indicator"
          className={cn(
            "flex items-center gap-1.5 text-xs text-muted-foreground transition-opacity duration-200 hover:text-foreground cursor-pointer",
            className,
          )}
          title={getStatusTitle(displayStatus)}
          aria-label="Sync status"
        >
          <StatusIcon status={displayStatus} />
          <span className="hidden sm:inline">{getStatusLabel(displayStatus)}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 max-h-96 overflow-y-auto"
        data-testid="sync-indicator-popover"
      >
        <SyncStatusPopoverContent
          status={displayStatus}
          pendingCount={pendingCount}
          outboxItems={outboxItems}
          hasPendingOps={hasPendingOps}
        />
      </PopoverContent>
    </Popover>
  );
}

function StatusIcon({ status }: { status: SyncStatus }) {
  switch (status) {
    case "synced":
      return <Check className="h-3.5 w-3.5 text-green-500" />;
    case "syncing":
      return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
    case "pending":
      return <Cloud className="h-3.5 w-3.5 text-yellow-500" />;
    case "error":
      return <CloudOff className="h-3.5 w-3.5 text-destructive" />;
  }
}

function getStatusLabel(status: SyncStatus): string {
  switch (status) {
    case "synced":
      return "Saved";
    case "syncing":
      return "Saving...";
    case "pending":
      return "Pending";
    case "error":
      return "Error";
  }
}

function getStatusTitle(status: SyncStatus): string {
  switch (status) {
    case "synced":
      return "All changes saved";
    case "syncing":
      return "Saving changes...";
    case "pending":
      return "Changes pending sync";
    case "error":
      return "Failed to save changes";
  }
}
