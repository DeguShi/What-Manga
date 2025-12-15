import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { HomeClient } from '@/components/home-client';

async function getWorks(userId: string) {
    try {
        const works = await prisma.work.findMany({
            where: { userId }, // Only get current user's works
            orderBy: { userIndex: 'asc' },
        });
        return works;
    } catch {
        return [];
    }
}

export default async function HomePage() {
    const session = await auth();

    // Server-side auth check - redirect if not authenticated
    if (!session?.user?.id) {
        redirect('/auth/signin');
    }

    const works = await getWorks(session.user.id);

    return <HomeClient works={works} />;
}
