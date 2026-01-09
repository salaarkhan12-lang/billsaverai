"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { RevenueBreakdown } from "@/lib/revenue-calculator";
import { cn } from "@/lib/cn";

interface RevenueExplainerProps {
    breakdown: RevenueBreakdown;
    className?: string;
}

/**
 * RevenueExplainer - Tooltip component showing revenue calculation breakdown
 * 
 * Provides transparent, step-by-step explanation of revenue calculations
 * Perfect for building investor trust and user confidence
 */
export function RevenueExplainer({ breakdown, className }: RevenueExplainerProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Confidence color coding
    const confidenceColor = {
        high: "text-emerald-400",
        medium: "text-yellow-400",
        low: "text-orange-400",
    }[breakdown.confidence.level];

    return (
        <div className={cn("relative inline-block", className)}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 group"
            >
                <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                <span className="group-hover:underline">View calculation</span>
            </button>

            {/* Modal/Tooltip */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-2xl shadow-2xl p-6">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1">
                                            Revenue Calculation Breakdown
                                        </h3>
                                        <p className="text-sm text-white/60">
                                            {breakdown.explanation}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                    >
                                        <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Current Level Section */}
                                <div className="space-y-6">
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">1</span>
                                            Current Billable Level
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-white/60">CPT Code:</span>
                                                <span className="text-white font-mono">{breakdown.currentLevel.code}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/60">Description:</span>
                                                <span className="text-white text-right max-w-xs">{breakdown.currentLevel.description}</span>
                                            </div>
                                            <div className="h-px bg-white/10 my-2" />
                                            <div className="flex justify-between">
                                                <span className="text-white/60">Medicare Base Rate:</span>
                                                <span className="text-white font-mono">${breakdown.currentLevel.baseRate.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/60">{breakdown.currentLevel.payerName} ({breakdown.currentLevel.multiplier}x):</span>
                                                <span className="text-emerald-400 font-mono font-semibold">${breakdown.currentLevel.payerRate.toFixed(2)}/visit</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Potential Level Section */}
                                    <div className="bg-white/5 rounded-xl p-4 border border-emerald-500/30">
                                        <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">2</span>
                                            Potential Level (with better documentation)
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-white/60">CPT Code:</span>
                                                <span className="text-white font-mono">{breakdown.potentialLevel.code}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/60">Description:</span>
                                                <span className="text-white text-right max-w-xs">{breakdown.potentialLevel.description}</span>
                                            </div>
                                            <div className="h-px bg-white/10 my-2" />
                                            <div className="flex justify-between">
                                                <span className="text-white/60">Medicare Base Rate:</span>
                                                <span className="text-white font-mono">${breakdown.potentialLevel.baseRate.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/60">{breakdown.currentLevel.payerName} ({breakdown.potentialLevel.multiplier}x):</span>
                                                <span className="text-emerald-400 font-mono font-semibold">${breakdown.potentialLevel.payerRate.toFixed(2)}/visit</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Gap Calculation */}
                                    <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-xl p-4 border border-red-500/30">
                                        <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs">3</span>
                                            Revenue Gap
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between items-center">
                                                <span className="text-white/60">Per Visit Loss:</span>
                                                <span className="text-red-400 font-mono font-bold text-lg">
                                                    ${breakdown.gap.perVisit.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-white/60">Annual Loss ({breakdown.gap.visitsPerYear} visits/year):</span>
                                                <span className="text-red-400 font-mono font-bold text-xl">
                                                    ${breakdown.gap.annualized.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-white/60">Percent Increase:</span>
                                                <span className="text-emerald-400 font-mono font-semibold">
                                                    +{breakdown.gap.percentIncrease}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Confidence\u0026 Sources */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                            <h5 className="text-xs font-semibold text-white/60 mb-2">Confidence Level</h5>
                                            <div className={cn("text-2xl font-bold", confidenceColor)}>
                                                {breakdown.confidence.percentage}
                                            </div>
                                            <div className="text-xs text-white/40 mt-1 capitalize">
                                                {breakdown.confidence.level} confidence
                                            </div>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                            <h5 className="text-xs font-semibold text-white/60 mb-2">Data Sources</h5>
                                            <div className="text-xs text-white/60 space-y-1">
                                                <div>✓ {breakdown.sources.medicareSchedule}</div>
                                                <div>✓ {breakdown.sources.payerData.split('(')[0]}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step-by-Step Calculation */}
                                    <details className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                                        <summary className="px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors text-sm font-semibold text-white/80">
                                            Show detailed calculation steps
                                        </summary>
                                        <div className="px-4 py-3 bg-black/20">
                                            <pre className="text-xs text-white/80 font-mono whitespace-pre-wrap leading-relaxed">
                                                {breakdown.calculation}
                                            </pre>
                                        </div>
                                    </details>
                                </div>

                                {/* Footer */}
                                <div className="mt-6 pt-4 border-t border-white/10">
                                    <p className="text-xs text-white/40 text-center">
                                        All rates based on industry-standard fee schedules. Actual reimbursement may vary by contract.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
