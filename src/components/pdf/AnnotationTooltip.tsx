"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import type { DocumentationGap } from "@/lib/billing-rules";

interface AnnotationTooltipProps {
    gap: DocumentationGap;
    position: { x: number; y: number };
    isVisible: boolean;
    onMarkFixed?: () => void;
    onViewDetails?: () => void;
}

const severityColors = {
    critical: "text-red-400 bg-red-500/10 border-red-500/20",
    major: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    moderate: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    minor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
};

export function AnnotationTooltip({
    gap,
    position,
    isVisible,
    onMarkFixed,
    onViewDetails,
}: AnnotationTooltipProps) {
    // Smart positioning to avoid viewport edges
    const getTooltipPosition = () => {
        const tooltipWidth = 320;
        const tooltipHeight = 180;
        const padding = 20;

        let x = position.x + 10;
        let y = position.y - tooltipHeight - 10;

        // Check right edge
        if (x + tooltipWidth > window.innerWidth - padding) {
            x = position.x - tooltipWidth - 10;
        }

        // Check top edge
        if (y < padding) {
            y = position.y + 30;
        }

        return { x, y };
    };

    const tooltipPos = getTooltipPosition();

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="fixed z-50 pointer-events-auto"
                    style={{
                        left: tooltipPos.x,
                        top: tooltipPos.y,
                    }}
                >
                    <div className="w-80 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                        {/* Header with severity badge */}
                        <div className="p-4 border-b border-white/5">
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <span
                                    className={cn(
                                        "px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border",
                                        severityColors[gap.category]
                                    )}
                                >
                                    {gap.category}
                                </span>
                                {gap.potentialRevenueLoss && (
                                    <span className="text-red-400 font-mono text-sm font-bold">
                                        -{gap.potentialRevenueLoss}
                                    </span>
                                )}
                            </div>
                            <h4 className="text-white font-semibold text-sm leading-tight">
                                {gap.title.length > 60
                                    ? gap.title.substring(0, 60) + "..."
                                    : gap.title}
                            </h4>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            <p className="text-white/70 text-xs leading-relaxed line-clamp-3">
                                {gap.description}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="p-3 bg-white/5 border-t border-white/5 flex gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onViewDetails?.();
                                }}
                                className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-medium rounded-lg transition-colors border border-blue-500/20"
                            >
                                View Details
                            </button>
                            {onMarkFixed && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onMarkFixed();
                                    }}
                                    className="flex-1 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium rounded-lg transition-colors border border-emerald-500/20 flex items-center justify-center gap-1.5"
                                >
                                    <span>✓</span>
                                    <span>Mark Fixed</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Arrow pointer */}
                    <div
                        className="absolute w-3 h-3 bg-gray-900/95 border-l border-t border-white/10 transform rotate-45"
                        style={{
                            left: "20px",
                            bottom: "-6px",
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
