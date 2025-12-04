# ADR 005: Typography Utilities

We use **CSS utility classes** for consistent typography across the application.

## Decision

- Define typography presets as CSS classes in `globals.css` using `@layer components`
- Use semantic names that describe the purpose, not the visual style

## Classes

| Class | Definition | Usage |
|-------|------------|-------|
| `.text-body` | `text-sm` | Standard body text |
| `.text-body-lg` | `text-base` | Larger body text when emphasis needed |
| `.text-label` | `text-sm font-medium` | Form labels, section headers |
| `.text-muted` | `text-sm text-muted-foreground` | Secondary info, timestamps, hints |
| `.text-heading` | `text-lg font-semibold tracking-tight` | Page/section headings |
| `.text-heading-sm` | `text-sm font-medium` | Small section titles |

## Rationale

- **Follows shadcn/ui patterns**: No extra component wrappers, just composable classes
- **Simple**: No runtime overhead, works anywhere
- **Easy to audit**: Grep for class names to find usage
- **Tailwind-native**: Uses `@apply` within the existing system

## Alternatives Considered

- **Typography React Component**: A `<Text variant="body">` component with CVA. More TypeScript safety but adds verbosity and another import everywhere.
- **Fix only base components**: Just standardize shadcn primitives. Less explicit, future components might drift.

## Button as Form Trigger

When using `Button` as a form trigger (e.g., date pickers, comboboxes), use the `asInput` prop to match Input/Select typography:

```tsx
<Button variant="outline" asInput>
  {date ? format(date, "PPP") : "Pick a date"}
</Button>
```

This applies `font-normal` to override Button's default `font-medium`, ensuring consistent typography with other form elements.

## Examples

```tsx
// Form labels
<label className="text-label">Title</label>

// Timestamps and secondary info
<span className="text-muted">{formattedDate}</span>

// Section headers
<h3 className="text-heading-sm">Task Details</h3>

// Button as form trigger
<Button variant="outline" asInput>Select option...</Button>
```
