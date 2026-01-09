"use client";

import { CheckCircle, AlertCircle, Info, Shield } from "lucide-react";
import type { ConfidenceScore } from "@/lib/confidence-scoring";

/**
 * Confidence Badge Component
 * Displays confidence level for billing code recommendations
 * High (85-100%): Green, Medium (60-84%): Yellow, Low (<60%): Red
 */

interface ConfidenceBadgeProps {
    confidence: ConfidenceScore;
    size?: "sm" | "md" | "lg";
}

export function ConfidenceBadge({ confidence, size = "md" }: ConfidenceBadgeProps) {
    const percentage = Math.round(confidence.score * 100);

    const sizeClasses = {
        sm: "px-2 py-0.5 text-xs",
        md: "px-3 py-1 text-sm",
        lg: "px-4 py-2 text-base",
    };

    const levelConfig = {
        high: {
            bgColor: "bg-emerald-100",
            textColor: "text-emerald-800",
            borderColor: "border-emerald-300",
            icon: <CheckCircle className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'}`} />,
            label: "High Confidence",
        },
        medium: {
            bgColor: "bg-yellow-100",
            textColor: "text-yellow-800",
            borderColor: "border-yellow-300",
            icon: <Info className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'}`} />,
            label: "Medium Confidence",
        },
        low: {
            bgColor: "bg-orange-100",
            textColor: "text-orange-800",
            borderColor: "border-orange-300",
            icon: <AlertCircle className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'}`} />,
            label: "Low Confidence",
        },
    };

    const config = levelConfig[confidence.level];

    return (
        <div className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} ${config.bgColor} ${config.textColor} border ${config.borderColor} rounded-lg font-medium`}>
            {config.icon}
            <span>{percentage}%</span>
            <span className="hidden sm:inline">{config.label.split(' ')[0]}</span>
        </div>
    );
}

/**
 * Confidence Meter Component
 * Visual progress bar showing confidence level
 */
export function ConfidenceMeter({ confidence }: { confidence: ConfidenceScore }) {
    const percentage = Math.round(confidence.score * 100);

    const getColor = () => {
        if (confidence.level === 'high') return 'bg-emerald-500';
        if (confidence.level === 'medium') return 'bg-yellow-500';
        return 'bg-orange-500';
    };

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Confidence</span>
                <span className="font-medium">{percentage}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className={`h-full ${getColor()} transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

/**
 * Reasoning Section Component
 * Displays why a code is supported with evidence and audit defense
 */
interface ReasoningSectionProps {
    reasoning: {
        supported: string[];
        concerns: string[];
        auditDefense: string;
    };
    evidenceLocations?: Array<{
        pageNumber?: number;
        section: string;
        excerpt: string;
        requirement: string;
    }>;
    onEvidenceClick?: (pageNumber?: number) => void;
}

export function ReasoningSection({
    reasoning,
    evidenceLocations = [],
    onEvidenceClick
}: ReasoningSectionProps) {
    return (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            {/* Supported Reasons */}
            {reasoning.supported.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        Why This Code Is Supported
                    </h4>
                    <ul className="space-y-1.5">
                        {reasoning.supported.map((reason, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-emerald-600 mt-0.5">•</span>
                                <span>{reason}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Concerns */}
            {reasoning.concerns.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        Considerations
                    </h4>
                    <ul className="space-y-1.5">
                        {reasoning.concerns.map((concern, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-yellow-600 mt-0.5">•</span>
                                <span>{concern}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Evidence Locations */}
            {evidenceLocations.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-2">
                        📄 Evidence in Note
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {evidenceLocations.map((evidence, idx) => (
                            <button
                                key={idx}
                                onClick={() => onEvidenceClick?.(evidence.pageNumber)}
                                className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-colors"
                                title={`${evidence.requirement}: ${evidence.excerpt}`}
                            >
                                {evidence.pageNumber ? `Page ${evidence.pageNumber}, ` : ''}{evidence.section}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Audit Defense */}
            <div className="pt-3 border-t border-gray-300">
                <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">In an Audit:</h4>
                        <p className="text-sm text-gray-700">{reasoning.auditDefense}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Confidence Factors Breakdown
 * Shows detailed breakdown of confidence score components
 */
export function ConfidenceFactorsBreakdown({
    confidence
}: {
    confidence: ConfidenceScore
}) {
    const factors = [
        {
            label: "Documentation Completeness",
            value: confidence.factors.documentationCompleteness,
            description: "All required elements present",
        },
        {
            label: "Evidence Clarity",
            value: confidence.factors.evidenceClarity,
            description: "Unambiguous documentation",
        },
        {
            label: "Code Specificity",
            value: confidence.factors.codeSpecificity,
            description: "Specific vs. unspecified codes",
        },
    ];

    return (
        <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">Confidence Factors</h4>
            {factors.map((factor, idx) => (
                <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-700">{factor.label}</span>
                        <span className="font-medium text-gray-900">
                            {Math.round(factor.value * 100)}%
                        </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${factor.value * 100}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500">{factor.description}</p>
                </div>
            ))}
        </div>
    );
}
