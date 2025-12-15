import { CONTRIBUTOR_COLORS, type ContributorColor } from "@/db/schema"

/**
 * Get a random tag color from the full palette.
 * Used when creating new tags to ensure visual variety.
 */
export function getRandomTagColor(): ContributorColor {
  const index = Math.floor(Math.random() * CONTRIBUTOR_COLORS.length)
  return CONTRIBUTOR_COLORS[index]
}

/**
 * Badge/chip color styles for each tag color.
 * Reuses the same styles as contributors for consistency.
 */
export { contributorColorStyles as tagColorStyles } from "@/lib/contributor-colors"

/**
 * Solid color swatches for the color picker UI.
 * Reuses the same swatches as contributors for consistency.
 */
export { contributorColorSwatches as tagColorSwatches } from "@/lib/contributor-colors"
