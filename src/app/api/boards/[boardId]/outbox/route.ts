import { NextResponse } from "next/server";
import { requireBoardAccess } from "@/lib/secure-board";

import { updateBoardTitle } from "@/actions/boards";
import {
  createColumn,
  updateColumnName,
  toggleColumnCollapsed,
  deleteColumn,
  reorderColumns,
} from "@/actions/columns";
import {
  createTask,
  updateTaskTitle,
  updateTaskPriority,
  updateTaskCreatedAt,
  updateTaskColumn,
  reorderTasks,
  deleteTask,
  type TaskReorderMode,
} from "@/actions/tasks";
import {
  createContributor,
  createAndAssignContributor,
  updateContributor,
  deleteContributor,
  addAssignee,
  removeAssignee,
  addStakeholder,
  removeStakeholder,
  createAndAddStakeholder,
} from "@/actions/contributors";
import {
  createTag,
  updateTag,
  deleteTag,
  addTagToTask,
  removeTagFromTask,
  createAndAddTag,
} from "@/actions/tags";
import { createComment, updateComment, deleteComment } from "@/actions/comments";

type AnyOutboxItem = {
  id?: string;
  type: string;
  boardId: string;
  payload: Record<string, unknown>;
};

interface RouteParams {
  params: Promise<{ boardId: string }>;
}

function coerceDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return undefined;
    const ms = value < 10_000_000_000 ? value * 1000 : value;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    // If it's a numeric string, treat small values as seconds (compat with older payloads).
    if (/^\d+$/.test(trimmed)) {
      const n = Number(trimmed);
      if (!Number.isFinite(n)) return undefined;
      const ms = n < 10_000_000_000 ? n * 1000 : n;
      const d = new Date(ms);
      return Number.isNaN(d.getTime()) ? undefined : d;
    }
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

async function execute(item: AnyOutboxItem): Promise<void> {
  switch (item.type) {
    // Task operations
    case "createTask": {
      const { taskId, columnId, title, createdAt } = item.payload as {
        taskId: string;
        columnId: string;
        title: string;
        createdAt: unknown;
      };
      await createTask(item.boardId, columnId, title, taskId, coerceDate(createdAt));
      return;
    }
    case "updateTaskTitle": {
      const { taskId, title } = item.payload as { taskId: string; title: string };
      await updateTaskTitle(taskId, title, item.boardId);
      return;
    }
    case "updateTaskPriority": {
      const { taskId, priority } = item.payload as { taskId: string; priority: string };
      await updateTaskPriority(taskId, priority as never, item.boardId);
      return;
    }
    case "updateTaskCreatedAt": {
      const { taskId, createdAt } = item.payload as { taskId: string; createdAt: Date };
      const d = coerceDate(createdAt);
      if (!d) throw new Error("Invalid createdAt");
      await updateTaskCreatedAt(taskId, d, item.boardId);
      return;
    }
    case "updateTaskColumn": {
      const { taskId, columnId, position } = item.payload as {
        taskId: string;
        columnId: string;
        position?: number;
      };
      await updateTaskColumn(taskId, columnId, item.boardId, position);
      return;
    }
    case "reorderTasks": {
      const { mode } = item.payload as { mode: TaskReorderMode };
      await reorderTasks(item.boardId, mode);
      return;
    }
    case "deleteTask": {
      const { taskId } = item.payload as { taskId: string };
      await deleteTask(taskId, item.boardId);
      return;
    }

    // Contributor operations
    case "createContributor": {
      const { contributorId, name, color } = item.payload as {
        contributorId: string;
        name: string;
        color: never;
      };
      await createContributor(item.boardId, name, contributorId, color);
      return;
    }
    case "createAndAssignContributor": {
      const { taskId, contributorId, name, color } = item.payload as {
        taskId: string;
        contributorId: string;
        name: string;
        color: never;
      };
      await createAndAssignContributor(taskId, item.boardId, name, contributorId, color);
      return;
    }
    case "updateContributor": {
      const { contributorId, name, color, email } = item.payload as {
        contributorId: string;
        name?: string;
        color?: never;
        email?: string | null;
      };
      await updateContributor(contributorId, item.boardId, { name, color, email });
      return;
    }
    case "deleteContributor": {
      const { contributorId } = item.payload as { contributorId: string };
      await deleteContributor(contributorId, item.boardId);
      return;
    }

    // Assignee operations
    case "addAssignee": {
      const { taskId, contributorId } = item.payload as { taskId: string; contributorId: string };
      await addAssignee(taskId, contributorId, item.boardId);
      return;
    }
    case "removeAssignee": {
      const { taskId, contributorId } = item.payload as { taskId: string; contributorId: string };
      await removeAssignee(taskId, contributorId, item.boardId);
      return;
    }

    // Stakeholder operations
    case "addStakeholder": {
      const { taskId, contributorId } = item.payload as { taskId: string; contributorId: string };
      await addStakeholder(taskId, contributorId, item.boardId);
      return;
    }
    case "removeStakeholder": {
      const { taskId, contributorId } = item.payload as { taskId: string; contributorId: string };
      await removeStakeholder(taskId, contributorId, item.boardId);
      return;
    }
    case "createAndAddStakeholder": {
      const { taskId, contributorId, name, color } = item.payload as {
        taskId: string;
        contributorId: string;
        name: string;
        color: never;
      };
      await createAndAddStakeholder(taskId, item.boardId, name, contributorId, color);
      return;
    }

    // Tag operations
    case "createTag": {
      const { tagId, name, color } = item.payload as { tagId: string; name: string; color: never };
      await createTag(item.boardId, name, tagId, color);
      return;
    }
    case "updateTag": {
      const { tagId, name, color } = item.payload as {
        tagId: string;
        name?: string;
        color?: never;
      };
      await updateTag(tagId, item.boardId, { name, color });
      return;
    }
    case "deleteTag": {
      const { tagId } = item.payload as { tagId: string };
      await deleteTag(tagId, item.boardId);
      return;
    }
    case "addTag": {
      const { taskId, tagId } = item.payload as { taskId: string; tagId: string };
      await addTagToTask(taskId, tagId, item.boardId);
      return;
    }
    case "removeTag": {
      const { taskId, tagId } = item.payload as { taskId: string; tagId: string };
      await removeTagFromTask(taskId, tagId, item.boardId);
      return;
    }
    case "createAndAddTag": {
      const { taskId, tagId, name, color } = item.payload as {
        taskId: string;
        tagId: string;
        name: string;
        color: never;
      };
      await createAndAddTag(taskId, item.boardId, name, tagId, color);
      return;
    }

    // Comment operations
    case "createComment": {
      const { taskId, commentId, authorId, content, createdAt, stakeholderId } = item.payload as {
        taskId: string;
        commentId: string;
        authorId: string;
        content: string;
        createdAt: unknown;
        stakeholderId?: string | null;
      };
      const d = coerceDate(createdAt);
      if (!d) throw new Error("Invalid createdAt");
      await createComment(taskId, item.boardId, authorId, content, commentId, d, stakeholderId);
      return;
    }
    case "updateComment": {
      const { commentId, authorId, content, stakeholderId } = item.payload as {
        commentId: string;
        authorId: string;
        content: string;
        stakeholderId?: string | null;
      };
      await updateComment(commentId, authorId, content, item.boardId, stakeholderId);
      return;
    }
    case "deleteComment": {
      const { commentId } = item.payload as { commentId: string };
      await deleteComment(commentId, item.boardId);
      return;
    }

    // Board operations
    case "updateBoardTitle": {
      const { title } = item.payload as { title: string };
      await updateBoardTitle(item.boardId, title);
      return;
    }

    // Column operations
    case "createColumn": {
      const { columnId } = item.payload as { columnId: string };
      await createColumn(item.boardId, columnId);
      return;
    }
    case "updateColumnName": {
      const { columnId, name } = item.payload as { columnId: string; name: string };
      await updateColumnName(columnId, name, item.boardId);
      return;
    }
    case "toggleColumnCollapsed": {
      const { columnId } = item.payload as { columnId: string };
      await toggleColumnCollapsed(columnId, item.boardId);
      return;
    }
    case "deleteColumn": {
      const { columnId } = item.payload as { columnId: string };
      await deleteColumn(columnId, item.boardId);
      return;
    }
    case "reorderColumns": {
      const { columnId, newPosition } = item.payload as { columnId: string; newPosition: number };
      await reorderColumns(item.boardId, columnId, newPosition);
      return;
    }

    default:
      throw new Error(`Unknown outbox item type: ${item.type}`);
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const { boardId } = await params;

  try {
    await requireBoardAccess(boardId);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const item = (body as { item?: AnyOutboxItem }).item;
  if (!item || typeof item !== "object") {
    return NextResponse.json({ error: "Missing item" }, { status: 400 });
  }

  if (item.boardId !== boardId) {
    return NextResponse.json({ error: "Board mismatch" }, { status: 400 });
  }

  try {
    await execute(item);
    return NextResponse.json({ ok: true });
  } catch (error) {
    // Log on the server for observability during tests.
    // eslint-disable-next-line no-console
    console.error("[outbox] execute failed", { boardId, type: item.type, error });
    return NextResponse.json(
      { error: "Failed", details: error instanceof Error ? error.message : undefined },
      { status: 500 },
    );
  }
}
