'use client';

import { useEffect, useCallback } from 'react';

interface KeyboardShortcuts {
    onSearch?: () => void;
    onEscape?: () => void;
    onNew?: () => void;
}

/**
 * Hook for global keyboard shortcuts
 * - `/` → Focus search
 * - `Escape` → Close modal/clear
 * - `n` → New entry (when not in input)
 */
export function useKeyboardShortcuts({
    onSearch,
    onEscape,
    onNew,
}: KeyboardShortcuts) {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            // Don't trigger if user is typing in an input
            const target = event.target as HTMLElement;
            const isInput = target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable;

            // Escape always works
            if (event.key === 'Escape') {
                onEscape?.();
                return;
            }

            // Other shortcuts only work outside inputs
            if (isInput) return;

            if (event.key === '/' && onSearch) {
                event.preventDefault();
                onSearch();
            }

            if (event.key === 'n' && onNew) {
                event.preventDefault();
                onNew();
            }
        },
        [onSearch, onEscape, onNew]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}
