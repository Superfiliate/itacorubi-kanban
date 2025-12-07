# ADR 006: Mobile Responsiveness

## Context

The application should be usable on mobile devices (phones and tablets) as well as desktop browsers.

## Decision

Use Tailwind CSS responsive breakpoints with a **mobile-first approach**. The primary breakpoint is `sm:` (640px).

## Breakpoints

| Prefix | Min Width | Use For |
|--------|-----------|---------|
| (none) | 0px | Mobile styles (default) |
| `sm:` | 640px | Simple responsive changes (single-panel layouts) |
| `md:` | 768px | Larger tablets |
| `lg:` | 1024px | Complex multi-panel layouts (sidebars with multiple sections) |

**Choosing the right breakpoint:**
- Use `sm:` for simple layouts where content flows naturally at smaller sizes
- Use `lg:` for multi-panel layouts (e.g., side-by-side panels) that need sufficient width per panel

## Patterns

### Layout Stacking

Stack elements vertically on mobile, horizontally on desktop. Use `lg:` for multi-panel layouts that need more space:

```tsx
{/* Multi-panel layout: use lg: for side-by-side at 1024px+ */}
<div className="flex flex-col lg:flex-row">
  <div className="order-1 lg:order-2">First on mobile/tablet, second on desktop</div>
  <div className="order-2 lg:order-1">Second on mobile/tablet, first on desktop</div>
</div>
```

### Width Constraints

Full width on mobile, constrained on desktop:

```tsx
<div className="w-full sm:w-[600px] sm:max-w-[600px]">
  Content here
</div>
```

### Sidebars and Sheets

Sheets/sidebars should be full-width on mobile/tablet, with max-width on desktop:

```tsx
<SheetContent className="w-full lg:max-w-[1040px]">
  ...
</SheetContent>
```

For multi-panel sidebars, use `lg:` to ensure panels have enough width before switching to side-by-side layout.

### Flex Sizing

Use `flex-none` on mobile when stacking to prevent shrinking, `flex-[n]` on desktop for proportional sizing:

```tsx
{/* For multi-panel layouts, use lg: */}
<div className="flex-none lg:flex-[3]">Details panel</div>
<div className="flex-1 lg:flex-[7]">Main content</div>
```

### Borders

Adjust borders based on layout direction (use same breakpoint as the layout switch):

```tsx
{/* For multi-panel layouts using lg: */}
<div className="border-b lg:border-b-0 lg:border-l border-border">
  Border bottom on mobile/tablet (stacked), border left on desktop (side-by-side)
</div>
```

### Scroll Containers

On mobile/tablet, prefer a single scroll container for the entire view. On desktop, allow independent scroll areas:

```tsx
{/* Parent: scrolls on mobile/tablet, contains overflow on desktop */}
<div className="overflow-y-auto lg:overflow-hidden">
  {/* Children: no scroll on mobile/tablet, independent scroll on desktop */}
  <div className="lg:overflow-y-auto">Panel 1</div>
  <div className="lg:overflow-y-auto">Panel 2</div>
</div>
```

This avoids tiny scroll areas on mobile/tablet that frustrate touch users.

## Testing

Always test features at these viewport widths:
- **375px** — iPhone SE / small phones
- **768px** — iPad / tablets
- **1280px** — Desktop

## Notes

- Prioritize essential content/actions on mobile (e.g., task details before comments)
- Touch targets should be at least 44x44px on mobile
- Avoid horizontal scrolling on mobile
