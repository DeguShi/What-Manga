import { NextRequest, NextResponse } from 'next/server';
import { parseFile } from '@/lib/parser';

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

        // Check file type
        if (!file.name.endsWith('.txt')) {
            return NextResponse.json(
                { error: 'Invalid file type. Please upload a .txt file' },
                { status: 400 }
            );
        }

        // Read file content
        const text = await file.text();

        // Parse the file
        const result = parseFile(text);

        return NextResponse.json({
            success: true,
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
