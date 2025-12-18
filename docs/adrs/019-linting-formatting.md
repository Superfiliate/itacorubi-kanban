# ADR 019: Linting and Formatting with Oxlint and Oxfmt

Use Oxlint for linting and Oxfmt for code formatting, with pre-commit hooks to enforce code quality.

- Oxlint and Oxfmt are high-performance Rust-based tools from the Oxc project
- Significantly faster than ESLint and Prettier for large codebases
- Pre-commit hooks via Husky and lint-staged auto-fix issues before commits
- CI enforces lint and format checks on all pushes and PRs

## Configuration Files

- `.oxlintrc.json` - Linting rules and ignore patterns
- `.oxfmtrc.jsonc` - Formatting preferences and ignore patterns

## Scripts

```bash
pnpm lint          # Run linter
pnpm format        # Format all files
pnpm format:check  # Check formatting without modifying files
```

## Pre-commit Behavior

On `git commit`, the pre-commit hook:

1. Runs lint-staged which:
   - Runs `oxlint --fix` on staged `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs` files
   - Runs `oxfmt` to format those files
2. Runs `tsc --noEmit` to type-check the entire codebase
3. Blocks the commit if any issues remain after auto-fixing or if type errors exist
