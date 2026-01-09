// Encrypted database storage for analysis history
// Migrated from localStorage to HIPAA-compliant encrypted backend storage

import type { AnalysisResult } from "./billing-rules";

export interface AnalysisHistoryItem {
  id: string;
  fileName: string;
  timestamp: number;
  result: AnalysisResult;
  documentId?: string; // Link to uploaded document if available
}

import { sessionManager } from './security/session-manager';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Track backend availability to avoid noisy console errors
let backendAvailable: boolean | null = null;
let lastCheckTime = 0;
const CHECK_INTERVAL = 30000; // Check every 30 seconds

// Check if backend is available (with caching to avoid repeated checks)
async function isBackendAvailable(): Promise<boolean> {
  // Use cached result if recent
  const now = Date.now();
  if (backendAvailable !== null && (now - lastCheckTime) < CHECK_INTERVAL) {
    return backendAvailable;
  }

  try {
    // Try a quick HEAD request to check connectivity
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 second timeout

    await fetch(`${API_BASE}/health`, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    backendAvailable = true;
    lastCheckTime = now;
    return true;
  } catch (error) {
    // Backend not available - use memory fallback
    backendAvailable = false;
    lastCheckTime = now;
    return false;
  }
}

// SECURITY FIX: Get authentication from session manager (not localStorage)
// Session is in-memory only, no disk persistence
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  const session = sessionManager.getSession();
  if (!session) return null;

  // Session ID can be used as auth token for backend
  return session.id;
}

// API helper functions
async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;

    // Add CSRF token for additional security
    const session = sessionManager.getSession();
    if (session) {
      headers['X-CSRF-Token'] = session.csrfToken;
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Get all history items from encrypted backend
export async function getAnalysisHistory(): Promise<AnalysisHistoryItem[]> {
  // Check backend availability first to avoid noisy console errors
  const available = await isBackendAvailable();
  if (!available) {
    return await getLocalStorageFallback();
  }

  try {
    const results = await apiRequest('/api/analysis-results');

    // Transform backend format to frontend format
    return results.map((item: any) => ({
      id: item.id,
      fileName: item.fileName || 'Unknown File',
      timestamp: new Date(item.createdAt).getTime(),
      result: item.result, // This will be decrypted by the backend
      documentId: item.documentId,
    }));
  } catch (error) {
    // Silently fallback to memory storage when backend is unavailable
    return await getLocalStorageFallback();
  }
}

// Save a new analysis to encrypted backend
export async function saveToHistory(fileName: string, result: AnalysisResult, documentId?: string): Promise<void> {
  // Check backend availability first to avoid noisy console errors
  const available = await isBackendAvailable();
  if (!available) {
    await saveToLocalStorageFallback(fileName, result);
    return;
  }

  try {
    await apiRequest('/api/analysis-results', {
      method: 'POST',
      body: JSON.stringify({
        result,
        fileName,
        documentId,
      }),
    });
  } catch (error) {
    // Silently fallback to memory storage when backend is unavailable
    await saveToLocalStorageFallback(fileName, result);
  }
}

// Delete a specific history item
export async function deleteHistoryItem(id: string): Promise<void> {
  // Check backend availability first to avoid noisy console errors
  const available = await isBackendAvailable();
  if (!available) {
    await deleteLocalStorageItem(id);
    return;
  }

  try {
    await apiRequest(`/api/analysis-results/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    // Silently fallback to memory storage when backend is unavailable
    await deleteLocalStorageItem(id);
  }
}

// Clear all history
export async function clearHistory(): Promise<void> {
  // Check backend availability first to avoid noisy console errors
  const available = await isBackendAvailable();
  if (!available) {
    await clearLocalStorage();
    return;
  }

  try {
    const results = await apiRequest('/api/analysis-results');
    await Promise.all(
      results.map((item: any) =>
        apiRequest(`/api/analysis-results/${item.id}`, { method: 'DELETE' })
      )
    );
  } catch (error) {
    // Silently fallback to memory storage when backend is unavailable
    await clearLocalStorage();
  }
}

// SECURITY FIX: Memory-only fallback storage (NO browser storage for PHI)
// Uses in-memory store that's automatically cleared on page unload
// This ensures HIPAA compliance - no PHI persists to disk
import { memoryStore } from './security/memory-store';

const STORAGE_KEY = "billsaver_analysis_history";
const MAX_HISTORY_ITEMS = 50;

async function getLocalStorageFallback(): Promise<AnalysisHistoryItem[]> {
  if (typeof window === "undefined") return [];

  try {
    const history = await memoryStore.get<AnalysisHistoryItem[]>(STORAGE_KEY);
    if (!history) return [];

    return history.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Failed to load fallback history:", error);
    return [];
  }
}

async function saveToLocalStorageFallback(fileName: string, result: AnalysisResult): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const history = await getLocalStorageFallback();

    const newItem: AnalysisHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fileName,
      timestamp: Date.now(),
      result,
    };

    // Remove any existing entries with the same fileName (deduplication)
    const filteredHistory = history.filter((item) => item.fileName !== fileName);

    // Add new item to beginning
    filteredHistory.unshift(newItem);

    // Keep only the most recent items
    const trimmedHistory = filteredHistory.slice(0, MAX_HISTORY_ITEMS);

    // Store in memory with tamper detection
    await memoryStore.set(STORAGE_KEY, trimmedHistory, {
      enableTamperDetection: true,
    });
  } catch (error) {
    console.error("Failed to save to fallback storage:", error);
  }
}

async function deleteLocalStorageItem(id: string): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const history = await getLocalStorageFallback();
    const filtered = history.filter((item) => item.id !== id);

    await memoryStore.set(STORAGE_KEY, filtered, {
      enableTamperDetection: true,
    });
  } catch (error) {
    console.error("Failed to delete from fallback storage:", error);
  }
}

async function clearLocalStorage(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    memoryStore.delete(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear fallback storage:", error);
  }
}

// Get history statistics
export interface HistoryStats {
  totalAnalyses: number;
  uniqueDocuments: number;
  averageScore: number;
  totalRevenueLoss: number;
  mostCommonGaps: Array<{ title: string; count: number }>;
  scoreDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
    critical: number;
  };
}

export async function getHistoryStats(): Promise<HistoryStats> {
  const history = await getAnalysisHistory();

  if (history.length === 0) {
    return {
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
    };
  }

  // Calculate average score
  const totalScore = history.reduce((sum, item) => sum + item.result.overallScore, 0);
  const averageScore = Math.round(totalScore / history.length);

  // Get unique documents (deduplicate by fileName, keep most recent)
  const uniqueFilesMap = new Map<string, AnalysisHistoryItem>();
  history.forEach((item) => {
    if (!uniqueFilesMap.has(item.fileName) ||
      item.timestamp > uniqueFilesMap.get(item.fileName)!.timestamp) {
      uniqueFilesMap.set(item.fileName, item);
    }
  });

  const uniqueDocuments = Array.from(uniqueFilesMap.values());

  // Helper to parse revenue range (e.g., "$450-750" -> 600 average)
  const parseRevenueAmount = (revenueString: string): number => {
    const numbers = revenueString.match(/\d+/g);
    if (!numbers || numbers.length === 0) return 0;

    // If it's a range, take the average
    if (numbers.length >= 2) {
      const min = parseInt(numbers[0]);
      const max = parseInt(numbers[1]);
      return Math.round((min + max) / 2);
    }

    return parseInt(numbers[0]);
  };

  // Calculate total revenue loss from UNIQUE documents only
  const totalRevenueLoss = uniqueDocuments.reduce((sum, item) => {
    const amount = parseRevenueAmount(item.result.totalPotentialRevenueLoss);
    return sum + amount;
  }, 0);

  // Count gap occurrences
  const gapCounts = new Map<string, number>();
  history.forEach((item) => {
    item.result.gaps.forEach((gap) => {
      const count = gapCounts.get(gap.title) || 0;
      gapCounts.set(gap.title, count + 1);
    });
  });

  // Get most common gaps
  const mostCommonGaps = Array.from(gapCounts.entries())
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate score distribution
  const scoreDistribution = {
    excellent: 0,
    good: 0,
    fair: 0,
    poor: 0,
    critical: 0,
  };

  history.forEach((item) => {
    const level = item.result.documentationLevel.toLowerCase() as keyof typeof scoreDistribution;
    if (level in scoreDistribution) {
      scoreDistribution[level]++;
    }
  });

  return {
    totalAnalyses: history.length,
    uniqueDocuments: uniqueDocuments.length,
    averageScore,
    totalRevenueLoss,
    mostCommonGaps,
    scoreDistribution,
  };
}

// Search history
export async function searchHistory(query: string): Promise<AnalysisHistoryItem[]> {
  const history = await getAnalysisHistory();
  const lowerQuery = query.toLowerCase();

  return history.filter((item) => {
    // Search in file name
    if (item.fileName.toLowerCase().includes(lowerQuery)) return true;

    // Search in gap titles
    if (item.result.gaps.some((gap) => gap.title.toLowerCase().includes(lowerQuery))) {
      return true;
    }

    return false;
  });
}

// Get history by date range
export async function getHistoryByDateRange(startDate: Date, endDate: Date): Promise<AnalysisHistoryItem[]> {
  const history = await getAnalysisHistory();
  const start = startDate.getTime();
  const end = endDate.getTime();

  return history.filter((item) => item.timestamp >= start && item.timestamp <= end);
}

// Export history as JSON (from backend)
export async function exportHistoryAsJSON(): Promise<string> {
  try {
    const results = await apiRequest('/api/export/analysis-results?format=json');
    return JSON.stringify(results, null, 2);
  } catch (error) {
    // Silently fallback to memory storage when backend is unavailable
    // console.error("Failed to export from backend:", error);
    const history = await getLocalStorageFallback();
    return JSON.stringify(history, null, 2);
  }
}

// Import history from JSON (to backend)
export async function importHistoryFromJSON(jsonString: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonString);

    // Send to backend import endpoint
    await apiRequest('/api/import/analysis-results', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });

    return true;
  } catch (error) {
    // Silently fallback when backend is unavailable
    // console.error("Failed to import to backend:", error);
    return false;
  }
}
