import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    notifyDataChanged,
    subscribeToDataChanges,
    getListenerCount,
    clearListeners,
    type DataChangeEvent,
} from '../dataChangeNotifier';

describe('dataChangeNotifier', () => {
    beforeEach(() => {
        clearListeners();
        vi.restoreAllMocks();
    });

    describe('notifyDataChanged', () => {
        it('should be callable without errors', () => {
            expect(() =>
                notifyDataChanged({ type: 'add', entity: 'work', id: 'test-id' })
            ).not.toThrow();
        });

        it('should add timestamp to events', () => {
            const events: DataChangeEvent[] = [];
            subscribeToDataChanges((event) => events.push(event));

            const before = Date.now();
            notifyDataChanged({ type: 'add', entity: 'work', id: 'test-id' });
            const after = Date.now();

            expect(events.length).toBe(1);
            expect(events[0].timestamp).toBeGreaterThanOrEqual(before);
            expect(events[0].timestamp).toBeLessThanOrEqual(after);
        });

        it('should notify all registered listeners', () => {
            const listener1 = vi.fn();
            const listener2 = vi.fn();

            subscribeToDataChanges(listener1);
            subscribeToDataChanges(listener2);

            notifyDataChanged({ type: 'update', entity: 'work', id: 'test-id' });

            expect(listener1).toHaveBeenCalledTimes(1);
            expect(listener2).toHaveBeenCalledTimes(1);
        });

        it('should include correct event data', () => {
            const events: DataChangeEvent[] = [];
            subscribeToDataChanges((event) => events.push(event));

            notifyDataChanged({ type: 'delete', entity: 'work', id: 'delete-id' });
            notifyDataChanged({ type: 'add', entity: 'work', count: 5 });

            expect(events[0].type).toBe('delete');
            expect(events[0].entity).toBe('work');
            expect(events[0].id).toBe('delete-id');

            expect(events[1].type).toBe('add');
            expect(events[1].count).toBe(5);
        });

        it('should swallow listener errors', () => {
            const errorListener = vi.fn(() => {
                throw new Error('Listener error');
            });
            const goodListener = vi.fn();

            subscribeToDataChanges(errorListener);
            subscribeToDataChanges(goodListener);

            expect(() =>
                notifyDataChanged({ type: 'add', entity: 'work', id: 'test' })
            ).not.toThrow();

            expect(errorListener).toHaveBeenCalled();
            expect(goodListener).toHaveBeenCalled();
        });
    });

    describe('subscribeToDataChanges', () => {
        it('should return an unsubscribe function', () => {
            const listener = vi.fn();
            const unsubscribe = subscribeToDataChanges(listener);

            expect(typeof unsubscribe).toBe('function');
            expect(getListenerCount()).toBe(1);

            unsubscribe();
            expect(getListenerCount()).toBe(0);
        });

        it('should not call listener after unsubscribe', () => {
            const listener = vi.fn();
            const unsubscribe = subscribeToDataChanges(listener);

            notifyDataChanged({ type: 'add', entity: 'work' });
            expect(listener).toHaveBeenCalledTimes(1);

            unsubscribe();
            notifyDataChanged({ type: 'add', entity: 'work' });
            expect(listener).toHaveBeenCalledTimes(1); // Still 1, not called again
        });
    });

    describe('getListenerCount', () => {
        it('should return correct count', () => {
            expect(getListenerCount()).toBe(0);

            const unsub1 = subscribeToDataChanges(() => { });
            expect(getListenerCount()).toBe(1);

            const unsub2 = subscribeToDataChanges(() => { });
            expect(getListenerCount()).toBe(2);

            unsub1();
            expect(getListenerCount()).toBe(1);

            unsub2();
            expect(getListenerCount()).toBe(0);
        });
    });

    describe('clearListeners', () => {
        it('should remove all listeners', () => {
            subscribeToDataChanges(() => { });
            subscribeToDataChanges(() => { });
            subscribeToDataChanges(() => { });

            expect(getListenerCount()).toBe(3);
            clearListeners();
            expect(getListenerCount()).toBe(0);
        });
    });
});
