"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { AnimatedCounter } from "./AnimatedCounter";
import {
  getAnalysisHistory,
  getHistoryStats,
  deleteHistoryItem,
  clearHistory,
  type AnalysisHistoryItem,
  type HistoryStats,
} from "@/lib/history-storage";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardProps {
  onClose: () => void;
  onLoadAnalysis: (item: AnalysisHistoryItem) => void;
}

type TabType = "overview" | "history";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export function Dashboard({ onClose, onLoadAnalysis }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [stats, setStats] = useState<HistoryStats>({
    totalAnalyses: 0,
    uniqueDocuments: 0,
    averageScore: 0,
    totalRevenueLoss: 0,
    mostCommonGaps: [],
    scoreDistribution: {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
      critical: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [historyData, statsData] = await Promise.all([
          getAnalysisHistory(),
          getHistoryStats(),
        ]);
        setHistory(historyData);
        setStats(statsData);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  // Generate chart data
  const trendData = useMemo(() => {
    // Helper to parse revenue string
    const parseRevenue = (val: string) => {
      if (!val) return 0;
      const numbers = val.match(/\d+/g);
      if (!numbers || numbers.length === 0) return 0;
      if (numbers.length >= 2) {
        return Math.round((parseInt(numbers[0]) + parseInt(numbers[1])) / 2);
      }
      return parseInt(numbers[0]);
    };

    // Group by date, take average score
    const grouped = history.reduce((acc, item) => {
      const date = new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
      if (!acc[date]) {
        acc[date] = { date, score: 0, count: 0, revenue: 0 };
      }
      acc[date].score += item.result.overallScore;
      acc[date].revenue += parseRevenue(item.result.totalPotentialRevenueLoss);
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, { date: string; score: number; count: number; revenue: number }>);

    return Object.values(grouped)
      .map(item => ({
        ...item,
        score: Math.round(item.score / item.count),
        revenue: Math.round(item.revenue) // Keep revenue as total for that day
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 days/entries
  }, [history]);

  const gapDistributionData = useMemo(() => {
    // Use top 5 gaps
    return stats.mostCommonGaps.slice(0, 5).map((gap) => ({
      name: gap.title,
      value: gap.count
    }));
  }, [stats]);


  // Actionable Insights
  const actionItems = useMemo(() => {
    const items = [];

    // Critical score items
    const criticalItems = history.filter(h => h.result.overallScore < 70);
    if (criticalItems.length > 0) {
      items.push({
        type: 'critical',
        title: 'Review Critical Documentation',
        description: `${criticalItems.length} documents have a score below 70. Immediate review recommended.`,
        action: 'Review Now',
        onClick: () => {
          setActiveTab('history');
          // Could implement filter set here
        }
      });
    }

    // Revenue at risk
    if (stats.totalRevenueLoss > 1000) {
      items.push({
        type: 'warning',
        title: 'High Revenue Risk Detected',
        description: `Total identified revenue risk is $${stats.totalRevenueLoss.toLocaleString()}.`,
        action: 'View Analysis',
        onClick: () => setActiveTab('history')
      });
    }

    if (items.length === 0) {
      items.push({
        type: 'success',
        title: 'All Systems Go',
        description: 'Documentation quality is looking great. Keep up the good work!',
        action: 'Scan New',
        onClick: onClose
      });
    }

    return items;
  }, [history, stats]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-7xl h-[90vh] flex flex-col rounded-3xl border border-white/10 bg-[#0f111a] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#131620]">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Command Center</h2>
              <p className="text-white/40 text-sm">Real-time practice intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex p-1 rounded-lg bg-white/5 border border-white/5">
              {(['overview', 'history'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-white/40 hover:text-white/80'
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0f]">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' ? (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-6"
              >
                {/* Top Stats Row */}
                <div className="col-span-1 md:col-span-3">
                  <GlassCard className="h-full p-6 flex flex-col justify-between overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-blue-500/20" />
                    <div>
                      <p className="text-white/40 text-sm font-medium mb-1">Overall Revenue Risk</p>
                      <h3 className="text-3xl font-bold text-white">
                        $<AnimatedCounter value={stats.totalRevenueLoss} prefix="" />
                      </h3>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-red-400 text-sm bg-red-400/10 w-fit px-2 py-1 rounded-md">
                      <span>⚠️ Action Required</span>
                    </div>
                  </GlassCard>
                </div>

                <div className="col-span-1 md:col-span-3">
                  <GlassCard className="h-full p-6 flex flex-col justify-between overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-emerald-500/20" />
                    <div>
                      <p className="text-white/40 text-sm font-medium mb-1">Avg. Quality Score</p>
                      <h3 className="text-3xl font-bold text-white">
                        <AnimatedCounter value={stats.averageScore} suffix="" />
                        <span className="text-lg text-white/40">/100</span>
                      </h3>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span>Top 15% of clinics</span>
                    </div>
                  </GlassCard>
                </div>

                <div className="col-span-1 md:col-span-6">
                  <GlassCard className="h-full p-6 relative overflow-hidden">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      Priority Action Items
                    </h3>
                    <div className="space-y-3">
                      {actionItems.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.type === 'critical' ? 'bg-red-500/20 text-red-400' :
                                item.type === 'warning' ? 'bg-orange-500/20 text-orange-400' :
                                  'bg-green-500/20 text-green-400'
                              }`}>
                              !
                            </div>
                            <div>
                              <p className="text-white font-medium text-sm">{item.title}</p>
                              <p className="text-white/40 text-xs">{item.description}</p>
                            </div>
                          </div>
                          {item.onClick && (
                            <button onClick={item.onClick} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors">
                              {item.action}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </div>

                {/* Mid Row - Charts */}
                <div className="col-span-1 md:col-span-8">
                  <GlassCard className="h-[400px] p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-white font-semibold">Quality Trend Analysis</h3>
                      <div className="flex gap-2">
                        <span className="text-xs text-blue-400 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500" /> Score
                        </span>
                        <span className="text-xs text-purple-400 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-purple-500" /> Revenue
                        </span>
                      </div>
                    </div>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                          <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis
                            dataKey="date"
                            stroke="rgba(255,255,255,0.3)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            yAxisId="left"
                            stroke="rgba(255,255,255,0.3)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 100]}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="rgba(255,255,255,0.3)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#131620', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="score"
                            stroke="#3b82f6"
                            fillOpacity={1}
                            fill="url(#colorScore)"
                            strokeWidth={2}
                          />
                          <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="revenue"
                            stroke="#8b5cf6"
                            fillOpacity={1}
                            fill="url(#colorRev)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </GlassCard>
                </div>

                <div className="col-span-1 md:col-span-4">
                  <GlassCard className="h-[400px] p-6 flex flex-col">
                    <h3 className="text-white font-semibold mb-2">Common Gaps</h3>
                    <p className="text-white/40 text-xs mb-6">Distribution of documentation issues</p>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={gapDistributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {gapDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: '#131620', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                      {gapDistributionData.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-white/60 truncate max-w-[150px]">{item.name}</span>
                          </div>
                          <span className="text-white font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <HistoryList
                  history={history}
                  onLoadAnalysis={onLoadAnalysis}
                  onDelete={async (id) => {
                    await deleteHistoryItem(id);
                    const newHistory = await getAnalysisHistory();
                    setHistory(newHistory);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

function HistoryList({ history, onLoadAnalysis, onDelete }: {
  history: AnalysisHistoryItem[],
  onLoadAnalysis: (item: AnalysisHistoryItem) => void,
  onDelete: (id: string) => Promise<void>
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = history.filter(h =>
    h.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.result.documentationLevel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">🔍</span>
          <input
            type="text"
            placeholder="Search document history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer"
            onClick={() => onLoadAnalysis(item)}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${item.result.overallScore >= 90 ? 'bg-emerald-500/20 text-emerald-400' :
                  item.result.overallScore >= 70 ? 'bg-blue-500/20 text-blue-400' :
                    item.result.overallScore >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                }`}>
                {item.result.overallScore}
              </div>
              <div>
                <h4 className="text-white font-medium">{item.fileName}</h4>
                <div className="flex items-center gap-2 text-xs text-white/40 mt-1">
                  <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{item.result.gaps.length} gaps identified</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <div className="text-xs text-white/40">Est. Loss</div>
                <div className="text-white font-medium">${item.result.totalPotentialRevenueLoss}</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this item?')) onDelete(item.id);
                }}
                className="p-2 rounded-lg hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
