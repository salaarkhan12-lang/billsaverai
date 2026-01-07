// Local API using Service Workers for EHR system integration
// Provides REST-like endpoints for external system communication

import type { AnalysisResult } from "./billing-rules";

export interface APIRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: any;
}

export interface APIResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
}

export interface AnalysisJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  fileName: string;
  submittedAt: string;
  completedAt?: string;
  result?: AnalysisResult;
  error?: string;
}

class LocalAPIService {
  private serviceWorker: ServiceWorker | null = null;
  private isRegistered = false;
  private jobs = new Map<string, AnalysisJob>();

  constructor() {
    this.initializeServiceWorker();
  }

  // Initialize Service Worker
  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/api-sw.js', {
          scope: '/api/'
        });

        this.serviceWorker = registration.active;
        this.isRegistered = true;

        console.log('Local API Service Worker registered successfully');

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event);
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
        this.fallbackToMainThread();
      }
    } else {
      console.warn('Service Workers not supported, using main thread fallback');
      this.fallbackToMainThread();
    }
  }

  // Handle messages from Service Worker
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, jobId, result, error } = event.data;

    switch (type) {
      case 'analysis_complete':
        this.updateJobStatus(jobId, 'completed', result);
        break;
      case 'analysis_error':
        this.updateJobStatus(jobId, 'failed', undefined, error);
        break;
      case 'analysis_progress':
        // Handle progress updates if needed
        break;
    }
  }

  // Fallback when Service Workers aren't available
  private fallbackToMainThread(): void {
    this.isRegistered = false;
    console.log('Using main thread for API operations');
  }

  // Update job status
  private updateJobStatus(jobId: string, status: AnalysisJob['status'], result?: AnalysisResult, error?: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = status;
      job.completedAt = new Date().toISOString();
      if (result) job.result = result;
      if (error) job.error = error;

      // Dispatch custom event for UI updates
      window.dispatchEvent(new CustomEvent('api-job-update', {
        detail: { jobId, job }
      }));
    }
  }

  // Submit document for analysis
  async submitAnalysis(file: File, options?: {
    priority?: 'low' | 'normal' | 'high';
    callbackUrl?: string;
  }): Promise<string> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const job: AnalysisJob = {
      id: jobId,
      status: 'queued',
      fileName: file.name,
      submittedAt: new Date().toISOString(),
    };

    this.jobs.set(jobId, job);

    if (this.isRegistered && this.serviceWorker) {
      // Send to Service Worker
      this.serviceWorker.postMessage({
        type: 'submit_analysis',
        jobId,
        file,
        options
      });
    } else {
      // Process in main thread
      this.processAnalysisInMainThread(jobId, file);
    }

    return jobId;
  }

  // Process analysis in main thread (fallback)
  private async processAnalysisInMainThread(jobId: string, file: File): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      job.status = 'processing';

      // Import required modules dynamically
      const { parsePDF } = await import('./blackbox_pdf-parser');
      const { analyzeDocument } = await import('./billing-rules');

      const parseResult = await parsePDF(file);
      const result = await analyzeDocument(parseResult);

      this.updateJobStatus(jobId, 'completed', result);
    } catch (error) {
      this.updateJobStatus(jobId, 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Get job status
  getJobStatus(jobId: string): AnalysisJob | null {
    return this.jobs.get(jobId) || null;
  }

  // Get all jobs
  getAllJobs(): AnalysisJob[] {
    return Array.from(this.jobs.values()).sort((a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }

  // Cancel job
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (job && (job.status === 'queued' || job.status === 'processing')) {
      job.status = 'failed';
      job.error = 'Cancelled by user';
      job.completedAt = new Date().toISOString();

      if (this.isRegistered && this.serviceWorker) {
        this.serviceWorker.postMessage({
          type: 'cancel_job',
          jobId
        });
      }

      return true;
    }
    return false;
  }

  // Batch submit multiple files
  async submitBatchAnalysis(files: File[], options?: {
    priority?: 'low' | 'normal' | 'high';
    callbackUrl?: string;
  }): Promise<string[]> {
    const jobIds: string[] = [];

    for (const file of files) {
      const jobId = await this.submitAnalysis(file, options);
      jobIds.push(jobId);

      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return jobIds;
  }

  // Get API health status
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    serviceWorker: boolean;
    activeJobs: number;
    completedJobs: number;
  } {
    const allJobs = Array.from(this.jobs.values());
    const activeJobs = allJobs.filter(job => job.status === 'processing').length;
    const completedJobs = allJobs.filter(job => job.status === 'completed').length;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (!this.isRegistered) {
      status = 'degraded';
    }

    if (activeJobs > 10) { // Arbitrary threshold
      status = 'degraded';
    }

    return {
      status,
      serviceWorker: this.isRegistered,
      activeJobs,
      completedJobs
    };
  }

  // Clean up old completed jobs (keep last 100)
  cleanupOldJobs(): void {
    const allJobs = this.getAllJobs();
    const jobsToRemove = allJobs.slice(100); // Keep only the most recent 100

    jobsToRemove.forEach(job => {
      if (job.status === 'completed' || job.status === 'failed') {
        this.jobs.delete(job.id);
      }
    });
  }

  // Export job data for backup
  exportJobData(): string {
    const jobs = Array.from(this.jobs.values());
    return JSON.stringify(jobs, null, 2);
  }

  // Import job data from backup
  importJobData(jsonData: string): void {
    try {
      const importedJobs = JSON.parse(jsonData);
      if (Array.isArray(importedJobs)) {
        importedJobs.forEach((job: AnalysisJob) => {
          this.jobs.set(job.id, job);
        });
      }
    } catch (error) {
      throw new Error('Invalid job data format');
    }
  }
}

// Service Worker script content (to be served at /api-sw.js)
export const SERVICE_WORKER_SCRIPT = `
self.addEventListener('install', (event) => {
  console.log('API Service Worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('API Service Worker activating');
  event.waitUntil(clients.claim());
});

self.addEventListener('message', async (event) => {
  const { type, jobId, file, options } = event.data;
  const client = event.source;

  switch (type) {
    case 'submit_analysis':
      try {
        // Import required modules
        const { parsePDF } = await import('./blackbox_pdf-parser.js');
        const { analyzeDocument } = await import('./billing-rules.js');

        // Process the file
        const parseResult = await parsePDF(file);
        const result = await analyzeDocument(parseResult);

        // Send result back
        client.postMessage({
          type: 'analysis_complete',
          jobId,
          result
        });
      } catch (error) {
        client.postMessage({
          type: 'analysis_error',
          jobId,
          error: error.message
        });
      }
      break;

    case 'cancel_job':
      // Handle job cancellation
      console.log('Cancelling job:', jobId);
      break;
  }
});

// Handle fetch events for API endpoints
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(event.request));
  }
});

async function handleAPIRequest(request) {
  const url = new URL(request.url);
  const method = request.method;
  const pathname = url.pathname;

  try {
    switch (pathname) {
      case '/api/health':
        return new Response(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          serviceWorker: true
        }), {
          headers: { 'Content-Type': 'application/json' }
        });

      case '/api/jobs':
        if (method === 'GET') {
          // Return job list (would need to access main thread data)
          return new Response(JSON.stringify({
            jobs: [],
            message: 'Job listing not implemented in Service Worker'
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        break;

      default:
        return new Response(JSON.stringify({
          error: 'Endpoint not found',
          availableEndpoints: ['/api/health', '/api/jobs']
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
`;

// Create and export singleton instance
export const localAPI = new LocalAPIService();

// Utility functions
export function createLocalAPI(): LocalAPIService {
  return new LocalAPIService();
}

export function isAPISupported(): boolean {
  return 'serviceWorker' in navigator;
}

export function getAPIStatus(): {
  supported: boolean;
  registered: boolean;
  healthy: boolean;
} {
  return {
    supported: isAPISupported(),
    registered: localAPI['isRegistered'],
    healthy: localAPI.getHealthStatus().status === 'healthy'
  };
}
