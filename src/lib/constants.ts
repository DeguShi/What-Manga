/**
 * Shared constants for status handling
 * Consolidates duplicated definitions from work-list.tsx, work-detail-panel.tsx, create-entry-modal.tsx
 */

export type Status = 'IN_PROGRESS' | 'COMPLETED' | 'INCOMPLETE' | 'UNCERTAIN' | 'DROPPED_HIATUS';
export type BadgeVariant = 'in-progress' | 'completed' | 'incomplete' | 'uncertain' | 'dropped';

export const STATUS_OPTIONS = [
    { value: 'IN_PROGRESS' as const, label: 'In Progress', symbol: '~', color: 'text-blue-500' },
    { value: 'COMPLETED' as const, label: 'Completed', symbol: '*', color: 'text-emerald-500' },
    { value: 'INCOMPLETE' as const, label: 'Incomplete', symbol: '∆', color: 'text-amber-500' },
    { value: 'UNCERTAIN' as const, label: 'Uncertain', symbol: '?', color: 'text-purple-500' },
    { value: 'DROPPED_HIATUS' as const, label: 'Dropped/Hiatus', symbol: 'r.π', color: 'text-rose-500' },
] as const;

export const STATUS_LABELS: Record<Status, string> = {
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    INCOMPLETE: 'Incomplete',
    UNCERTAIN: 'Uncertain',
    DROPPED_HIATUS: 'Dropped',
};

export const STATUS_BADGE_VARIANT: Record<Status, BadgeVariant> = {
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed',
    INCOMPLETE: 'incomplete',
    UNCERTAIN: 'uncertain',
    DROPPED_HIATUS: 'dropped',
};

/**
 * Get status option by value
 */
export function getStatusOption(status: Status) {
    return STATUS_OPTIONS.find((o) => o.value === status);
}

/**
 * Score color based on value
 */
export function getScoreColor(score: number | null): string {
    if (score === null || score === 0) return 'text-muted-foreground';
    if (score >= 8) return 'text-emerald-500';
    if (score >= 6) return 'text-amber-500';
    return 'text-rose-500';
}
