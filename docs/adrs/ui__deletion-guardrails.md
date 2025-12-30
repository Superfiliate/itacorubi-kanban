# ADR 012: Deletion Guardrails

All foreign keys use `onDelete: "restrict"`. Cascades are disallowed to prevent silent data loss.

## Rationale

- **Prevent silent data loss**: Deletes must be explicit, not cascaded
- **Predictable behavior**: No unintended side effects in complex relationship chains
- **Trackable**: Know exactly what gets deleted and when

### Why Not CASCADE?

Using `onDelete: "cascade"` leads to:

- Silent data loss when deleting a parent record
- Difficulty tracking what was deleted
- Unintended side effects in complex relationship chains

## Implementation

### Schema Pattern

```typescript
// Always use restrict
export const taskAssignees = sqliteTable("task_assignees", {
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "restrict" }),
  contributorId: text("contributor_id")
    .notNull()
    .references(() => contributors.id, { onDelete: "restrict" }),
});
```

### Before Deleting

Check related records and fail with clear errors:

```typescript
const count = await db
  .select({ c: sql<number>`count(*)` })
  .from(taskAssignees)
  .where(eq(taskAssignees.contributorId, id));

if (count[0]?.c) {
  throw new Error("Cannot delete contributor: has task assignments");
}
```

### Delete Dependents Intentionally

Delete related records explicitly before the parent:

```typescript
// Delete comments before task
await db.delete(comments).where(eq(comments.taskId, taskId));
// Now safe to delete task
await db.delete(tasks).where(eq(tasks.id, taskId));
```

## UI Implications

When deletion is restricted:

1. Check related record counts before attempting delete
2. Disable delete buttons when deletion is not allowed
3. Show clear explanation to users (e.g., "Cannot delete: has X tasks assigned")
4. Optionally provide a way to reassign/remove related records first

## Key Files

- `src/db/schema.ts` - FK definitions with restrict policies
- `src/actions/tasks.ts` - Task deletion with dependency cleanup
- `src/actions/comments.ts` - Comment deletion
- `src/actions/contributors.ts` - Contributor deletion guards
