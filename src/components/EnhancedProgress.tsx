"use client";

import { motion } from "framer-motion";

interface EnhancedProgressProps {
  progress: number;
  statusMessage: string;
  fileName: string;
}

export function EnhancedProgress({
  progress,
  statusMessage,
  fileName,
}: EnhancedProgressProps) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8">
      {/* Circular Progress */}
      <div className="relative">
        {/* Background glow */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 blur-2xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* SVG Circle */}
        <svg className="relative w-32 h-32 transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-white/10"
          />
          {/* Progress circle */}
          <motion.circle
            cx="64"
            cy="64"
            r="45"
            stroke="url(#gradient)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>

        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-white"
          >
            {Math.round(progress)}%
          </motion.span>
        </div>
      </div>

      {/* Status Message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <div className="flex items-center justify-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"
          />
          <p className="text-lg font-medium text-white">{statusMessage}</p>
        </div>
        <p className="text-sm text-white/60">{fileName}</p>
      </motion.div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-center">
        {[
          { label: "Reading", threshold: 0 },
          { label: "Extracting", threshold: 30 },
          { label: "Analyzing", threshold: 60 },
          { label: "Complete", threshold: 100 },
        ].map((step, index) => (
          <div key={step.label} className="flex items-center gap-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{
                scale: progress >= step.threshold ? 1 : 0.8,
                backgroundColor:
                  progress >= step.threshold
                    ? "rgb(168, 85, 247)"
                    : "rgba(255, 255, 255, 0.1)",
              }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-white/20"
            >
              {progress >= step.threshold && (
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.3 }}
                  className="w-4 h-4 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.path d="M20 6L9 17l-5-5" />
                </motion.svg>
              )}
            </motion.div>
            <span
              className={`text-xs font-medium hidden sm:inline ${progress >= step.threshold ? "text-white" : "text-white/40"
                }`}
            >
              {step.label}
            </span>
            {index < 3 && (
              <div
                className={`w-4 md:w-8 h-0.5 ${progress >= step.threshold ? "bg-purple-500" : "bg-white/10"
                  }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
