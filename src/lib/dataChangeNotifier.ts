/**
 * Data Change Notifier
 *
 * A centralized, side-effect-free notification system for data mutations.
 * This module provides a single point of truth for tracking when data changes occur.
 *
 * Key characteristics:
 * - Side-effect-free in production (logging guarded to dev only)
 * - Safe to call multiple times
 * - Easy to extend with listeners (for future backup/sync)
 * - No debounce, timers, or background jobs (kept minimal)
 *
 * @example
 * // After a successful create:
 * notifyDataChanged({ type: 'add', entity: 'work', id: work.id });
 *
 * // After a successful bulk import:
 * notifyDataChanged({ type: 'add', entity: 'work', count: 10 });
 */

export type DataChangeType = 'add' | 'update' | 'delete';
export type DataChangeEntity = 'work';

export interface DataChangeEvent {
    type: DataChangeType;
    entity: DataChangeEntity;
    id?: string;
    count?: number; // For bulk operations
    timestamp: number;
}

type DataChangeListener = (event: DataChangeEvent) => void;

// Internal listener registry (for future use by backup/sync systems)
const listeners: DataChangeListener[] = [];

/**
 * Notify that a data change has occurred.
 * This function is safe to call from anywhere after a successful mutation.
 *
 * @param event - The change event (without timestamp, which is auto-added)
 */
export function notifyDataChanged(
    event: Omit<DataChangeEvent, 'timestamp'>
): void {
    const fullEvent: DataChangeEvent = {
        ...event,
        timestamp: Date.now(),
    };

    // Development logging only - guarded to prevent production noise
    if (process.env.NODE_ENV === 'development') {
        console.log('[DataChange]', fullEvent);
    }

    // Notify all registered listeners (fire-and-forget, swallow errors)
    listeners.forEach((listener) => {
        try {
            listener(fullEvent);
        } catch {
            // Swallow listener errors to prevent breaking the mutation flow
        }
    });
}

/**
 * Subscribe to data change events.
 * Returns an unsubscribe function.
 *
 * @param listener - Callback to invoke on each data change
 * @returns Unsubscribe function
 *
 * @example
 * const unsubscribe = subscribeToDataChanges((event) => {
 *   console.log('Data changed:', event);
 * });
 * // Later:
 * unsubscribe();
 */
export function subscribeToDataChanges(
    listener: DataChangeListener
): () => void {
    listeners.push(listener);
    return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    };
}

/**
 * Get the current number of listeners (useful for testing/debugging).
 */
export function getListenerCount(): number {
    return listeners.length;
}

/**
 * Clear all listeners (useful for testing).
 */
export function clearListeners(): void {
    listeners.length = 0;
}
