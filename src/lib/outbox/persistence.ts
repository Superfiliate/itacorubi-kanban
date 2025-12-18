"use client";

import type { OutboxItem } from "@/stores/board-store";

const STORAGE_KEY_PREFIX = "outbox:";

/**
 * Recursively convert Date objects to a serializable format.
 */
function serializeDates(obj: unknown): unknown {
  if (obj instanceof Date) {
    return { __type: "Date", value: obj.toISOString() };
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeDates);
  }
  if (obj && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeDates(value);
    }
    return result;
  }
  return obj;
}

/**
 * Recursively restore Date objects from serialized format.
 */
function deserializeDates(obj: unknown): unknown {
  if (obj && typeof obj === "object") {
    if ("__type" in obj && (obj as Record<string, unknown>).__type === "Date") {
      return new Date((obj as Record<string, unknown>).value as string);
    }
    if (Array.isArray(obj)) {
      return obj.map(deserializeDates);
    }
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = deserializeDates(value);
    }
    return result;
  }
  return obj;
}

/**
 * Serialize an outbox item for localStorage.
 * Handles Date objects by converting them to a tagged format.
 */
function serializeItem(item: OutboxItem): string {
  const serializable = serializeDates(item);
  return JSON.stringify(serializable);
}

/**
 * Deserialize an outbox item from localStorage.
 * Reconstructs Date objects from tagged format.
 */
function deserializeItem(json: string): OutboxItem {
  const parsed = JSON.parse(json);
  return deserializeDates(parsed) as OutboxItem;
}

/**
 * Save the outbox for a board to localStorage.
 */
export function saveOutbox(boardId: string, outbox: OutboxItem[]): void {
  if (typeof window === "undefined") return;

  const key = `${STORAGE_KEY_PREFIX}${boardId}`;
  if (outbox.length === 0) {
    localStorage.removeItem(key);
  } else {
    const serialized = outbox.map(serializeItem);
    localStorage.setItem(key, JSON.stringify(serialized));
  }
}

/**
 * Load the outbox for a board from localStorage.
 * Returns an empty array if nothing is stored.
 */
export function loadOutbox(boardId: string): OutboxItem[] {
  if (typeof window === "undefined") return [];

  const key = `${STORAGE_KEY_PREFIX}${boardId}`;
  const stored = localStorage.getItem(key);
  if (!stored) return [];

  try {
    const serialized = JSON.parse(stored) as string[];
    return serialized.map(deserializeItem);
  } catch (error) {
    console.error(`[Outbox] Failed to load persisted outbox for board ${boardId}:`, error);
    localStorage.removeItem(key);
    return [];
  }
}

/**
 * Clear the persisted outbox for a board.
 */
export function clearPersistedOutbox(boardId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}${boardId}`);
}

/**
 * Get all board IDs that have persisted outbox items.
 * Useful for resuming sync on app startup.
 */
export function getPersistedBoardIds(): string[] {
  if (typeof window === "undefined") return [];

  const boardIds: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_KEY_PREFIX)) {
      boardIds.push(key.slice(STORAGE_KEY_PREFIX.length));
    }
  }
  return boardIds;
}
