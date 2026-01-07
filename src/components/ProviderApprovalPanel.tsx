import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { DocumentationGap as Gap } from "@/lib/billing-rules";

interface ProviderApprovalPanelProps {
    fixedGaps: Gap[];
    onApprove: (gapId: string) => void;
    onReject: (gapId: string) => void;
}

export function ProviderApprovalPanel({ fixedGaps, onApprove, onReject }: ProviderApprovalPanelProps) {
    return (
        <div className="space-y-4 p-1">
            <div className="flex items-center justify-between mb-6 px-2">
                <div>
                    <h3 className="text-white font-semibold text-lg">Provider Approval</h3>
                    <p className="text-white/50 text-xs">Review fixes made by coding staff</p>
                </div>
                <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-xs text-white/70">
                    {fixedGaps.length} Pending
                </div>
            </div>

            {fixedGaps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl">✓</span>
                    </div>
                    <h4 className="text-white font-medium mb-1">All Caught Up</h4>
                    <p className="text-white/40 text-sm">No items pending provider approval</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {fixedGaps.map((gap, index) => (
                        <ApprovalItem
                            key={gap.id}
                            gap={gap}
                            onApprove={() => onApprove(gap.id)}
                            onReject={() => onReject(gap.id)}
                            index={index}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function ApprovalItem({
    gap,
    onApprove,
    onReject,
    index,
}: {
    gap: Gap;
    onApprove: () => void;
    onReject: () => void;
    index: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/[0.07] transition-colors"
        >
            <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            gap.category === 'critical' ? "bg-red-500" :
                                gap.category === 'major' ? "bg-orange-500" : "bg-blue-500"
                        )} />
                        <span className="text-white/60 text-xs uppercase tracking-wider font-medium">
                            {gap.category} Issue
                        </span>
                    </div>
                    <h4 className="text-white font-medium text-sm">{gap.title}</h4>
                </div>
                {gap.potentialRevenueLoss && (
                    <span className="text-emerald-400 font-mono text-xs">+ {gap.potentialRevenueLoss} recovered</span>
                )}
            </div>

            <div className="bg-black/20 rounded-lg p-3 mb-4">
                <p className="text-white/70 text-xs italic">
                    "{gap.location?.textSnippet || gap.description}"
                </p>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={onApprove}
                    className="flex-1 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/20 transition-all"
                >
                    Approve Fix
                </button>
                <button
                    onClick={onReject}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg border border-red-500/10 transition-all"
                >
                    Reject
                </button>
            </div>
        </motion.div>
    );
}
