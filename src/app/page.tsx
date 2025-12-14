import { prisma } from '@/lib/db';
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
    const works = await getWorks();

    return <HomeClient works={works} />;
}
