# Spec 001: Project Setup

## Overview

This document captures the AI-assisted development process for setting up the itacorubi-kanban project infrastructure.

## Initial Requirements

The user requested a new Next.js project with the following characteristics:

- Simple relational database for data storage
- Easy local development setup (preferably no Docker)
- Free tier cloud hosting compatibility (Turso, Neon, or Prisma)
- Vercel deployment with marketplace integrations
- Server-side rendering / Server Actions only (no REST/GraphQL API)
- Modern, easy-to-use ORM

## Decision Process

### Database Selection

The AI analyzed three main options:

| Factor | Turso (SQLite) | Neon (Postgres) | Prisma Postgres |
|--------|---------------|-----------------|-----------------|
| Local dev ease | Just a file | Needs Docker | Needs Docker |
| Vercel integration | Marketplace | Deep partnership | Available |
| Free tier | 9GB, very generous | 0.5GB, decent | Available |

**Decision**: Turso (SQLite/libSQL) was chosen for its zero-friction local development experience.

### ORM Selection

Drizzle ORM was selected over Prisma for:
- Lighter weight (no client generation)
- TypeScript-first approach
- SQL-like syntax
- First-class Turso support

### Package Manager

pnpm was chosen over npm for:
- Faster installations
- Efficient disk space usage
- Strict dependency resolution

## Implementation Steps

The following steps were executed to set up the project:

### Step 1: Initialize Next.js Project

```bash
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Created Next.js 16 with App Router, TypeScript, Tailwind CSS, and ESLint.

### Step 2: Install Database Dependencies

```bash
pnpm add drizzle-orm @libsql/client
pnpm add -D drizzle-kit
```

### Step 3: Create Database Configuration

Created `src/db/index.ts` - Database client that connects to either local SQLite file or Turso cloud based on environment variables.

Created `src/db/schema.ts` - Initial schema with a `tasks` table as a starting point for the kanban application.

### Step 4: Create Drizzle Kit Configuration

Created `drizzle.config.ts` for migration management and schema synchronization.

### Step 5: Environment Setup

No `.env` files needed for local development - code falls back to `file:local.db` when `TURSO_DATABASE_URL` is not set (see ADR 003).

Updated `.gitignore` to exclude `*.db` and `*.db-journal` files.

### Step 6: Add Package Scripts

Added to `package.json`:
- `pnpm dev` - Start dev server on port 5800
- `pnpm kill` - Kill process on port 5800
- `pnpm db:generate` - Generate migrations
- `pnpm db:migrate` - Run migrations
- `pnpm db:push` - Push schema to database (for development)
- `pnpm db:studio` - Open Drizzle Studio GUI
- `pnpm db:reset` - Delete local.db and recreate from schema

### Step 7: Document Decisions

Created Architecture Decision Records:
- `docs/adrs/001-package-manager.md` - pnpm choice rationale
- `docs/adrs/002-database-choice.md` - Turso + Drizzle rationale

## Files Created/Modified

```
itacorubi-kanban/
├── .gitignore                    # Updated with *.db patterns
├── drizzle.config.ts             # Drizzle Kit configuration
├── package.json                  # Updated with db:* and utility scripts
├── src/
│   └── db/
│       ├── index.ts              # Database client (uses TURSO_DATABASE_URL)
│       └── schema.ts             # Database schema
└── docs/
    └── adrs/
        ├── 001-package-manager.md
        ├── 002-database-choice.md
        └── 003-no-local-env-files.md
```

## Local Development Workflow

1. Run `pnpm db:push` to sync schema to local SQLite file (or `pnpm db:reset` to start fresh)
2. Run `pnpm dev` to start Next.js development server on port 5800
3. Run `pnpm db:studio` to browse data visually

## Production Deployment (Vercel + Turso)

1. Create a Turso database via CLI (`turso db create`) or dashboard
2. Add Turso integration in Vercel Marketplace (auto-sets `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`)
3. Deploy to Vercel - the application will connect to Turso automatically

## Notes

- No `.env` files needed - code uses fallback defaults for local development (see ADR 003)
- The `.gitignore` was updated manually by the user
- All other files were created programmatically by the AI assistant
