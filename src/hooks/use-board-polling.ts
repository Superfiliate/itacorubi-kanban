"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getBoard } from "@/actions/boards";
import { boardKeys, type BoardData } from "@/hooks/use-board";
import { selectOutboxStatus, useBoardStore } from "@/stores/board-store";
import { useShallow } from "zustand/react/shallow";

/**
 * Backoff steps optimized for active-user experience while protecting Vercel limits.
 *
 * Active users (within ACTIVE_THRESHOLD_MS): stay at fast polling (first few steps)
 * Idle users: gradually back off to 10 minutes
 * Hidden/unfocused: jump to >= 60s immediately
 *
 * Steps: 1s, 1s, 2s, 2s, 3s, 3s, 5s, 10s, 30s, 60s, 120s, 300s, 600s
 */
const BACKOFF_STEPS_MS = [
  1000, 1000, 2000, 2000, 3000, 3000, 5000, 10000, 30000, 60000, 120000, 300000, 600000,
] as const;

/** How long after last activity we consider the user "active" and keep fast polling */
const ACTIVE_THRESHOLD_MS = 60_000;

function nextBackoff(current: number) {
  const idx = BACKOFF_STEPS_MS.findIndex((v) => v === current);
  if (idx === -1) return BACKOFF_STEPS_MS[0];
  return BACKOFF_STEPS_MS[Math.min(idx + 1, BACKOFF_STEPS_MS.length - 1)];
}

/**
 * Poll board data with an activity/visibility-aware exponential backoff.
 *
 * - Active + visible (within 60s of activity): 1-3s polling
 * - Idle: gradual backoff up to 10 minutes
 * - Hidden/unfocused: jump quickly to >= 1 minute and keep backing off
 *
 * Remote snapshots are only applied when the local-first store is clean
 * (no pending/in-flight outbox), to avoid overwriting local edits.
 */
export function useBoardPolling(boardId: string) {
  const queryClient = useQueryClient();
  const outbox = useBoardStore(useShallow(selectOutboxStatus(boardId)));

  const [delayMs, setDelayMs] = useState<number>(BACKOFF_STEPS_MS[0]);
  const [lastUiActivityAt, setLastUiActivityAt] = useState<number>(() => Date.now());

  const focusedRef = useRef<boolean>(true);
  const timerRef = useRef<number | null>(null);

  const lastActivityAt = useMemo(() => {
    return Math.max(lastUiActivityAt, outbox.lastLocalActivityAt);
  }, [lastUiActivityAt, outbox.lastLocalActivityAt]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const markActive = () => setLastUiActivityAt(Date.now());
    const handleFocus = () => {
      focusedRef.current = true;
      setLastUiActivityAt(Date.now());
      setDelayMs(BACKOFF_STEPS_MS[0]);
    };
    const handleBlur = () => {
      focusedRef.current = false;
      setLastUiActivityAt(Date.now());
    };
    const handleVisibility = () => {
      setLastUiActivityAt(Date.now());
      if (document.visibilityState === "visible") {
        setDelayMs(BACKOFF_STEPS_MS[0]);
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibility);

    // User activity (even without mutations) should keep polling responsive.
    window.addEventListener("pointerdown", markActive);
    window.addEventListener("keydown", markActive);
    window.addEventListener("scroll", markActive, { passive: true });

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pointerdown", markActive);
      window.removeEventListener("keydown", markActive);
      window.removeEventListener("scroll", markActive as any);
    };
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const schedule = () => {
      timerRef.current = window.setTimeout(async () => {
        const now = Date.now();
        const recentlyActive = now - lastActivityAt < ACTIVE_THRESHOLD_MS;

        const currentlyVisible =
          typeof document === "undefined" ? true : document.visibilityState === "visible";
        const currentlyFocused = focusedRef.current;

        // Active + visible => reset to fast polling
        if (recentlyActive && currentlyVisible && currentlyFocused) {
          setDelayMs(BACKOFF_STEPS_MS[0]);
        } else if (!currentlyVisible || !currentlyFocused) {
          // Hidden/unfocused => jump quickly to >= 60s then backoff
          const next = nextBackoff(delayMs);
          setDelayMs(Math.max(60_000, next));
        } else {
          setDelayMs(nextBackoff(delayMs));
        }

        // Only reconcile when local store is clean
        const boardState = useBoardStore.getState().boardsById[boardId];
        const storeClean =
          !!boardState && boardState.outbox.length === 0 && boardState.isFlushing === false;

        if (storeClean && !outbox.pending && !outbox.isFlushing) {
          const remote = (await getBoard(boardId)) as BoardData | null;
          if (remote) {
            queryClient.setQueryData(boardKeys.detail(boardId), remote);
            useBoardStore.getState().hydrateBoardFromServer(boardId, remote);
          }
        }

        schedule();
      }, delayMs);
    };

    schedule();

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, delayMs, lastActivityAt, outbox.pending, outbox.isFlushing, queryClient]);

  // no return; side-effect hook
}
