import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/admin-emails';
import { notifyDataChanged } from '@/lib/dataChangeNotifier';
import { z } from 'zod';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        // Auth check
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only admins can get individual work details
        if (!isAdmin(session.user.email)) {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        const { id } = await params;
        const work = await prisma.work.findUnique({
            where: { id },
        });

        if (!work) {
            return NextResponse.json(
                { error: 'Work not found' },
                { status: 404 }
            );
        }

        // Verify admin owns this work
        if (work.userId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden - Not your work' }, { status: 403 });
        }

        return NextResponse.json(work);
    } catch (error) {
        console.error('Error fetching work:', error);
        return NextResponse.json(
            { error: 'Failed to fetch work' },
            { status: 500 }
        );
    }
}

// Update schema
const updateSchema = z.object({
    title: z.string().min(1).optional(),
    userIndex: z.number().int().optional(),
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
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        // Auth check
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admin check
        if (!isAdmin(session.user.email)) {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        const { id } = await params;

        // Verify work exists and belongs to this admin
        const existingWork = await prisma.work.findUnique({ where: { id } });
        if (!existingWork) {
            return NextResponse.json({ error: 'Work not found' }, { status: 404 });
        }
        if (existingWork.userId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden - Not your work' }, { status: 403 });
        }

        const body = await request.json();
        const data = updateSchema.parse(body);

        const work = await prisma.work.update({
            where: { id },
            data,
        });

        notifyDataChanged({ type: 'update', entity: 'work', id: work.id });

        return NextResponse.json(work);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            );
        }
        console.error('Error updating work:', error);
        return NextResponse.json(
            { error: 'Failed to update work' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        // Auth check
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admin check
        if (!isAdmin(session.user.email)) {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        const { id } = await params;

        // Verify work exists and belongs to this admin
        const existingWork = await prisma.work.findUnique({ where: { id } });
        if (!existingWork) {
            return NextResponse.json({ error: 'Work not found' }, { status: 404 });
        }
        if (existingWork.userId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden - Not your work' }, { status: 403 });
        }

        await prisma.work.delete({
            where: { id },
        });

        notifyDataChanged({ type: 'delete', entity: 'work', id });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting work:', error);
        return NextResponse.json(
            { error: 'Failed to delete work' },
            { status: 500 }
        );
    }
}

