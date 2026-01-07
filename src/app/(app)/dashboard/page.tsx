"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadZone } from "@/components/UploadZone";
import { AnalysisResults } from "@/components/AnalysisResults";
import { BatchUploadZone } from "@/components/BatchUploadZone";
import { BatchResults } from "@/components/BatchResults";
import { ParticleField } from "@/components/ParticleField";
import { EnhancedProgress } from "@/components/EnhancedProgress";
import { Dashboard } from "@/components/Dashboard";
import { InvestorPresentationMode } from "@/components/InvestorPresentationMode";
import { parsePDF } from "@/lib/blackbox_pdf-parser";
import { analyzeDocument, type AnalysisResult } from "@/lib/billing-rules";
import { createBatchProcessor, type BatchItem } from "@/lib/batch-processor";
import type { AnalysisHistoryItem } from "@/lib/history-storage";
import { DEMO_ANALYSIS_RESULT } from "@/lib/demo-data";
import { getHistoryStats } from "@/lib/history-storage";

type AppState = "idle" | "processing" | "results" | "batch-processing" | "batch-results" | "error";
type ProcessingMode = "single" | "batch";

interface ErrorInfo {
  message: string;
  details?: string;
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [processingMode, setProcessingMode] = useState<ProcessingMode>("single");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [currentFile, setCurrentFile] = useState<File | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showInvestorMode, setShowInvestorMode] = useState(false);
  const [liveStats, setLiveStats] = useState({ uniqueDocuments: 0, totalRevenue: 0 });

  // Batch processing state
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [batchProcessor, setBatchProcessor] = useState<ReturnType<typeof createBatchProcessor> | null>(null);

  // Animated gradient background positions
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Update live stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await getHistoryStats();
        setLiveStats({
          uniqueDocuments: stats.uniqueDocuments,
          totalRevenue: stats.totalRevenueLoss,
        });
      } catch (error) {
        console.error('Failed to fetch live stats:', error);
        // Set defaults when backend is unavailable
        setLiveStats({ uniqueDocuments: 0, totalRevenue: 0 });
      }
    };
    fetchStats();
  }, [appState]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    setFileName(file.name);
    setCurrentFile(file);
    setAppState("processing");
    setProgress(0);
    setError(null);
    setStatusMessage("");

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      // Simulate progress for better UX
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            if (progressInterval) clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      // Parse PDF
      console.log("Starting PDF parse...");
      setStatusMessage("Reading PDF...");
      const parseResult = await parsePDF(file, (ocrProgress) => {
        // Switch to real progress if OCR kicks in
        if (progressInterval) clearInterval(progressInterval);
        setStatusMessage(`Extracting text with OCR... ${Math.round(ocrProgress)}%`);
        setProgress(ocrProgress);
      });
      console.log("PDF parsed successfully:", parseResult.pageCount, "pages");
      console.log("Extracted text length:", parseResult.text.length, "characters");
      console.log("Used OCR:", parseResult.usedOCR);

      if (parseResult.usedOCR) {
        console.log("✓ OCR was used to extract text from image-based PDF");
        setStatusMessage("OCR extraction complete!");
      } else {
        setStatusMessage("Text extraction complete!");
      }
      setProgress(50);

      // Small delay for visual effect
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Analyze document
      console.log("Starting analysis...");
      setStatusMessage("Analyzing medical document with AI...");
      const analysisResult = await analyzeDocument(parseResult);
      console.log("Analysis complete:", analysisResult);
      setStatusMessage("AI analysis complete!");

      if (progressInterval) clearInterval(progressInterval);
      setProgress(100);

      // Transition to results
      await new Promise((resolve) => setTimeout(resolve, 300));
      setResult(analysisResult);
      setAppState("results");
    } catch (error) {
      console.error("Error processing file:", error);
      console.error("Error details:", error instanceof Error ? error.message : String(error));

      if (progressInterval) clearInterval(progressInterval);

      setError({
        message: error instanceof Error ? error.message : "An unknown error occurred",
        details: error instanceof Error ? error.stack : undefined,
      });
      setAppState("error");
      setProgress(0);
    }
  }, []);

  const handleReset = useCallback(() => {
    setAppState("idle");
    setProgress(0);
    setResult(null);
    setFileName("");
    setStatusMessage("");
    setError(null);
  }, []);

  const handleRetry = useCallback(() => {
    setAppState("idle");
    setProgress(0);
    setError(null);
    setStatusMessage("");
  }, []);

  const handleLoadFromHistory = useCallback((item: AnalysisHistoryItem) => {
    setFileName(item.fileName);
    setResult(item.result);
    setAppState("results");
    setShowDashboard(false);
  }, []);

  const handleDemoMode = useCallback(() => {
    setFileName("Demo_Medical_Note.pdf");
    setResult(DEMO_ANALYSIS_RESULT);
    setAppState("results");
  }, []);

  // Batch processing handlers
  const handleBatchFilesSelect = useCallback(async (files: File[]) => {
    setAppState("batch-processing");
    setBatchItems([]);

    // Create batch processor with 3 concurrent workers
    const processor = createBatchProcessor({
      maxConcurrent: 3,
      onProgress: (item, overallProgress) => {
        setBatchItems(prev => {
          const updated = prev.map(existing =>
            existing.id === item.id ? { ...item } : existing
          );
          // Ensure all items are included
          const itemIds = updated.map(i => i.id);
          const missingItems = prev.filter(i => !itemIds.includes(i.id));
          return [...updated, ...missingItems];
        });
      },
      onComplete: (results) => {
        setBatchItems(results);
        setAppState("batch-results");
        // Cleanup processor
        processor.destroy();
        setBatchProcessor(null);
      },
      onError: (item, error) => {
        console.error('Batch processing error:', error);
        setBatchItems(prev => prev.map(existing =>
          existing.id === item.id ? { ...existing, status: 'error' as const, error: error.message } : existing
        ));
      }
    });

    setBatchProcessor(processor);

    // Start batch processing
    const itemIds = processor.addToQueue(files);
    setBatchItems(itemIds.map(id => ({
      id,
      file: files[itemIds.indexOf(id)],
      status: 'pending' as const,
      progress: 0
    })));
  }, []);

  const handleBatchReset = useCallback(() => {
    setAppState("idle");
    setBatchItems([]);
    if (batchProcessor) {
      batchProcessor.destroy();
      setBatchProcessor(null);
    }
  }, [batchProcessor]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0a0a0f] via-[#0d0d15] to-[#0a0a0f]">
      {/* Animated gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(99, 102, 241, 0.15), transparent 50%)`,
        }}
      />

      {/* Particle field background */}
      <ParticleField />

      {/* Top Right Buttons */}
      {appState === "idle" && (
        <div className="fixed top-6 right-6 z-20 flex flex-col gap-3">
          {/* Mode Toggle */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-xl rounded-xl p-1 border border-white/20"
          >
            <button
              onClick={() => setProcessingMode("single")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${processingMode === "single"
                  ? "bg-blue-500/20 text-blue-400 shadow-lg"
                  : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
            >
              Single File
            </button>
            <button
              onClick={() => setProcessingMode("batch")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${processingMode === "batch"
                  ? "bg-purple-500/20 text-purple-400 shadow-lg"
                  : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
            >
              Batch Processing
            </button>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            onClick={() => setShowInvestorMode(true)}
            className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-semibold text-white shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 transition-all hover:scale-105"
          >
            <span className="flex items-center gap-2">
              <span>🎯</span>
              <span>Investor Pitch</span>
            </span>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            onClick={() => setShowDashboard(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:scale-105"
          >
            <span className="flex items-center gap-2">
              <span>📊</span>
              <span>Command Center</span>
            </span>
          </motion.button>
        </div>
      )}

      {/* Live Stats Ticker - Bottom */}
      {appState === "idle" && liveStats.uniqueDocuments > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 px-8 py-4 bg-gradient-to-r from-gray-900/95 to-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
        >
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <div>
                <div className="text-white/60 text-xs">Total Revenue Identified</div>
                <div className="text-green-400 font-bold text-xl">
                  ${liveStats.totalRevenue.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="flex items-center gap-2">
              <span className="text-2xl">📈</span>
              <div>
                <div className="text-white/60 text-xs">Documents Analyzed</div>
                <div className="text-blue-400 font-bold text-xl">
                  {liveStats.uniqueDocuments}
                </div>
              </div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <div>
                <div className="text-white/60 text-xs">Time Saved</div>
                <div className="text-purple-400 font-bold text-xl">
                  {Math.round(liveStats.uniqueDocuments * 40)} min
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {appState === "idle" && processingMode === "single" && (
            <motion.div
              key="single-upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-2xl"
            >
              <div className="mb-8 text-center">
                <motion.h1
                  className="mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-5xl font-bold text-transparent"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  BillSaver AI
                </motion.h1>
                <motion.p
                  className="text-lg text-gray-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Intelligent Medical Billing Analysis
                </motion.p>
                <motion.p
                  className="text-sm text-white/50 mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  Recover lost revenue • Ensure compliance • Save time
                </motion.p>

                {/* Live Stats Banner */}
                {liveStats.uniqueDocuments > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-6 inline-flex items-center gap-6 px-6 py-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-full"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-white/60 text-sm">Documents Analyzed:</span>
                      <span className="text-white font-bold">{liveStats.uniqueDocuments}</span>
                    </div>
                    <div className="w-px h-4 bg-white/20" />
                    <div className="flex items-center gap-2">
                      <span className="text-white/60 text-sm">Revenue Identified:</span>
                      <span className="text-green-400 font-bold">${liveStats.totalRevenue.toLocaleString()}</span>
                    </div>
                  </motion.div>
                )}
              </div>
              <UploadZone onFileSelect={handleFileSelect} />

              {/* Demo Mode Button */}
              <motion.div
                className="mt-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <button
                  onClick={handleDemoMode}
                  className="group relative px-8 py-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl font-semibold text-white hover:from-purple-600/30 hover:to-pink-600/30 transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-2xl">🎯</span>
                    <span>
                      <div className="text-lg">Try Demo Mode</div>
                      <div className="text-xs text-white/60 font-normal">
                        See instant analysis without uploading
                      </div>
                    </span>
                  </span>
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs font-bold px-2 py-1 rounded-full">
                    NEW
                  </div>
                </button>
              </motion.div>
            </motion.div>
          )}

          {appState === "idle" && processingMode === "batch" && (
            <motion.div
              key="batch-upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <BatchUploadZone
                onFilesSelect={handleBatchFilesSelect}
                isProcessing={false}
              />
            </motion.div>
          )}

          {appState === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-2xl"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
                <EnhancedProgress
                  progress={progress}
                  statusMessage={statusMessage}
                  fileName={fileName}
                />
                <div className="text-center text-sm text-gray-400 mt-4">
                  {Math.round(progress)}% complete
                </div>

                {/* Animated loading indicator */}
                <div className="mt-8 flex justify-center">
                  <div className="flex space-x-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="h-3 w-3 rounded-full bg-blue-500"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {appState === "error" && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-2xl"
            >
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 backdrop-blur-xl">
                <div className="mb-6 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="rounded-full bg-red-500/20 p-4">
                      <svg
                        className="h-12 w-12 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                  </div>
                  <h2 className="mb-2 text-2xl font-bold text-white">
                    Processing Error
                  </h2>
                  <p className="text-red-400">{error.message}</p>
                  {error.details && (
                    <details className="mt-4 text-left">
                      <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                        Technical Details
                      </summary>
                      <pre className="mt-2 max-h-40 overflow-auto rounded bg-black/20 p-2 text-xs text-gray-500">
                        {error.details}
                      </pre>
                    </details>
                  )}
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleRetry}
                    className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/50"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleReset}
                    className="rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10"
                  >
                    Upload Different File
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {appState === "results" && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-6xl"
            >
              <AnalysisResults result={result} fileName={fileName} onReset={handleReset} file={currentFile} />
            </motion.div>
          )}

          {appState === "batch-processing" && (
            <motion.div
              key="batch-processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-2xl"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
                <BatchUploadZone
                  onFilesSelect={() => { }} // Already handled
                  isProcessing={true}
                />
                <div className="text-center text-sm text-gray-400 mt-4">
                  Processing {batchItems.length} documents with AI analysis...
                </div>

                {/* Processing Progress */}
                {batchItems.length > 0 && (
                  <div className="mt-6 space-y-3">
                    {batchItems.slice(0, 5).map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${item.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              item.status === 'error' ? 'bg-red-500/20 text-red-400' :
                                'bg-blue-500/20 text-blue-400'
                            }`}>
                            {item.status === 'completed' ? '✓' :
                              item.status === 'error' ? '✗' :
                                item.status === 'processing' ? '⟳' : '○'}
                          </div>
                          <span className="text-white text-sm truncate max-w-48">
                            {item.file.name}
                          </span>
                        </div>
                        <span className={`text-xs ${item.status === 'completed' ? 'text-green-400' :
                            item.status === 'error' ? 'text-red-400' :
                              'text-blue-400'
                          }`}>
                          {item.status === 'completed' ? 'Complete' :
                            item.status === 'error' ? 'Failed' :
                              item.status === 'processing' ? `${item.progress}%` : 'Queued'}
                        </span>
                      </motion.div>
                    ))}
                    {batchItems.length > 5 && (
                      <div className="text-center text-white/60 text-sm">
                        ... and {batchItems.length - 5} more files
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {appState === "batch-results" && (
            <motion.div
              key="batch-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <BatchResults
                items={batchItems}
                onReset={handleBatchReset}
                onExportAll={(results) => {
                  // Handle batch export - could implement combined PDF or CSV
                  console.log('Exporting all results:', results);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dashboard Modal */}
      <AnimatePresence>
        {showDashboard && (
          <Dashboard
            onClose={() => setShowDashboard(false)}
            onLoadAnalysis={handleLoadFromHistory}
          />
        )}
      </AnimatePresence>

      {/* Investor Presentation Mode */}
      <AnimatePresence>
        {showInvestorMode && (
          <InvestorPresentationMode onClose={() => setShowInvestorMode(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
