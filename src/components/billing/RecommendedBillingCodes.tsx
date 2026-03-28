"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { useState } from "react";
import type { AnalysisResult } from "@/lib/billing-rules";
import { analyzeBillingCodes, type CPTCode, type ICD10Code } from "@/lib/billing-code-analyzer";
import { ConfidenceBadge, ReasoningSection, ConfidenceMeter } from "./ConfidenceBadge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { RiskAdjustmentDashboard } from "./RiskAdjustmentDashboard";
import { ICD10_DATABASE } from "@/lib/icd10-database";

interface RecommendedBillingCodesProps {
    analysisResult: AnalysisResult;
    onGapClick?: (gapId: string) => void;
}

export function RecommendedBillingCodes({ analysisResult, onGapClick }: RecommendedBillingCodesProps) {
    const billingAnalysis = analyzeBillingCodes(analysisResult, analysisResult.documentText);

    return (
        <div className="space-y-6">
            {/* Revenue Impact Summary */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 rounded-xl p-6"
            >
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <span className="text-2xl">💰</span>
                    Revenue Impact Summary
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Current Billing</p>
                        <p className="text-2xl font-bold text-white">{billingAnalysis.revenueImpact.current}</p>
                    </div>
                    <div>
                        <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Potential</p>
                        <p className="text-2xl font-bold text-emerald-400">{billingAnalysis.revenueImpact.potential}</p>
                    </div>
                    <div>
                        <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Opportunity</p>
                        <p className="text-2xl font-bold text-yellow-400">{billingAnalysis.revenueImpact.difference}</p>
                    </div>
                </div>
            </motion.div>

            {/* CPT Codes Section */}
            <div>
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <span className="text-xl">📊</span>
                    CPT Procedure Codes
                </h3>

                {/* Overcoding Warning */}
                {billingAnalysis.cptCodes.overcoded && (
                    <div className="mb-4">
                        <p className="text-red-400 text-sm mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Claimed Code (OVERCODING RISK)
                        </p>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-white font-mono text-lg font-bold">{billingAnalysis.cptCodes.overcoded.code}</span>
                                        <span className="px-2 py-0.5 bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold uppercase rounded">
                                            ⚠️ Not Supported
                                        </span>
                                    </div>
                                    <p className="text-white/70 text-sm mb-1">{billingAnalysis.cptCodes.overcoded.description}</p>
                                    <p className="text-red-300/70 font-mono text-sm">{billingAnalysis.cptCodes.overcoded.reimbursement}</p>
                                    <p className="text-red-400 text-xs mt-2">⚠️ This code exceeds documentation support. Consider downcoding to avoid audit risk.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Currently Billable */}
                <div className="mb-4">
                    <p className="text-white/60 text-sm mb-2">Currently Billable (Based on Documentation)</p>
                    <div className="space-y-2">
                        {billingAnalysis.cptCodes.current.map((cpt) => (
                            <CPTCodeCard key={cpt.code} code={cpt} onGapClick={onGapClick} />
                        ))}
                    </div>
                </div>

                {/* Potential with Fixes */}
                {billingAnalysis.cptCodes.potential.length > 0 && (
                    <div>
                        <p className="text-white/60 text-sm mb-2">Potential with Documentation Improvements</p>
                        <div className="space-y-2">
                            {billingAnalysis.cptCodes.potential.map((cpt) => (
                                <CPTCodeCard key={cpt.code} code={cpt} onGapClick={onGapClick} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Upgrade Guidance - How to achieve higher level */}
                {billingAnalysis.upgradeGuidance && (
                    <div className="mt-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-4">
                        <p className="text-emerald-400 text-sm mb-3 flex items-center gap-2 font-medium">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            How to Bill Higher: {billingAnalysis.upgradeGuidance.currentCode} → {billingAnalysis.upgradeGuidance.targetCode}
                        </p>

                        <div className="bg-black/20 rounded-lg p-3 mb-3">
                            <div className="flex justify-between items-center">
                                <span className="text-white/70 text-sm">Potential Revenue Increase:</span>
                                <span className="text-emerald-400 font-bold text-lg">
                                    +${billingAnalysis.upgradeGuidance.revenueIncrease}/visit
                                </span>
                            </div>
                            <p className="text-white/50 text-xs mt-1">
                                Annual impact: +${(billingAnalysis.upgradeGuidance.revenueIncrease * 52).toLocaleString()}+ (at 1 visit/week)
                            </p>
                        </div>

                        {/* MDM Requirements Summary */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className={`text-center p-2 rounded-lg ${billingAnalysis.upgradeGuidance.requirements.problems.met ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
                                <p className="text-[10px] text-white/50 uppercase">Problems</p>
                                <p className="text-xs text-white font-medium">
                                    {billingAnalysis.upgradeGuidance.requirements.problems.met ? '✓' : '○'} {billingAnalysis.upgradeGuidance.requirements.problems.currentLevel}
                                </p>
                            </div>
                            <div className={`text-center p-2 rounded-lg ${billingAnalysis.upgradeGuidance.requirements.data.met ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
                                <p className="text-[10px] text-white/50 uppercase">Data</p>
                                <p className="text-xs text-white font-medium">
                                    {billingAnalysis.upgradeGuidance.requirements.data.met ? '✓' : '○'} {billingAnalysis.upgradeGuidance.requirements.data.currentLevel}
                                </p>
                            </div>
                            <div className={`text-center p-2 rounded-lg ${billingAnalysis.upgradeGuidance.requirements.risk.met ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
                                <p className="text-[10px] text-white/50 uppercase">Risk</p>
                                <p className="text-xs text-white font-medium">
                                    {billingAnalysis.upgradeGuidance.requirements.risk.met ? '✓' : '○'} {billingAnalysis.upgradeGuidance.requirements.risk.currentLevel}
                                </p>
                            </div>
                        </div>

                        <p className="text-white/50 text-xs mb-2">
                            Need 2 of 3 MDM elements at "{billingAnalysis.upgradeGuidance.targetLevel}" level.
                            Currently: {billingAnalysis.upgradeGuidance.requirements.elementsMet}/3 met.
                        </p>

                        {/* Recommendations */}
                        {billingAnalysis.upgradeGuidance.recommendations.length > 0 && (
                            <div className="mt-3">
                                <p className="text-white/70 text-xs font-medium mb-2">Recommended Documentation Improvements:</p>
                                <div className="space-y-2">
                                    {billingAnalysis.upgradeGuidance.recommendations.slice(0, 3).map((rec) => (
                                        <div key={rec.id} className={`p-2 rounded-lg border ${rec.priority === 'high' ? 'bg-emerald-500/10 border-emerald-500/30' :
                                            rec.priority === 'medium' ? 'bg-blue-500/10 border-blue-500/30' :
                                                'bg-white/5 border-white/10'
                                            }`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${rec.category === 'problem' ? 'bg-purple-500/20 text-purple-300' :
                                                    rec.category === 'data' ? 'bg-blue-500/20 text-blue-300' :
                                                        'bg-orange-500/20 text-orange-300'
                                                    }`}>
                                                    {rec.category}
                                                </span>
                                                <span className="text-white text-xs font-medium">{rec.title}</span>
                                            </div>
                                            <p className="text-white/60 text-xs">{rec.description}</p>
                                            {rec.examplePhrases.length > 0 && (
                                                <div className="mt-1.5 bg-black/20 rounded p-1.5">
                                                    <p className="text-white/40 text-[10px] mb-0.5">Example:</p>
                                                    <p className="text-emerald-300/80 text-xs italic">"{rec.examplePhrases[0]}"</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Time Conflict Warning */}
                {billingAnalysis.timeConflict?.hasConflict && (
                    <div className="mt-4 bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                        <p className="text-orange-400 text-sm flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Time Documentation Conflict
                        </p>
                        <p className="text-white/70 text-xs mt-1">{billingAnalysis.timeConflict.details}</p>
                        {billingAnalysis.timeConflict.supportedCode && (
                            <p className="text-orange-300/80 text-xs mt-1">
                                Time supports: <span className="font-bold">{billingAnalysis.timeConflict.supportedCode}</span>
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* ICD-10 Codes Section */}
            <div>
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <span className="text-xl">🔬</span>
                    ICD-10 Diagnosis Codes
                </h3>

                {/* Currently Documented */}
                {billingAnalysis.icdCodes.documented.length > 0 && (
                    <div className="mb-4">
                        <p className="text-white/60 text-sm mb-2">Currently Documented</p>
                        <div className="grid grid-cols-1 gap-2">
                            {billingAnalysis.icdCodes.documented.map((icd) => (
                                <ICD10CodeCard key={icd.code} code={icd} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Missing - Available for Capture */}
                {billingAnalysis.icdCodes.missing.length > 0 && (
                    <div>
                        <p className="text-white/60 text-sm mb-2 flex items-center gap-2">
                            Missing - Available for Capture
                            {billingAnalysis.icdCodes.missing.some(c => c.isHCC) && (
                                <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-bold rounded">
                                    HCC OPPORTUNITIES
                                </span>
                            )}
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                            {billingAnalysis.icdCodes.missing.map((icd) => (
                                <ICD10CodeCard key={icd.code} code={icd} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Risk Adjustment Dashboard */}
            <div className="mt-8 pt-8 border-t border-white/10">
                <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    Risk Adjustment & MIPS Analysis
                </h3>
                <RiskAdjustmentDashboard
                    documentText={analysisResult.documentText || ''}
                    documentedCodes={billingAnalysis.icdCodes.documented.map(c => c.code)}
                    conditions={billingAnalysis.icdCodes.documented.map(icd => ({
                        code: icd.code,
                        description: icd.description,
                        isHCC: icd.isHCC || (ICD10_DATABASE[icd.code]?.isHCC ?? false),
                    }))}
                />
            </div>
        </div>
    );
}

function CPTCodeCard({ code, onGapClick }: { code: CPTCode; onGapClick?: (gapId: string) => void }) {
    const [showReasoning, setShowReasoning] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
                "bg-white/5 border rounded-lg p-4 transition-all",
                code.status === 'ready' ? "border-emerald-500/30" : "border-orange-500/30"
            )}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-white font-mono text-lg font-bold">{code.code}</span>

                        {/* Confidence Badge */}
                        {code.confidence && (
                            <ConfidenceBadge confidence={code.confidence} size="sm" />
                        )}

                        <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                            code.status === 'ready'
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                        )}>
                            {code.status === 'ready' ? '✓ Ready' : `⚠️ Fix ${code.requiredFixes?.length || 0}`}
                        </span>
                        {code.complexity && (
                            <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-medium",
                                code.complexity === 'high' ? "bg-red-500/20 text-red-300" :
                                    code.complexity === 'moderate' ? "bg-yellow-500/20 text-yellow-300" :
                                        "bg-blue-500/20 text-blue-300"
                            )}>
                                {code.complexity}
                            </span>
                        )}
                    </div>
                    <p className="text-white/70 text-sm mb-1">{code.description}</p>
                    <p className="text-white/90 font-mono text-sm font-semibold">{code.reimbursement}</p>

                    {/* Confidence Meter */}
                    {code.confidence && (
                        <div className="mt-3">
                            <ConfidenceMeter confidence={code.confidence} />
                        </div>
                    )}
                </div>
            </div>

            {/* Reasoning Toggle */}
            {code.reasoning && (
                <div className="mt-3 pt-3 border-t border-white/10">
                    <button
                        onClick={() => setShowReasoning(!showReasoning)}
                        className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition-colors"
                    >
                        {showReasoning ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {showReasoning ? 'Hide' : 'Show'} Reasoning & Evidence
                    </button>

                    {showReasoning && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3"
                        >
                            <ReasoningSection
                                reasoning={code.reasoning}
                                evidenceLocations={code.evidenceLocations}
                                onEvidenceClick={(pageNumber) => {
                                    // TODO: Implement scroll to PDF page
                                    console.log('Scroll to page:', pageNumber);
                                }}
                            />
                        </motion.div>
                    )}
                </div>
            )}

            {/* Required Fixes */}
            {code.requiredFixes && code.requiredFixes.length > 0 && onGapClick && (
                <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-white/50 text-xs mb-2">Required documentation fixes:</p>
                    <div className="flex flex-wrap gap-2">
                        {code.requiredFixes.slice(0, 3).map(gapId => (
                            <button
                                key={gapId}
                                onClick={() => onGapClick(gapId)}
                                className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs rounded transition-colors"
                            >
                                View Gap
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}

function ICD10CodeCard({ code }: { code: ICD10Code }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
                "bg-white/5 border rounded-lg p-3 flex items-start justify-between",
                code.source === 'documented' ? "border-white/10" : "border-purple-500/30"
            )}
        >
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-mono text-sm font-bold">{code.code}</span>
                    {code.isHCC && (
                        <span className="px-1.5 py-0.5 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[9px] font-bold rounded">
                            HCC
                        </span>
                    )}
                    <span className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-medium",
                        code.category === 'chronic' ? "bg-blue-500/20 text-blue-300" :
                            code.category === 'acute' ? "bg-red-500/20 text-red-300" :
                                "bg-gray-500/20 text-gray-300"
                    )}>
                        {code.category}
                    </span>
                </div>
                <p className="text-white/70 text-xs">{code.description}</p>
            </div>
        </motion.div>
    );
}
