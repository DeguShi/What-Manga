import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import type { Status } from '@/lib/parser';

const commitSchema = z.object({
    entries: z.array(
        z.object({
            userIndex: z.number(),
            title: z.string(),
            status: z.enum(['IN_PROGRESS', 'COMPLETED', 'INCOMPLETE', 'UNCERTAIN', 'DROPPED_HIATUS']),
            mangaProgress: z
                .object({
                    raw: z.string(),
                    current: z.number().nullable(),
                    unit: z.string(),
                    isUncertain: z.boolean(),
                })
                .nullable(),
            novelProgress: z
                .object({
                    raw: z.string(),
                    current: z.number().nullable(),
                    unit: z.string(),
                    isUncertain: z.boolean(),
                })
                .nullable(),
            score: z.number().nullable(),
            rawBlock: z.string(),
            parseWarnings: z.array(z.string()),
        })
    ),
    mode: z.enum(['add', 'update', 'replace']),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { entries, mode } = commitSchema.parse(body);

        let created = 0;
        let updated = 0;
        const skipped = 0;

        if (mode === 'replace') {
            // Delete all existing works
            await prisma.work.deleteMany();
        }

        for (const entry of entries) {
            const workData = {
                title: entry.title,
                userIndex: entry.userIndex,
                status: entry.status as Status,
                mangaProgressRaw: entry.mangaProgress?.raw || null,
                mangaProgressCurrent: entry.mangaProgress?.current || null,
                mangaProgressUnit: entry.mangaProgress?.unit || null,
                novelProgressRaw: entry.novelProgress?.raw || null,
                novelProgressCurrent: entry.novelProgress?.current || null,
                novelProgressUnit: entry.novelProgress?.unit || null,
                score: entry.score,
                rawImportedText: entry.rawBlock,
            };

            if (mode === 'add' || mode === 'replace') {
                // Just create new entries
                await prisma.work.create({ data: workData });
                created++;
            } else if (mode === 'update') {
                // Try to find existing by title (exact match, case sensitive)
                const existing = await prisma.work.findFirst({
                    where: {
                        title: entry.title,
                    },
                });
                if (existing) {
                    await prisma.work.update({
                        where: { id: existing.id },
                        data: workData,
                    });
                    updated++;
                } else {
                    await prisma.work.create({ data: workData });
                    created++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            stats: {
                created,
                updated,
                skipped,
                total: entries.length,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            );
        }
        console.error('Error committing import:', error);
        return NextResponse.json(
            { error: 'Failed to commit import' },
            { status: 500 }
        );
    }
}
