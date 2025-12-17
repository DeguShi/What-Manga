import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/admin-emails';

export async function GET() {
    try {
        // Auth check
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admin check - only admins can export their data
        if (!isAdmin(session.user.email) || !session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const userId = session.user.id;

        const works = await prisma.work.findMany({
            where: { userId },
            orderBy: { userIndex: 'asc' },
        });

        // Generate CSV
        const headers = [
            'Index',
            'Title',
            'Status',
            'Manga Progress',
            'Manga Chapter',
            'Novel Progress',
            'Novel Chapter',
            'Score',
            'Notes',
        ];

        const rows = works.map((work) => [
            work.userIndex.toString(),
            `"${work.title.replace(/"/g, '""')}"`,
            work.status,
            work.mangaProgressRaw ? `"${work.mangaProgressRaw.replace(/"/g, '""')}"` : '',
            work.mangaProgressCurrent?.toString() || '',
            work.novelProgressRaw ? `"${work.novelProgressRaw.replace(/"/g, '""')}"` : '',
            work.novelProgressCurrent?.toString() || '',
            work.score?.toString() || '',
            work.reviewNote ? `"${work.reviewNote.replace(/"/g, '""')}"` : '',
        ]);

        const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="manga-list-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error('Error exporting CSV:', error);
        return NextResponse.json(
            { error: 'Failed to export CSV' },
            { status: 500 }
        );
    }
}
