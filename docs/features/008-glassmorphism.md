# Feature: Glassmorphism

## Overview

We use a light glassmorphism aesthetic (soft blur, translucent surfaces, subtle borders/shadows) to keep the UI cohesive across pages and themes.

## Design Principles

- Favor readability and contrast over effect; increase border/opacity when clarity suffers
- Keep blur and translucency subtle; avoid heavy frosted looks
- Reuse shared glass utilities/vars; adjust opacity/blur per context (card, dialog, control)
- Gradient background is supportive, not dominant

## Implementation Notes

- Use the shared glass utility classes in `src/styles/glassmorphism.css` (imported via `src/styles/globals.css`) for surfaces and controls
- Cards, dialogs, and controls should feel related but can vary slightly by context
- Test in light/dark themes to ensure borders and text remain legible

## Links
- Utilities: `src/styles/glassmorphism.css`
- Variables: `src/styles/theme.css`
