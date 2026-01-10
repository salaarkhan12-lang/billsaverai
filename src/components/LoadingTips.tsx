"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LoadingTip } from "@/lib/loading-tips";
import { LOADING_TIPS } from "@/lib/loading-tips";
import { cn } from "@/lib/cn";

interface LoadingTipsProps {
    interval?: number; // Milliseconds between tips (default: 4000)
    className?: string;
}

/**
 * LoadingTips Component
 * Displays rotating educational tips during processing
 */
export function LoadingTips({ interval = 4000, className }: LoadingTipsProps) {
    // Start with a random tip instead of always the first one
    const [currentTipIndex, setCurrentTipIndex] = useState(() =>
        Math.floor(Math.random() * LOADING_TIPS.length)
    );
    const [currentTip, setCurrentTip] = useState<LoadingTip>(() =>
        LOADING_TIPS[currentTipIndex]
    );

    useEffect(() => {
        // Rotate tips at specified interval
        const timer = setInterval(() => {
            setCurrentTipIndex((prev) => {
                const nextIndex = (prev + 1) % LOADING_TIPS.length;
                setCurrentTip(LOADING_TIPS[nextIndex]);
                return nextIndex;
            });
        }, interval);

        return () => clearInterval(timer);
    }, [interval]);

    return (
        <div className={cn("relative h-16 flex items-center justify-center overflow-hidden", className)}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentTip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="absolute inset-0 flex items-center justify-center gap-3 px-6"
                >
                    {/* Icon */}
                    <motion.span
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="text-2xl flex-shrink-0"
                    >
                        {currentTip.icon}
                    </motion.span>

                    {/* Tip Text */}
                    <p className="text-sm text-white/70 text-center leading-relaxed">
                        {currentTip.text}
                    </p>
                </motion.div>
            </AnimatePresence>

            {/* Progress Dots */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-1.5">
                {LOADING_TIPS.map((_, index) => (
                    <div
                        key={index}
                        className={cn(
                            "h-1 rounded-full transition-all duration-300",
                            index === currentTipIndex
                                ? "w-6 bg-blue-400"
                                : "w-1 bg-white/20"
                        )}
                    />
                ))}
            </div>
        </div>
    );
}
