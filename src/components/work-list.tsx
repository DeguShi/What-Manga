'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { WorkDetailDrawer } from '@/components/work-detail-drawer';
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
        if (score >= 8) return 'text-green-600 dark:text-green-400';
        if (score >= 6) return 'text-amber-600 dark:text-amber-400';
        return 'text-red-600 dark:text-red-400';
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null;
        return sortOrder === 'asc' ? (
            <ChevronUp className="ml-1 h-4 w-4" />
        ) : (
            <ChevronDown className="ml-1 h-4 w-4" />
        );
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search titles..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px]">
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
                <div className="text-sm text-muted-foreground">
                    {filteredAndSortedWorks.length} of {works.length} works
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border bg-card">
                <table className="w-full">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="p-3 text-left text-sm font-medium">
                                <button
                                    onClick={() => toggleSort('userIndex')}
                                    className="flex items-center hover:text-primary"
                                >
                                    #
                                    <SortIcon field="userIndex" />
                                </button>
                            </th>
                            <th className="p-3 text-left text-sm font-medium">
                                <button
                                    onClick={() => toggleSort('title')}
                                    className="flex items-center hover:text-primary"
                                >
                                    Title
                                    <SortIcon field="title" />
                                </button>
                            </th>
                            <th className="p-3 text-left text-sm font-medium">Status</th>
                            <th className="p-3 text-left text-sm font-medium">Progress</th>
                            <th className="p-3 text-left text-sm font-medium">
                                <button
                                    onClick={() => toggleSort('score')}
                                    className="flex items-center hover:text-primary"
                                >
                                    Score
                                    <SortIcon field="score" />
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedWorks.map((work) => (
                            <tr
                                key={work.id}
                                onClick={() => setSelectedWork(work)}
                                className="cursor-pointer border-b transition-colors hover:bg-muted/50 last:border-0"
                            >
                                <td className="p-3 text-sm text-muted-foreground">
                                    {work.userIndex}
                                </td>
                                <td className="p-3">
                                    <span className="font-medium">{work.title}</span>
                                    {work.novelProgressRaw && (
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            +Novel
                                        </span>
                                    )}
                                </td>
                                <td className="p-3">
                                    <Badge variant={STATUS_BADGE_VARIANT[work.status]}>
                                        {STATUS_LABELS[work.status]}
                                    </Badge>
                                </td>
                                <td className="p-3 text-sm">
                                    {work.mangaProgressCurrent
                                        ? `Ch. ${work.mangaProgressCurrent}`
                                        : work.mangaProgressRaw || '-'}
                                </td>
                                <td className="p-3">
                                    <span className={`font-medium ${getScoreColor(work.score)}`}>
                                        {work.score !== null ? work.score.toFixed(1) : '-'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredAndSortedWorks.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                        No works found matching your criteria.
                    </div>
                )}
            </div>

            {/* Detail Drawer */}
            {selectedWork && (
                <WorkDetailDrawer
                    work={selectedWork}
                    open={!!selectedWork}
                    onClose={() => setSelectedWork(null)}
                    onUpdate={handleWorkUpdate}
                />
            )}
        </div>
    );
}
