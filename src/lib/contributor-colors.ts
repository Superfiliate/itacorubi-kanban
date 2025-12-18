import { CONTRIBUTOR_COLORS, type ContributorColor } from "@/db/schema";

/**
 * Get a random contributor color from the full palette.
 * Used when creating new contributors to ensure visual variety.
 */
export function getRandomContributorColor(): ContributorColor {
  const index = Math.floor(Math.random() * CONTRIBUTOR_COLORS.length);
  return CONTRIBUTOR_COLORS[index];
}

/**
 * Badge/chip color styles for each contributor color.
 * Provides light background with matching text color, with dark mode variants.
 */
export const contributorColorStyles: Record<ContributorColor, string> = {
  rose: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  pink: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  fuchsia: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300",
  purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  violet: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  indigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  sky: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  cyan: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  teal: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  lime: "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300",
  yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  orange: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

/**
 * Solid color swatches for the color picker UI.
 * Uses the 500 shade for a vibrant, selectable appearance.
 */
export const contributorColorSwatches: Record<ContributorColor, string> = {
  rose: "bg-rose-500",
  pink: "bg-pink-500",
  fuchsia: "bg-fuchsia-500",
  purple: "bg-purple-500",
  violet: "bg-violet-500",
  indigo: "bg-indigo-500",
  blue: "bg-blue-500",
  sky: "bg-sky-500",
  cyan: "bg-cyan-500",
  teal: "bg-teal-500",
  emerald: "bg-emerald-500",
  green: "bg-green-500",
  lime: "bg-lime-500",
  yellow: "bg-yellow-500",
  amber: "bg-amber-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
};
