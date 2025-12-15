import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/admin-emails';
import { HomeClient } from '@/components/home-client';

// Demo data for non-admin users
const DEMO_WORKS = [
    { id: 'demo-1', title: 'Naruto', userIndex: 1, status: 'COMPLETED', score: 9.5, mangaProgressRaw: '72 vol.', mangaProgressCurrent: 72, mangaProgressUnit: 'vol', novelProgressRaw: null, novelProgressCurrent: null, novelProgressUnit: null, novelExtra: null, reviewNote: null, rawImportedText: null, createdAt: new Date(), updatedAt: new Date(), userId: null },
    { id: 'demo-2', title: 'One Piece', userIndex: 2, status: 'IN_PROGRESS', score: 10, mangaProgressRaw: '1089 ch.', mangaProgressCurrent: 1089, mangaProgressUnit: 'ch', novelProgressRaw: null, novelProgressCurrent: null, novelProgressUnit: null, novelExtra: null, reviewNote: null, rawImportedText: null, createdAt: new Date(), updatedAt: new Date(), userId: null },
    { id: 'demo-3', title: 'Attack on Titan', userIndex: 3, status: 'COMPLETED', score: 9.8, mangaProgressRaw: '139 ch.', mangaProgressCurrent: 139, mangaProgressUnit: 'ch', novelProgressRaw: null, novelProgressCurrent: null, novelProgressUnit: null, novelExtra: null, reviewNote: null, rawImportedText: null, createdAt: new Date(), updatedAt: new Date(), userId: null },
    { id: 'demo-4', title: 'Death Note', userIndex: 4, status: 'COMPLETED', score: 9.0, mangaProgressRaw: '12 vol.', mangaProgressCurrent: 12, mangaProgressUnit: 'vol', novelProgressRaw: null, novelProgressCurrent: null, novelProgressUnit: null, novelExtra: null, reviewNote: null, rawImportedText: null, createdAt: new Date(), updatedAt: new Date(), userId: null },
    { id: 'demo-5', title: 'Fullmetal Alchemist', userIndex: 5, status: 'COMPLETED', score: 9.7, mangaProgressRaw: '27 vol.', mangaProgressCurrent: 27, mangaProgressUnit: 'vol', novelProgressRaw: null, novelProgressCurrent: null, novelProgressUnit: null, novelExtra: null, reviewNote: null, rawImportedText: null, createdAt: new Date(), updatedAt: new Date(), userId: null },
    { id: 'demo-6', title: 'My Hero Academia', userIndex: 6, status: 'IN_PROGRESS', score: 8.5, mangaProgressRaw: '350 ch.', mangaProgressCurrent: 350, mangaProgressUnit: 'ch', novelProgressRaw: null, novelProgressCurrent: null, novelProgressUnit: null, novelExtra: null, reviewNote: null, rawImportedText: null, createdAt: new Date(), updatedAt: new Date(), userId: null },
    { id: 'demo-7', title: 'Demon Slayer', userIndex: 7, status: 'COMPLETED', score: 8.8, mangaProgressRaw: '23 vol.', mangaProgressCurrent: 23, mangaProgressUnit: 'vol', novelProgressRaw: null, novelProgressCurrent: null, novelProgressUnit: null, novelExtra: null, reviewNote: null, rawImportedText: null, createdAt: new Date(), updatedAt: new Date(), userId: null },
    { id: 'demo-8', title: 'Jujutsu Kaisen', userIndex: 8, status: 'IN_PROGRESS', score: 9.2, mangaProgressRaw: '230 ch.', mangaProgressCurrent: 230, mangaProgressUnit: 'ch', novelProgressRaw: null, novelProgressCurrent: null, novelProgressUnit: null, novelExtra: null, reviewNote: null, rawImportedText: null, createdAt: new Date(), updatedAt: new Date(), userId: null },
    { id: 'demo-9', title: 'Chainsaw Man', userIndex: 9, status: 'IN_PROGRESS', score: 9.0, mangaProgressRaw: '150 ch.', mangaProgressCurrent: 150, mangaProgressUnit: 'ch', novelProgressRaw: null, novelProgressCurrent: null, novelProgressUnit: null, novelExtra: null, reviewNote: null, rawImportedText: null, createdAt: new Date(), updatedAt: new Date(), userId: null },
    { id: 'demo-10', title: 'Spy x Family', userIndex: 10, status: 'IN_PROGRESS', score: 8.7, mangaProgressRaw: '80 ch.', mangaProgressCurrent: 80, mangaProgressUnit: 'ch', novelProgressRaw: null, novelProgressCurrent: null, novelProgressUnit: null, novelExtra: null, reviewNote: null, rawImportedText: null, createdAt: new Date(), updatedAt: new Date(), userId: null },
];

async function getWorks(userId: string) {
    try {
        const works = await prisma.work.findMany({
            where: { userId },
            orderBy: { userIndex: 'asc' },
        });
        return works;
    } catch {
        return [];
    }
}

export default async function HomePage() {
    const session = await auth();

    // Must be authenticated
    if (!session?.user) {
        redirect('/auth/signin');
    }

    // Check if admin
    const userIsAdmin = isAdmin(session.user.email);

    // Admins get their own data, non-admins get demo data
    const works = userIsAdmin && session.user.id
        ? await getWorks(session.user.id)
        : DEMO_WORKS;

    return <HomeClient works={works} isAdmin={userIsAdmin} />;
}

