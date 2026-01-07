"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { AnimatedCounter } from "./AnimatedCounter";
import { InteractiveGapCard } from "./InteractiveGapCard";
import { ExportMenu } from "./ExportMenu";
import { FeedbackCollection } from "./FeedbackCollection";
import type { AnalysisResult } from "@/lib/billing-rules";
import { cn } from "@/lib/cn";
import { useEffect, useState } from "react";
import { saveToHistory } from "@/lib/history-storage";

interface AnalysisResultsProps {
  result: AnalysisResult;
  fileName: string;
  onReset: () => void;
}

const levelColors = {
  Excellent: "from-emerald-500 to-green-400",
  Good: "from-green-500 to-emerald-400",
  Fair: "from-yellow-500 to-amber-400",
  Poor: "from-orange-500 to-red-400",
  Critical: "from-red-500 to-rose-600",
};

function ScoreRing({ score, level, mlScore, mlConfidence }: {
  score: number;
  level: AnalysisResult["documentationLevel"];
  mlScore?: number;
  mlConfidence?: number;
}) {
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-36 h-36">
      {/* Background ring */}
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="72"
          cy="72"
          r="54"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="12"
        />
        <motion.circle
          cx="72"
          cy="72"
          r="54"
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className={`${levelColors[level].split(" ")[0].replace("from-", "text-")}`} stopColor="currentColor" />
            <stop offset="100%" className={`${levelColors[level].split(" ")[1].replace("to-", "text-")}`} stopColor="currentColor" />
          </linearGradient>
        </defs>
      </svg>

      {/* Score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-bold text-white"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {Math.round(score)}
        </motion.span>
        <motion.span
          className="text-white/50 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          / 100
        </motion.span>
        {/* ML confidence indicator */}
        {mlConfidence && (
          <motion.div
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <span className="text-xs text-purple-400">🤖</span>
            <span className="text-xs text-purple-400 font-medium">
              {Math.round(mlConfidence * 100)}% AI
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Helper function to parse revenue range (e.g., "$450-750" -> 600 average)
function parseRevenueAmount(revenueString: string): number {
  // Extract all numbers from the string
  const numbers = revenueString.match(/\d+/g);
  if (!numbers || numbers.length === 0) return 0;
  
  // If it's a range (e.g., "450-750"), take the average
  if (numbers.length >= 2) {
    const min = parseInt(numbers[0]);
    const max = parseInt(numbers[1]);
    return Math.round((min + max) / 2);
  }
  
  // Single number
  return parseInt(numbers[0]);
}

export function AnalysisResults({ result, fileName, onReset }: AnalysisResultsProps) {
  const criticalCount = result.gaps.filter((g) => g.category === "critical").length;
  const majorCount = result.gaps.filter((g) => g.category === "major").length;

  // Save to history when component mounts
  useEffect(() => {
    saveToHistory(fileName, result);
  }, [fileName, result]);

  // Generate shareable summary
  const handleShareSummary = () => {
    const summary = `🎯 BillSaver AI Analysis Summary

📄 Document: ${fileName}
📊 Quality Score: ${result.overallScore}/100 (${result.documentationLevel})
💰 Revenue at Risk: ${result.totalPotentialRevenueLoss}

🔍 Issues Found: ${result.gaps.length}
  • Critical: ${criticalCount}
  • Major: ${majorCount}
  • Moderate: ${result.gaps.filter(g => g.category === "moderate").length}

Top Opportunities:
${result.gaps.slice(0, 3).map((gap, i) => `${i + 1}. ${gap.title} - ${gap.potentialRevenueLoss}`).join('\n')}

✅ Strengths:
${result.strengths.slice(0, 3).map(s => `  • ${s}`).join('\n')}

---
Powered by BillSaver AI - Intelligent Medical Billing Analysis
`;

    navigator.clipboard.writeText(summary).then(() => {
      alert('✅ Summary copied to clipboard! Ready to share with stakeholders.');
    }).catch(() => {
      alert('Summary:\n\n' + summary);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-6xl mx-auto space-y-8"
    >
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <motion.h2
          className="text-4xl md:text-5xl font-bold text-white mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Analysis Complete
        </motion.h2>
        <motion.p
          className="text-white/60 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          We&apos;ve identified opportunities to optimize your documentation
        </motion.p>
      </motion.div>

      {/* Score and Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <GlassCard variant="elevated" intensity="medium" className="p-8 h-full">
            <div className="flex flex-col items-center">
              <ScoreRing
                score={result.overallScore}
                level={result.documentationLevel}
                mlScore={result.mlQualityScore}
                mlConfidence={result.mlConfidence}
              />
              
              <motion.div
                className={cn(
                  "mt-6 px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r",
                  levelColors[result.documentationLevel]
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                {result.documentationLevel} Documentation
              </motion.div>

              <div className="mt-6 text-center">
                <p className="text-white/50 text-sm">Medical Decision Making</p>
                <p className="text-white font-semibold text-lg">{result.mdmComplexity} Complexity</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* E/M Level Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <GlassCard variant="elevated" intensity="medium" className="p-8 h-full">
            <h3 className="text-white/70 text-sm font-medium mb-6">E/M Level Analysis</h3>
            
            <div className="space-y-6">
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Current Support</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">{result.currentEMLevel}</span>
                  <span className="text-white/40 text-sm">based on documentation</span>
                </div>
              </div>

              {result.potentialUpcodeOpportunity && (
                <motion.div
                  className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 }}
                >
                  <p className="text-emerald-400 text-xs uppercase tracking-wider mb-2">Potential Level</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-emerald-400">{result.suggestedEMLevel}</span>
                    <span className="text-emerald-400/60 text-sm">with improvements</span>
                  </div>
                </motion.div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <div className={cn("w-2 h-2 rounded-full", result.timeDocumented ? "bg-emerald-400" : "bg-white/30")} />
                <span className={result.timeDocumented ? "text-white" : "text-white/50"}>
                  Time Documentation {result.timeDocumented ? "Present" : "Missing"}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <div className={cn("w-2 h-2 rounded-full", result.meatCriteriaMet ? "bg-emerald-400" : "bg-white/30")} />
                <span className={result.meatCriteriaMet ? "text-white" : "text-white/50"}>
                  MEAT Criteria {result.meatCriteriaMet ? "Met" : "Not Met"}
                </span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Revenue Impact Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <GlassCard variant="elevated" intensity="medium" className="p-8 h-full">
            <h3 className="text-white/70 text-sm font-medium mb-6">Revenue Impact</h3>
            
            <div className="mb-6">
              <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Potential Loss</p>
              <AnimatedCounter
                value={parseRevenueAmount(result.totalPotentialRevenueLoss)}
                duration={2000}
                prefix="$"
                className="text-4xl font-bold text-red-400"
              />
              <p className="text-white/40 text-sm mt-1">
                {result.totalPotentialRevenueLoss} per encounter if unaddressed
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-white/70 text-sm">Critical Issues</span>
                </div>
                <span className="text-red-400 font-semibold">{criticalCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-white/70 text-sm">Major Issues</span>
                </div>
                <span className="text-orange-400 font-semibold">{majorCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-white/70 text-sm">Other Issues</span>
                </div>
                <span className="text-yellow-400 font-semibold">
                  {result.gaps.length - criticalCount - majorCount}
                </span>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Strengths Section */}
      {result.strengths.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassCard variant="default" intensity="light" className="p-6">
            <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <span className="text-emerald-400 text-sm">✓</span>
              </span>
              Documentation Strengths
            </h3>
            <div className="flex flex-wrap gap-3">
              {result.strengths.map((strength, index) => (
                <motion.span
                  key={strength}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm rounded-full"
                >
                  {strength}
                </motion.span>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Gaps Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-semibold text-2xl">
            Documentation Opportunities
          </h3>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <span className="text-white/60 text-sm">Total Issues:</span>
            <span className="text-white font-bold text-lg">{result.gaps.length}</span>
          </div>
        </div>
        <div className="space-y-4">
          {result.gaps
            .sort((a, b) => {
              const order = { critical: 0, major: 1, moderate: 2, minor: 3 };
              return order[a.category] - order[b.category];
            })
            .map((gap, index) => (
              <InteractiveGapCard key={gap.id} gap={gap} index={index} />
            ))}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex justify-center gap-4 pt-8 flex-wrap"
      >
        <ExportMenu result={result} fileName={fileName} />
        
        <motion.button
          onClick={handleShareSummary}
          className="group relative px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl font-semibold text-white shadow-xl shadow-green-500/25 overflow-hidden"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="relative z-10 flex items-center gap-2">
            <span>📋</span>
            <span>Share Summary</span>
          </span>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500"
            initial={{ x: "100%" }}
            whileHover={{ x: 0 }}
            transition={{ duration: 0.3 }}
          />
        </motion.button>
      </motion.div>

      {/* Additional CPT Codes Section */}
      {result.suggestedCPTCodes && result.suggestedCPTCodes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <GlassCard variant="default" intensity="light" className="p-6">
            <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                <span className="text-blue-400 text-sm">🏥</span>
              </span>
              Additional CPT Code Suggestions
            </h3>
            <p className="text-white/60 text-sm mb-6">
              AI-detected procedures, labs, and imaging that may apply to this encounter
            </p>

            <div className="space-y-4">
              {/* Group by category */}
              {[
                'laboratory', 'radiology', 'procedures', 'other'].map(category => {
                const categoryCodes = result.suggestedCPTCodes!.filter(code => code.category === category);
                if (categoryCodes.length === 0) return null;

                return (
                  <div key={category}>
                    <h4 className="text-white/80 font-medium text-sm uppercase tracking-wider mb-3 capitalize">
                      {category}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categoryCodes.map((cpt, index) => (
                        <motion.div
                          key={cpt.code}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + index * 0.05 }}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                        >
                          <div>
                            <span className="text-white font-mono text-sm font-semibold">{cpt.code}</span>
                            <p className="text-white/70 text-xs mt-1">{cpt.description}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-purple-400 text-xs font-medium">
                              {Math.round(cpt.confidence * 100)}% AI
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* ML Feedback Collection */}
      <FeedbackCollection
        result={result}
        documentText={fileName}
        onFeedbackSubmitted={() => {
          // Could add a toast or update state here
        }}
      />

    </motion.div>
  );
}
