"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AnalysisResult } from "@/lib/billing-rules";
import {
  downloadCSV,
  printReport,
  downloadHTMLReport,
  copyToClipboard,
  generatePDFReport,
} from "@/lib/export-utils";

interface ExportMenuProps {
  result: AnalysisResult;
  fileName: string;
}

export function ExportMenu({ result, fileName }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Close menu on Escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleExport = async (format: string, action: () => void | Promise<void>) => {
    setExportingFormat(format);
    setError(null);
    try {
      await action();
      // Show success animation
      setTimeout(() => {
        setExportingFormat(null);
        setIsOpen(false);
      }, 1000);
    } catch (error) {
      console.error(`Export failed:`, error);
      setError(error instanceof Error ? error.message : "Export failed");
      setExportingFormat(null);
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleCopy = async () => {
    try {
      await copyToClipboard(result, fileName);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const exportOptions = [
    {
      id: "pdf",
      label: "Export PDF",
      icon: "📕",
      description: "Professional PDF report",
      action: () => generatePDFReport(result, fileName),
    },
    {
      id: "csv",
      label: "Export CSV",
      icon: "📊",
      description: "Spreadsheet format for billing teams",
      action: () => downloadCSV(result, fileName),
    },
    {
      id: "html",
      label: "Download Report",
      icon: "📄",
      description: "Professional HTML report",
      action: () => downloadHTMLReport(result, fileName),
    },
    {
      id: "print",
      label: "Print Report",
      icon: "🖨️",
      description: "Print or save as PDF",
      action: () => printReport(result, fileName),
    },
    {
      id: "copy",
      label: "Copy Summary",
      icon: "📋",
      description: "Copy text summary to clipboard",
      action: handleCopy,
    },
  ];

  return (
    <div className="relative">
      {/* Export Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Export report menu"
        aria-haspopup="true"
        className="group relative px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl font-semibold text-white shadow-lg shadow-emerald-500/25 overflow-hidden flex items-center gap-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="relative z-10 flex items-center gap-2">
          <span>📤</span>
          <span>Export Report</span>
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ▼
          </motion.span>
        </span>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-500"
          initial={{ x: "100%" }}
          whileHover={{ x: 0 }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 bottom-full mb-2 w-80 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-50"
            >
              <div className="p-2">
                {exportOptions.map((option, index) => (
                  <motion.button
                    key={option.id}
                    onClick={() => handleExport(option.id, option.action)}
                    disabled={exportingFormat !== null}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{option.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">
                            {option.label}
                          </span>
                          {exportingFormat === option.id && (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                            />
                          )}
                          {copied && option.id === "copy" && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-green-400"
                            >
                              ✓
                            </motion.span>
                          )}
                        </div>
                        <p className="text-xs text-white/60 mt-1">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 bg-white/5 border-t border-white/10">
                {error ? (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400 text-center"
                  >
                    ⚠️ {error}
                  </motion.p>
                ) : (
                  <p className="text-xs text-white/50 text-center">
                    💡 Tip: Use CSV for Excel analysis, Print for PDF conversion
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
