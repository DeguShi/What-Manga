import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/admin-emails';
import { notifyDataChanged } from '@/lib/dataChangeNotifier';

export async function DELETE(request: Request) {
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

        if (!session.user.id) {
            return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
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

        // Delete only THIS ADMIN's works
        let totalDeleted = 0;
        let batchDeleted = 0;

        do {
            const result = await prisma.work.deleteMany({
                where: { userId },
            });
            batchDeleted = result.count;
            totalDeleted += batchDeleted;
            console.log(`[Clear All] Admin ${session.user.email} - Deleted batch: ${batchDeleted}, total: ${totalDeleted}`);
        } while (batchDeleted > 0);

        if (totalDeleted > 0) {
            notifyDataChanged({ type: 'delete', entity: 'work', count: totalDeleted });
        }

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

