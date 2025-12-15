'use client';

import { motion } from 'framer-motion';
import { BookOpen, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { STATUS_LABELS, STATUS_BADGE_VARIANT, getScoreColor, type Status } from '@/lib/constants';
import { listItemVariants, springs } from '@/lib/motion';
import type { Work } from '@prisma/client';

interface WorkCardProps {
    work: Work;
    onClick: () => void;
    index: number;
}

/**
 * Mobile-optimized card for work list items
 * Replaces cramped table rows on small screens
 */
export function WorkCard({ work, onClick, index }: WorkCardProps) {
    const scoreColor = getScoreColor(work.score);

    return (
        <motion.div
            variants={listItemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ ...springs.gentle, delay: index * 0.03 }}
            onClick={onClick}
            className="group relative p-4 pl-10 rounded-xl manga-card cursor-pointer 
                       w-full max-w-full overflow-hidden box-border
                       active:scale-[0.98] transition-transform duration-150"
        >
            {/* Index badge - inline left */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center 
                           rounded-r-lg bg-primary text-primary-foreground text-xs font-bold shadow-md">
                {work.userIndex}
            </div>

            {/* Main content */}
            <div className="flex items-start justify-between gap-3">
                {/* Left: Title and progress */}
                <div className="flex-1 min-w-0 space-y-2">
                    <h3 className="text-display font-semibold text-base leading-tight truncate pr-2">
                        {work.title}
                    </h3>

                    {/* Progress row */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BookOpen className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                        <span>
                            {work.mangaProgressCurrent
                                ? `Ch. ${work.mangaProgressCurrent}`
                                : 'No progress'}
                        </span>
                        {work.novelProgressRaw && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500">
                                +Novel
                            </span>
                        )}
                    </div>
                </div>

                {/* Right: Score */}
                {work.score !== null && work.score > 0 && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <Star className={`h-4 w-4 ${scoreColor} fill-current`} />
                        <span className={`text-lg text-display font-bold ${scoreColor}`}>
                            {work.score.toFixed(1)}
                        </span>
                    </div>
                )}
            </div>

            {/* Status badge - bottom */}
            <div className="mt-3 pt-3 border-t border-white/10">
                <Badge
                    variant={STATUS_BADGE_VARIANT[work.status as Status]}
                    className="text-xs"
                >
                    {STATUS_LABELS[work.status as Status]}
                </Badge>
            </div>
        </motion.div>
    );
}
