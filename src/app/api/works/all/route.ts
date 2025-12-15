import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function DELETE(request: Request) {
    try {
        // Auth check
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        const body = await request.json();

        // Require confirmation token for safety
        if (body.confirmToken !== 'DELETE_ALL_WORKS') {
            return NextResponse.json(
                { error: 'Invalid confirmation token' },
                { status: 400 }
            );
        }

        // Keep deleting until all of THIS USER's works are gone
        let totalDeleted = 0;
        let batchDeleted = 0;

        do {
            const result = await prisma.work.deleteMany({
                where: { userId }, // Only delete current user's works
            });
            batchDeleted = result.count;
            totalDeleted += batchDeleted;
            console.log(`[Clear All] User ${userId} - Deleted batch: ${batchDeleted}, total: ${totalDeleted}`);
        } while (batchDeleted > 0);

        return NextResponse.json({
            success: true,
            deleted: totalDeleted,
        });
    } catch (error) {
        console.error('Error deleting all works:', error);
        return NextResponse.json(
            { error: 'Failed to delete works' },
            { status: 500 }
        );
    }
}

