"use client";

import { motion } from "framer-motion";

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="animate-pulse space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-white/10" />
            <div className="h-3 w-1/2 rounded bg-white/10" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-white/10" />
          <div className="h-3 w-5/6 rounded bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonMetric() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="animate-pulse space-y-3">
        <div className="h-3 w-20 rounded bg-white/10" />
        <div className="h-8 w-24 rounded bg-white/10" />
      </div>
    </div>
  );
}

export function SkeletonProgress() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse space-y-3">
        <div className="h-3 w-32 rounded bg-white/10 mx-auto" />
        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500/50 to-pink-500/50"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>
    </div>
  );
}
