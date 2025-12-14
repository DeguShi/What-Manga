/**
 * Type definitions for the manga list parser
 */

export type Status = 'IN_PROGRESS' | 'COMPLETED' | 'INCOMPLETE' | 'UNCERTAIN' | 'DROPPED_HIATUS';

export interface ProgressData {
    raw: string;
    current: number | null;
    unit: 'chapter' | 'volume' | 'season' | 'mixed' | 'unknown';
    isUncertain: boolean;
}

export interface ParsedEntry {
    userIndex: number;
    title: string;
    status: Status;
    mangaProgress: ProgressData | null;
    novelProgress: ProgressData | null;
    score: number | null;
    rawBlock: string;
    parseWarnings: string[];
}

export interface ParseResult {
    entries: ParsedEntry[];
    totalLines: number;
    successCount: number;
    warningCount: number;
    errorCount: number;
    parseErrors: Array<{ line: number; message: string }>;
}

/**
 * Symbol to status mapping
 * ~ = in progress
 * * = completed
 * ∆ = incomplete
 * ? = uncertain (can combine with ~)
 * r.π = dropped/hiatus
 */
export const SYMBOL_STATUS_MAP: Record<string, Status> = {
    '~': 'IN_PROGRESS',
    '*': 'COMPLETED',
    '∆': 'INCOMPLETE',
    'r.π': 'DROPPED_HIATUS',
};

/**
 * Status display info for UI
 */
export const STATUS_DISPLAY: Record<Status, { label: string; symbol: string; color: string }> = {
    IN_PROGRESS: { label: 'In Progress', symbol: '~', color: 'blue' },
    COMPLETED: { label: 'Completed', symbol: '*', color: 'green' },
    INCOMPLETE: { label: 'Incomplete', symbol: '∆', color: 'amber' },
    UNCERTAIN: { label: 'Uncertain', symbol: '?', color: 'purple' },
    DROPPED_HIATUS: { label: 'Dropped/Hiatus', symbol: 'r.π', color: 'red' },
};
