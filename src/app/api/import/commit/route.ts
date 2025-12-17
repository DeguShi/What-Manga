import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/admin-emails';
import { notifyDataChanged } from '@/lib/dataChangeNotifier';
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
        // Auth check
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admin check - only admins can import
        if (!isAdmin(session.user.email)) {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        const userId = session.user.id;

        const body = await request.json();
        const { entries, mode } = commitSchema.parse(body);

        let created = 0;
        let updated = 0;
        const skipped = 0;

        if (mode === 'replace') {
            // Delete only THIS USER's existing works
            await prisma.work.deleteMany({
                where: { userId },
            });
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
                userId, // Associate with current user
            };

            if (mode === 'add' || mode === 'replace') {
                // Just create new entries
                await prisma.work.create({ data: workData });
                created++;
            } else if (mode === 'update') {
                // Try to find existing by title FOR THIS USER
                const existing = await prisma.work.findFirst({
                    where: {
                        title: entry.title,
                        userId, // Only find this user's works
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

        // Notify data changes for bulk operations
        if (created > 0) {
            notifyDataChanged({ type: 'add', entity: 'work', count: created });
        }
        if (updated > 0) {
            notifyDataChanged({ type: 'update', entity: 'work', count: updated });
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

