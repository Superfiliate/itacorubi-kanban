# ADR 003: Environment Variables

Hardcode non-secret values in the codebase. Only use environment variables for actual secrets, and validate them at build time.

## Rationale

- **Version control**: Hardcoded values are tracked, documented, and diffable
- **Easier debugging**: No need to check Vercel dashboard to understand behavior
- **Simpler deployment**: Fewer variables to configure = fewer mistakes
- **No `.env` files**: Local dev works immediately with `pnpm dev`
- **Build-time validation**: Fail deployments before they go live, not at runtime

## What Should Be Hardcoded

| Value                | Location                              | Example                               |
| -------------------- | ------------------------------------- | ------------------------------------- |
| Production domain    | `src/lib/process-board-notifications` | `https://itacorubi.com`               |
| Local database path  | `src/db/index.ts`                     | `file:local.db`                       |
| Local dev port       | `package.json`                        | `5800`                                |
| Email sender address | `src/lib/process-board-notifications` | `noreply@notifications.itacorubi.com` |

## Required ENV Variables (Secrets Only)

These are validated at build time using Zod in `src/lib/validate-env.ts`. Builds fail with clear errors if missing in production.

| Variable                | Format            | Purpose                      |
| ----------------------- | ----------------- | ---------------------------- |
| `TURSO_DATABASE_URL`    | URL               | Turso database connection    |
| `TURSO_AUTH_TOKEN`      | Non-empty         | Turso authentication         |
| `CRON_SECRET`           | Min 16 chars      | Cron endpoint authentication |
| `RESEND_API_KEY`        | Starts with `re_` | Email sending via Resend     |
| `BLOB_READ_WRITE_TOKEN` | Non-empty         | Vercel Blob file storage     |

These are injected automatically by Vercel/Turso marketplace integration.

## Examples

### Hardcoding Non-Secrets

```typescript
// ✅ Hardcoded production domain (not a secret)
const PRODUCTION_DOMAIN = "https://itacorubi.com";
function getBaseUrl(): string {
  if (env.VERCEL_ENV === "production") return PRODUCTION_DOMAIN;
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return "http://localhost:5800";
}

// ✅ Hardcoded fallback for local dev (not a secret)
url: process.env.TURSO_DATABASE_URL ?? "file:local.db"

// ❌ Don't use ENV for non-secrets
const domain = process.env.NEXT_PUBLIC_BASE_URL; // Avoid this
```

### Adding a New Required Variable

```typescript
// In src/lib/validate-env.ts
const serverEnvSchema = z.object({
  // ... existing vars ...

  NEW_API_KEY: z
    .string()
    .min(1, "NEW_API_KEY cannot be empty")
    .optional()
    .refine((val) => !isVercelProduction || (val && val.length > 0), {
      message: "NEW_API_KEY is required in production",
    }),
});
```

### Using Validated Variables

```typescript
import { env } from "@/lib/validate-env";

// Type-safe access to validated variables
const apiKey = env.RESEND_API_KEY;
const dbUrl = env.TURSO_DATABASE_URL ?? "file:local.db";
```

### Testing Validation Locally

```bash
# Should pass (no VERCEL_ENV)
pnpm build

# Should fail with clear errors
VERCEL_ENV=production pnpm build
```

## Linting Enforcement

The `node/no-process-env` rule prevents direct `process.env` usage, enforcing that all code uses the validated `env` object.

**Exceptions** (allowed to use `process.env` directly):

- `src/lib/validate-env.ts` - The validation module itself
- `next.config.ts` - Loaded before validation runs
- `drizzle.config.ts` - Used by CLI, not app runtime
- `playwright/**/*.ts` - Test configuration
