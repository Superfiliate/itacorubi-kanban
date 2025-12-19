"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CommentsSection } from "./comments-section";
import { TaskDetails } from "./task-details";
import { useTaskQuery } from "@/hooks/use-task";
import { SyncIndicator } from "@/components/sync-indicator";
import { Button } from "@/components/ui/button";
import type { ContributorColor } from "@/db/schema";
import { ChevronLeft, Loader2 } from "lucide-react";
import { selectBoard, selectTaskDetails, useBoardStore } from "@/stores/board-store";

interface TaskSidebarProps {
  taskId: string;
  boardId: string;
  columns: Array<{
    id: string;
    name: string;
  }>;
  contributors: Array<{
    id: string;
    name: string;
    color: ContributorColor;
  }>;
  tags: Array<{
    id: string;
    name: string;
    color: ContributorColor;
  }>;
}

export function TaskSidebar({ taskId, boardId, columns, contributors, tags }: TaskSidebarProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const board = useBoardStore(selectBoard(boardId));
  const localTaskEntity = board?.tasksById[taskId];
  const pendingCreate = (board?.outbox ?? []).some(
    (i) => i.type === "createTask" && i.payload.taskId === taskId,
  );

  // Task details from local store (includes comments if previously fetched/created)
  const hydratedTaskDetails = useBoardStore(selectTaskDetails(boardId, taskId));

  // Fetch server task details when:
  // - We don't have hydrated task details (which includes comments), AND
  // - There's no pending create for this task (local-first creates don't need server fetch)
  const needsServerFetch = !hydratedTaskDetails && !pendingCreate;
  const { data: serverTask, isLoading: isServerLoading } = useTaskQuery(
    needsServerFetch ? taskId : null,
  );

  const taskForUI = useMemo(() => {
    // Start with hydrated task details or server task as base
    const baseTask = hydratedTaskDetails ?? serverTask;

    // If we have a local task entity and board, derive assignees and stakeholders from normalized store
    // This ensures contributor updates (name, color) are immediately reflected
    if (localTaskEntity && board) {
      const assigneeIds = board.assigneeIdsByTaskId[taskId] ?? [];
      const assignees = assigneeIds
        .map((cid) => board.contributorsById[cid])
        .filter(Boolean)
        .map((c) => ({ contributor: { id: c.id, name: c.name, color: c.color } }));

      const stakeholderIds = board.stakeholderIdsByTaskId[taskId] ?? [];
      const stakeholders = stakeholderIds
        .map((cid) => board.contributorsById[cid])
        .filter(Boolean)
        .map((c) => ({ contributor: { id: c.id, name: c.name, color: c.color } }));

      const tagIds = board.tagIdsByTaskId[taskId] ?? [];
      const tags = tagIds
        .map((tid) => board.tagsById[tid])
        .filter(Boolean)
        .map((t) => ({ tag: { id: t.id, name: t.name, color: t.color } }));

      return {
        id: localTaskEntity.id,
        title: localTaskEntity.title,
        priority: localTaskEntity.priority,
        columnId: localTaskEntity.columnId,
        boardId,
        createdAt: localTaskEntity.createdAt,
        column: {
          id: localTaskEntity.columnId,
          name: columns.find((c) => c.id === localTaskEntity.columnId)?.name ?? "",
        },
        assignees,
        stakeholders,
        tags,
        comments: baseTask?.comments ?? [],
      };
    }

    // Fallback: if we have a base task but no local entity, still derive assignees and stakeholders from normalized store
    // when available to ensure contributor color updates are reflected
    if (baseTask && board) {
      const assigneeIds =
        board.assigneeIdsByTaskId[taskId] ?? baseTask.assignees.map((a) => a.contributor.id);
      const assignees = assigneeIds
        .map((cid) => board.contributorsById[cid])
        .filter(Boolean)
        .map((c) => ({ contributor: { id: c.id, name: c.name, color: c.color } }));

      const stakeholderIds =
        board.stakeholderIdsByTaskId[taskId] ??
        (baseTask.stakeholders ?? []).map((s) => s.contributor.id);
      const stakeholders = stakeholderIds
        .map((cid) => board.contributorsById[cid])
        .filter(Boolean)
        .map((c) => ({ contributor: { id: c.id, name: c.name, color: c.color } }));

      const tagIds = board.tagIdsByTaskId[taskId] ?? (baseTask.tags ?? []).map((t) => t.tag.id);
      const tags = tagIds
        .map((tid) => board.tagsById[tid])
        .filter(Boolean)
        .map((t) => ({ tag: { id: t.id, name: t.name, color: t.color } }));

      return {
        ...baseTask,
        assignees,
        stakeholders,
        tags,
      };
    }

    return baseTask;
  }, [hydratedTaskDetails, localTaskEntity, board, taskId, boardId, columns, serverTask]);

  const currentContributors = useMemo(() => {
    if (board) {
      return board.contributorOrder
        .map((id) => board.contributorsById[id])
        .filter(Boolean)
        .map((c) => ({ id: c.id, name: c.name, color: c.color }));
    }
    return contributors;
  }, [board, contributors]);

  const currentTags = useMemo(() => {
    if (board) {
      return board.tagOrder
        .map((id) => board.tagsById[id])
        .filter(Boolean)
        .map((t) => ({ id: t.id, name: t.name, color: t.color }));
    }
    return tags;
  }, [board, tags]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Clear pending task to ensure clean state for reopening
    useBoardStore.getState().setPendingOpenTask(null);
    // Update URL
    router.replace(`/boards/${boardId}`);
  }, [router, boardId]);

  // Hydrate server task into local store when it arrives
  useEffect(() => {
    if (serverTask && !hydratedTaskDetails) {
      useBoardStore.getState().hydrateTaskFromServer(boardId, serverTask);
    }
  }, [serverTask, hydratedTaskDetails, boardId]);

  useEffect(() => {
    // If the task is truly missing (deep-link to invalid id), close gracefully.
    // For local-first creates, we never close while the create is pending.
    if (!pendingCreate && !localTaskEntity && !isServerLoading && !taskForUI) {
      handleClose();
    }
  }, [pendingCreate, localTaskEntity, isServerLoading, taskForUI, handleClose]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 lg:max-w-[1040px]" hideCloseButton>
        <SheetHeader className="sr-only">
          <SheetTitle>Edit Task</SheetTitle>
        </SheetHeader>

        {!taskForUI || (isServerLoading && !localTaskEntity && !hydratedTaskDetails) ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          /* Mobile/Tablet: single scroll container | Desktop: each panel scrolls independently */
          <div className="flex flex-1 min-h-0 flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
            {/* Task Details - First on mobile/tablet (stacked), right side on desktop */}
            <div className="relative order-1 lg:order-2 flex-none lg:flex-[3] min-h-0 lg:overflow-y-auto border-b lg:border-b-0 lg:border-l border-border">
              {/* Sticky header - transparent to inherit sidebar glass */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2.5 border-b border-border/20">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 gap-1 rounded-full px-3 text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="text-sm">Back</span>
                </Button>
                <SyncIndicator boardId={boardId} />
              </div>
              <TaskDetails
                task={{
                  id: taskForUI.id,
                  title: taskForUI.title,
                  priority: taskForUI.priority,
                  columnId: taskForUI.columnId,
                  boardId: boardId,
                  createdAt: taskForUI.createdAt,
                  assignees: taskForUI.assignees,
                  stakeholders: taskForUI.stakeholders,
                  tags: taskForUI.tags,
                }}
                columns={columns}
                contributors={currentContributors}
                tags={currentTags}
                onClose={handleClose}
              />
            </div>

            {/* Comments - Second on mobile/tablet (stacked), left side on desktop */}
            <div className="order-2 lg:order-1 flex-1 lg:flex-[7] min-h-0 lg:overflow-y-auto">
              <CommentsSection
                taskId={taskForUI.id}
                boardId={boardId}
                comments={taskForUI.comments}
                contributors={currentContributors}
              />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

interface TaskSidebarHostProps {
  boardId: string;
  columns: Array<{ id: string; name: string }>;
  contributors: Array<{ id: string; name: string; color: ContributorColor }>;
  tags: Array<{ id: string; name: string; color: ContributorColor }>;
}

export function TaskSidebarHost({ boardId, columns, contributors, tags }: TaskSidebarHostProps) {
  const searchParams = useSearchParams();
  const urlTaskId = searchParams.get("task");
  const [openCount, setOpenCount] = useState(0);

  // Use pending task from zustand for instant sidebar (bypasses router.push delay)
  const pendingOpenTask = useBoardStore((s) => s.pendingOpenTask);
  const pendingTaskId = pendingOpenTask?.boardId === boardId ? pendingOpenTask.taskId : null;

  // Prefer pending task (local-first), fall back to URL (for direct links/refreshes)
  const taskId = pendingTaskId ?? urlTaskId;

  // Track when a new sidebar opens (increment counter for unique key)
  useEffect(() => {
    if (taskId) {
      setOpenCount((c) => c + 1);
    }
  }, [taskId]);

  // Clear pending task once URL catches up
  useEffect(() => {
    if (urlTaskId && pendingTaskId && urlTaskId === pendingTaskId) {
      useBoardStore.getState().setPendingOpenTask(null);
    }
  }, [urlTaskId, pendingTaskId]);

  if (!taskId) return null;

  return (
    <TaskSidebar
      key={`${taskId}-${openCount}`}
      taskId={taskId}
      boardId={boardId}
      columns={columns}
      contributors={contributors}
      tags={tags}
    />
  );
}
