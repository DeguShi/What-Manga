/**
 * Manga List Parser
 * 
 * Parses the custom .txt format for manga tracking lists.
 * Handles various edge cases including:
 * - Multiple status symbols (~, *, ∆, r.π, ?)
 * - Decimal chapter/volume numbers
 * - Novel tracking in brackets or parentheses
 * - Scores in braces {N.N}
 * - Multi-line entries
 */

import type { ParsedEntry, ParseResult, ProgressData, Status } from './types';
import { SYMBOL_STATUS_MAP } from './types';
import {
    ENTRY_HEADER_PATTERN,
    SCORE_PATTERN,
    STATUS_SYMBOL_PATTERN,
    UNCERTAIN_PATTERN,
    PROGRESS_NUMBER_PATTERN,
    VOLUME_CHAPTER_COMBO_PATTERN,
    SEASON_PATTERN,
    detectUnit,
} from './patterns';

/**
 * Split the file into entry blocks (each starting with "N- Title")
 */
function splitIntoBlocks(text: string): Array<{ lineNumber: number; block: string }> {
    const lines = text.split('\n');
    const blocks: Array<{ lineNumber: number; block: string }> = [];
    let currentBlock: string[] = [];
    let currentStartLine = -1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = ENTRY_HEADER_PATTERN.exec(line.trim());

        if (match) {
            // Save previous block if exists
            if (currentBlock.length > 0 && currentStartLine >= 0) {
                blocks.push({
                    lineNumber: currentStartLine,
                    block: currentBlock.join('\n'),
                });
            }
            // Start new block
            currentBlock = [line];
            currentStartLine = i + 1; // 1-indexed
        } else if (currentBlock.length > 0) {
            // Add to current block
            currentBlock.push(line);
        }
    }

    // Don't forget the last block
    if (currentBlock.length > 0 && currentStartLine >= 0) {
        blocks.push({
            lineNumber: currentStartLine,
            block: currentBlock.join('\n'),
        });
    }

    return blocks;
}

/**
 * Extract status from progress text
 */
function extractStatus(text: string): { status: Status; isUncertain: boolean } {
    // Check for uncertain marker first
    const isUncertain = UNCERTAIN_PATTERN.test(text);

    // Check for r.π first (it's a longer pattern)
    if (text.includes('r.π')) {
        return { status: 'DROPPED_HIATUS', isUncertain };
    }

    // Look for status symbols anywhere in the text (not just at start)
    // Order matters: check specific patterns first
    if (text.includes('*')) {
        return { status: 'COMPLETED', isUncertain };
    }

    if (text.includes('∆')) {
        return { status: 'INCOMPLETE', isUncertain };
    }

    if (text.includes('~')) {
        // If uncertain and has ~, mark as uncertain
        if (isUncertain) {
            return { status: 'UNCERTAIN', isUncertain: true };
        }
        return { status: 'IN_PROGRESS', isUncertain: false };
    }

    // Default: if just a question mark, it's uncertain
    if (isUncertain) {
        return { status: 'UNCERTAIN', isUncertain: true };
    }

    // Default to in progress for implicit cases
    return { status: 'IN_PROGRESS', isUncertain: false };
}

/**
 * Extract progress number from text
 */
function extractProgressNumber(text: string): number | null {
    // Check for volume + chapter combo first
    const comboMatch = VOLUME_CHAPTER_COMBO_PATTERN.exec(text);
    if (comboMatch) {
        // Return the chapter number (second group)
        return parseFloat(comboMatch[2]);
    }

    // Check for season
    const seasonMatches: number[] = [];
    let seasonMatch;
    const seasonPattern = new RegExp(SEASON_PATTERN.source, 'gi');
    while ((seasonMatch = seasonPattern.exec(text)) !== null) {
        seasonMatches.push(parseInt(seasonMatch[1], 10));
    }
    if (seasonMatches.length > 0) {
        // Return the highest season number
        return Math.max(...seasonMatches);
    }

    // Try to extract a regular number
    const numberMatch = PROGRESS_NUMBER_PATTERN.exec(text);
    if (numberMatch) {
        return parseFloat(numberMatch[1]);
    }

    return null;
}

/**
 * Parse manga progress from text
 */
function parseMangaProgress(text: string): ProgressData | null {
    // Find manga-related content
    const mangaPatterns = [
        /\([^)]*mang[aá][^)]*\)/gi,
        /mang[aá][^.)\]]*[.)\]]/gi,
    ];

    let mangaText: string | null = null;
    for (const pattern of mangaPatterns) {
        const matches = text.match(pattern);
        if (matches && matches.length > 0) {
            mangaText = matches[0];
            break;
        }
    }

    if (!mangaText) return null;

    const { status, isUncertain } = extractStatus(mangaText);
    const current = extractProgressNumber(mangaText);
    const unit = detectUnit(mangaText);

    return {
        raw: mangaText.trim(),
        current,
        unit,
        isUncertain,
    };
}

/**
 * Parse novel progress from text
 */
function parseNovelProgress(text: string): { progress: ProgressData | null; extra: string | null } {
    // Find novel-related content in brackets or parentheses
    const novelPatterns = [
        /\[[^\]]*(?:novel|ln|light\s*novel)[^\]]*\]/gi,
        /\([^)]*(?:novel|ln|light\s*novel)[^)]*\)/gi,
        /(?:novel|ln|light\s*novel)[^.)\]]*[.)\]]/gi,
    ];

    let novelText: string | null = null;
    for (const pattern of novelPatterns) {
        const matches = text.match(pattern);
        if (matches && matches.length > 0) {
            novelText = matches[0];
            break;
        }
    }

    if (!novelText) return { progress: null, extra: null };

    // Check for extra info like "Livro 7"
    const extraMatch = /\(Livro\s*(\d+)\)/i.exec(novelText);
    const extra = extraMatch ? `Livro ${extraMatch[1]}` : null;

    const { status, isUncertain } = extractStatus(novelText);
    const current = extractProgressNumber(novelText);
    const unit = detectUnit(novelText);

    return {
        progress: {
            raw: novelText.trim(),
            current,
            unit: unit === 'unknown' ? 'chapter' : unit,
            isUncertain,
        },
        extra,
    };
}

/**
 * Parse score from text
 */
function parseScore(text: string): number | null {
    const match = SCORE_PATTERN.exec(text);
    if (match) {
        const score = parseFloat(match[1]);
        // Validate score is in 0-10 range
        if (score >= 0 && score <= 10) {
            return score;
        }
    }
    return null;
}

/**
 * Parse a single entry block
 */
function parseEntryBlock(block: string, lineNumber: number): ParsedEntry | null {
    const lines = block.split('\n').filter((l) => l.trim());
    if (lines.length === 0) return null;

    const warnings: string[] = [];

    // Parse header
    const headerMatch = ENTRY_HEADER_PATTERN.exec(lines[0].trim());
    if (!headerMatch) return null;

    const userIndex = parseInt(headerMatch[1], 10);
    const title = headerMatch[2].trim();

    // Check for empty entry (just "N-" with no title)
    if (!title) {
        return null;
    }

    // Join remaining lines for parsing
    const contentText = lines.slice(1).join(' ');

    // Also check if header line has content after title
    const fullText = block;

    // Parse manga progress
    const mangaProgress = parseMangaProgress(fullText);
    if (!mangaProgress && contentText.includes('mangá')) {
        warnings.push('Could not parse manga progress');
    }

    // Parse novel progress
    const { progress: novelProgress, extra: novelExtra } = parseNovelProgress(fullText);

    // Parse score
    const score = parseScore(fullText);

    // Determine overall status (prioritize manga progress status)
    let status: Status = 'IN_PROGRESS';
    if (mangaProgress) {
        const { status: mangaStatus } = extractStatus(mangaProgress.raw);
        status = mangaStatus;
        if (mangaProgress.isUncertain && status === 'IN_PROGRESS') {
            status = 'UNCERTAIN';
        }
    }

    // Validate
    if (!mangaProgress && !novelProgress) {
        // This might be a header-only entry or malformed
        if (lines.length === 1) {
            // Just a title, no progress info yet
            warnings.push('Entry has no progress information');
        }
    }

    return {
        userIndex,
        title,
        status,
        mangaProgress,
        novelProgress: novelProgress
            ? { ...novelProgress }
            : null,
        score,
        rawBlock: block.trim(),
        parseWarnings: warnings,
    };
}

/**
 * Main parsing function
 * Takes the full .txt file content and returns structured data
 */
export function parseFile(text: string): ParseResult {
    const blocks = splitIntoBlocks(text);
    const entries: ParsedEntry[] = [];
    const parseErrors: Array<{ line: number; message: string }> = [];

    let successCount = 0;
    let warningCount = 0;
    let errorCount = 0;

    for (const { lineNumber, block } of blocks) {
        try {
            const entry = parseEntryBlock(block, lineNumber);
            if (entry) {
                entries.push(entry);
                successCount++;
                if (entry.parseWarnings.length > 0) {
                    warningCount++;
                }
            }
        } catch (error) {
            errorCount++;
            parseErrors.push({
                line: lineNumber,
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    return {
        entries,
        totalLines: text.split('\n').length,
        successCount,
        warningCount,
        errorCount,
        parseErrors,
    };
}

/**
 * Export parsed entries to CSV format
 */
export function exportToCsv(entries: ParsedEntry[]): string {
    const headers = [
        'Index',
        'Title',
        'Status',
        'Manga Progress',
        'Manga Chapter',
        'Manga Unit',
        'Novel Progress',
        'Novel Chapter',
        'Novel Unit',
        'Score',
        'Warnings',
    ];

    const rows = entries.map((entry) => [
        entry.userIndex.toString(),
        `"${entry.title.replace(/"/g, '""')}"`,
        entry.status,
        entry.mangaProgress?.raw || '',
        entry.mangaProgress?.current?.toString() || '',
        entry.mangaProgress?.unit || '',
        entry.novelProgress?.raw || '',
        entry.novelProgress?.current?.toString() || '',
        entry.novelProgress?.unit || '',
        entry.score?.toString() || '',
        entry.parseWarnings.join('; '),
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

// Re-export types
export * from './types';
