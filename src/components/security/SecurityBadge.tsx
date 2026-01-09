"use client";

import { Lock, Shield, CheckCircle } from "lucide-react";
import { useState } from "react";

/**
 * Security Badge Component (UPDATED - Less Intrusive)
 * Displays prominent security messaging in UI to build trust
 * Shows client-side processing and HIPAA compliance
 */
export function SecurityBadge() {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="relative inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-lg">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">
                100% Local Processing - Zero Cloud Storage
            </span>

            <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
                className="ml-1 text-emerald-600 hover:text-emerald-700"
                aria-label="Security information"
            >
                <Shield className="w-4 h-4" />
            </button>

            {showTooltip && (
                <div className="absolute top-full left-0 mt-2 w-80 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="space-y-3">
                        <div className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    All analysis happens in your browser
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                    No data ever transmitted to servers
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    HIPAA-compliant by design
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                    Zero risk of data breach from transmission
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    Automatic data clearing
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                    All files removed from memory on close
                                </p>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                                Your firewall logs will show zero outbound traffic during analysis.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Compact Security Indicator (UPDATED - Non-intrusive)
 * Smaller version for bottom-right corner or unobtrusive locations
 */
export function SecurityIndicator() {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="relative">
            <button
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-full text-xs font-medium text-emerald-300 transition-all shadow-lg backdrop-blur-sm"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
            >
                <Lock className="w-3 h-3" />
                <span className="hidden sm:inline">Local Processing</span>
                <span className="sm:hidden">🔒 Secure</span>
            </button>

            {showTooltip && (
                <div className="absolute bottom-full right-0 mb-2 w-72 p-3 bg-gray-900 border border-emerald-500/30 rounded-lg shadow-xl z-50">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <p className="text-xs text-gray-200">
                                <strong className="text-emerald-300">100% Local Processing</strong> - No cloud uploads
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <p className="text-xs text-gray-200">
                                <strong className="text-emerald-300">HIPAA Compliant</strong> - Zero PHI transmission
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <p className="text-xs text-gray-200">
                                <strong className="text-emerald-300">Auto-Clear</strong> - Data removed on close
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Analysis Progress Security Message
 * Shows during PDF analysis to reassure users
 */
export function AnalysisSecurityMessage() {
    return (
        <div className="flex items-center justify-center gap-2 py-2 px-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Shield className="w-4 h-4 text-blue-600" />
            <p className="text-sm text-blue-700">
                Analyzing locally in your browser - no data transmitted
            </p>
        </div>
    );
}

/**
 * Footer Security Badge
 * For use in marketing pages or footer sections
 */
export function FooterSecurityBadge() {
    return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-900/30 border border-emerald-500/30 rounded-md">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-300">
                100% Client-Side • HIPAA Compliant • Zero Cloud Storage
            </span>
        </div>
    );
}
