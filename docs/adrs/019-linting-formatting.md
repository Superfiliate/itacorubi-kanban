# ADR 019: Linting, Formatting, and Dead Code Detection

Use Oxlint for linting, Oxfmt for code formatting, and Knip for dead code detection, with pre-commit hooks to enforce code quality.

- Oxlint and Oxfmt are high-performance Rust-based tools from the Oxc project
- Significantly faster than ESLint and Prettier for large codebases
- Knip detects unused files, dependencies, and exports
- Pre-commit hooks via Husky run tools on entire codebase (fast enough to skip incremental checks)
- CI enforces lint, format, and dead code checks on all pushes and PRs

## Configuration Files

- `.oxlintrc.json` - Linting rules and ignore patterns
- `.oxfmtrc.jsonc` - Formatting preferences and ignore patterns
- `knip.json` - Dead code detection configuration

## Scripts

```bash
pnpm lint          # Run linter
pnpm lint --fix    # Run linter with auto-fix
pnpm format        # Format all files
pnpm format:check  # Check formatting without modifying files
pnpm knip          # Check for unused files, dependencies, and exports
```

## Pre-commit Behavior

On `git commit`, the pre-commit hook runs on the entire codebase:

1. `pnpm lint --fix` - Auto-fix lint issues (unused imports, etc.)
2. `pnpm format` - Auto-format all files
3. `pnpm exec tsc --noEmit` - Type-check the entire codebase
4. `pnpm knip` - Check for dead code (report only, no auto-fix)

The commit is blocked if any issues remain after auto-fixing, type errors exist, or unused code is detected.
