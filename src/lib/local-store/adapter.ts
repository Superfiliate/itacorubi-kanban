"use client"

export type Unsubscribe = () => void

/**
 * Storage adapter boundary for the local-first layer.
 *
 * Today: in-memory only.
 * Later: can be swapped for localStorage / IndexedDB without rewriting the store.
 */
export interface StorageAdapter<T> {
  load(key: string): Promise<T | undefined>
  save(key: string, value: T): Promise<void>
  subscribe(key: string, cb: (value: T | undefined) => void): Unsubscribe
}

export class InMemoryAdapter<T> implements StorageAdapter<T> {
  private map = new Map<string, T>()
  private listenersByKey = new Map<string, Set<(value: T | undefined) => void>>()

  async load(key: string): Promise<T | undefined> {
    return this.map.get(key)
  }

  async save(key: string, value: T): Promise<void> {
    this.map.set(key, value)
    const listeners = this.listenersByKey.get(key)
    if (listeners) {
      for (const cb of listeners) cb(value)
    }
  }

  subscribe(key: string, cb: (value: T | undefined) => void): Unsubscribe {
    let set = this.listenersByKey.get(key)
    if (!set) {
      set = new Set()
      this.listenersByKey.set(key, set)
    }
    set.add(cb)
    return () => {
      const current = this.listenersByKey.get(key)
      current?.delete(cb)
      if (current && current.size === 0) {
        this.listenersByKey.delete(key)
      }
    }
  }
}
