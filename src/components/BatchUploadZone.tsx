"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./GlassCard";

interface BatchUploadZoneProps {
  onFilesSelect: (files: File[]) => void;
  isProcessing?: boolean;
  maxFiles?: number;
  acceptedTypes?: string[];
}

export function BatchUploadZone({
  onFilesSelect,
  isProcessing = false,
  maxFiles = 50,
  acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff']
}: BatchUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, []);

  const handleFiles = useCallback((files: File[]) => {
    // Filter by accepted types
    const validFiles = files.filter(file => acceptedTypes.includes(file.type));

    // Limit number of files
    const limitedFiles = validFiles.slice(0, maxFiles - selectedFiles.length);

    if (limitedFiles.length > 0) {
      const newFiles = [...selectedFiles, ...limitedFiles];
      setSelectedFiles(newFiles);
    }
  }, [selectedFiles, maxFiles, acceptedTypes]);

  const removeFile = useCallback((index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
  }, [selectedFiles]);

  const clearAll = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  const handleProcess = useCallback(() => {
    if (selectedFiles.length > 0) {
      onFilesSelect(selectedFiles);
    }
  }, [selectedFiles, onFilesSelect]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <GlassCard variant="elevated" intensity="medium" className="p-8">
          <div className="text-center mb-6">
            <motion.h3
              className="text-2xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Batch Document Analysis
            </motion.h3>
            <motion.p
              className="text-white/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Upload multiple medical documents for simultaneous AI analysis
            </motion.p>
          </div>

          {/* Drop Zone */}
          <motion.div
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
              isDragOver
                ? 'border-blue-400 bg-blue-500/10 scale-105'
                : 'border-white/20 hover:border-white/40 hover:bg-white/5'
            } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            whileHover={!isProcessing ? { scale: 1.02 } : {}}
            whileTap={!isProcessing ? { scale: 0.98 } : {}}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedTypes.join(',')}
              onChange={handleFileInput}
              className="hidden"
              disabled={isProcessing}
            />

            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-white font-medium">Processing documents...</p>
                  <p className="text-white/60 text-sm mt-1">Please wait while AI analyzes your files</p>
                </motion.div>
              ) : (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6"
                    animate={isDragOver ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg
                      className="w-10 h-10 text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </motion.div>

                  <h4 className="text-xl font-semibold text-white mb-2">
                    {isDragOver ? 'Drop files here' : 'Choose files or drag & drop'}
                  </h4>
                  <p className="text-white/60 mb-4">
                    Supports PDF, JPEG, PNG, and TIFF files
                  </p>
                  <p className="text-white/40 text-sm">
                    Maximum {maxFiles} files • Up to 10MB each
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </GlassCard>
      </motion.div>

      {/* Selected Files List */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard variant="default" intensity="light" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-semibold">
                  Selected Files ({selectedFiles.length})
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={clearAll}
                    className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    disabled={isProcessing}
                  >
                    Clear All
                  </button>
                  <button
                    onClick={handleProcess}
                    disabled={isProcessing || selectedFiles.length === 0}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isProcessing ? 'Processing...' : `Analyze ${selectedFiles.length} Files`}
                  </button>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {selectedFiles.map((file, index) => (
                  <motion.div
                    key={`${file.name}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-400 text-xs font-medium">
                          {file.name.split('.').pop()?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {file.name}
                        </p>
                        <p className="text-white/60 text-xs">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      disabled={isProcessing}
                      className="w-6 h-6 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center justify-center text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* File Stats */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex justify-between text-sm text-white/60">
                  <span>Total size: {formatFileSize(selectedFiles.reduce((sum, f) => sum + f.size, 0))}</span>
                  <span>Average: {formatFileSize(selectedFiles.reduce((sum, f) => sum + f.size, 0) / selectedFiles.length)}</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
