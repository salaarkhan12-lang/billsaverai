"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { GlassCard } from "./GlassCard";
import { submitFeedback } from "@/lib/ml-feedback";
import type { AnalysisResult } from "@/lib/billing-rules";
import type { DocumentationGap } from "@/lib/billing-rules";
import type { CPTCodePrediction } from "@/lib/ml-models";
import { cn } from "@/lib/cn";

interface FeedbackCollectionProps {
  result: AnalysisResult;
  documentText: string;
  onFeedbackSubmitted?: () => void;
}

export function FeedbackCollection({ result, documentText, onFeedbackSubmitted }: FeedbackCollectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [qualityRating, setQualityRating] = useState<'correct' | 'too_high' | 'too_low' | null>(null);
  const [customScore, setCustomScore] = useState<number | null>(null);
  const [gapFeedback, setGapFeedback] = useState<Record<string, { isCorrect: boolean; notes?: string }>>({});
  const [cptFeedback, setCptFeedback] = useState<Record<string, { isCorrect: boolean; shouldRemove?: boolean }>>({});
  const [additionalCptCodes, setAdditionalCptCodes] = useState<string>('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGapFeedback = (gapId: string, isCorrect: boolean, notes?: string) => {
    setGapFeedback(prev => ({
      ...prev,
      [gapId]: { isCorrect, notes }
    }));
  };

  const handleCptFeedback = (code: string, isCorrect: boolean, shouldRemove = false) => {
    setCptFeedback(prev => ({
      ...prev,
      [code]: { isCorrect, shouldRemove }
    }));
  };

  const handleSubmitFeedback = async () => {
    setIsSubmitting(true);

    try {
      // Prepare user corrections
      const userCorrection: any = {};

      // Quality score correction
      if (qualityRating === 'correct') {
        userCorrection.qualityScore = result.overallScore;
      } else if (qualityRating === 'too_high' && customScore !== null) {
        userCorrection.qualityScore = customScore;
      } else if (qualityRating === 'too_low' && customScore !== null) {
        userCorrection.qualityScore = customScore;
      }

      // Gap corrections
      const incorrectGaps = Object.entries(gapFeedback)
        .filter(([, feedback]) => !feedback.isCorrect)
        .map(([gapId, feedback]) => {
          const gap = result.gaps.find(g => g.id === gapId);
          return gap ? `${gap.title}${feedback.notes ? ` - ${feedback.notes}` : ''}` : gapId;
        });

      if (incorrectGaps.length > 0) {
        userCorrection.gaps = incorrectGaps;
      }

      // CPT code corrections
      const incorrectCpts = Object.entries(cptFeedback)
        .filter(([, feedback]) => !feedback.isCorrect)
        .map(([code]) => code);

      const additionalCodes = additionalCptCodes
        .split(',')
        .map(code => code.trim())
        .filter(code => code.length > 0);

      if (incorrectCpts.length > 0 || additionalCodes.length > 0) {
        userCorrection.cptCodes = [...incorrectCpts, ...additionalCodes];
      }

      if (generalNotes.trim()) {
        userCorrection.notes = generalNotes.trim();
      }

      // Submit feedback
      await submitFeedback({
        documentText,
        originalPrediction: {
          qualityScore: result.overallScore,
          gaps: result.gaps.map(g => g.title),
          cptCodes: result.suggestedCPTCodes?.map(c => c.code) || [],
        },
        userCorrection,
        feedbackType: 'general_feedback',
        confidence: result.mlConfidence || 0.5,
      });

      // Reset form
      setQualityRating(null);
      setCustomScore(null);
      setGapFeedback({});
      setCptFeedback({});
      setAdditionalCptCodes('');
      setGeneralNotes('');
      setIsExpanded(false);

      onFeedbackSubmitted?.();
      alert('✅ Thank you! Your feedback will help improve our ML predictions.');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('❌ Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasFeedback = qualityRating || Object.keys(gapFeedback).length > 0 ||
                     Object.keys(cptFeedback).length > 0 || additionalCptCodes.trim() || generalNotes.trim();

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <GlassCard variant="default" intensity="light" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <span className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center">
              <span className="text-purple-400 text-sm">🤖</span>
            </span>
            Help Improve AI Predictions
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white/60 hover:text-white transition-colors text-sm"
          >
            {isExpanded ? 'Collapse' : 'Expand'} Feedback Form
          </button>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Quality Score Feedback */}
              <div>
                <h4 className="text-white/80 font-medium mb-3">Quality Score Prediction</h4>
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-white/60 text-sm">AI predicted:</span>
                  <span className="text-white font-bold">{Math.round(result.overallScore)}/100</span>
                  {result.mlConfidence && (
                    <span className="text-purple-400 text-xs">({Math.round(result.mlConfidence * 100)}% confident)</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQualityRating('correct')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      qualityRating === 'correct'
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    )}
                  >
                    👍 Correct
                  </button>
                  <button
                    onClick={() => setQualityRating('too_high')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      qualityRating === 'too_high'
                        ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    )}
                  >
                    📉 Too High
                  </button>
                  <button
                    onClick={() => setQualityRating('too_low')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      qualityRating === 'too_low'
                        ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    )}
                  >
                    📈 Too Low
                  </button>
                </div>

                {(qualityRating === 'too_high' || qualityRating === 'too_low') && (
                  <div className="mt-3">
                    <label className="text-white/60 text-sm block mb-2">What should the score be?</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={customScore || ''}
                      onChange={(e) => setCustomScore(parseInt(e.target.value) || null)}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm w-24"
                      placeholder="0-100"
                    />
                  </div>
                )}
              </div>

              {/* Gap Feedback */}
              {result.gaps.length > 0 && (
                <div>
                  <h4 className="text-white/80 font-medium mb-3">Documentation Gaps</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {result.gaps.map((gap) => (
                      <div key={gap.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleGapFeedback(gap.id, true)}
                            className={cn(
                              "w-6 h-6 rounded border-2 flex items-center justify-center text-xs",
                              gapFeedback[gap.id]?.isCorrect === true
                                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                                : "border-white/30 text-white/50 hover:border-white/50"
                            )}
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => handleGapFeedback(gap.id, false)}
                            className={cn(
                              "w-6 h-6 rounded border-2 flex items-center justify-center text-xs",
                              gapFeedback[gap.id]?.isCorrect === false
                                ? "bg-red-500/20 border-red-500 text-red-400"
                                : "border-white/30 text-white/50 hover:border-white/50"
                            )}
                          >
                            ✗
                          </button>
                        </div>
                        <div className="flex-1">
                          <p className="text-white/80 text-sm font-medium">{gap.title}</p>
                          {gapFeedback[gap.id]?.isCorrect === false && (
                            <textarea
                              placeholder="Why is this incorrect?"
                              value={gapFeedback[gap.id]?.notes || ''}
                              onChange={(e) => handleGapFeedback(gap.id, false, e.target.value)}
                              className="mt-2 w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm resize-none"
                              rows={2}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CPT Code Feedback */}
              {result.suggestedCPTCodes && result.suggestedCPTCodes.length > 0 && (
                <div>
                  <h4 className="text-white/80 font-medium mb-3">CPT Code Suggestions</h4>
                  <div className="space-y-3">
                    {result.suggestedCPTCodes.map((cpt) => (
                      <div key={cpt.code} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <span className="text-white font-mono text-sm">{cpt.code}</span>
                          <span className="text-white/60 text-sm ml-2">{cpt.description}</span>
                          <span className="text-purple-400 text-xs ml-2">({Math.round(cpt.confidence * 100)}%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCptFeedback(cpt.code, true)}
                            className={cn(
                              "px-3 py-1 rounded text-xs font-medium",
                              cptFeedback[cpt.code]?.isCorrect === true
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-white/10 text-white/70 hover:bg-white/20"
                            )}
                          >
                            Correct
                          </button>
                          <button
                            onClick={() => handleCptFeedback(cpt.code, false, true)}
                            className={cn(
                              "px-3 py-1 rounded text-xs font-medium",
                              cptFeedback[cpt.code]?.shouldRemove
                                ? "bg-red-500/20 text-red-400"
                                : "bg-white/10 text-white/70 hover:bg-white/20"
                            )}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <label className="text-white/60 text-sm block mb-2">Add missing CPT codes (comma-separated)</label>
                    <input
                      type="text"
                      value={additionalCptCodes}
                      onChange={(e) => setAdditionalCptCodes(e.target.value)}
                      placeholder="e.g., 99214, 85025, 83036"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
              )}

              {/* General Notes */}
              <div>
                <h4 className="text-white/80 font-medium mb-3">Additional Notes</h4>
                <textarea
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder="Any other feedback about the AI predictions?"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm resize-none"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4 border-t border-white/10">
                <motion.button
                  onClick={handleSubmitFeedback}
                  disabled={!hasFeedback || isSubmitting}
                  className={cn(
                    "px-6 py-3 rounded-xl font-semibold text-white transition-all",
                    hasFeedback && !isSubmitting
                      ? "bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 shadow-lg shadow-purple-500/25"
                      : "bg-white/10 text-white/50 cursor-not-allowed"
                  )}
                  whileHover={hasFeedback && !isSubmitting ? { scale: 1.02 } : {}}
                  whileTap={hasFeedback && !isSubmitting ? { scale: 0.98 } : {}}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}
