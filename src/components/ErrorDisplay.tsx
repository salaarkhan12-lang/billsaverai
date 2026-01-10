"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export type ErrorType =
    | "corrupt_pdf"
    | "empty_pdf"
    | "no_medical_content"
    | "file_too_large"
    | "ocr_timeout"
    | "generic";

export interface ErrorAction {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
}

interface ErrorDisplayProps {
    type?: ErrorType;
    title?: string;
    message?: string;
    actions?: ErrorAction[];
    className?: string;
}

const ERROR_CONFIGS = {
    corrupt_pdf: {
        icon: "😔",
        title: "PDF File Damaged",
        message: "This PDF appears to be corrupted or damaged. Try re-exporting the document from your EHR system or using a PDF repair tool.",
        color: "from-red-500/20 to-orange-500/20",
        borderColor: "border-red-500/30"
    },
    empty_pdf: {
        icon: "📄",
        title: "Empty Document",
        message: "This PDF contains no readable text. If it's a scanned document, make sure the scan quality is good and try again.",
        color: "from-yellow-500/20 to-orange-500/20",
        borderColor: "border-yellow-500/30"
    },
    no_medical_content: {
        icon: "🤔",
        title: "No Medical Content Found",
        message: "We couldn't find medical documentation in this file. Please upload a progress note, H&P, or office visit note.",
        color: "from-blue-500/20 to-purple-500/20",
        borderColor: "border-blue-500/30"
    },
    file_too_large: {
        icon: "📦",
        title: "File Too Large",
        message: "This file exceeds the 50MB limit. Try splitting large documents, compressing the PDF, or optimizing images.",
        color: "from-orange-500/20 to-red-500/20",
        borderColor: "border-orange-500/30"
    },
    ocr_timeout: {
        icon: "⏱️",
        title: "Processing Timeout",
        message: "OCR is taking longer than expected. For faster results, use text-based PDFs when possible. You can continue waiting or try a different file.",
        color: "from-purple-500/20 to-pink-500/20",
        borderColor: "border-purple-500/30"
    },
    generic: {
        icon: "⚠️",
        title: "Processing Error",
        message: "An unexpected error occurred while processing your file.",
        color: "from-red-500/20 to-orange-500/20",
        borderColor: "border-red-500/30"
    }
};

/**
 * ErrorDisplay Component
 * Professional error display with helpful messages and recovery actions
 */
export function ErrorDisplay({
    type = "generic",
    title,
    message,
    actions = [],
    className
}: ErrorDisplayProps) {
    const config = ERROR_CONFIGS[type];
    const displayTitle = title || config.title;
    const displayMessage = message || config.message;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "rounded-2xl border backdrop-blur-xl p-8",
                `bg-gradient-to-br ${config.color}`,
                config.borderColor,
                className
            )}
        >
            {/* Icon */}
            <div className="flex justify-center mb-6">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className="rounded-full bg-white/10 p-6"
                >
                    <span className="text-6xl">{config.icon}</span>
                </motion.div>
            </div>

            {/* Title */}
            <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-white text-center mb-3"
            >
                {displayTitle}
            </motion.h2>

            {/* Message */}
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-white/80 text-center mb-8 leading-relaxed max-w-md mx-auto"
            >
                {displayMessage}
            </motion.p>

            {/* Actions */}
            {actions.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-wrap justify-center gap-3"
                >
                    {actions.map((action, index) => (
                        <button
                            key={index}
                            onClick={action.onClick}
                            className={cn(
                                "px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105",
                                action.variant === "primary"
                                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-blue-500/50"
                                    : "border border-white/20 bg-white/5 text-white hover:bg-white/10"
                            )}
                        >
                            {action.label}
                        </button>
                    ))}
                </motion.div>
            )}
        </motion.div>
    );
}
