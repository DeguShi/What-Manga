import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(request: Request) {
    try {
        const body = await request.json();

        // Require confirmation token for safety
        if (body.confirmToken !== 'DELETE_ALL_WORKS') {
            return NextResponse.json(
                { error: 'Invalid confirmation token' },
                { status: 400 }
            );
        }

        // Keep deleting until all works are gone (handles batch limits)
        let totalDeleted = 0;
        let batchDeleted = 0;

        do {
            const result = await prisma.work.deleteMany();
            batchDeleted = result.count;
            totalDeleted += batchDeleted;
            console.log(`[Clear All] Deleted batch: ${batchDeleted}, total: ${totalDeleted}`);
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
