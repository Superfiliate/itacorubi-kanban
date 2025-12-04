# ADR 006: Mobile Responsiveness

## Context

The application should be usable on mobile devices (phones and tablets) as well as desktop browsers.

## Decision

Use Tailwind CSS responsive breakpoints with a **mobile-first approach**. The primary breakpoint is `sm:` (640px).

## Breakpoints

| Prefix | Min Width | Use For |
|--------|-----------|---------|
| (none) | 0px | Mobile styles (default) |
| `sm:` | 640px | Tablet and desktop |
| `md:` | 768px | Larger tablets |
| `lg:` | 1024px | Desktop |

## Patterns

### Layout Stacking

Stack elements vertically on mobile, horizontally on desktop:

```tsx
<div className="flex flex-col sm:flex-row">
  <div className="order-1 sm:order-2">First on mobile, second on desktop</div>
  <div className="order-2 sm:order-1">Second on mobile, first on desktop</div>
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

Sheets/sidebars should be full-width on mobile:

```tsx
<SheetContent className="w-full sm:w-[1040px] sm:max-w-[1040px]">
  ...
</SheetContent>
```

### Flex Sizing

Use `flex-none` on mobile when stacking to prevent shrinking, `flex-[n]` on desktop for proportional sizing:

```tsx
<div className="flex-none sm:flex-[3]">Details panel</div>
<div className="flex-1 sm:flex-[7]">Main content</div>
```

### Borders

Adjust borders based on layout direction:

```tsx
<div className="border-b sm:border-b-0 sm:border-l border-border">
  Border bottom on mobile (stacked), border left on desktop (side-by-side)
</div>
```

### Scroll Containers

On mobile, prefer a single scroll container for the entire view. On desktop, allow independent scroll areas:

```tsx
{/* Parent: scrolls on mobile, contains overflow on desktop */}
<div className="overflow-y-auto sm:overflow-hidden">
  {/* Children: no scroll on mobile, independent scroll on desktop */}
  <div className="sm:overflow-y-auto">Panel 1</div>
  <div className="sm:overflow-y-auto">Panel 2</div>
</div>
```

This avoids tiny scroll areas on mobile that frustrate touch users.

## Testing

Always test features at these viewport widths:
- **375px** — iPhone SE / small phones
- **768px** — iPad / tablets
- **1280px** — Desktop

## Notes

- Prioritize essential content/actions on mobile (e.g., task details before comments)
- Touch targets should be at least 44x44px on mobile
- Avoid horizontal scrolling on mobile
