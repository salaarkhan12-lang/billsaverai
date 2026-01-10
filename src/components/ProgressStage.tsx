"use client";

import { motion } from "framer-motion";
import type { ProgressUpdate } from "@/lib/progress-tracker";
import { cn } from "@/lib/cn";

interface ProgressStageProps {
    update: ProgressUpdate;
    className?: string;
}

/**
 * ProgressStage Component
 * Displays current processing stage with animated progress bar
 */
export function ProgressStage({ update, className }: ProgressStageProps) {
    const { currentStage, overallPercent, message, icon, estimatedTimeRemaining } = update;

    return (
        <div className={cn("w-full space-y-3", className)}>
            {/* Stage Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <motion.span
                        key={icon}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="text-2xl"
                    >
                        {icon}
                    </motion.span>
                    <motion.div
                        key={message}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-sm font-medium text-white"
                    >
                        {message}
                    </motion.div>
                </div>

                {/* Percent & Time Remaining */}
                <div className="flex items-center gap-3 text-xs text-white/60">
                    <span className="font-mono font-semibold">{overallPercent}%</span>
                    {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 && (
                        <span className="text-white/40">
                            ~{estimatedTimeRemaining}s remaining
                        </span>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                {/* Gradient Fill */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${overallPercent}%` }}
                    transition={{
                        duration: 0.5,
                        ease: "easeOut"
                    }}
                    className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-full relative"
                >
                    {/* Pulsing Glow Effect */}
                    <motion.div
                        animate={{
                            opacity: [0.5, 1, 0.5],
                            scale: [1, 1.05, 1]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute inset-0 bg-white/20 rounded-full"
                    />
                </motion.div>

                {/* Shimmer Effect (moving highlight) */}
                {overallPercent < 100 && (
                    <motion.div
                        animate={{
                            x: ["-100%", "300%"]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        style={{
                            width: `${Math.min(overallPercent * 3, 100)}%`
                        }}
                    />
                )}
            </div>

            {/* Stage Indicators (mini dots) */}
            <div className="flex items-center justify-center gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map((stageNum) => (
                    <div
                        key={stageNum}
                        className={cn(
                            "h-1.5 rounded-full transition-all duration-300",
                            stageNum === currentStage.id
                                ? "w-8 bg-gradient-to-r from-purple-500 to-blue-500"
                                : stageNum < currentStage.id
                                    ? "w-1.5 bg-green-500/60"
                                    : "w-1.5 bg-white/20"
                        )}
                    />
                ))}
            </div>
        </div>
    );
}
