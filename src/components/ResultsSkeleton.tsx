"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface ResultsSkeletonProps {
    className?: string;
}

/**
 * ResultsSkeleton Component
 * Displays skeleton loading state that mimics final results layout
 */
export function ResultsSkeleton({ className }: ResultsSkeletonProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={cn("w-full max-w-6xl space-y-6", className)}
        >
            {/* Header with Score Ring Skeleton */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    {/* Score Ring Skeleton */}
                    <div className="flex-shrink-0">
                        <div className="w-40 h-40 rounded-full bg-white/10 shimmer" />
                    </div>

                    {/* Info Skeleton */}
                    <div className="flex-1 space-y-4 w-full">
                        <div className="h-6 bg-white/10 rounded w-3/4 shimmer" />
                        <div className="h-4 bg-white/10 rounded w-full shimmer" />
                        <div className="h-4 bg-white/10 rounded w-5/6 shimmer" />
                    </div>
                </div>
            </div>

            {/* Revenue Card Skeleton */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
                <div className="space-y-4">
                    <div className="h-5 bg-white/10 rounded w-1/4 shimmer" />
                    <div className="h-12 bg-white/10 rounded w-1/2 shimmer" />
                    <div className="h-4 bg-white/10 rounded w-1/3 shimmer" />
                </div>
            </div>

            {/* Gap Cards Skeleton (3 cards) */}
            {[1, 2, 3].map((index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
                >
                    <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                                <div className="h-5 bg-white/10 rounded w-2/3 shimmer" />
                                <div className="h-4 bg-white/10 rounded w-1/2 shimmer" />
                            </div>
                            <div className="w-16 h-8 bg-white/10 rounded-full shimmer" />
                        </div>

                        {/* Content Lines */}
                        <div className="space-y-2 pt-2">
                            <div className="h-3 bg-white/10 rounded w-full shimmer" />
                            <div className="h-3 bg-white/10 rounded w-5/6 shimmer" />
                            <div className="h-3 bg-white/10 rounded w-4/5 shimmer" />
                        </div>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}
