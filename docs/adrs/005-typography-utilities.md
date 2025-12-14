# ADR 005: Typography Utilities

Use a small set of utility classes in `src/styles/typography.css` (imported through `src/styles/globals.css`) to keep text consistent without adding wrapper components.

- Semantic class names (`text-body`, `text-muted`, `text-heading`, etc.) map to lightweight Tailwind applies
- Prefer utilities over bespoke per-component typography to stay consistent with shadcn primitives
- For button-as-input cases, match input weight (normal) so mixed controls align visually

If a new text style emerges repeatedly, add one semantic utility instead of inlining Tailwind everywhere.

## Examples

Cheatsheet:
- `text-body`: default body (`text-sm`)
- `text-body-lg`: larger body (`text-base`)
- `text-muted`: secondary info (`text-sm text-muted-foreground`)
- `text-heading`: section/page headings (`text-lg font-semibold tracking-tight`)
- `text-heading-lg`: large headings (`text-xl font-semibold tracking-tight`)
- `text-heading-sm`: small section titles (`text-sm font-medium`)
- `text-label`: form field labels (`text-xs text-muted-foreground`)
- Button as input trigger:
  ```tsx
  <Button variant="outline" asInput>
    {date ? format(date, "PPP") : "Pick a date"}
  </Button>
  ```

## Links
- Utilities defined in: `src/styles/typography.css`
