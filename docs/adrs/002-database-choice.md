# ADR 002: Database and ORM

We use **Turso** (SQLite/libSQL) with **Drizzle ORM**.

- SQLite is just a file - zero local setup, no Docker needed for development environment
- Turso's free tier (9GB, 1B reads/month) is plenty for this small internal tool
- Drizzle is lightweight and TypeScript-first with excellent Turso support
- Vercel Marketplace integration makes production deployment straightforward
- Trade-off: SQLite has fewer features than Postgres, but acceptable for our simple internal tool needs

## Examples

```bash
pnpm db:push    # Push schema to local SQLite
pnpm db:studio  # Browse data visually
```
