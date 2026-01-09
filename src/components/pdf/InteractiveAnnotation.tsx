"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { DocumentationGap } from "@/lib/billing-rules";

interface InteractiveAnnotationProps {
    gap: DocumentationGap;
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    isHovered: boolean;
    isSelected: boolean;
    isFixed: boolean;
    onHover: (gapId: string | null) => void;
    onClick: (gapId: string) => void;
    scale: number;
}

const severityConfig = {
    critical: {
        border: "border-red-500",
        background: "bg-red-500/10",
        glow: "shadow-[0_0_20px_rgba(239,68,68,0.5)]",
        icon: "🚨",
        badgeColor: "bg-red-500",
    },
    major: {
        border: "border-orange-500",
        background: "bg-orange-500/10",
        glow: "shadow-[0_0_15px_rgba(249,115,22,0.4)]",
        icon: "⚠️",
        badgeColor: "bg-orange-500",
    },
    moderate: {
        border: "border-yellow-500",
        background: "bg-yellow-500/10",
        glow: "shadow-[0_0_10px_rgba(234,179,8,0.3)]",
        icon: "📌",
        badgeColor: "bg-yellow-500",
    },
    minor: {
        border: "border-blue-500 border-dashed",
        background: "bg-blue-500/5",
        glow: "",
        icon: "ℹ️",
        badgeColor: "bg-blue-500",
    },
};

function parseRevenueAmount(revenueString: string): number {
    const numbers = revenueString.match(/\d+/g);
    if (!numbers || numbers.length === 0) return 0;
    if (numbers.length >= 2) {
        const min = parseInt(numbers[0]);
        const max = parseInt(numbers[1]);
        return Math.round((min + max) / 2);
    }
    return parseInt(numbers[0]);
}

export function InteractiveAnnotation({
    gap,
    bounds,
    isHovered,
    isSelected,
    isFixed,
    onHover,
    onClick,
    scale,
}: InteractiveAnnotationProps) {
    const config = severityConfig[gap.category];
    const revenueAmount = parseRevenueAmount(gap.potentialRevenueLoss);

    return (
        <motion.div
            className={cn(
                "absolute pointer-events-auto cursor-pointer border-2 rounded-sm transition-all duration-150",
                config.border,
                config.background,
                isHovered && config.glow,
                isHovered && "z-30",
                isSelected && "z-40 ring-2 ring-white/50",
                isFixed && "opacity-50 grayscale"
            )}
            style={{
                left: bounds.x,
                top: bounds.y,
                width: bounds.width,
                height: bounds.height,
            }}
            initial={{ opacity: 0 }}
            animate={{
                opacity: 1,
                scale: isHovered ? 1.02 : 1,
            }}
            transition={{ duration: 0.15 }}
            onMouseEnter={() => onHover(gap.id)}
            onMouseLeave={() => onHover(null)}
            onClick={(e) => {
                e.stopPropagation();
                onClick(gap.id);
            }}
        >
            {/* Icon indicator */}
            {isHovered && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="absolute -left-8 top-0 text-2xl"
                >
                    {config.icon}
                </motion.div>
            )}

            {/* Revenue badge */}
            {revenueAmount > 0 && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: isHovered ? 1 : 0.8 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                        "absolute -top-3 -right-3 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap",
                        config.badgeColor
                    )}
                >
                    ${gap.potentialRevenueLoss}
                </motion.div>
            )}

            {/* Fixed indicator */}
            {isFixed && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-3 -left-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1"
                >
                    <span>✓</span>
                    <span>Fixed</span>
                </motion.div>
            )}

            {/* Pulsing animation for critical gaps */}
            {gap.category === "critical" && !isFixed && (
                <motion.div
                    className="absolute inset-0 border-2 border-red-500 rounded-sm"
                    animate={{
                        opacity: [0.3, 0.7, 0.3],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            )}

            {/* Underline effect */}
            <div
                className={cn(
                    "absolute bottom-0 left-0 right-0 h-1 transition-all",
                    config.badgeColor.replace("bg-", "bg-"),
                    isHovered ? "opacity-80" : "opacity-40"
                )}
            />
        </motion.div>
    );
}
