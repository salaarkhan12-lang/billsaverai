"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import type { DocumentationGap } from "@/lib/billing-rules";

interface AnnotationDetailsPanelProps {
    gap: DocumentationGap;
    isOpen: boolean;
    onClose: () => void;
    onMarkFixed?: () => void;
    relatedGaps?: DocumentationGap[];
}

const severityConfig = {
    critical: {
        color: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/20",
        icon: "🚨",
    },
    major: {
        color: "text-orange-400",
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
        icon: "⚠️",
    },
    moderate: {
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/20",
        icon: "📌",
    },
    minor: {
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        icon: "ℹ️",
    },
};

export function AnnotationDetailsPanel({
    gap,
    isOpen,
    onClose,
    onMarkFixed,
    relatedGaps = [],
}: AnnotationDetailsPanelProps) {
    const config = severityConfig[gap.category];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-gray-900/98 backdrop-blur-xl border-l border-white/10 shadow-2xl z-50 overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border",
                                            config.color,
                                            config.bg,
                                            config.border
                                        )}
                                    >
                                        {config.icon} {gap.category}
                                    </span>
                                    {gap.potentialRevenueLoss && (
                                        <span className="text-red-400 font-mono text-sm font-bold">
                                            -{gap.potentialRevenueLoss}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <h2 className="text-xl font-bold text-white leading-tight">
                                {gap.title}
                            </h2>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Description */}
                            <div>
                                <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-2">
                                    Issue Description
                                </h3>
                                <p className="text-white/80 text-sm leading-relaxed">
                                    {gap.description}
                                </p>
                            </div>

                            {/* Impact */}
                            <div>
                                <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-2">
                                    Impact
                                </h3>
                                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                    <p className="text-white/80 text-sm leading-relaxed">
                                        {gap.impact}
                                    </p>
                                </div>
                            </div>

                            {/* Recommendation */}
                            <div>
                                <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-2">
                                    Recommended Action
                                </h3>
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                    <p className="text-blue-100 text-sm leading-relaxed">
                                        {gap.recommendation}
                                    </p>
                                </div>
                            </div>

                            {/* CPT/ICD Codes if available */}
                            {(gap.cptCodes || gap.icdCodes) && (
                                <div>
                                    <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-2">
                                        Relevant Codes
                                    </h3>
                                    <div className="space-y-2">
                                        {gap.cptCodes && gap.cptCodes.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                <span className="text-xs text-white/60">CPT:</span>
                                                {gap.cptCodes.map((code, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-mono rounded"
                                                    >
                                                        {code}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {gap.icdCodes && gap.icdCodes.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                <span className="text-xs text-white/60">ICD:</span>
                                                {gap.icdCodes.map((code, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-2 py-1 bg-green-500/20 border border-green-500/30 text-green-300 text-xs font-mono rounded"
                                                    >
                                                        {code}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Related Gaps */}
                            {relatedGaps.length > 0 && (
                                <div>
                                    <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-2">
                                        Related Issues in This Section
                                    </h3>
                                    <div className="space-y-2">
                                        {relatedGaps.slice(0, 3).map((relatedGap) => (
                                            <div
                                                key={relatedGap.id}
                                                className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-white text-xs font-medium">
                                                        {relatedGap.title}
                                                    </span>
                                                    <span className={cn("text-[10px] font-bold uppercase", severityConfig[relatedGap.category].color)}>
                                                        {relatedGap.category}
                                                    </span>
                                                </div>
                                                <p className="text-white/60 text-xs line-clamp-1">
                                                    {relatedGap.description}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="p-6 border-t border-white/10 bg-gray-900/50">
                            <div className="flex gap-3">
                                {onMarkFixed && (
                                    <button
                                        onClick={() => {
                                            onMarkFixed();
                                            onClose();
                                        }}
                                        className="flex-1 px-4 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-medium rounded-xl transition-colors border border-emerald-500/20 flex items-center justify-center gap-2"
                                    >
                                        <span>✓</span>
                                        <span>Mark as Fixed</span>
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors border border-white/10"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
