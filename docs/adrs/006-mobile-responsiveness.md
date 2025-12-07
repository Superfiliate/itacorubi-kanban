# ADR 006: Mobile Responsiveness

Mobile-first layouts with Tailwind breakpoints; use `lg` for multi-panel/side-by-side layouts when there is room.

- Stack by default; switch to rows at `lg` when panels need width
- Prefer one scroll container on mobile; allow split scroll areas on desktop
- Keep touch targets usable and avoid horizontal scroll on small screens
- Sanity-check at 375px, 768px, and ~1280px before shipping

## Examples

Layout:
```tsx
<div className="flex flex-col lg:flex-row">
  <div className="flex-none lg:flex-[3]">Details</div>
  <div className="flex-1 lg:flex-[7]">Main</div>
</div>
```

Cheatsheet:
- Mobile default: 0+
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px (multi-panel breakpoint)
- `xl`: 1280px (desktop sanity check)

## Links
- Tailwind breakpoints: `tailwind.config.*` (if customized) and usage in `src/app/globals.css`
