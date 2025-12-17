import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/admin-emails';
import { notifyDataChanged } from '@/lib/dataChangeNotifier';
import { z } from 'zod';


// Query params schema
const querySchema = z.object({
    search: z.string().optional(),
    status: z.string().optional(),
    minScore: z.coerce.number().optional(),
    maxScore: z.coerce.number().optional(),
    sortBy: z.enum(['title', 'score', 'updatedAt', 'userIndex']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    page: z.coerce.number().optional(),
    limit: z.coerce.number().optional(),
});

export async function GET(request: NextRequest) {
    try {
        // Auth check - must be authenticated
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Non-admins get empty data (demo is handled by page.tsx)
        if (!isAdmin(session.user.email) || !session.user.id) {
            return NextResponse.json({
                data: [],
                pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
            });
        }

        const userId = session.user.id;

        const { searchParams } = new URL(request.url);
        const params = querySchema.parse({
            search: searchParams.get('search') || undefined,
            status: searchParams.get('status') || undefined,
            minScore: searchParams.get('minScore') || undefined,
            maxScore: searchParams.get('maxScore') || undefined,
            sortBy: searchParams.get('sortBy') || undefined,
            sortOrder: searchParams.get('sortOrder') || undefined,
            page: searchParams.get('page') || undefined,
            limit: searchParams.get('limit') || undefined,
        });

        const page = params.page || 1;
        const limit = params.limit || 50;
        const skip = (page - 1) * limit;

        // Build where clause - filter by userId (per-user data)
        const where: Record<string, unknown> = { userId };

        if (params.search) {
            where.title = {
                contains: params.search,
                mode: 'insensitive',
            };
        }

        if (params.status) {
            where.status = params.status;
        }

        if (params.minScore !== undefined || params.maxScore !== undefined) {
            where.score = {};
            if (params.minScore !== undefined) {
                (where.score as Record<string, unknown>).gte = params.minScore;
            }
            if (params.maxScore !== undefined) {
                (where.score as Record<string, unknown>).lte = params.maxScore;
            }
        }

        // Build orderBy
        const orderBy: Record<string, string> = {};
        if (params.sortBy) {
            orderBy[params.sortBy] = params.sortOrder || 'asc';
        } else {
            orderBy.userIndex = 'asc';
        }

        const [works, total] = await Promise.all([
            prisma.work.findMany({
                where,
                orderBy,
                skip,
                take: limit,
            }),
            prisma.work.count({ where }),
        ]);

        return NextResponse.json({
            data: works,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching works:', error);
        return NextResponse.json(
            { error: 'Failed to fetch works' },
            { status: 500 }
        );
    }
}

// Create schema
const createSchema = z.object({
    title: z.string().min(1),
    userIndex: z.number().int(),
    status: z.enum(['IN_PROGRESS', 'COMPLETED', 'INCOMPLETE', 'UNCERTAIN', 'DROPPED_HIATUS']).optional(),
    mangaProgressRaw: z.string().optional().nullable(),
    mangaProgressCurrent: z.number().optional().nullable(),
    mangaProgressUnit: z.string().optional().nullable(),
    novelProgressRaw: z.string().optional().nullable(),
    novelProgressCurrent: z.number().optional().nullable(),
    novelProgressUnit: z.string().optional().nullable(),
    novelExtra: z.string().optional().nullable(),
    score: z.number().min(0).max(10).optional().nullable(),
    reviewNote: z.string().optional().nullable(),
    rawImportedText: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
    try {
        // Auth check
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admin check - only admins can create
        if (!isAdmin(session.user.email)) {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        if (!session.user.id) {
            return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
        }

        const body = await request.json();
        const data = createSchema.parse(body);

        const work = await prisma.work.create({
            data: {
                ...data,
                userId: session.user.id, // Associate with admin's userId
            },
        });

        notifyDataChanged({ type: 'add', entity: 'work', id: work.id });

        return NextResponse.json(work, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            );
        }
        console.error('Error creating work:', error);
        return NextResponse.json(
            { error: 'Failed to create work' },
            { status: 500 }
        );
    }
}

