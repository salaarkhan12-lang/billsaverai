"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DocumentationGap } from "@/lib/billing-rules";
import { generateSmartTemplate } from "@/lib/smart-templates";

interface InteractiveGapCardProps {
  gap: DocumentationGap;
  index: number;
  onViewInPDF?: (gap: DocumentationGap) => void;
}

const severityConfig = {
  critical: {
    color: "from-red-500/20 to-red-600/20",
    border: "border-red-500/50",
    badge: "bg-red-500/20 text-red-300 border-red-500/30",
    icon: "🚨",
  },
  major: {
    color: "from-orange-500/20 to-orange-600/20",
    border: "border-orange-500/50",
    badge: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    icon: "⚠️",
  },
  moderate: {
    color: "from-yellow-500/20 to-yellow-600/20",
    border: "border-yellow-500/50",
    badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    icon: "⚡",
  },
  minor: {
    color: "from-blue-500/20 to-blue-600/20",
    border: "border-blue-500/50",
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    icon: "ℹ️",
  },
};

export function InteractiveGapCard({ gap, index, onViewInPDF }: InteractiveGapCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [template, setTemplate] = useState<string>("Loading AI template...");
  const [templateLoading, setTemplateLoading] = useState(false);

  const config = severityConfig[gap.category];

  // Generate template asynchronously when component mounts or gap changes
  useEffect(() => {
    let isMounted = true;

    const loadTemplate = async () => {
      setTemplateLoading(true);
      try {
        const generatedTemplate = await generateSmartTemplate({
          gapTitle: gap.title,
          gapCategory: gap.category,
          gapDescription: gap.description,
        });
        if (isMounted) {
          setTemplate(generatedTemplate);
        }
      } catch (error) {
        console.error("Failed to generate template:", error);
        if (isMounted) {
          setTemplate("Failed to generate AI template. Please try again.");
        }
      } finally {
        if (isMounted) {
          setTemplateLoading(false);
        }
      }
    };

    loadTemplate();

    return () => {
      isMounted = false;
    };
  }, [gap.title, gap.category, gap.description]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(template);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 200, damping: 20 }}
      className="relative"
    >
      <motion.div
        layout
        className={`relative overflow-hidden rounded-2xl border ${config.border} bg-gradient-to-br ${config.color} backdrop-blur-xl`}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* Main Card Content */}
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-3 flex-1">
              <span className="text-2xl">{config.icon}</span>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {gap.title}
                </h3>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${config.badge}`}
                >
                  {gap.category.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {gap.potentialRevenueLoss}
              </div>
              <div className="text-xs text-white/60">Potential Loss</div>
            </div>
          </div>

          {/* Description */}
          <p className="text-white/80 text-sm mb-4 leading-relaxed">
            {gap.description}
          </p>

          {/* Location Info */}
          {gap.location && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
              <div className="text-xs font-semibold text-blue-400 mb-1">
                📍 LOCATION IN DOCUMENT
              </div>
              <p className="text-sm text-blue-300">
                Page {gap.location.page}
                {gap.location.section && ` • ${gap.location.section}`}
              </p>
              {gap.location.textSnippet && (
                <p className="text-xs text-blue-400/60 mt-1 italic">
                  "{gap.location.textSnippet.length > 60 ? gap.location.textSnippet.slice(0, 60) + '...' : gap.location.textSnippet}"
                </p>
              )}
            </div>
          )}

          {/* Impact */}
          <div className="bg-white/5 rounded-lg p-3 mb-4">
            <div className="text-xs font-semibold text-white/60 mb-1">
              IMPACT
            </div>
            <p className="text-sm text-white/90">{gap.impact}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Hide gap details" : "View gap details"}
              className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors border border-white/20"
            >
              {isExpanded ? "Show Less" : "View Details"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowTemplate(!showTemplate)}
              aria-expanded={showTemplate}
              aria-label={showTemplate ? "Hide documentation template" : "Show AI-generated documentation template"}
              className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium transition-all shadow-lg shadow-purple-500/50"
            >
              {showTemplate ? "Hide Template" : "✨ Smart Template"}
            </motion.button>
            {onViewInPDF && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onViewInPDF(gap)}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-sm font-medium transition-all shadow-lg shadow-blue-500/50"
              >
                📄 View in PDF
              </motion.button>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-white/10"
            >
              <div className="p-6 space-y-4">
                {/* Recommendation */}
                <div>
                  <div className="text-xs font-semibold text-white/60 mb-2">
                    💡 RECOMMENDATION
                  </div>
                  <p className="text-sm text-white/90 leading-relaxed">
                    {gap.recommendation}
                  </p>
                </div>

                {/* CPT Codes */}
                {gap.cptCodes && gap.cptCodes.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-white/60 mb-2">
                      📋 RELEVANT CPT CODES
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {gap.cptCodes.map((code) => (
                        <span
                          key={code}
                          className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-mono border border-white/20"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ICD Codes */}
                {gap.icdCodes && gap.icdCodes.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-white/60 mb-2">
                      🏥 RELEVANT ICD-10 CODES
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {gap.icdCodes.map((code) => (
                        <span
                          key={code}
                          className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-mono border border-white/20"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Smart Template Panel */}
        <AnimatePresence>
          {showTemplate && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-white/10 bg-black/20"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✨</span>
                    <h4 className="text-sm font-semibold text-white">
                      AI-Generated Documentation Template
                    </h4>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopy}
                    aria-label="Copy template to clipboard"
                    disabled={copied}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                      copied
                        ? "bg-green-500 text-white"
                        : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    }`}
                  >
                    {copied ? "✓ Copied!" : "📋 Copy Template"}
                  </motion.button>
                </div>

                <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                  {templateLoading && (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/60"></div>
                      <span className="ml-2 text-white/60 text-sm">Generating AI template...</span>
                    </div>
                  )}
                  {!templateLoading && (
                    <pre className="text-xs text-white/90 whitespace-pre-wrap font-mono leading-relaxed">
                      {template}
                    </pre>
                  )}
                </div>

                <div className="mt-4 text-xs text-white/60 italic">
                  💡 Tip: Copy this template and paste it into your EHR to quickly
                  complete the missing documentation.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
