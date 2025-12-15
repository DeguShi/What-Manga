import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { HomeClient } from '@/components/home-client';

async function getWorks() {
    try {
        const works = await prisma.work.findMany({
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
    if (!session?.user) {
        redirect('/auth/signin');
    }

    const works = await getWorks();

    return <HomeClient works={works} />;
}
