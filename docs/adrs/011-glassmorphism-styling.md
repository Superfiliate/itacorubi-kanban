# ADR 011: Glassmorphism Styling

Apple Vision Pro style glassmorphism with frosted glass effects and gradient mesh backgrounds.

## Decision

- Creates modern, premium visual appearance with depth
- Uses CSS variables (`--glass`, `--glass-border`, `--glass-shadow`) for theme consistency
- Glass utility classes (`.glass`, `.glass-strong`, `.glass-subtle`) in `@layer components`
- Gradient mesh background provides visual depth for glass effects to be visible

## Glass Utility Classes

```css
.glass {
  @apply backdrop-blur-xl border rounded-xl;
  background: var(--glass);
  border-color: var(--glass-border);
  box-shadow: var(--glass-shadow);
}

.glass-strong {
  @apply backdrop-blur-2xl backdrop-saturate-150;
}

.glass-subtle {
  @apply backdrop-blur-md;
  background: var(--glass);
  border-color: var(--glass-border);
}
```

## Form Control Styling Pattern

All interactive form controls (buttons, inputs, selects, popovers) follow a consistent glass-compatible pattern:

```tsx
// Standard glass-compatible form control classes
className="rounded-lg border border-border/50 bg-white/40 dark:bg-white/5 backdrop-blur-sm shadow-sm"

// Hover state
className="hover:bg-white/60 dark:hover:bg-white/10 hover:border-border"

// Focus state
className="focus-visible:ring-2 focus-visible:ring-primary/20"
```

### Key Patterns

| Property | Value | Purpose |
|----------|-------|---------|
| `rounded-lg` | Consistent | All interactive elements use `rounded-lg` |
| `border-border/50` | Semi-transparent | Subtle border that works on glass |
| `bg-white/40 dark:bg-white/5` | Glass background | Visible in light mode, subtle in dark |
| `backdrop-blur-sm` | Subtle blur | Ties into glassmorphism theme |
| `shadow-sm` | Subtle shadow | Adds depth without being heavy |

## Disabled State Pattern

Disabled buttons and controls must be obviously disabled:

```tsx
className="disabled:opacity-40 disabled:grayscale disabled:shadow-none disabled:cursor-not-allowed"
```

- **opacity-40**: More faded than typical (not just 50%)
- **grayscale**: Removes color vibrancy, looks "inactive"
- **shadow-none**: Removes depth, appears flat
- **cursor-not-allowed**: Visual feedback on hover

## Dropdown/Popover Content

Dropdown menus and popovers use stronger glass effect:

```tsx
className="rounded-lg border border-border/50 bg-white/80 dark:bg-black/80 backdrop-blur-xl shadow-lg"
```

## Cards and Containers

For card-like containers within glass surfaces:

```tsx
// Standard card on glass
className="rounded-lg border border-border/50 bg-white/30 dark:bg-white/5 backdrop-blur-sm"
```

## Border Visibility

Borders using `border-border` can be too subtle in light mode due to the light gray color. For separators that need visibility in both modes:

- Use `border-border` (full opacity) for important separators
- Use `border-border/50` for subtle separators
- Avoid `border-border/30` or lower as it becomes invisible in light mode

## Examples

```tsx
/* Surface containers */
<div className="glass rounded-lg p-4">
  Frosted glass container
</div>

<header className="glass glass-strong rounded-none">
  Edge-to-edge header
</header>

/* Form controls */
<Input className="..." />  // Uses glass pattern internally

<Button variant="outline">  // Uses glass pattern for outline variant
  Click me
</Button>

/* Cards within glass surfaces */
<div className="rounded-lg border border-border/50 bg-white/30 dark:bg-white/5 backdrop-blur-sm p-3">
  Card content
</div>
```

## Consistency Checklist

When adding new UI components, ensure:

- [ ] Uses `rounded-lg` for interactive elements
- [ ] Border uses `border-border/50` (or full `border-border` for prominent separators)
- [ ] Background follows `bg-white/X dark:bg-white/Y` pattern
- [ ] Has `backdrop-blur-sm` or stronger for glass effect
- [ ] Hover states use `hover:bg-white/60 dark:hover:bg-white/10`
- [ ] Focus states use `focus-visible:ring-2 focus-visible:ring-primary/20`
- [ ] Disabled states include `opacity-40 grayscale shadow-none cursor-not-allowed`
