"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { AnimatedCounter } from "./AnimatedCounter";
import { GapList } from "./GapList";
import { ProviderApprovalPanel } from "./ProviderApprovalPanel";
import { PDFViewer } from "./PDFViewer";
import { RecommendedBillingCodes } from "./billing/RecommendedBillingCodes";
import { PayerComparisonView } from "./PayerComparisonView";
import type { AnalysisResult, DocumentationGap as Gap } from "@/lib/billing-rules";
import { comparePayerScenarios } from "@/lib/revenue-calculator";
import { cn } from "@/lib/cn";
import { useEffect, useState } from "react";
import { saveToHistory } from "@/lib/history-storage";

interface AnalysisResultsProps {
  result: AnalysisResult;
  fileName: string;
  onReset: () => void;
  file?: File;
}

const levelColors = {
  Excellent: "from-emerald-500 to-green-400",
  Good: "from-green-500 to-emerald-400",
  Fair: "from-yellow-500 to-amber-400",
  Poor: "from-orange-500 to-red-400",
  Critical: "from-red-500 to-rose-600",
};

// Reused ScoreRing with slight refinements
function ScoreRing({ score, level }: { score: number; level: AnalysisResult["documentationLevel"] }) {
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-40 h-40">
      <svg className="w-full h-full -rotate-90">
        <circle cx="80" cy="80" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <motion.circle
          cx="80"
          cy="80"
          r="54"
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className={levelColors[level].split(" ")[0].replace("from-", "text-")} stopColor="currentColor" />
            <stop offset="100%" className={levelColors[level].split(" ")[1].replace("to-", "text-")} stopColor="currentColor" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-5xl font-bold text-white tracking-tighter"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {Math.round(score)}
        </motion.span>
        <span className="text-white/40 text-xs font-medium uppercase tracking-widest mt-1">Score</span>
      </div>
    </div>
  );
}

// Helper to parse revenue - extract annual amount (the larger number)
function parseRevenueAmount(revenueString: string): number {
  const numbers = revenueString.match(/\d+/g);
  if (!numbers || numbers.length === 0) return 0;
  if (numbers.length >= 2) {
    // Extract both numbers and return the larger one (annual amount)
    const values = numbers.map(n => parseInt(n.replace(/,/g, '')));
    return Math.max(...values);
  }
  return parseInt(numbers[0].replace(/,/g, ''));
}

type Tab = 'overview' | 'details' | 'billing' | 'approval';

export function AnalysisResults({ result, fileName, onReset, file }: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedGapId, setSelectedGapId] = useState<string | undefined>(undefined);
  const [fixedGaps, setFixedGaps] = useState<Set<string>>(new Set());

  // Initialize state from existing data if possible
  useEffect(() => {
    saveToHistory(fileName, result);
    // Select first critical gap by default if available
    const firstCritical = result.gaps.find(g => g.category === 'critical');
    if (firstCritical) {
      setSelectedGapId(firstCritical.id);
    }
  }, [fileName, result]);

  const selectedGap = result.gaps.find(g => g.id === selectedGapId);
  const fixedGapsList = result.gaps.filter(g => fixedGaps.has(g.id));

  const handleGapSelect = (gap: Gap) => {
    setSelectedGapId(gap.id);
    // If we're in overview, switch to details to see the gap in context? 
    // Actually, maybe stay in overview but highlight PDF. 
    // Let's switch to details tab if on overview to show the list context.
    if (activeTab === 'overview') setActiveTab('details');
  };

  const handleFixGap = (gap: Gap) => {
    const newFixed = new Set(fixedGaps);
    if (newFixed.has(gap.id)) {
      newFixed.delete(gap.id);
    } else {
      newFixed.add(gap.id);
    }
    setFixedGaps(newFixed);
  };

  const handleApprove = (gapId: string) => {
    // Ideally this would remove it from the list or mark as approved permanently
    // For now, we'll just toggle it off "fixed" (simulate approval resets workflow or moves to archive)
    // Or better, keep it fixed but maybe show toast.
    alert("Fix approved by Provider!");
    const newFixed = new Set(fixedGaps);
    newFixed.delete(gapId); // Remove from pending approval
    setFixedGaps(newFixed);
  };

  const handleReject = (gapId: string) => {
    const newFixed = new Set(fixedGaps);
    newFixed.delete(gapId);
    setFixedGaps(newFixed);
  };

  const currentTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Score Card */}
            <div className="flex flex-col items-center bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
              <div className="flex items-center gap-8">
                <ScoreRing score={result.overallScore} level={result.documentationLevel} />
                <div className="space-y-2">
                  <div className="text-white/50 text-xs uppercase tracking-wider">Quality Level</div>
                  <div className={cn("text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r", levelColors[result.documentationLevel])}>
                    {result.documentationLevel} Note
                  </div>
                  <div className="h-px w-full bg-white/10 my-2" />
                  <div className="text-white/50 text-xs uppercase tracking-wider mb-2">Revenue Impact</div>

                  {/* Enhanced Revenue Display */}
                  <div className="space-y-2">
                    {/* Annual Revenue - Primary (Most Impressive) */}
                    <div className="flex items-baseline gap-2">
                      <div className="text-red-400 font-mono font-bold text-2xl">
                        {result.totalPotentialRevenueLoss}
                      </div>
                      <span className="text-xs text-white/40 font-sans">per year</span>
                    </div>

                    {/* Per-Visit Revenue - Show if we have detailed gap data */}
                    {result.gaps.some(g => g.revenueImpact) && (
                      <>
                        <div className="flex items-baseline gap-2">
                          <div className="text-red-300 font-mono text-sm">
                            ~${Math.round(
                              result.gaps
                                .filter(g => g.revenueImpact)
                                .reduce((sum, g) => sum + (g.revenueImpact?.perVisitGap || 0), 0)
                            ).toLocaleString()}
                          </div>
                          <span className="text-xs text-white/40 font-sans">per visit</span>
                        </div>

                        {/* Confidence Indicator - NEW! */}
                        {(() => {
                          // Calculate average confidence from gaps with revenue impact
                          const gapsWithConfidence = result.gaps.filter(g => g.revenueImpact?.confidence);
                          if (gapsWithConfidence.length > 0) {
                            const avgConfidence = gapsWithConfidence.reduce(
                              (sum, g) => sum + (g.revenueImpact?.confidence || 0),
                              0
                            ) / gapsWithConfidence.length;

                            const confidencePercent = Math.round(avgConfidence * 100);
                            const confidenceLevel = avgConfidence >= 0.75 ? 'high' : avgConfidence >= 0.50 ? 'medium' : 'low';
                            const confidenceColor = {
                              high: 'text-emerald-400',
                              medium: 'text-yellow-400',
                              low: 'text-orange-400'
                            }[confidenceLevel];

                            return (
                              <div className={cn("flex items-center gap-1.5 text-xs", confidenceColor)}>
                                <div className="flex items-center gap-1">
                                  {confidenceLevel === 'high' && (
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                  {confidenceLevel === 'medium' && (
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <circle cx="10" cy="10" r="8" opacity="0.5" />
                                    </svg>
                                  )}
                                  {confidenceLevel === 'low' && (
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                  <span className="capitalize">{confidenceLevel} confidence</span>
                                </div>
                                <span className="opacity-60">({confidencePercent}%)</span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </>
                    )}

                    {/* Source Data Link - NEW! */}
                    <div className="pt-1 space-y-1">
                      <a
                        href="https://www.cms.gov/medicare/payment/fee-schedules/physician"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 group w-fit"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="group-hover:underline">2024 Medicare Fee Schedule</span>
                        <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <div className="text-xs text-white/40 opacity-60">
                        Based on CMS national averages + commercial payer rates
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-white/40 text-xs uppercase mb-1">E/M Level</div>
                <div className="text-xl font-bold text-white">{result.currentEMLevel}</div>
                {result.isOvercoded && (
                  <div className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Downcode to: {result.suggestedEMLevel}
                  </div>
                )}
                {result.potentialUpcodeOpportunity && !result.isOvercoded && (
                  <div className="text-xs text-emerald-400 mt-1">Potential: {result.suggestedEMLevel}</div>
                )}
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-white/40 text-xs uppercase mb-1">Gaps Found</div>
                <div className="text-xl font-bold text-white">{result.gaps.length}</div>
                <div className="text-xs text-red-400 mt-1">{result.gaps.filter(g => g.category === 'critical').length} Critical</div>
              </div>
            </div>

            {/* Top Critical Gaps Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium text-sm">Top Priorities</h3>
                <button
                  onClick={() => setActiveTab('details')}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View All →
                </button>
              </div>
              <GapList
                gaps={result.gaps.slice(0, 3)}
                onGapSelect={handleGapSelect}
                selectedGapId={selectedGapId}
                onFixGap={handleFixGap}
                fixedGaps={fixedGaps}
              />
            </div>

            {/* Documented Procedures Section */}
            {result.documentedProcedures && result.documentedProcedures.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-medium text-sm">Documented Billable Services</h3>
                  <span className="text-emerald-400 text-xs font-mono">+{result.totalDocumentedRevenue}</span>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 space-y-2">
                  {result.documentedProcedures.map((proc) => (
                    <div key={proc.cptCode} className="flex justify-between items-center py-1.5">
                      <div className="flex-1">
                        <div className="text-white text-sm font-medium">{proc.description}</div>
                        <div className="text-white/60 text-xs font-mono">{proc.cptCode} • {proc.category}</div>
                      </div>
                      <div className="text-emerald-400 font-mono text-sm font-semibold ml-4">
                        ${proc.revenue.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-white/40 italic">
                  ✓ These services were documented and should be billed
                </div>
              </div>
            )}

            {/* Billing Codes Section */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
              <RecommendedBillingCodes
                analysisResult={result}
                onGapClick={(gapId) => {
                  setSelectedGapId(gapId);
                  setActiveTab('details');
                }}
              />
            </div>

            {/* Payer Comparison Section - NEW! */}
            {result.gaps.some(g => g.revenueImpact) && (() => {
              // Get a gap with revenue impact to use for comparison
              const gapWithRevenue = result.gaps.find(g => g.revenueImpact);
              if (gapWithRevenue?.revenueImpact) {
                const comparison = comparePayerScenarios(
                  gapWithRevenue.revenueImpact.currentLevel.cptCode,
                  gapWithRevenue.revenueImpact.potentialLevel.cptCode,
                  ['bcbs-national', 'uhc-national', 'aetna-national', 'cigna-national'],
                  52, // visits per year
                  gapWithRevenue.revenueImpact.confidence
                );

                return (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                    <PayerComparisonView comparisons={comparison} />
                  </div>
                );
              }
              return null;
            })()}
          </div>
        );
      case 'details':
        return (
          <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">All Findings</h3>
              <span className="text-white/40 text-xs">{result.gaps.length} total</span>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 -mr-2">
              <GapList
                gaps={result.gaps}
                onGapSelect={handleGapSelect}
                selectedGapId={selectedGapId}
                onFixGap={handleFixGap}
                fixedGaps={fixedGaps}
              />
            </div>
          </div>
        );
      case 'billing':
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <RecommendedBillingCodes
              analysisResult={result}
              onGapClick={(gapId) => {
                setSelectedGapId(gapId);
                setActiveTab('details');
              }}
            />
          </div>
        );
      case 'approval':
        return (
          <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <ProviderApprovalPanel
              fixedGaps={fixedGapsList}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 pt-[80px] pb-6 px-6 bg-[#0a0a0f] text-white overflow-hidden flex flex-col">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />

      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 shrink-0 z-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={onReset}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-white tracking-tight">{fileName}</h1>
          </div>
          <div className="flex gap-2 text-xs text-white/40 ml-10">
            <span>Analyzed just now</span>
            <span>•</span>
            <span>{result.gaps.length} issues identified</span>
            <span>•</span>
            <span>{result.overallScore}/100</span>
          </div>
        </div>

        <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10">
          {(['overview', 'details', 'billing', 'approval'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                activeTab === tab
                  ? "bg-white text-black shadow-lg"
                  : "text-white/60 hover:text-white"
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'approval' && fixedGaps.size > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px]">
                  {fixedGaps.size}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content - Full Width */}
      <div className="flex-1 flex flex-col h-full min-h-0">
        {/* Analysis Panel - Centered and Constrained */}
        <div className="max-w-5xl mx-auto w-full flex flex-col h-full min-h-0 bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl">
          <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {currentTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
