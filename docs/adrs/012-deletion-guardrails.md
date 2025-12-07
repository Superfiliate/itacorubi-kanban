# ADR 012: Deletion Guardrails

All foreign keys use `onDelete: "restrict"`; cascades are disallowed.

- Prevent silent data loss; deletes must be explicit
- Before deleting, check related records and show clear errors/toasts
- Delete dependents intentionally (e.g., comments before tasks) rather than relying on the DB

## Examples

Guard:
```ts
const count = await db.select({ c: sql<number>`count(*)` }).from(child).where(eq(child.parentId, id))
if (count[0]?.c) throw new Error("Cannot delete: has dependents")
```

## Links
- FKs and restrict policies: `src/db/schema.ts`
- Task/comment deletes: `src/actions/tasks.ts`, `src/actions/comments.ts`
