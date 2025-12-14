import Link from 'next/link';
import {
    BookOpen,
    Upload,
    Download,
    Search,
    Filter,
    List,
} from 'lucide-react';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WorkList } from '@/components/work-list';

async function getWorks() {
    try {
        const works = await prisma.work.findMany({
            orderBy: { userIndex: 'asc' },
            take: 100,
        });
        return works;
    } catch {
        // Database might not exist yet
        return [];
    }
}

async function getStats() {
    try {
        const [total, completed, inProgress] = await Promise.all([
            prisma.work.count(),
            prisma.work.count({ where: { status: 'COMPLETED' } }),
            prisma.work.count({ where: { status: 'IN_PROGRESS' } }),
        ]);
        return { total, completed, inProgress };
    } catch {
        return { total: 0, completed: 0, inProgress: 0 };
    }
}

export default async function HomePage() {
    const [works, stats] = await Promise.all([getWorks(), getStats()]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">What-Manga</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/import">
                                <Upload className="mr-2 h-4 w-4" />
                                Import
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <a href="/api/export/csv">
                                <Download className="mr-2 h-4 w-4" />
                                Export CSV
                            </a>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Stats Cards */}
                <div className="mb-8 grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                <List className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Works</p>
                                <p className="text-3xl font-bold">{stats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                                <BookOpen className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Completed</p>
                                <p className="text-3xl font-bold">{stats.completed}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                                <BookOpen className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">In Progress</p>
                                <p className="text-3xl font-bold">{stats.inProgress}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Works List */}
                {stats.total === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/40 py-20">
                        <BookOpen className="mb-4 h-16 w-16 text-muted-foreground/50" />
                        <h2 className="mb-2 text-xl font-semibold">No works yet</h2>
                        <p className="mb-6 text-center text-muted-foreground">
                            Import your manga list to get started tracking your reading progress.
                        </p>
                        <Button asChild>
                            <Link href="/import">
                                <Upload className="mr-2 h-4 w-4" />
                                Import your list
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <WorkList initialWorks={works} />
                )}
            </main>
        </div>
    );
}
