# Feature: Dark Mode

## Overview

The application supports light, dark, and system-based themes. Users can toggle between themes via a dropdown menu in the board header.

## User Flows

### Toggle Theme

- Click the sun/moon icon in the top-right corner of the board header
- Select from dropdown options:
  - **Light**: Forces light theme
  - **Dark**: Forces dark theme
  - **System**: Follows OS/browser preference
- Theme preference is saved to localStorage and persists across sessions

### System Theme

- When set to "System", the app respects the user's OS preference
- Automatically updates if the OS theme changes (e.g., scheduled dark mode)

## Technical Notes

- Powered by `next-themes` library
- Theme is applied via `.dark` class on the `<html>` element
- CSS variables in `globals.css` define all color values for both themes
- `suppressHydrationWarning` on `<html>` prevents SSR hydration warnings
- All shadcn/ui components automatically adapt to the current theme

## Visual Design

### Light Theme
- White/light gray backgrounds
- Dark text for readability
- Glass backgrounds: `bg-white/40` to `bg-white/80`
- Borders need higher opacity to be visible (avoid `border-border/30` or lower)

### Dark Theme
- Dark gray/black backgrounds
- Light text for contrast
- Adjusted accent colors for visibility
- Glass backgrounds: `bg-white/5` to `bg-black/80`
- Borders are more visible due to white-on-dark contrast

### Glassmorphism Considerations

The app uses glassmorphism styling (see `docs/features/008-glassmorphism.md`). When adding new components, ensure they work well in both themes:

- **Backgrounds**: Always specify both light and dark variants (`bg-white/40 dark:bg-white/5`)
- **Borders**: Use `border-border/50` minimum for visibility in light mode; `border-border/30` becomes invisible
- **Shadows**: Light mode uses subtle shadows; dark mode uses darker, more prominent shadows
- **Backdrop blur**: Works in both themes but is more noticeable against the gradient mesh background
