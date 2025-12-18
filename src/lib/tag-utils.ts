/**
 * Ensures a tag name starts with "#" character.
 * If it already starts with "#", returns it as-is.
 * Otherwise, prepends "#" to the name.
 */
export function ensureTagHasHash(name: string): string {
  const trimmed = name.trim();
  if (trimmed.startsWith("#")) {
    return trimmed;
  }
  return `#${trimmed}`;
}

/**
 * Removes the "#" prefix from a tag name if present.
 * Useful for display or editing where you might want to show/edit without the hash.
 */
export function removeTagHash(name: string): string {
  return name.startsWith("#") ? name.slice(1) : name;
}
