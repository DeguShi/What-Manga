'use client';

import { cn } from '@/lib/utils';
import { useReducedMotion } from 'framer-motion';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    const shouldReduceMotion = useReducedMotion();

    return (
        <div
            className={cn(
                'rounded-md bg-muted',
                !shouldReduceMotion && 'animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:400%_100%]',
                shouldReduceMotion && 'animate-pulse',
                className
            )}
            {...props}
        />
    );
}

// Premium skeleton row for work list
function WorkListSkeleton({ rows = 8 }: { rows?: number }) {
    return (
        <div className="glass-card rounded-2xl overflow-hidden">
            {/* Header skeleton */}
            <div className="grid grid-cols-[50px_1fr_110px_80px_60px] gap-2 px-4 py-3 bg-muted/30 border-b border-white/10">
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-10" />
            </div>

            {/* Row skeletons */}
            <div className="divide-y divide-white/5">
                {Array.from({ length: rows }).map((_, i) => (
                    <div
                        key={i}
                        className="grid grid-cols-[50px_1fr_110px_80px_60px] gap-2 px-4 py-4 items-center"
                        style={{
                            animationDelay: `${i * 50}ms`,
                            opacity: 1 - (i * 0.08)
                        }}
                    >
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-4 w-14" />
                        <Skeleton className="h-4 w-8" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// Stats card skeleton
function StatsCardSkeleton() {
    return (
        <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-12" />
                </div>
            </div>
        </div>
    );
}

export { Skeleton, WorkListSkeleton, StatsCardSkeleton };
