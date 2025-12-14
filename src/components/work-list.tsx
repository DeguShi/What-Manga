'use client';

import { useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search, Filter, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { WorkDetailPanel } from '@/components/work-detail-panel';
import type { Work } from '@prisma/client';

interface WorkListProps {
    initialWorks: Work[];
}

type SortField = 'userIndex' | 'title' | 'score' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

const STATUS_BADGE_VARIANT: Record<string, 'in-progress' | 'completed' | 'incomplete' | 'uncertain' | 'dropped'> = {
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed',
    INCOMPLETE: 'incomplete',
    UNCERTAIN: 'uncertain',
    DROPPED_HIATUS: 'dropped',
};

const STATUS_LABELS: Record<string, string> = {
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    INCOMPLETE: 'Incomplete',
    UNCERTAIN: 'Uncertain',
    DROPPED_HIATUS: 'Dropped',
};

export function WorkList({ initialWorks }: WorkListProps) {
    const [works, setWorks] = useState<Work[]>(initialWorks);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortField, setSortField] = useState<SortField>('userIndex');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [selectedWork, setSelectedWork] = useState<Work | null>(null);

    const parentRef = useRef<HTMLDivElement>(null);

    const filteredAndSortedWorks = useMemo(() => {
        let result = [...works];

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            result = result.filter((work) =>
                work.title.toLowerCase().includes(searchLower)
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            result = result.filter((work) => work.status === statusFilter);
        }

        // Apply sorting
        result.sort((a, b) => {
            let aVal: string | number | Date | null = null;
            let bVal: string | number | Date | null = null;

            switch (sortField) {
                case 'userIndex':
                    aVal = a.userIndex;
                    bVal = b.userIndex;
                    break;
                case 'title':
                    aVal = a.title.toLowerCase();
                    bVal = b.title.toLowerCase();
                    break;
                case 'score':
                    aVal = a.score ?? -1;
                    bVal = b.score ?? -1;
                    break;
                case 'updatedAt':
                    aVal = new Date(a.updatedAt).getTime();
                    bVal = new Date(b.updatedAt).getTime();
                    break;
            }

            if (aVal === null || bVal === null) return 0;
            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [works, search, statusFilter, sortField, sortOrder]);

    // Virtual scrolling
    const rowVirtualizer = useVirtualizer({
        count: filteredAndSortedWorks.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 64,
        overscan: 10,
    });

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const handleWorkUpdate = (updatedWork: Work) => {
        setWorks((prev) =>
            prev.map((w) => (w.id === updatedWork.id ? updatedWork : w))
        );
    };

    const getScoreColor = (score: number | null) => {
        if (score === null) return 'text-muted-foreground';
        if (score >= 8) return 'text-emerald-500';
        if (score >= 6) return 'text-amber-500';
        return 'text-rose-500';
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null;
        return sortOrder === 'asc' ? (
            <ChevronUp className="ml-1 h-4 w-4 text-primary" />
        ) : (
            <ChevronDown className="ml-1 h-4 w-4 text-primary" />
        );
    };

    return (
        <div className="space-y-4">
            {/* Premium Filters */}
            <div className="flex flex-wrap items-center gap-3 p-4 glass-card rounded-2xl">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search titles..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 bg-background/50 border-white/10"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px] bg-background/50 border-white/10">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="INCOMPLETE">Incomplete</SelectItem>
                        <SelectItem value="UNCERTAIN">Uncertain</SelectItem>
                        <SelectItem value="DROPPED_HIATUS">Dropped</SelectItem>
                    </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground px-3 py-1.5 rounded-full bg-muted/50">
                    <span className="font-medium text-foreground">{filteredAndSortedWorks.length}</span> of {works.length} works
                </div>
            </div>

            {/* Premium Table */}
            <div className="glass-card rounded-2xl overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-[60px_1fr_120px_100px_80px] gap-2 px-4 py-3 bg-muted/30 border-b border-white/10 text-sm font-medium">
                    <button
                        onClick={() => toggleSort('userIndex')}
                        className="flex items-center hover:text-primary transition-colors"
                    >
                        #<SortIcon field="userIndex" />
                    </button>
                    <button
                        onClick={() => toggleSort('title')}
                        className="flex items-center hover:text-primary transition-colors"
                    >
                        Title<SortIcon field="title" />
                    </button>
                    <span>Status</span>
                    <span>Progress</span>
                    <button
                        onClick={() => toggleSort('score')}
                        className="flex items-center hover:text-primary transition-colors"
                    >
                        Score<SortIcon field="score" />
                    </button>
                </div>

                {/* Virtual Scroll Container */}
                <div
                    ref={parentRef}
                    className="overflow-auto scrollbar-thin"
                    style={{ maxHeight: 'calc(100vh - 380px)', minHeight: '400px' }}
                >
                    <div
                        style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                            const work = filteredAndSortedWorks[virtualRow.index];
                            return (
                                <div
                                    key={work.id}
                                    onClick={() => setSelectedWork(work)}
                                    className="absolute top-0 left-0 w-full grid grid-cols-[60px_1fr_120px_100px_80px] gap-2 px-4 py-3 cursor-pointer table-row-premium border-b border-white/5"
                                    style={{
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                >
                                    <span className="flex items-center text-sm text-muted-foreground font-mono">
                                        {work.userIndex}
                                    </span>
                                    <span className="flex items-center">
                                        <span className="font-medium truncate">{work.title}</span>
                                        {work.novelProgressRaw && (
                                            <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500">
                                                +Novel
                                            </span>
                                        )}
                                    </span>
                                    <span className="flex items-center">
                                        <Badge variant={STATUS_BADGE_VARIANT[work.status]} className="text-xs">
                                            {STATUS_LABELS[work.status]}
                                        </Badge>
                                    </span>
                                    <span className="flex items-center text-sm">
                                        {work.mangaProgressCurrent
                                            ? `Ch. ${work.mangaProgressCurrent}`
                                            : '-'}
                                    </span>
                                    <span className={`flex items-center font-bold ${getScoreColor(work.score)}`}>
                                        {work.score !== null ? work.score.toFixed(1) : '-'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {filteredAndSortedWorks.length === 0 && (
                    <div className="p-12 text-center text-muted-foreground">
                        <p className="text-lg font-medium mb-1">No works found</p>
                        <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                )}
            </div>

            {/* Detail Panel */}
            {selectedWork && (
                <WorkDetailPanel
                    work={selectedWork}
                    open={!!selectedWork}
                    onClose={() => setSelectedWork(null)}
                    onUpdate={handleWorkUpdate}
                />
            )}
        </div>
    );
}
