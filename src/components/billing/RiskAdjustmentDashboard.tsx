"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { useState } from "react";
import { analyzeHCCOpportunities, type HCCAnalysisResult, type HCCOpportunity } from "@/lib/risk-adjustment/hcc-analyzer";
import { analyzeMEATCompliance, type MEATAnalysisResult, type ConditionMEATAnalysis } from "@/lib/risk-adjustment/meat-analyzer";
import { analyzeAllSpecificityOpportunities, type SpecificityOverview } from "@/lib/risk-adjustment/specificity-database";
import { analyzeMIPSMeasures, type MIPSAnalysisResult } from "@/lib/mips/mips-database";
import { ChevronDown, ChevronUp, TrendingUp, Activity, Target, FileCheck } from "lucide-react";

interface RiskAdjustmentDashboardProps {
    documentText: string;
    documentedCodes: string[];
    conditions?: Array<{ code: string; description: string; isHCC: boolean }>;
}

export function RiskAdjustmentDashboard({
    documentText,
    documentedCodes,
    conditions = [],
}: RiskAdjustmentDashboardProps) {
    // Run all analyses
    const hccAnalysis = analyzeHCCOpportunities(documentText, documentedCodes);
    const meatAnalysis = analyzeMEATCompliance(conditions, documentText);
    const specificityAnalysis = analyzeAllSpecificityOpportunities(documentedCodes, documentText);
    const mipsAnalysis = analyzeMIPSMeasures(documentText, documentedCodes);

    return (
        <div className="space-y-6">
            {/* RAF Score Summary Card */}
            <RAFScoreSummary hccAnalysis={hccAnalysis} />

            {/* HCC Gap List */}
            <HCCGapList hccAnalysis={hccAnalysis} />

            {/* MIPS Score Preview */}
            <MIPSScorePreview mipsAnalysis={mipsAnalysis} />

            {/* MEAT Compliance Grid */}
            <MEATComplianceGrid meatAnalysis={meatAnalysis} />

            {/* Specificity Recommendations */}
            <SpecificityRecommendations specificityAnalysis={specificityAnalysis} />
        </div>
    );
}

// ============================================================================
// RAF SCORE SUMMARY
// ============================================================================

function RAFScoreSummary({ hccAnalysis }: { hccAnalysis: HCCAnalysisResult }) {
    const rafIncrease = hccAnalysis.potentialRAF - hccAnalysis.currentRAF;
    const valueIncrease = hccAnalysis.gapValue;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-6"
        >
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                RAF Score Summary
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black/20 rounded-lg p-4 text-center">
                    <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Current RAF</p>
                    <p className="text-2xl font-bold text-white">{hccAnalysis.currentRAF.toFixed(3)}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-4 text-center">
                    <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Potential RAF</p>
                    <p className="text-2xl font-bold text-emerald-400">{hccAnalysis.potentialRAF.toFixed(3)}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-4 text-center">
                    <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Current Value</p>
                    <p className="text-2xl font-bold text-white">${hccAnalysis.currentAnnualValue.toLocaleString()}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-4 text-center">
                    <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Opportunity</p>
                    <p className="text-2xl font-bold text-yellow-400">+${valueIncrease.toLocaleString()}</p>
                </div>
            </div>

            {rafIncrease > 0 && (
                <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                    <p className="text-emerald-400 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span className="font-medium">+{rafIncrease.toFixed(3)} RAF points available</span>
                        <span className="text-emerald-300/70">({((rafIncrease / (hccAnalysis.currentRAF || 0.001)) * 100).toFixed(0)}% increase potential)</span>
                    </p>
                </div>
            )}
        </motion.div>
    );
}

// ============================================================================
// HCC GAP LIST
// ============================================================================

function HCCGapList({ hccAnalysis }: { hccAnalysis: HCCAnalysisResult }) {
    const [expanded, setExpanded] = useState(true);
    const allOpportunities = [
        ...hccAnalysis.upgradeOpportunities,
        ...hccAnalysis.potentialHCCs,
    ];

    if (allOpportunities.length === 0) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6"
        >
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between text-white font-semibold mb-4"
            >
                <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-400" />
                    HCC Gap Opportunities
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                        {allOpportunities.length}
                    </span>
                </div>
                {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expanded && (
                <div className="space-y-3">
                    {allOpportunities.map((opp, idx) => (
                        <HCCOpportunityCard key={`${opp.icd10Code}-${idx}`} opportunity={opp} />
                    ))}
                </div>
            )}
        </motion.div>
    );
}

function HCCOpportunityCard({ opportunity }: { opportunity: HCCOpportunity }) {
    return (
        <div className={cn(
            "bg-black/20 rounded-lg p-4 border",
            opportunity.source === 'upgrade' ? "border-emerald-500/30" : "border-purple-500/30"
        )}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-white font-mono font-bold">{opportunity.icd10Code}</span>
                        <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            opportunity.source === 'upgrade'
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : opportunity.source === 'documented'
                                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                    : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        )}>
                            {opportunity.source === 'upgrade' ? '↑ Upgrade' : opportunity.source === 'documented' ? '✓ Documented' : '+ Potential'}
                        </span>
                        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] rounded">
                            HCC {opportunity.hccCategory}
                        </span>
                        <span className={cn(
                            "px-2 py-0.5 rounded text-[10px]",
                            opportunity.confidence === 'high' ? "bg-emerald-500/20 text-emerald-300" :
                                opportunity.confidence === 'medium' ? "bg-yellow-500/20 text-yellow-300" :
                                    "bg-gray-500/20 text-gray-300"
                        )}>
                            {opportunity.confidence} confidence
                        </span>
                    </div>
                    <p className="text-white/70 text-sm mb-1">{opportunity.description}</p>
                    <p className="text-white/50 text-xs">{opportunity.hccDescription}</p>
                </div>
                <div className="text-right ml-4">
                    <p className="text-emerald-400 font-bold text-lg">+${opportunity.annualValue.toLocaleString()}</p>
                    <p className="text-white/50 text-xs">RAF: {opportunity.rafWeight.toFixed(3)}</p>
                </div>
            </div>

            {opportunity.upgradeFrom && (
                <div className="mt-2 pt-2 border-t border-white/10">
                    <p className="text-emerald-300/80 text-xs">
                        Upgrade from <span className="font-mono font-bold">{opportunity.upgradeFrom}</span>
                    </p>
                </div>
            )}

            {opportunity.documentationRequired && opportunity.documentationRequired.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/10">
                    <p className="text-white/50 text-xs mb-1">Required documentation:</p>
                    <ul className="text-white/70 text-xs space-y-0.5">
                        {opportunity.documentationRequired.slice(0, 2).map((doc, i) => (
                            <li key={i} className="flex items-start gap-1">
                                <span className="text-purple-400">•</span>
                                <span>{doc}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// MIPS SCORE PREVIEW
// ============================================================================

function MIPSScorePreview({ mipsAnalysis }: { mipsAnalysis: MIPSAnalysisResult }) {
    const [expanded, setExpanded] = useState(false);

    const getAdjustmentColor = (adjustment: number) => {
        if (adjustment >= 5) return "text-emerald-400";
        if (adjustment >= 0) return "text-yellow-400";
        return "text-red-400";
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'exceptional': return "bg-emerald-500";
            case 'high': return "bg-blue-500";
            case 'moderate': return "bg-yellow-500";
            case 'low': return "bg-orange-500";
            default: return "bg-red-500";
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6"
        >
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between text-white font-semibold mb-4"
            >
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                    MIPS Quality Score Preview
                </div>
                {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-black/20 rounded-lg p-4 text-center">
                    <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Projected Score</p>
                    <p className="text-3xl font-bold text-white">{mipsAnalysis.projectedScore}</p>
                    <p className="text-white/50 text-xs">/100</p>
                </div>
                <div className="bg-black/20 rounded-lg p-4 text-center">
                    <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Performance</p>
                    <p className={cn(
                        "text-lg font-bold capitalize",
                        getCategoryColor(mipsAnalysis.performanceCategory).replace('bg-', 'text-')
                    )}>
                        {mipsAnalysis.performanceCategory}
                    </p>
                    <div className={cn(
                        "w-3 h-3 rounded-full mx-auto mt-1",
                        getCategoryColor(mipsAnalysis.performanceCategory)
                    )} />
                </div>
                <div className="bg-black/20 rounded-lg p-4 text-center">
                    <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Payment Adjustment</p>
                    <p className={cn("text-2xl font-bold", getAdjustmentColor(mipsAnalysis.paymentAdjustment))}>
                        {mipsAnalysis.paymentAdjustment >= 0 ? '+' : ''}{mipsAnalysis.paymentAdjustment}%
                    </p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-xs text-white/50 mb-1">
                    <span>0</span>
                    <span>50</span>
                    <span>100</span>
                </div>
                <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                    <div
                        className={cn(
                            "h-full rounded-full transition-all duration-500",
                            getCategoryColor(mipsAnalysis.performanceCategory)
                        )}
                        style={{ width: `${mipsAnalysis.projectedScore}%` }}
                    />
                </div>
            </div>

            {expanded && (
                <div className="space-y-3 mt-4 pt-4 border-t border-white/10">
                    <p className="text-white/70 text-sm font-medium">Applicable Measures:</p>
                    {mipsAnalysis.applicableMeasures.map((result) => (
                        <div
                            key={result.measure.measureId}
                            className={cn(
                                "bg-black/20 rounded-lg p-3 border",
                                result.isMet ? "border-emerald-500/30" :
                                    result.isExcluded ? "border-gray-500/30" : "border-orange-500/30"
                            )}
                        >
                            <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
                                <span className="text-white font-medium text-sm">
                                    #{result.measure.measureId}: {result.measure.title}
                                </span>
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold",
                                    result.isMet
                                        ? "bg-emerald-500/20 text-emerald-300"
                                        : result.isExcluded
                                            ? "bg-gray-500/20 text-gray-300"
                                            : "bg-orange-500/20 text-orange-300"
                                )}>
                                    {result.isMet ? `✓ ${result.points} pts` :
                                        result.isExcluded ? '— Excluded' : '○ Needs work'}
                                </span>
                            </div>
                            <p className="text-white/50 text-xs">{result.recommendation}</p>
                        </div>
                    ))}

                    {mipsAnalysis.recommendations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                            <p className="text-white/70 text-sm font-medium mb-2">Recommendations:</p>
                            {mipsAnalysis.recommendations.slice(0, 3).map((rec) => (
                                <div key={rec.measureId} className="text-xs text-white/60 mb-1">
                                    • {rec.action}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}

// ============================================================================
// MEAT COMPLIANCE GRID
// ============================================================================

function MEATComplianceGrid({ meatAnalysis }: { meatAnalysis: MEATAnalysisResult }) {
    const [expanded, setExpanded] = useState(false);

    if (meatAnalysis.conditions.length === 0) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-500/20 rounded-xl p-6"
        >
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between text-white font-semibold mb-4"
            >
                <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-teal-400" />
                    MEAT Documentation Compliance
                    {meatAnalysis.atRiskConditionsCount > 0 && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-300 text-xs rounded-full">
                            {meatAnalysis.atRiskConditionsCount} at risk
                        </span>
                    )}
                </div>
                {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-black/20 rounded-lg p-3 text-center">
                    <p className="text-white/50 text-[10px] uppercase">Conditions</p>
                    <p className="text-xl font-bold text-white">{meatAnalysis.conditions.length}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-3 text-center">
                    <p className="text-white/50 text-[10px] uppercase">HCC</p>
                    <p className="text-xl font-bold text-purple-400">{meatAnalysis.hccConditionsCount}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-3 text-center">
                    <p className="text-white/50 text-[10px] uppercase">Compliant</p>
                    <p className="text-xl font-bold text-emerald-400">{meatAnalysis.compliantConditionsCount}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-3 text-center">
                    <p className="text-white/50 text-[10px] uppercase">At Risk</p>
                    <p className="text-xl font-bold text-red-400">{meatAnalysis.atRiskConditionsCount}</p>
                </div>
            </div>

            {/* Overall MEAT Score */}
            <div className="mb-4">
                <div className="flex justify-between text-xs text-white/50 mb-1">
                    <span>Average MEAT Score</span>
                    <span>{meatAnalysis.overallMEATScore.toFixed(1)}/4</span>
                </div>
                <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${(meatAnalysis.overallMEATScore / 4) * 100}%` }}
                    />
                </div>
            </div>

            {expanded && (
                <div className="space-y-3 mt-4 pt-4 border-t border-white/10">
                    {meatAnalysis.conditions.map((condition) => (
                        <MEATConditionCard key={condition.conditionCode} condition={condition} />
                    ))}
                </div>
            )}
        </motion.div>
    );
}

function MEATConditionCard({ condition }: { condition: ConditionMEATAnalysis }) {
    const getComplianceColor = (level: string) => {
        switch (level) {
            case 'complete': return "border-emerald-500/30 bg-emerald-500/5";
            case 'partial': return "border-yellow-500/30 bg-yellow-500/5";
            case 'insufficient': return "border-orange-500/30 bg-orange-500/5";
            default: return "border-red-500/30 bg-red-500/5";
        }
    };

    return (
        <div className={cn("rounded-lg p-3 border", getComplianceColor(condition.complianceLevel))}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-white font-mono text-sm font-bold">{condition.conditionCode}</span>
                    {condition.isHCC && (
                        <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-[9px] rounded">HCC</span>
                    )}
                    {condition.annualRecaptureRisk && (
                        <span className="px-1.5 py-0.5 bg-red-500/20 text-red-300 text-[9px] rounded">⚠️ AT RISK</span>
                    )}
                </div>
                <span className="text-white/70 text-xs">{condition.meatScore}/4 MEAT</span>
            </div>
            <p className="text-white/60 text-xs mb-2">{condition.conditionDescription}</p>

            {/* MEAT Element Grid */}
            <div className="grid grid-cols-4 gap-1">
                {condition.meatElements.map((element) => (
                    <div
                        key={element.type}
                        className={cn(
                            "text-center py-1 rounded text-[10px] font-bold",
                            element.detected
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-white/5 text-white/30"
                        )}
                    >
                        {element.type}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// SPECIFICITY RECOMMENDATIONS
// ============================================================================

function SpecificityRecommendations({ specificityAnalysis }: { specificityAnalysis: SpecificityOverview }) {
    const [expanded, setExpanded] = useState(false);

    if (specificityAnalysis.upgradesAvailable === 0) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-xl p-6"
        >
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between text-white font-semibold mb-4"
            >
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-400" />
                    Code Specificity Upgrades
                    <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 text-xs rounded-full">
                        +${specificityAnalysis.totalAnnualOpportunity.toLocaleString()}/yr
                    </span>
                </div>
                {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-black/20 rounded-lg p-3 text-center">
                    <p className="text-white/50 text-xs uppercase">Codes Analyzed</p>
                    <p className="text-xl font-bold text-white">{specificityAnalysis.totalCodesAnalyzed}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-3 text-center">
                    <p className="text-white/50 text-xs uppercase">Upgrades Available</p>
                    <p className="text-xl font-bold text-orange-400">{specificityAnalysis.upgradesAvailable}</p>
                </div>
            </div>

            {expanded && specificityAnalysis.priorityUpgrades.length > 0 && (
                <div className="space-y-3 mt-4 pt-4 border-t border-white/10">
                    {specificityAnalysis.priorityUpgrades.map((upgrade) => (
                        <div
                            key={upgrade.currentCode}
                            className={cn(
                                "bg-black/20 rounded-lg p-3 border",
                                upgrade.documentationSupportsUpgrade
                                    ? "border-emerald-500/30"
                                    : "border-orange-500/30"
                            )}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-mono font-bold">{upgrade.currentCode}</span>
                                    <span className="text-white/50">→</span>
                                    <span className="text-emerald-400 font-mono font-bold">{upgrade.upgradePath?.toCode}</span>
                                    {upgrade.documentationSupportsUpgrade && (
                                        <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] rounded">
                                            ✓ Supported
                                        </span>
                                    )}
                                </div>
                                <span className="text-emerald-400 font-bold">
                                    +${upgrade.upgradePath?.annualValueIncrease.toLocaleString()}/yr
                                </span>
                            </div>
                            <p className="text-white/60 text-xs">{upgrade.recommendation}</p>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

export default RiskAdjustmentDashboard;
