import { limitConcurrency } from './concurrency';

// Map to store limiters for each key
const limiters = new Map<string, <T>(fn: () => Promise<T>) => Promise<T>>();

/**
 * Limit concurrency per unique key (e.g., userId).
 * Ensures that for a given key, only 'concurrency' number of tasks run at once.
 * Different keys run in parallel.
 *
 * @param key The unique key to limit by (e.g. "user:123")
 * @param concurrency Max concurrent tasks for this key (default 1)
 */
export function limitByKey(key: string, concurrency: number = 1) {
    if (!limiters.has(key)) {
        limiters.set(key, limitConcurrency(concurrency));
    }
    return limiters.get(key)!;
}

/**
 * Clean up limiters that are empty to avoid memory leaks.
 * (Optional: basic implementation doesn't track emptiness easily without exposing internals,
 * so we rely on the Map being relatively small for active users or aggressive GC if needed.
 * For a long-running bot with millions of users, we'd need a more complex LRU or expiration.)
 */
export function clearKeyLimit(key: string) {
    limiters.delete(key);
}
