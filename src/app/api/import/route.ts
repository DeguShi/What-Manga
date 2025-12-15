import { NextRequest, NextResponse } from 'next/server';
import { parseFile, type ParsedEntry, type ProgressData, type Status } from '@/lib/parser';

// CSV column mapping
const CSV_STATUS_MAP: Record<string, Status> = {
    'IN_PROGRESS': 'IN_PROGRESS',
    'COMPLETED': 'COMPLETED',
    'INCOMPLETE': 'INCOMPLETE',
    'UNCERTAIN': 'UNCERTAIN',
    'DROPPED_HIATUS': 'DROPPED_HIATUS',
    // Also handle lowercase or variations
    'in_progress': 'IN_PROGRESS',
    'completed': 'COMPLETED',
    'incomplete': 'INCOMPLETE',
    'uncertain': 'UNCERTAIN',
    'dropped_hiatus': 'DROPPED_HIATUS',
    'dropped': 'DROPPED_HIATUS',
};

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

interface ParseStatsResult {
    entries: ParsedEntry[];
    totalLines: number;
    successCount: number;
    warningCount: number;
    errorCount: number;
    parseErrors: Array<{ line: number; message: string }>;
}

function parseCSV(content: string): ParseStatsResult {
    const lines = content.split('\n').filter(line => line.trim());
    const entries: ParsedEntry[] = [];
    const parseErrors: Array<{ line: number; message: string }> = [];

    // Skip header line
    const dataLines = lines.slice(1);

    for (let i = 0; i < dataLines.length; i++) {
        try {
            const values = parseCSVLine(dataLines[i]);

            // CSV columns: Index, Title, Status, Manga Progress, Manga Chapter, Novel Progress, Novel Chapter, Score, Notes
            const [
                indexStr,
                title,
                status,
                mangaProgressRaw,
                mangaChapter,
                novelProgressRaw,
                novelChapter,
                scoreStr,
                // notes is not used in ParsedEntry
            ] = values;

            if (!title || !title.trim()) {
                parseErrors.push({ line: i + 2, message: 'Missing title' });
                continue;
            }

            const mangaProgress: ProgressData | null = mangaChapter ? {
                raw: mangaProgressRaw || mangaChapter,
                current: parseFloat(mangaChapter) || null,
                unit: 'chapter',
                isUncertain: false,
            } : null;

            const novelProgress: ProgressData | null = novelChapter ? {
                raw: novelProgressRaw || novelChapter,
                current: parseFloat(novelChapter) || null,
                unit: 'chapter',
                isUncertain: false,
            } : null;

            const entry: ParsedEntry = {
                title: title.trim(),
                userIndex: parseInt(indexStr) || (entries.length + 1),
                status: CSV_STATUS_MAP[status] || 'IN_PROGRESS',
                mangaProgress,
                novelProgress,
                score: scoreStr ? parseFloat(scoreStr) : null,
                rawBlock: dataLines[i],
                parseWarnings: [],
            };

            entries.push(entry);
        } catch {
            parseErrors.push({ line: i + 2, message: 'Failed to parse line' });
        }
    }

    return {
        entries,
        totalLines: lines.length,
        successCount: entries.length,
        warningCount: 0,
        errorCount: parseErrors.length,
        parseErrors,
    };
}

function detectFormat(fileName: string, content: string): 'csv' | 'txt' {
    // Check file extension first
    if (fileName.endsWith('.csv')) return 'csv';
    if (fileName.endsWith('.txt')) return 'txt';

    // Auto-detect by content
    const firstLine = content.split('\n')[0];
    // CSV header check
    if (firstLine.includes('Index,Title,Status') || firstLine.includes('"Index","Title"')) {
        return 'csv';
    }

    return 'txt';
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Accept both .txt and .csv
        if (!file.name.endsWith('.txt') && !file.name.endsWith('.csv')) {
            return NextResponse.json(
                { error: 'Invalid file type. Please upload a .txt or .csv file' },
                { status: 400 }
            );
        }

        // Read file content
        const text = await file.text();

        // Auto-detect format
        const format = detectFormat(file.name, text);

        // Parse based on format
        let result: ParseStatsResult;
        if (format === 'csv') {
            result = parseCSV(text);
        } else {
            const parsed = parseFile(text);
            result = {
                entries: parsed.entries,
                totalLines: parsed.totalLines,
                successCount: parsed.successCount,
                warningCount: parsed.warningCount,
                errorCount: parsed.errorCount,
                parseErrors: parsed.parseErrors,
            };
        }

        return NextResponse.json({
            success: true,
            format,
            result: {
                entries: result.entries,
                stats: {
                    totalLines: result.totalLines,
                    successCount: result.successCount,
                    warningCount: result.warningCount,
                    errorCount: result.errorCount,
                },
                parseErrors: result.parseErrors,
            },
        });
    } catch (error) {
        console.error('Error parsing file:', error);
        return NextResponse.json(
            { error: 'Failed to parse file' },
            { status: 500 }
        );
    }
}
