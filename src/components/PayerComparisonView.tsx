"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import type { PayerComparison } from "@/lib/revenue-calculator";
import { cn } from "@/lib/cn";

interface PayerComparisonViewProps {
    comparisons: PayerComparison[];
    className?: string;
}

/**
 * Animated Counter Component
 * Counts up from 0 to target value with smooth animation
 */
function AnimatedCounter({
    value,
    prefix = "$",
    suffix = "",
    duration = 1000,
}: {
    value: number;
    prefix?: string;
    suffix?: string;
    duration?: number;
}) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(value * easeOutQuart));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(value);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [value, duration]);

    return (
        <span>
            {prefix}{count.toLocaleString()}{suffix}
        </span>
    );
}

/**
 * PayerComparisonView - Side-by-side comparison of revenue across insurance providers
 * 
 * Perfect for investor demos to show revenue variation by payer
 */
export function PayerComparisonView({ comparisons, className }: PayerComparisonViewProps) {
    if (comparisons.length === 0) {
        return null;
    }

    // Get stats for best/average/worst
    const annualGaps = comparisons.map(c => c.calculation.annualizedGap);
    const bestAnnual = Math.max(...annualGaps);
    const avgAnnual = annualGaps.reduce((sum, val) => sum + val, 0) / annualGaps.length;

    return (
        <div className={cn("space-y-4", className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-white font-semibold">Revenue by Insurance Provider</h3>
                    <p className="text-xs text-white/50 mt-1">
                        Annual revenue gap comparison across major payers
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-xs text-white/40">Best Case</div>
                    <div className="text-emerald-400 font-mono font-bold">
                        ${Math.round(bestAnnual).toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Payer Comparison Grid */}
            <div className="grid grid-cols-2 gap-3">
                {comparisons.map((payer, index) => {
                    const isTop = payer.rank === 1;
                    const percentage = (payer.calculation.annualizedGap / bestAnnual) * 100;

                    return (
                        <motion.div
                            key={payer.payerId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.3 }}
                            className={cn(
                                "relative bg-white/5 border rounded-xl p-4 overflow-hidden",
                                isTop ? "border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 to-transparent" : "border-white/10"
                            )}
                        >
                            {/* Rank Badge */}
                            {isTop && (
                                <div className="absolute top-2 right-2">
                                    <div className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        BEST
                                    </div>
                                </div>
                            )}

                            {/* Payer Name */}
                            <div className="mb-3">
                                <div className="text-white font-semibold text-sm">{payer.payerShortName}</div>
                                <div className="text-white/40 text-xs mt-0.5">{payer.multiplier}x Medicare</div>
                            </div>

                            {/* Annual Revenue with Counter */}
                            <div className="space-y-1">
                                <div className={cn(
                                    "text-2xl font-mono font-bold",
                                    isTop ? "text-emerald-400" : "text-red-400"
                                )}>
                                    <AnimatedCounter
                                        value={Math.round(payer.calculation.annualizedGap)}
                                        duration={1200 + index * 200}
                                    />
                                    <span className="text-xs text-white/40 font-sans ml-1">/year</span>
                                </div>

                                <div className="text-xs text-white/50">
                                    <AnimatedCounter
                                        value={Math.round(payer.calculation.perVisitGap)}
                                        prefix="$"
                                        suffix="/visit"
                                        duration={1200 + index * 200}
                                    />
                                </div>
                            </div>

                            {/* Progress Bar showing relative value */}
                            <div className="mt-3">
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ delay: 0.3 + index * 0.1, duration: 0.8, ease: "easeOut" }}
                                        className={cn(
                                            "h-full rounded-full",
                                            isTop ? "bg-emerald-500" : "bg-red-500/70"
                                        )}
                                    />
                                </div>
                                <div className="text-[10px] text-white/40 mt-1">
                                    {percentage.toFixed(0)}% of best case
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Summary Stats */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-6">
                    <div>
                        <div className="text-[10px] text-white/40 uppercase tracking-wider">Average</div>
                        <div className="text-white font-mono font-semibold">
                            ${Math.round(avgAnnual).toLocaleString()}/year
                        </div>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div>
                        <div className="text-[10px] text-white/40 uppercase tracking-wider">Range</div>
                        <div className="text-white/70 font-mono text-sm">
                            ${Math.round(Math.min(...annualGaps)).toLocaleString()} - ${Math.round(Math.max(...annualGaps)).toLocaleString()}
                        </div>
                    </div>
                </div>
                <div className="text-xs text-white/40">
                    {comparisons.length} payers compared
                </div>
            </div>
        </div>
    );
}
