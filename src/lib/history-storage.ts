import type { AnalysisResult } from './billing-rules';

const STORAGE_KEY = 'analysis-history-v1';

export interface AnalysisHistoryItem {
  id: string;
  fileName: string;
  result: AnalysisResult;
  createdAt: string;
}

export function loadHistory(): AnalysisHistoryItem[] {
  if (typeof localStorage === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as AnalysisHistoryItem[];
  } catch {
    return [];
  }
}

export function saveToHistory(item: AnalysisHistoryItem) {
  const history = loadHistory();
  history.unshift(item);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
}

export function clearHistory() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getMetadataOnly(history: AnalysisHistoryItem[]) {
  return history.map(h => ({
    id: h.id,
    createdAt: h.createdAt,
    scoreBucket: h.result.documentationLevel,
  }));
}
