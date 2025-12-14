import Link from 'next/link';
import {
    BookOpen,
    Upload,
    Download,
    List,
    ChevronDown,
    Check,
    FileText,
    FileCode,
} from 'lucide-react';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { WorkList } from '@/components/work-list';
import { ThemeToggleButton } from '@/components/theme-toggle';

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

async function getStats() {
    try {
        const [total, completed, inProgress, dropped] = await Promise.all([
            prisma.work.count(),
            prisma.work.count({ where: { status: 'COMPLETED' } }),
            prisma.work.count({ where: { status: 'IN_PROGRESS' } }),
            prisma.work.count({ where: { status: 'DROPPED_HIATUS' } }),
        ]);
        return { total, completed, inProgress, dropped };
    } catch {
        return { total: 0, completed: 0, inProgress: 0, dropped: 0 };
    }
}

export default async function HomePage() {
    const [works, stats] = await Promise.all([getWorks(), getStats()]);

    return (
        <div className="min-h-screen mesh-gradient">
            {/* Premium Header */}
            <header className="sticky top-0 z-40 glass border-b border-white/10">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-lg glow-sm">
                            <BookOpen className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                                What-Manga
                            </h1>
                            <p className="text-xs text-muted-foreground hidden sm:block">Tracker</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <ThemeToggleButton />

                        <Button variant="outline" size="sm" className="glass-button" asChild>
                            <Link href="/import">
                                <Upload className="mr-2 h-4 w-4" />
                                Import
                            </Link>
                        </Button>

                        {/* Export Dropdown */}
                        <div className="relative group">
                            <Button variant="outline" size="sm" className="glass-button">
                                <Download className="mr-2 h-4 w-4" />
                                Export
                                <ChevronDown className="ml-2 h-3 w-3" />
                            </Button>
                            <div className="absolute right-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                <div className="glass-card rounded-lg p-1 shadow-xl">
                                    <a
                                        href="/api/export/csv"
                                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-primary/10 transition-colors"
                                    >
                                        <FileText className="h-4 w-4" />
                                        CSV Spreadsheet
                                    </a>
                                    <a
                                        href="/api/export/mal"
                                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-primary/10 transition-colors"
                                    >
                                        <FileCode className="h-4 w-4" />
                                        MAL XML Format
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Premium Stats Cards */}
                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
                    <div className="glass-card rounded-2xl p-6 group hover:glow-sm transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <List className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Works</p>
                                <p className="text-3xl font-bold tracking-tight">{stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card rounded-2xl p-6 group hover:glow-sm transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <Check className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                                <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{stats.completed}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card rounded-2xl p-6 group hover:glow-sm transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Reading</p>
                                <p className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card rounded-2xl p-6 group hover:glow-sm transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Dropped</p>
                                <p className="text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">{stats.dropped}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Works List */}
                {stats.total === 0 ? (
                    <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-20 animate-scale-in">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 mb-6">
                            <BookOpen className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h2 className="mb-2 text-2xl font-bold">No works yet</h2>
                        <p className="mb-6 text-center text-muted-foreground max-w-md">
                            Import your manga list to get started tracking your reading progress.
                        </p>
                        <Button className="gradient-primary text-white shadow-lg hover:shadow-xl transition-shadow" asChild>
                            <Link href="/import">
                                <Upload className="mr-2 h-4 w-4" />
                                Import your list
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="animate-slide-up">
                        <WorkList initialWorks={works} />
                    </div>
                )}
            </main>
        </div>
    );
}
