// Batch processing utilities for BillSaver AI
// Handles sequential document analysis with progress tracking

import { parsePDF } from "./blackbox_pdf-parser";
import { analyzeDocument, type AnalysisResult } from "./billing-rules";

export interface BatchItem {
  id: string;
  file: File;
  status: "pending" | "processing" | "completed" | "error";
  result?: AnalysisResult;
  error?: string;
  progress: number;
  startTime?: number;
  endTime?: number;
}

export interface BatchProcessOptions {
  maxConcurrent: number;
  onProgress?: (item: BatchItem, overallProgress: number) => void;
  onComplete?: (results: BatchItem[]) => void;
  onError?: (item: BatchItem, error: Error) => void;
}

export class BatchProcessor {
  private activeJobs = new Map<string, BatchItem>();
  private queue: BatchItem[] = [];
  private maxConcurrent: number;
  private onProgress?: (item: BatchItem, overallProgress: number) => void;
  private onComplete?: (results: BatchItem[]) => void;
  private onError?: (item: BatchItem, error: Error) => void;
  private isProcessing = false;

  constructor(options: BatchProcessOptions) {
    this.maxConcurrent = options.maxConcurrent;
    this.onProgress = options.onProgress;
    this.onComplete = options.onComplete;
    this.onError = options.onError;
  }

  // Add items to batch processing queue
  addToQueue(files: File[]): string[] {
    const itemIds: string[] = [];

    files.forEach((file) => {
      const item: BatchItem = {
        id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        status: 'pending',
        progress: 0,
      };

      this.queue.push(item);
      itemIds.push(item.id);
    });

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return itemIds;
  }

  // Process items from queue sequentially
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const item = this.queue.shift()!;
        await this.startProcessing(item);
      }

      // All processing complete
      const allItems = Array.from(this.activeJobs.values());
      this.onComplete?.(allItems);
    } catch (error) {
      console.error('Batch processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Start processing an item
  private async startProcessing(item: BatchItem): Promise<void> {
    item.status = 'processing';
    item.startTime = Date.now();
    this.activeJobs.set(item.id, item);

    try {
      // Update progress: Starting
      item.progress = 10;
      this.onProgress?.(item, this.getOverallProgress());

      console.log(`Processing document: ${item.file.name}`);

      // Parse PDF
      const parseResult = await parsePDF(item.file);
      console.log(`PDF parsed: ${parseResult.pageCount} pages`);

      // Update progress: Parsing complete
      item.progress = 60;
      this.onProgress?.(item, this.getOverallProgress());

      // Analyze document
      const analysisResult: AnalysisResult = await analyzeDocument(parseResult);
      console.log(`Analysis complete for: ${item.file.name}`);

      // Complete processing
      item.status = 'completed';
      item.result = analysisResult;
      item.endTime = Date.now();
      item.progress = 100;

      this.onProgress?.(item, this.getOverallProgress());

    } catch (error) {
      console.error(`Error processing ${item.file.name}:`, error);
      item.status = 'error';
      item.error = error instanceof Error ? error.message : 'Unknown processing error';
      item.endTime = Date.now();
      this.onError?.(item, new Error(error instanceof Error ? error.message : 'Unknown processing error'));
    }
  }

  // Get overall progress percentage
  private getOverallProgress(): number {
    const allItems = [...this.activeJobs.values(), ...this.queue];
    if (allItems.length === 0) return 100;

    const totalProgress = allItems.reduce((sum, item) => {
      if (item.status === 'completed') return sum + 100;
      if (item.status === 'error') return sum + 100; // Count errors as complete for progress
      return sum + item.progress;
    }, 0);

    return Math.round(totalProgress / allItems.length);
  }

  // Cancel processing
  cancel(itemId?: string): void {
    if (itemId) {
      const item = this.activeJobs.get(itemId) || this.queue.find(item => item.id === itemId);
      if (item) {
        item.status = 'error';
        item.error = 'Cancelled by user';
        this.activeJobs.delete(itemId);
        this.onError?.(item, new Error('Cancelled by user'));
      }
    } else {
      // Cancel all
      this.activeJobs.forEach(item => {
        item.status = 'error';
        item.error = 'Batch cancelled by user';
        this.onError?.(item, new Error('Batch cancelled by user'));
      });
      this.activeJobs.clear();
      this.queue.length = 0;
    }
  }

  // Get current status
  getStatus(): { active: number; queued: number; completed: number; errors: number } {
    const active = this.activeJobs.size;
    const queued = this.queue.length;
    const allItems = [...this.activeJobs.values(), ...this.queue];
    const completed = allItems.filter(item => item.status === 'completed').length;
    const errors = allItems.filter(item => item.status === 'error').length;

    return { active, queued, completed, errors };
  }

  // Cleanup
  destroy(): void {
    this.activeJobs.clear();
    this.queue = [];
    this.isProcessing = false;
  }
}

// Utility function to create batch processor instance
export function createBatchProcessor(options: BatchProcessOptions): BatchProcessor {
  return new BatchProcessor(options);
}

// Batch processing statistics
export interface BatchStats {
  totalFiles: number;
  processedFiles: number;
  successRate: number;
  averageProcessingTime: number;
  totalRevenueIdentified: string;
  criticalIssuesFound: number;
  majorIssuesFound: number;
}

export function calculateBatchStats(items: BatchItem[]): BatchStats {
  const completedItems = items.filter(item => item.status === 'completed');
  const totalFiles = items.length;
  const processedFiles = completedItems.length;
  const successRate = totalFiles > 0 ? (processedFiles / totalFiles) * 100 : 0;

  const processingTimes = completedItems
    .filter(item => item.startTime && item.endTime)
    .map(item => item.endTime! - item.startTime!);

  const averageProcessingTime = processingTimes.length > 0
    ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
    : 0;

  const totalRevenue = completedItems.reduce((sum, item) => {
    if (item.result) {
      const revenue = item.result.totalPotentialRevenueLoss.match(/\$?([\d,]+)/);
      if (revenue) {
        return sum + parseFloat(revenue[1].replace(/,/g, ''));
      }
    }
    return sum;
  }, 0);

  const criticalIssues = completedItems.reduce((sum, item) => {
    if (item.result) {
      return sum + item.result.gaps.filter(gap => gap.category === 'critical').length;
    }
    return sum;
  }, 0);

  const majorIssues = completedItems.reduce((sum, item) => {
    if (item.result) {
      return sum + item.result.gaps.filter(gap => gap.category === 'major').length;
    }
    return sum;
  }, 0);

  return {
    totalFiles,
    processedFiles,
    successRate: Math.round(successRate),
    averageProcessingTime: Math.round(averageProcessingTime / 1000), // Convert to seconds
    totalRevenueIdentified: `$${totalRevenue.toLocaleString()}`,
    criticalIssuesFound: criticalIssues,
    majorIssuesFound: majorIssues,
  };
}
