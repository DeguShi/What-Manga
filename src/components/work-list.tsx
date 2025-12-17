'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
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
import { WorkCard } from '@/components/work-card';
import { STATUS_LABELS, STATUS_BADGE_VARIANT, getScoreColor, type Status } from '@/lib/constants';
import { staggerContainer, listItemVariants, springs } from '@/lib/motion';
import type { Work } from '@prisma/client';

interface WorkListProps {
    initialWorks: Work[];
    initialFilter?: string;
    onFilterChange?: (filter: string) => void;
    searchInputRef?: React.RefObject<HTMLInputElement>;
}

type SortField = 'userIndex' | 'title' | 'score' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

// Hook to detect mobile viewport
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
}

export function WorkList({
    initialWorks,
    initialFilter = 'all',
    onFilterChange,
    searchInputRef,
}: WorkListProps) {
    const [works, setWorks] = useState<Work[]>(initialWorks);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>(initialFilter);
    const [sortField, setSortField] = useState<SortField>('userIndex');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [selectedWork, setSelectedWork] = useState<Work | null>(null);

    const parentRef = useRef<HTMLDivElement>(null);
    const isMobile = useIsMobile();

    // Sync works when initialWorks prop changes
    useEffect(() => {
        setWorks(initialWorks);
    }, [initialWorks]);

    // Sync external filter changes
    useEffect(() => {
        setStatusFilter(initialFilter);
    }, [initialFilter]);

    const handleFilterChange = (value: string) => {
        setStatusFilter(value);
        onFilterChange?.(value);
    };

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

    // Virtual scrolling for desktop table
    const rowVirtualizer = useVirtualizer({
        count: filteredAndSortedWorks.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 56,
        overscan: 10,
        enabled: !isMobile, // Disable for mobile
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

    const handleWorkDelete = (workId: string) => {
        setWorks((prev) => prev.filter((w) => w.id !== workId));
        setSelectedWork(null);
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
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 p-4 glass-card rounded-2xl">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        ref={searchInputRef}
                        placeholder="Search titles... (press /)"
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
                <Select value={statusFilter} onValueChange={handleFilterChange}>
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
                {statusFilter !== 'all' && (
                    <button
                        onClick={() => handleFilterChange('all')}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-3 w-3" />
                        Clear filter
                    </button>
                )}
                <div className="text-sm text-muted-foreground px-3 py-1.5 rounded-full bg-muted/50">
                    <span className="font-medium text-foreground">{filteredAndSortedWorks.length}</span> of {works.length} works
                </div>
            </div>

            {/* Mobile: Card Grid */}
            {isMobile ? (
                <div className="grid gap-4 px-2 w-full max-w-full overflow-hidden">
                    {filteredAndSortedWorks.map((work, index) => (
                        <WorkCard
                            key={work.id}
                            work={work}
                            index={Math.min(index, 10)} // Cap stagger delay
                            onClick={() => setSelectedWork(work)}
                        />
                    ))}
                </div>
            ) : (
                /* Desktop: Table */
                <div className="glass-card rounded-2xl overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-[50px_1fr_110px_80px_60px] gap-2 px-4 py-3 bg-muted/30 border-b border-white/10 text-sm font-medium">
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
                                    <motion.div
                                        key={work.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.15 }}
                                        onClick={() => setSelectedWork(work)}
                                        className="absolute top-0 left-0 w-full grid grid-cols-[50px_1fr_110px_80px_60px] gap-2 px-4 cursor-pointer table-row-premium border-b border-white/5 items-center"
                                        style={{
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                    >
                                        <span className="text-sm text-muted-foreground font-mono">
                                            {work.userIndex}
                                        </span>
                                        <span className="flex items-center gap-2 min-w-0">
                                            <span className="font-medium truncate">{work.title}</span>
                                            {work.novelProgressRaw && (
                                                <span className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500">
                                                    +N
                                                </span>
                                            )}
                                        </span>
                                        <span className="flex items-center">
                                            <Badge variant={STATUS_BADGE_VARIANT[work.status as Status]} className="text-xs truncate">
                                                {STATUS_LABELS[work.status as Status]}
                                            </Badge>
                                        </span>
                                        <span className="text-sm truncate">
                                            {work.mangaProgressCurrent
                                                ? `Ch. ${work.mangaProgressCurrent}`
                                                : '-'}
                                        </span>
                                        <span className={`font-bold text-sm ${getScoreColor(work.score)}`}>
                                            {work.score !== null ? work.score.toFixed(1) : '-'}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {filteredAndSortedWorks.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={springs.gentle}
                    className="glass-card rounded-2xl p-12 text-center"
                >
                    <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-muted/50 mb-4">
                        <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-lg text-display font-medium mb-1">No works found</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
                </motion.div>
            )}

            {/* Detail Panel */}
            {selectedWork && (
                <WorkDetailPanel
                    work={selectedWork}
                    open={!!selectedWork}
                    onClose={() => setSelectedWork(null)}
                    onUpdate={handleWorkUpdate}
                    onDelete={handleWorkDelete}
                />
            )}
        </div>
    );
}
