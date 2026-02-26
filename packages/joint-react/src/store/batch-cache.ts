import type { dia } from '@joint/core';
import type { ClearViewCacheEntry } from './clear-view';

/**
 * Generic batch cache for collecting updates before flushing.
 * Provides a unified pattern for link, and other batched updates.
 * @template K - Key type (usually dia.Cell.ID)
 * @template V - Value type (cache entry)
 */
export class BatchCache<K, V extends object> {
  private cache = new Map<K, V>();
  private scheduler: () => void;
  private defaultEntry: () => V;

  constructor(options: { readonly scheduler: () => void; readonly defaultEntry: () => V }) {
    this.scheduler = options.scheduler;
    this.defaultEntry = options.defaultEntry;
  }

  /**
   * Gets or creates an entry for the given key.
   * @param key
   */
  getOrCreate(key: K): V {
    let entry = this.cache.get(key);
    if (!entry) {
      entry = this.defaultEntry();
      this.cache.set(key, entry);
    }
    return entry;
  }

  /**
   * Updates an entry and schedules a flush.
   * @param key
   * @param updater
   */
  update(key: K, updater: (entry: V) => void): void {
    const entry = this.getOrCreate(key);
    updater(entry);
    this.scheduler();
  }

  /**
   * Gets the current cache size.
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Checks if the cache is empty.
   */
  get isEmpty(): boolean {
    return this.cache.size === 0;
  }

  /**
   * Iterates over cache entries.
   */
  entries(): IterableIterator<[K, V]> {
    return this.cache.entries();
  }

  /**
   * Clears the cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Gets an entry by key.
   * @param key
   */
  get(key: K): V | undefined {
    return this.cache.get(key);
  }

  /**
   * Sets an entry by key.
   * @param key
   * @param value
   */
  set(key: K, value: V): void {
    this.cache.set(key, value);
  }

  /**
   * Checks if a key exists.
   * @param key
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }
}

/**
 * Creates a typed batch cache for cell ID keyed entries.
 * @param scheduler - Function to call when updates are scheduled
 * @returns A new BatchCache instance
 */
function createCellCache<V extends object>(scheduler: () => void): BatchCache<dia.Cell.ID, V> {
  return new BatchCache<dia.Cell.ID, V>({
    scheduler,
    defaultEntry: () => ({}) as V,
  });
}

/**
 * Creates a clearView cache with the standard entry structure.
 * @param scheduler
 */
export function createClearViewCache(
  scheduler: () => void
): BatchCache<dia.Cell.ID, ClearViewCacheEntry> {
  return createCellCache<ClearViewCacheEntry>(scheduler);
}
