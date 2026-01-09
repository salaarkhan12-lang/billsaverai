import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import type { DocumentationGap as Gap } from "@/lib/billing-rules";

interface GapListProps {
    gaps: Gap[];
    onGapSelect: (gap: Gap) => void;
    selectedGapId?: string;
    onFixGap: (gap: Gap) => void;
    fixedGaps: Set<string>; // Set of gap IDs that have been marked as fixed
}

export function GapList({ gaps, onGapSelect, selectedGapId, onFixGap, fixedGaps }: GapListProps) {
    // Sort gaps: Critical -> Major -> Moderate -> Minor
    // Then by whether they are fixed (fixed items move to bottom or are visually dimmed)
    const sortedGaps = [...gaps].sort((a, b) => {
        // Fixed items last
        const aFixed = fixedGaps.has(a.id);
        const bFixed = fixedGaps.has(b.id);
        if (aFixed && !bFixed) return 1;
        if (!aFixed && bFixed) return -1;

        // Severity order
        const severityOrder: Record<string, number> = { critical: 0, major: 1, moderate: 2, minor: 3 };
        return severityOrder[a.category] - severityOrder[b.category];
    });

    return (
        <div className="space-y-3 p-1">
            <AnimatePresence mode="popLayout">
                {sortedGaps.map((gap, index) => (
                    <GapItem
                        key={gap.id}
                        gap={gap}
                        isSelected={selectedGapId === gap.id}
                        isFixed={fixedGaps.has(gap.id)}
                        onClick={() => onGapSelect(gap)}
                        onFix={() => onFixGap(gap)}
                        index={index}
                    />
                ))}
            </AnimatePresence>
            {sortedGaps.length === 0 && (
                <div className="text-center py-12 text-white/40">
                    <p>No issues found. Great job!</p>
                </div>
            )}
        </div>
    );
}

function GapItem({
    gap,
    isSelected,
    isFixed,
    onClick,
    onFix,
    index,
}: {
    gap: Gap;
    isSelected: boolean;
    isFixed: boolean;
    onClick: () => void;
    onFix: (e: any) => void;
    index: number;
}) {
    const severityColor: Record<string, string> = {
        critical: "bg-red-500",
        major: "bg-orange-500",
        moderate: "bg-yellow-500",
        minor: "bg-blue-500",
    };

    const color = severityColor[gap.category] || "bg-gray-500";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 30 }}
            onClick={onClick}
            className={cn(
                "group relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer",
                isSelected
                    ? "bg-white/10 border-white/20 shadow-lg shadow-black/20"
                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10",
                isFixed && "opacity-60 grayscale-[0.5]"
            )}
        >
            {/* Active Indicator Strip */}
            {isSelected && (
                <motion.div
                    layoutId="active-strip"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-500"
                />
            )}

            <div className="p-4 flex items-start gap-4">
                {/* Severity Dot */}
                <div className={cn("mt-1.5 w-2.5 h-2.5 rounded-full shadow-lg shadow-current/50", color)} />

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-1">
                        <h4 className="text-white font-medium text-sm truncate pr-2">
                            {gap.title}
                        </h4>
                        {gap.potentialRevenueLoss && (
                            <span className="text-red-400 font-mono text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded">
                                {gap.potentialRevenueLoss}
                            </span>
                        )}
                    </div>

                    <p className="text-white/60 text-xs line-clamp-2 leading-relaxed">
                        {gap.description}
                    </p>

                    <AnimatePresence>
                        {isSelected && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-3 pt-3 border-t border-white/5"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-white/40 text-[10px] uppercase tracking-wider font-semibold">
                                        Suggested Action
                                    </span>
                                    {!isFixed ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onFix(e);
                                            }}
                                            className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs rounded-lg transition-colors border border-emerald-500/20 flex items-center gap-1.5"
                                        >
                                            <span>✓</span>
                                            <span>Mark Fixed</span>
                                        </button>
                                    ) : (
                                        <span className="text-emerald-400 text-xs flex items-center gap-1">
                                            <span>✓</span> Fixed (Pending Approval)
                                        </span>
                                    )}
                                </div>
                                <p className="text-white/80 text-xs mt-1.5">
                                    {gap.recommendation}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
