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

        const result = await prisma.work.deleteMany();

        return NextResponse.json({
            success: true,
            deleted: result.count,
        });
    } catch (error) {
        console.error('Error deleting all works:', error);
        return NextResponse.json(
            { error: 'Failed to delete works' },
            { status: 500 }
        );
    }
}
