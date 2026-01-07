"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { ParticleField } from "./ParticleField";
import { cn } from "@/lib/cn";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing?: boolean;
  progress?: number;
  statusMessage?: string;
}

export function UploadZone({ onFileSelect, isProcessing = false, progress = 0, statusMessage = "" }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type === "application/pdf") {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleClick = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  return (
    <motion.div
      className="relative w-full max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <GlassCard
        variant={isDragging ? "glow" : "elevated"}
        intensity="medium"
        hoverEffect={!isProcessing}
        glowColor={isDragging ? "rgba(99, 102, 241, 0.4)" : undefined}
        className={cn(
          "relative cursor-pointer transition-all duration-500",
          isDragging && "scale-[1.02]",
          isProcessing && "cursor-default"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Particle Background */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <ParticleField
            isActive={isDragging || isHovering}
            isAnalyzing={isProcessing}
            particleCount={40}
          />
        </div>

        {/* Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <motion.div
            className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl"
            animate={{
              x: isDragging ? 20 : 0,
              y: isDragging ? 20 : 0,
              scale: isDragging ? 1.2 : 1,
            }}
            transition={{ duration: 0.5 }}
          />
          <motion.div
            className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl"
            animate={{
              x: isDragging ? -20 : 0,
              y: isDragging ? -20 : 0,
              scale: isDragging ? 1.2 : 1,
            }}
            transition={{ duration: 0.5 }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl"
            animate={{
              scale: isProcessing ? [1, 1.3, 1] : 1,
              opacity: isProcessing ? [0.2, 0.4, 0.2] : 0.2,
            }}
            transition={{
              duration: 2,
              repeat: isProcessing ? Infinity : 0,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 p-12 md:p-16">
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center text-center"
              >
                {/* Animated Processing Icon */}
                <div className="relative w-24 h-24 mb-8">
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-indigo-500/30"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute inset-2 rounded-full border-4 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute inset-4 rounded-full border-4 border-t-transparent border-r-purple-400 border-b-transparent border-l-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg"
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 180, 270, 360],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </div>
                </div>

                <motion.h3
                  className="text-2xl font-semibold text-white mb-3"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {statusMessage || "Analyzing Document"}
                </motion.h3>
                <p className="text-white/60 mb-6">
                  {statusMessage.includes("OCR") 
                    ? "Extracting text from image-based PDF using OCR..." 
                    : "Scanning for documentation gaps and billing opportunities..."}
                </p>

                {/* Progress Bar */}
                <div className="w-full max-w-xs h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-white/40 text-sm mt-2">{Math.round(progress)}%</p>
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center text-center"
              >
                {/* Upload Icon */}
                <motion.div
                  className="relative w-24 h-24 mb-8"
                  animate={{
                    y: isDragging ? -10 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Document shape */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-indigo-500/80 to-purple-600/80 rounded-2xl shadow-2xl"
                    animate={{
                      rotateY: isDragging ? 15 : 0,
                      rotateX: isDragging ? -15 : 0,
                    }}
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* Document lines */}
                    <div className="absolute inset-4 flex flex-col gap-2">
                      <div className="h-2 w-3/4 bg-white/30 rounded" />
                      <div className="h-2 w-full bg-white/20 rounded" />
                      <div className="h-2 w-5/6 bg-white/20 rounded" />
                      <div className="h-2 w-2/3 bg-white/20 rounded" />
                    </div>
                  </motion.div>

                  {/* Floating plus icon */}
                  <motion.div
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-400/30"
                    animate={{
                      scale: isDragging ? 1.2 : 1,
                      rotate: isDragging ? 90 : 0,
                    }}
                  >
                    <span className="text-2xl font-bold text-white">+</span>
                  </motion.div>
                </motion.div>

                <motion.h3
                  className="text-2xl md:text-3xl font-semibold text-white mb-3"
                  animate={{ scale: isDragging ? 1.05 : 1 }}
                >
                  {isDragging ? "Release to Analyze" : "Drop Medical Note Here"}
                </motion.h3>
                <p className="text-white/60 mb-6 max-w-sm">
                  Upload your clinical documentation to identify missing elements and optimize billing accuracy
                </p>

                {/* File type badge */}
                <motion.div
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10"
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                >
                  <div className="w-2 h-2 bg-red-400 rounded-full" />
                  <span className="text-white/70 text-sm font-medium">PDF Files Supported</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInput}
          className="hidden"
        />
      </GlassCard>

      {/* Ambient glow beneath card */}
      <motion.div
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-indigo-500/20 blur-3xl rounded-full"
        animate={{
          opacity: isDragging || isProcessing ? 0.6 : 0.3,
          scale: isDragging ? 1.2 : 1,
        }}
      />
    </motion.div>
  );
}
