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

### Dark Theme
- Dark gray/black backgrounds
- Light text for contrast
- Adjusted accent colors for visibility
