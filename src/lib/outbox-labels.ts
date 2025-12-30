import type { OutboxItem } from "@/stores/board-store";

/**
 * Returns a human-readable label for an outbox operation.
 * Used in the sync indicator popover to show what operations are pending.
 */
export function getOperationLabel(item: OutboxItem): string {
  switch (item.type) {
    case "createTask":
      return "Creating task";
    case "updateTaskTitle":
      return "Updating task title";
    case "updateTaskPriority":
      return "Updating task priority";
    case "updateTaskCreatedAt":
      return "Updating task date";
    case "updateTaskColumn":
      return "Moving task";
    case "deleteTask":
      return "Deleting task";
    case "createComment":
      return "Creating comment";
    case "updateComment":
      return "Updating comment";
    case "deleteComment":
      return "Deleting comment";
    case "createContributor":
      return "Creating contributor";
    case "createAndAssignContributor":
      return "Creating and assigning contributor";
    case "updateContributor":
      return "Updating contributor";
    case "deleteContributor":
      return "Deleting contributor";
    case "addAssignee":
      return "Adding assignee";
    case "removeAssignee":
      return "Removing assignee";
    case "addStakeholder":
      return "Adding stakeholder";
    case "removeStakeholder":
      return "Removing stakeholder";
    case "createAndAddStakeholder":
      return "Creating and adding stakeholder";
    case "createTag":
      return "Creating tag";
    case "updateTag":
      return "Updating tag";
    case "deleteTag":
      return "Deleting tag";
    case "addTag":
      return "Adding tag";
    case "removeTag":
      return "Removing tag";
    case "createAndAddTag":
      return "Creating and adding tag";
    case "updateBoardTitle":
      return "Updating board title";
    case "createColumn":
      return "Creating column";
    case "updateColumnName":
      return "Updating column name";
    case "toggleColumnCollapsed":
      return "Toggling column";
    case "deleteColumn":
      return "Deleting column";
    case "reorderColumns":
      return "Reordering columns";
    default: {
      const _exhaustive: never = item;
      return `Unknown operation: ${(_exhaustive as { type: string }).type}`;
    }
  }
}
