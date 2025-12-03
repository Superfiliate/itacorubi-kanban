# ADR 003: No Local Environment Files

We don't use `.env` files. Code falls back to hardcoded defaults for local development.

- Local dev uses a SQLite file with no sensitive data - no secrets to protect
- Production env vars are injected automatically by Vercel/Turso marketplace
- Simpler setup: developers run `pnpm dev` immediately without any configuration

## Examples

```typescript
// Falls back to local SQLite when DATABASE_URL is not set
url: process.env.DATABASE_URL ?? "file:local.db"
```
