# ADR 020: Environment Variable Validation

Build-time validation of required environment variables using Zod, failing deployments before they go live.

- Prevents broken production deployments when required env vars are missing
- Uses `VERCEL_ENV` to distinguish between local builds and production deployments
- Format validation catches misconfigured values (invalid URLs, malformed API keys)
- Clear error messages guide developers to fix issues

## Required Variables (Production Only)

| Variable                | Format            | Purpose                      |
| ----------------------- | ----------------- | ---------------------------- |
| `TURSO_DATABASE_URL`    | URL               | Turso database connection    |
| `TURSO_AUTH_TOKEN`      | Non-empty         | Turso authentication         |
| `CRON_SECRET`           | Min 16 chars      | Cron endpoint authentication |
| `RESEND_API_KEY`        | Starts with `re_` | Email sending via Resend     |
| `BLOB_READ_WRITE_TOKEN` | Non-empty         | Vercel Blob file storage     |

## Optional Variables

| Variable               | Format | Default                         |
| ---------------------- | ------ | ------------------------------- |
| `NEXT_PUBLIC_BASE_URL` | URL    | Auto-detected from `VERCEL_URL` |

## Examples

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

### Using Validated Environment Variables

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

The `node/no-process-env` rule in `.oxlintrc.json` prevents direct `process.env` usage, enforcing that all code uses the validated `env` object.

**Exceptions** (allowed to use `process.env` directly):

- `src/lib/validate-env.ts` - The validation module itself
- `next.config.ts` - Loaded before validation runs
- `drizzle.config.ts` - Used by CLI, not app runtime
- `playwright/**/*.ts` - Test configuration

For client components that need `NODE_ENV`, use an inline disable comment with explanation:

```typescript
// eslint-disable-next-line node/no-process-env -- NODE_ENV is replaced at build time by bundler
const isProduction = process.env.NODE_ENV === "production";
```
