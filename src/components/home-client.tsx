'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    BookOpen,
    Upload,
    Download,
    List,
    ChevronDown,
    Check,
    FileText,
    FileCode,
    Pause,
    Plus,
    Settings,
    Trash2,
    LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkList } from '@/components/work-list';
import { ThemeToggleButton } from '@/components/theme-toggle';
import { CreateEntryModal } from '@/components/create-entry-modal';
import { ClearAllDialog } from '@/components/clear-all-dialog';
import { signOut } from 'next-auth/react';
import type { Work } from '@prisma/client';

interface HomeClientProps {
    works: Work[];
    isAdmin?: boolean;
}

export function HomeClient({ works: initialWorks, isAdmin = false }: HomeClientProps) {
    const router = useRouter();
    const [works, setWorks] = useState(initialWorks);
    const [filter, setFilter] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showClearDialog, setShowClearDialog] = useState(false);

    // Sync works when prop changes (e.g., after navigation from import)
    useEffect(() => {
        setWorks(initialWorks);
    }, [initialWorks]);

    // Calculate stats from actual works data
    const stats = useMemo(() => {
        const total = works.length;
        const completed = works.filter(w => w.status === 'COMPLETED').length;
        const inProgress = works.filter(w => w.status === 'IN_PROGRESS').length;
        const dropped = works.filter(w => w.status === 'DROPPED_HIATUS').length;
        return { total, completed, inProgress, dropped };
    }, [works]);

    // Get next index in sequence
    const nextIndex = useMemo(() => {
        if (works.length === 0) return 1;
        return Math.max(...works.map(w => w.userIndex)) + 1;
    }, [works]);

    const handleStatClick = (status: string) => {
        setFilter(filter === status ? 'all' : status);
    };

    const handleCreated = () => {
        router.refresh();
        // Also update local state by refetching
        fetch('/api/works?limit=10000')
            .then(res => res.json())
            .then(data => setWorks(data.data || []));
    };

    const handleCleared = () => {
        setWorks([]);
        router.refresh();
        // Force refetch to ensure we don't show stale data
        setTimeout(() => {
            fetch('/api/works?limit=10000')
                .then(res => res.json())
                .then(data => setWorks(data.data || []));
        }, 100);
    };

    return (
        <div className="min-h-screen mesh-gradient">
            {/* Premium Header */}
            <header className="sticky top-0 z-40 glass border-b border-white/10">
                <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl gradient-primary shadow-lg glow-sm">
                            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                                What-Manga
                            </h1>
                            <p className="text-xs text-muted-foreground hidden sm:block">Tracker</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <ThemeToggleButton />

                        {/* + New Button - Admin only */}
                        {isAdmin && (
                            <Button
                                size="sm"
                                className="gradient-primary text-white shadow-md hover:shadow-lg transition-shadow h-8 sm:h-9 px-2 sm:px-3"
                                onClick={() => setShowCreateModal(true)}
                            >
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline ml-1">New</span>
                            </Button>
                        )}

                        {/* Import Button - Admin only */}
                        {isAdmin && (
                            <Button variant="outline" size="sm" className="glass-button h-8 sm:h-9 px-2 sm:px-3" asChild>
                                <Link href="/import">
                                    <Upload className="h-4 w-4" />
                                    <span className="hidden sm:inline ml-2">Import</span>
                                </Link>
                            </Button>
                        )}

                        {/* Export Dropdown */}
                        <div className="relative group">
                            <Button variant="outline" size="sm" className="glass-button h-8 sm:h-9 px-2 sm:px-3">
                                <Download className="h-4 w-4" />
                                <span className="hidden sm:inline ml-2">Export</span>
                                <ChevronDown className="ml-1 h-3 w-3" />
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

                        {/* Settings Dropdown */}
                        <div className="relative group">
                            <Button variant="outline" size="icon" className="glass-button h-9 w-9">
                                <Settings className="h-4 w-4" />
                            </Button>
                            <div className="absolute right-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                <div className="glass-card rounded-lg p-1 shadow-xl">
                                    {isAdmin && (
                                        <button
                                            onClick={() => setShowClearDialog(true)}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Clear All Entries
                                        </button>
                                    )}
                                    {isAdmin && <hr className="my-1 border-white/10" />}
                                    <button
                                        onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Clickable Stats Cards */}
                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
                    {/* Total */}
                    <button
                        onClick={() => handleStatClick('all')}
                        className={`glass-card rounded-2xl p-6 group hover:glow-sm transition-all duration-300 text-left ${filter === 'all' ? 'ring-2 ring-primary/50' : ''
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <List className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Works</p>
                                <p className="text-3xl font-bold tracking-tight">{stats.total}</p>
                            </div>
                        </div>
                    </button>

                    {/* Completed */}
                    <button
                        onClick={() => handleStatClick('COMPLETED')}
                        className={`glass-card rounded-2xl p-6 group hover:glow-sm transition-all duration-300 text-left ${filter === 'COMPLETED' ? 'ring-2 ring-emerald-500/50' : ''
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <Check className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                                <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{stats.completed}</p>
                            </div>
                        </div>
                    </button>

                    {/* In Progress */}
                    <button
                        onClick={() => handleStatClick('IN_PROGRESS')}
                        className={`glass-card rounded-2xl p-6 group hover:glow-sm transition-all duration-300 text-left ${filter === 'IN_PROGRESS' ? 'ring-2 ring-blue-500/50' : ''
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Reading</p>
                                <p className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
                            </div>
                        </div>
                    </button>

                    {/* Dropped */}
                    <button
                        onClick={() => handleStatClick('DROPPED_HIATUS')}
                        className={`glass-card rounded-2xl p-6 group hover:glow-sm transition-all duration-300 text-left ${filter === 'DROPPED_HIATUS' ? 'ring-2 ring-rose-500/50' : ''
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <Pause className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Dropped</p>
                                <p className="text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">{stats.dropped}</p>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Works List */}
                {stats.total === 0 ? (
                    <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-20 animate-scale-in">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 mb-6">
                            <BookOpen className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h2 className="mb-2 text-2xl font-bold">No works yet</h2>
                        <p className="mb-6 text-center text-muted-foreground max-w-md">
                            Add your first manga or import your existing list to get started.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                className="gradient-primary text-white shadow-lg hover:shadow-xl transition-shadow"
                                onClick={() => setShowCreateModal(true)}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add First Entry
                            </Button>
                            <Button variant="outline" className="glass-button" asChild>
                                <Link href="/import">
                                    <Upload className="mr-2 h-4 w-4" />
                                    Import List
                                </Link>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="animate-slide-up">
                        <WorkList
                            initialWorks={works}
                            initialFilter={filter}
                            onFilterChange={setFilter}
                        />
                    </div>
                )}
            </main>

            {/* Modals */}
            <CreateEntryModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreated={handleCreated}
                nextIndex={nextIndex}
            />

            <ClearAllDialog
                open={showClearDialog}
                onClose={() => setShowClearDialog(false)}
                onCleared={handleCleared}
                totalCount={stats.total}
            />
        </div>
    );
}
