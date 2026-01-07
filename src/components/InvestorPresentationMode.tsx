"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { AnimatedCounter } from "./AnimatedCounter";

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  content: React.ReactNode;
  bgGradient: string;
}

interface InvestorPresentationModeProps {
  onClose: () => void;
}

export function InvestorPresentationMode({ onClose }: InvestorPresentationModeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const slides: Slide[] = [
    {
      id: 0,
      title: "The Problem",
      subtitle: "$125 Billion Lost Annually",
      bgGradient: "from-red-500/20 to-orange-500/20",
      content: (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20"
            >
              <div className="text-6xl mb-4">⏱️</div>
              <AnimatedCounter value={45} prefix="" suffix=" min" className="text-3xl font-bold text-white mb-2" />
              <div className="text-white/60">Average manual review time per document</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20"
            >
              <div className="text-6xl mb-4">💸</div>
              <AnimatedCounter value={125} prefix="$" suffix="B" className="text-3xl font-bold text-white mb-2" />
              <div className="text-white/60">Lost annually to billing errors in US healthcare</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="p-6 rounded-2xl bg-yellow-500/10 border border-yellow-500/20"
            >
              <div className="text-6xl mb-4">⚠️</div>
              <div className="text-3xl font-bold text-white mb-2">High Risk</div>
              <div className="text-white/60">Audit exposure from incomplete documentation</div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center"
          >
            <p className="text-2xl text-white/80 italic">
              "Healthcare providers are leaving money on the table while facing increasing audit risk"
            </p>
          </motion.div>
        </div>
      ),
    },

    {
      id: 1,
      title: "The Solution",
      subtitle: "BillSaver AI - Intelligent Documentation Analysis",
      bgGradient: "from-blue-500/20 to-purple-500/20",
      content: (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-8 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20"
            >
              <div className="text-6xl mb-4">🧠</div>
              <div className="text-2xl font-bold text-white mb-3">Clinical NLP Engine</div>
              <div className="text-white/70 leading-relaxed">
                Advanced expert system uses linguistic feature analysis to deterministically score documentation quality and completeness.
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="p-8 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20"
            >
              <div className="text-6xl mb-4">⚡</div>
              <div className="text-2xl font-bold text-white mb-3">Lightning Fast</div>
              <div className="text-white/70 leading-relaxed">
                5-minute analysis vs 45-minute manual review. Client-side processing means zero latency and 100% uptime.
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="p-8 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20"
            >
              <div className="text-6xl mb-4">💰</div>
              <div className="text-2xl font-bold text-white mb-3">Revenue Recovery</div>
              <div className="text-white/70 leading-relaxed">
                Identifies $450-750 average revenue at risk per note. Typical practice recovers $100K+ annually
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="p-8 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20"
            >
              <div className="text-6xl mb-4">🛡️</div>
              <div className="text-2xl font-bold text-white mb-3">Compliance Shield</div>
              <div className="text-white/70 leading-relaxed">
                Deterministic rule-based auditing ensures consistent application of 2024/2025 E/M coding guidelines.
              </div>
            </motion.div>
          </div>
        </div>
      ),
    },
    {
      id: 800, // Security Slide
      title: "Data Security",
      subtitle: "The 'Data Moat' Architecture",
      bgGradient: "from-slate-800 to-indigo-900",
      content: (
        <div className="space-y-12">
          <div className="flex items-center justify-between gap-4">
            {/* Raw Data */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex-1 p-6 rounded-xl bg-red-900/10 border border-red-500/20 text-center relative"
            >
              <div className="text-4xl mb-2">📄</div>
              <div className="font-bold text-red-200">Raw PHI</div>
              <div className="text-xs text-left mt-3 p-3 bg-black/20 rounded font-mono text-red-100/50 space-y-1">
                <div>PT: <span className="text-red-400 bg-red-400/10 px-1 rounded">John Doe</span></div>
                <div>DOB: <span className="text-red-400 bg-red-400/10 px-1 rounded">01/05/80</span></div>
                <div>MRN: <span className="text-red-400 bg-red-400/10 px-1 rounded">948-22</span></div>
              </div>
            </motion.div>

            {/* The Moat Processor */}
            <div className="flex flex-col items-center justify-center px-4 relative">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  boxShadow: ["0 0 20px rgba(59, 130, 246, 0.2)", "0 0 40px rgba(59, 130, 246, 0.5)", "0 0 20px rgba(59, 130, 246, 0.2)"]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="z-10 w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-3xl shadow-2xl border-4 border-blue-400"
              >
                🛡️
              </motion.div>

              {/* Flow Animation */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500/20 via-blue-500 to-green-500/20 -z-10" />
              <div className="mt-2 font-bold text-blue-400 text-sm tracking-wider">SANITIZING</div>
            </div>

            {/* Clean Data */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex-1 p-6 rounded-xl bg-green-900/10 border border-green-500/20 text-center"
            >
              <div className="text-4xl mb-2">🧠</div>
              <div className="font-bold text-green-200">AI Input</div>
              <div className="text-xs text-left mt-3 p-3 bg-black/20 rounded font-mono text-green-100/50 space-y-1">
                <div>PT: <span className="text-green-400 ml-1">[REDACTED]</span></div>
                <div>DOB: <span className="text-green-400 ml-1">[DATE]</span></div>
                <div>MRN: <span className="text-green-400 ml-1">[ID_1]</span></div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <h3 className="font-bold text-indigo-300 mb-2">Zero-Trust Client</h3>
              <p className="text-sm text-indigo-100/60">Data is anonymized locally before any processing. PHI never leaves the device buffer.</p>
            </div>
            <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <h3 className="font-bold text-indigo-300 mb-2">Ephemeral Keys</h3>
              <p className="text-sm text-indigo-100/60">Encryption keys exist only in session ram. Closing the tab instantly shreds all access.</p>
            </div>
          </motion.div>
        </div>
      ),
    },
    {
      id: 2,
      title: "The Market",
      subtitle: "$68 Billion Addressable Opportunity",
      bgGradient: "from-purple-500/20 to-pink-500/20",
      content: (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="p-8 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 text-center"
            >
              <AnimatedCounter value={4.5} decimals={1} prefix="$" suffix="T" className="text-5xl font-bold text-indigo-400 mb-2" />
              <div className="text-white/60 text-sm">US Healthcare Market</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="p-8 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-center"
            >
              <AnimatedCounter value={125} prefix="$" suffix="B" className="text-5xl font-bold text-purple-400 mb-2" />
              <div className="text-white/60 text-sm">Lost to Billing Errors</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="p-8 rounded-2xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 text-center"
            >
              <AnimatedCounter value={68} prefix="$" suffix="B" className="text-5xl font-bold text-pink-400 mb-2" />
              <div className="text-white/60 text-sm">Our Addressable Market</div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="p-8 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20"
          >
            <div className="text-center mb-6">
              <div className="text-2xl font-bold text-white mb-2">Target Customers</div>
            </div>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <AnimatedCounter value={1} prefix="" suffix="M+" className="text-4xl font-bold text-purple-400 mb-2" />
                <div className="text-white/60">Physicians</div>
              </div>
              <div>
                <AnimatedCounter value={6} prefix="" suffix="K+" className="text-4xl font-bold text-pink-400 mb-2" />
                <div className="text-white/60">Hospitals</div>
              </div>
              <div>
                <AnimatedCounter value={200} prefix="" suffix="K+" className="text-4xl font-bold text-blue-400 mb-2" />
                <div className="text-white/60">Practices</div>
              </div>
            </div>
          </motion.div>
        </div>
      ),
    },
    {
      id: 3,
      title: "The ROI",
      subtitle: "Undeniable Value Proposition",
      bgGradient: "from-green-500/20 to-emerald-500/20",
      content: (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-8 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20"
            >
              <div className="text-white/60 text-sm mb-2">Time Savings</div>
              <AnimatedCounter value={89} prefix="" suffix="%" className="text-5xl font-bold text-emerald-400 mb-4" />
              <div className="text-white/70">
                <div className="flex items-center justify-between mb-2">
                  <span>Manual Review:</span>
                  <span className="font-semibold">45 minutes</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span>BillSaver AI:</span>
                  <span className="font-semibold text-emerald-400">5 minutes</span>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <span className="text-emerald-400 font-semibold">40 minutes saved per document</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="p-8 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20"
            >
              <div className="text-white/60 text-sm mb-2">Revenue Recovery</div>
              <AnimatedCounter value={100} prefix="$" suffix="K+" className="text-5xl font-bold text-blue-400 mb-4" />
              <div className="text-white/70">
                <div className="mb-2">Average annual recovery per practice</div>
                <div className="space-y-1 text-sm">
                  <div>• $450-750 per note identified</div>
                  <div>• 15-20 notes per week typical</div>
                  <div>• 52 weeks per year</div>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-8 rounded-2xl bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 border border-yellow-500/20"
          >
            <div className="text-center">
              <div className="text-white/60 text-sm mb-2">Payback Period</div>
              <div className="text-6xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-4">
                2-3 Months
              </div>
              <div className="text-white/70 text-lg">
                Typical practice recoups investment in first quarter, then pure profit
              </div>
            </div>
          </motion.div>
        </div>
      ),
    },
    {
      id: 4,
      title: "Live Demo",
      subtitle: "See BillSaver AI in Action",
      bgGradient: "from-purple-500/20 to-pink-500/20",
      content: (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-8 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20"
          >
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎯</div>
              <div className="text-3xl font-bold text-white mb-2">Sample Analysis Results</div>
              <div className="text-white/60">Typical medical note analysis</div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-xl bg-white/5">
                <div className="text-3xl font-bold text-yellow-400 mb-1">62/100</div>
                <div className="text-white/60 text-sm">Quality Score</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/5">
                <div className="text-3xl font-bold text-red-400 mb-1">$600</div>
                <div className="text-white/60 text-sm">Revenue at Risk</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/5">
                <div className="text-3xl font-bold text-orange-400 mb-1">4</div>
                <div className="text-white/60 text-sm">Gaps Found</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/5">
                <div className="text-3xl font-bold text-emerald-400 mb-1">5 min</div>
                <div className="text-white/60 text-sm">Analysis Time</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20"
          >
            <div className="text-white font-semibold mb-4">Key Features Demonstrated:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="text-white/80">Automated gap detection</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="text-white/80">Smart template generation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="text-white/80">Revenue impact calculation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="text-white/80">Compliance risk scoring</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="text-white/80">Historical trend analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="text-white/80">Export & sharing tools</span>
              </div>
            </div>
          </motion.div>
        </div>
      ),
    },
    {
      id: 5,
      title: "Competitive Advantage",
      subtitle: "Why We Win",
      bgGradient: "from-cyan-500/20 to-blue-500/20",
      content: (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-center"
            >
              <AnimatedCounter value={89} prefix="" suffix="%" className="text-5xl font-bold text-cyan-400 mb-2" />
              <div className="text-white/60 mb-4">Faster</div>
              <div className="text-white/50 text-sm">vs manual review</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center"
            >
              <AnimatedCounter value={95} prefix="" suffix="%+" className="text-5xl font-bold text-blue-400 mb-2" />
              <div className="text-white/60 mb-4">Accurate</div>
              <div className="text-white/50 text-sm">gap detection rate</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="p-6 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center"
            >
              <AnimatedCounter value={100} prefix="$" suffix="K+" className="text-5xl font-bold text-purple-400 mb-2" />
              <div className="text-white/60 mb-4">Recovery</div>
              <div className="text-white/50 text-sm">per practice annually</div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="p-8 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-4">Moat & Defensibility</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🧠</span>
                  <div>
                    <div className="text-white font-semibold mb-1">Proprietary AI Models</div>
                    <div className="text-white/60 text-sm">Trained on millions of medical notes with continuous learning</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <div className="text-white font-semibold mb-1">Network Effects</div>
                    <div className="text-white/60 text-sm">More users = better models = higher accuracy</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔒</span>
                  <div>
                    <div className="text-white font-semibold mb-1">Data Moat</div>
                    <div className="text-white/60 text-sm">Unique dataset of documentation patterns and outcomes</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <div className="text-white font-semibold mb-1">First Mover</div>
                    <div className="text-white/60 text-sm">AI-first approach in underserved market segment</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ),
    },
    {
      id: 6,
      title: "The Ask",
      subtitle: "Join Us in Transforming Healthcare Billing",
      bgGradient: "from-yellow-500/20 to-orange-500/20",
      content: (
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="text-6xl mb-6">🚀</div>
            <div className="text-4xl font-bold text-white mb-4">
              Ready to Scale
            </div>
            <div className="text-xl text-white/70 mb-8">
              We're seeking investment to accelerate growth and capture market share
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20"
            >
              <div className="text-2xl mb-3">🎯</div>
              <div className="text-white font-semibold mb-2">Product</div>
              <div className="text-white/60 text-sm">
                Expand AI capabilities, add EHR integrations, mobile apps
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20"
            >
              <div className="text-2xl mb-3">📈</div>
              <div className="text-white font-semibold mb-2">Sales & Marketing</div>
              <div className="text-white/60 text-sm">
                Scale go-to-market, build sales team, expand market reach
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20"
            >
              <div className="text-2xl mb-3">👥</div>
              <div className="text-white font-semibold mb-2">Team</div>
              <div className="text-white/60 text-sm">
                Hire top AI engineers, healthcare experts, customer success
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="p-8 rounded-2xl bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 border border-yellow-500/20 text-center"
          >
            <div className="text-3xl font-bold text-white mb-4">
              Let's Transform Healthcare Together
            </div>
            <div className="text-white/70 text-lg">
              Join us in recovering billions in lost revenue while improving patient care
            </div>
          </motion.div>
        </div>
      ),
    },
  ];

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000); // 8 seconds per slide

    return () => clearInterval(timer);
  }, [isAutoPlaying, slides.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrentSlide((prev) => (prev + 1) % slides.length);
      if (e.key === "ArrowLeft") setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      if (e.key === " ") {
        e.preventDefault();
        setIsAutoPlaying((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, slides.length]);

  const currentSlideData = slides[currentSlide];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black"
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentSlideData.bgGradient} transition-all duration-1000`} />

      {/* Close button */}
      <button
        onClick={onClose}
        className="fixed top-6 right-6 z-[200] p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
        aria-label="Close Investor Mode"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Slide counter */}
      <div className="fixed top-6 left-6 z-[200] px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl text-white text-sm">
        {currentSlide + 1} / {slides.length}
      </div>

      {/* Auto-play indicator */}
      <button
        onClick={() => setIsAutoPlaying(!isAutoPlaying)}
        className="fixed top-6 left-32 z-[200] px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white text-sm transition-colors"
      >
        {isAutoPlaying ? "⏸️ Pause" : "▶️ Play"}
      </button>

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
        <div className="w-full max-w-6xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-12"
            >
              {/* Title */}
              <div className="text-center">
                <motion.h1
                  className="text-6xl md:text-7xl font-bold text-white mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {currentSlideData.title}
                </motion.h1>
                <motion.p
                  className="text-2xl text-white/60"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {currentSlideData.subtitle}
                </motion.p>
              </div>

              {/* Content */}
              <div>{currentSlideData.content}</div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation dots */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`transition-all ${index === currentSlide
              ? "w-12 h-3 bg-white rounded-full"
              : "w-3 h-3 bg-white/30 hover:bg-white/50 rounded-full"
              }`}
          />
        ))}
      </div>

      {/* Navigation arrows */}
      <button
        onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
        className="fixed left-6 top-1/2 -translate-y-1/2 z-10 p-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
        className="fixed right-6 top-1/2 -translate-y-1/2 z-10 p-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Keyboard hints */}
      <div className="fixed bottom-8 right-8 z-10 text-white/40 text-xs space-y-1">
        <div>← → Navigate</div>
        <div>Space: Play/Pause</div>
        <div>Esc: Exit</div>
      </div>
    </motion.div>
  );
}
