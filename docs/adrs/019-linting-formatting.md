# ADR 019: Linting, Formatting, and Dead Code Detection

Use Oxlint for linting, Oxfmt for code formatting, and Knip for dead code detection, with pre-commit hooks to enforce code quality.

- Oxlint and Oxfmt are high-performance Rust-based tools from the Oxc project
- Significantly faster than ESLint and Prettier for large codebases
- Knip detects unused files, dependencies, and exports
- Pre-commit hooks via Husky and lint-staged auto-fix issues before commits
- CI enforces lint, format, and dead code checks on all pushes and PRs

## Configuration Files

- `.oxlintrc.json` - Linting rules and ignore patterns
- `.oxfmtrc.jsonc` - Formatting preferences and ignore patterns
- `knip.json` - Dead code detection configuration

## Scripts

```bash
pnpm lint          # Run linter
pnpm format        # Format all files
pnpm format:check  # Check formatting without modifying files
pnpm knip          # Check for unused files, dependencies, and exports
```

## Pre-commit Behavior

On `git commit`, the pre-commit hook:

1. Runs lint-staged which:
   - Runs `oxlint --fix` on staged `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs` files
   - Runs `oxfmt` to format those files
2. Runs `tsc --noEmit` to type-check the entire codebase
3. Runs `knip` to check for dead code
4. Blocks the commit if any issues remain after auto-fixing, type errors exist, or unused code is detected
