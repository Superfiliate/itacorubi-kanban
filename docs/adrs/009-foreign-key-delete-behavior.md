# ADR 009: Foreign Key Delete Behavior

## Context

When defining foreign key relationships in the database schema, we need to decide how deletions should cascade (or not) to related records.

## Decision

**Always use `onDelete: "restrict"` for foreign key relationships.**

This prevents accidental data loss by forcing explicit deletion of related records before the parent record can be deleted.

### Why Not CASCADE?

Using `onDelete: "cascade"` can lead to:
- Silent data loss when deleting a parent record
- Difficulty tracking what was deleted
- Unintended side effects in complex relationship chains

### Implementation Pattern

```typescript
// Good: Explicit restriction
export const taskAssignees = sqliteTable("task_assignees", {
  taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "restrict" }),
  contributorId: text("contributor_id").notNull().references(() => contributors.id, { onDelete: "restrict" }),
}, ...)

// Before deleting a contributor, explicitly check and handle relationships:
const assignmentCount = await db
  .select({ count: sql<number>`count(*)` })
  .from(taskAssignees)
  .where(eq(taskAssignees.contributorId, id))

if (assignmentCount > 0) {
  throw new Error("Cannot delete contributor with task assignments")
}
```

### UI Implications

When deletion is restricted:
1. Check related record counts before attempting delete
2. Disable delete buttons when deletion is not allowed
3. Show clear explanation to users (e.g., "Cannot delete: has X tasks assigned")
4. Optionally provide a way to reassign/remove related records first

## Consequences

- **Positive**: No accidental data loss, explicit and predictable behavior
- **Negative**: More code required to handle deletions properly
- **Trade-off**: Users must manually clean up related records before deletion
