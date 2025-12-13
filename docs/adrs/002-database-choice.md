# ADR 002: Database and ORM

We use **Turso** (SQLite/libSQL) with **Drizzle ORM**.

- SQLite is just a file - zero local setup, no Docker needed for development environment
- Turso's free tier (9GB, 1B reads/month) is plenty for this small internal tool
- Drizzle is lightweight and TypeScript-first with excellent Turso support
- Vercel Marketplace integration makes production deployment straightforward
- Trade-off: SQLite has fewer features than Postgres, but acceptable for our simple internal tool needs

## Database Migrations

We use **Drizzle Kit migrations** (not push) for schema changes:

- Migration files in `drizzle/` are version-controlled and deterministic
- The `build` script runs `drizzle-kit migrate` before `next build`
- Migrations are tracked in `__drizzle_migrations` table - only new migrations run
- Works because Vercel provides `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` via the marketplace integration

### Why migrations over push?

- `drizzle-kit push` has interactive prompts that block CI/CD deployments
- Migrations are reviewable SQL files - no surprises in production
- Better for teams and auditing schema changes

### Workflow

1. Modify `src/db/schema.ts`
2. Run `pnpm db:generate --name=descriptive-name` to create migration
3. Review the generated SQL in `drizzle/`
4. Commit the migration files with your schema changes

## Examples

```bash
pnpm db:generate --name=add-feature  # Generate migration from schema changes
pnpm db:migrate                      # Apply pending migrations
pnpm db:push                         # Quick local sync (dev only, has prompts)
pnpm db:studio                       # Browse data visually
```
