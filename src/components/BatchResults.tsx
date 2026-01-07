"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { AnalysisResults } from "./AnalysisResults";
import { ExportMenu } from "./ExportMenu";
import type { BatchItem } from "@/lib/batch-processor";
import type { AnalysisResult } from "@/lib/billing-rules";
import { calculateBatchStats, type BatchStats } from "@/lib/batch-processor";
import { createAdvancedFilter, type FilterCriteria, type SortOption, getFilterStats } from "@/lib/advanced-filters";
import { executeQualityCheck, getWorkflowSummary, type WorkflowResult } from "@/lib/workflow-engine";

interface BatchResultsProps {
  items: BatchItem[];
  onReset: () => void;
  onExportAll?: (results: AnalysisResult[]) => void;
}

type ViewMode = 'overview' | 'detailed' | 'filtered';

export function BatchResults({ items, onReset, onExportAll }: BatchResultsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({});
  const [sortOptions, setSortOptions] = useState<SortOption[]>([
    { field: 'score', direction: 'asc' }
  ]);

  const completedItems = items.filter(item => item.status === 'completed' && item.result);
  const results = completedItems.map(item => item.result!);

  // Calculate batch statistics
  const batchStats = useMemo(() => calculateBatchStats(completedItems), [completedItems]);

  // Apply workflow checks
  const workflowResults = useMemo(() =>
    results.map(result => executeQualityCheck(result)),
    [results]
  );

  // Apply filters
  const filteredResults = useMemo(() => {
    const filter = createAdvancedFilter();
    const filterResult = filter.processResults(results, filterCriteria, sortOptions);
    return filterResult.results;
  }, [results, filterCriteria, sortOptions]);

  // Calculate filtered stats
  const filteredStats = useMemo(() =>
    getFilterStats(filteredResults),
    [filteredResults]
  );

  // Workflow summary
  const workflowSummary = useMemo(() =>
    getWorkflowSummary(workflowResults),
    [workflowResults]
  );

  const handleExportAll = () => {
    onExportAll?.(filteredResults);
  };

  const getStatusColor = (status: BatchItem['status']) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'processing': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: BatchItem['status']) => {
    switch (status) {
      case 'completed': return '✓';
      case 'error': return '✗';
      case 'processing': return '⟳';
      default: return '○';
    }
  };

  if (selectedResult) {
    return (
      <AnalysisResults
        result={selectedResult}
        fileName={completedItems.find(item => item.result === selectedResult)?.file.name || 'Unknown'}
        onReset={() => setSelectedResult(null)}
      />
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-4xl font-bold text-white mb-4">
          Batch Analysis Complete
        </h2>
        <p className="text-white/60 text-lg">
          Processed {batchStats.totalFiles} documents • {batchStats.successRate}% success rate
        </p>
      </motion.div>

      {/* View Mode Tabs */}
      <div className="flex justify-center">
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-1 border border-white/20">
          {(['overview', 'detailed', 'filtered'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                viewMode === mode
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6"
          >
            {/* Batch Stats Cards */}
            <GlassCard variant="elevated" intensity="medium" className="p-6">
              <h3 className="text-white/70 text-sm font-medium mb-4">Processing Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/60">Total Files</span>
                  <span className="text-white font-bold">{batchStats.totalFiles}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Success Rate</span>
                  <span className="text-green-400 font-bold">{batchStats.successRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Avg. Time</span>
                  <span className="text-blue-400 font-bold">{batchStats.averageProcessingTime}s</span>
                </div>
              </div>
            </GlassCard>

            <GlassCard variant="elevated" intensity="medium" className="p-6">
              <h3 className="text-white/70 text-sm font-medium mb-4">Revenue Impact</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/60">Total Identified</span>
                  <span className="text-green-400 font-bold text-lg">{batchStats.totalRevenueIdentified}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Critical Issues</span>
                  <span className="text-red-400 font-bold">{batchStats.criticalIssuesFound}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Major Issues</span>
                  <span className="text-orange-400 font-bold">{batchStats.majorIssuesFound}</span>
                </div>
              </div>
            </GlassCard>

            <GlassCard variant="elevated" intensity="medium" className="p-6">
              <h3 className="text-white/70 text-sm font-medium mb-4">Quality Assurance</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/60">Passed QA</span>
                  <span className="text-green-400 font-bold">{workflowSummary.totalPassed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Failed QA</span>
                  <span className="text-red-400 font-bold">{workflowSummary.totalFailed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Avg. Score</span>
                  <span className="text-blue-400 font-bold">{workflowSummary.averageScore}%</span>
                </div>
              </div>
            </GlassCard>

            <GlassCard variant="elevated" intensity="medium" className="p-6">
              <h3 className="text-white/70 text-sm font-medium mb-4">Top Issues</h3>
              <div className="space-y-2">
                {workflowSummary.topIssues.slice(0, 3).map((issue, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-white/60 truncate mr-2">{issue.issue}</span>
                    <span className="text-white font-bold">{issue.count}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {viewMode === 'detailed' && (
          <motion.div
            key="detailed"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* File Status List */}
            <GlassCard variant="default" intensity="light" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-semibold text-xl">Document Status</h3>
                <div className="flex gap-4">
                  <ExportMenu
                    result={results[0] || {} as AnalysisResult}
                    fileName="batch-export"
                  />
                  <button
                    onClick={handleExportAll}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all"
                  >
                    Export All
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      item.status === 'completed'
                        ? 'bg-green-500/10 border-green-500/20'
                        : item.status === 'error'
                        ? 'bg-red-500/10 border-red-500/20'
                        : 'bg-blue-500/10 border-blue-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        item.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        item.status === 'error' ? 'bg-red-500/20 text-red-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {getStatusIcon(item.status)}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium truncate">{item.file.name}</p>
                        <p className={`text-sm ${getStatusColor(item.status)}`}>
                          {item.status === 'completed' && item.result
                            ? `Score: ${item.result.overallScore}/100`
                            : item.status === 'error'
                            ? item.error || 'Processing failed'
                            : item.status === 'processing'
                            ? `Processing... ${item.progress}%`
                            : 'Queued'
                          }
                        </p>
                      </div>
                    </div>
                    {item.result && (
                      <button
                        onClick={() => setSelectedResult(item.result!)}
                        className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded hover:bg-blue-500/30 transition-colors"
                      >
                        View Details
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {viewMode === 'filtered' && (
          <motion.div
            key="filtered"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Filter Controls */}
            <GlassCard variant="default" intensity="light" className="p-6">
              <h3 className="text-white font-semibold text-xl mb-4">Advanced Filtering</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-white/60 text-sm mb-2">Min Score</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={filterCriteria.minScore || ''}
                    onChange={(e) => setFilterCriteria(prev => ({
                      ...prev,
                      minScore: e.target.value ? parseInt(e.target.value) : undefined
                    }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-2">Max Score</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={filterCriteria.maxScore || ''}
                    onChange={(e) => setFilterCriteria(prev => ({
                      ...prev,
                      maxScore: e.target.value ? parseInt(e.target.value) : undefined
                    }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-2">Min Revenue Loss</label>
                  <input
                    type="number"
                    min="0"
                    value={filterCriteria.minRevenueLoss || ''}
                    onChange={(e) => setFilterCriteria(prev => ({
                      ...prev,
                      minRevenueLoss: e.target.value ? parseInt(e.target.value) : undefined
                    }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filterCriteria.hasCriticalGaps || false}
                    onChange={(e) => setFilterCriteria(prev => ({
                      ...prev,
                      hasCriticalGaps: e.target.checked
                    }))}
                    className="rounded border-white/20"
                  />
                  <span className="text-white/60 text-sm">Critical Gaps Only</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filterCriteria.hasRevenueOpportunity || false}
                    onChange={(e) => setFilterCriteria(prev => ({
                      ...prev,
                      hasRevenueOpportunity: e.target.checked
                    }))}
                    className="rounded border-white/20"
                  />
                  <span className="text-white/60 text-sm">Revenue Opportunities</span>
                </label>
              </div>

              <div className="text-white/60 text-sm">
                Showing {filteredResults.length} of {results.length} results
              </div>
            </GlassCard>

            {/* Filtered Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResults.slice(0, 12).map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlassCard variant="default" intensity="light" className="p-4 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => setSelectedResult(result)}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-medium text-sm truncate">
                        Document {index + 1}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        result.overallScore >= 80 ? 'bg-green-500/20 text-green-400' :
                        result.overallScore >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {result.overallScore}
                      </span>
                    </div>
                    <div className="space-y-2 text-xs text-white/60">
                      <div>Level: {result.currentEMLevel}</div>
                      <div>Gaps: {result.gaps.length}</div>
                      <div>Revenue: {result.totalPotentialRevenueLoss}</div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex justify-center gap-4 pt-8"
      >
        <button
          onClick={onReset}
          className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-semibold text-white shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all hover:scale-105"
        >
          Process More Files
        </button>
      </motion.div>
    </div>
  );
}
