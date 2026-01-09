/**
 * In-Memory Storage for Test Results
 * Stores analysis results for retrieval via API
 */

import type { AnalysisResult } from '../billing-rules';
import { randomBytes } from 'crypto';

export interface TestResult {
    testId: string;
    result: AnalysisResult;
    timestamp: Date;
    fileName?: string;
}

class TestStorage {
    private results: Map<string, TestResult> = new Map();
    private maxResults = 10;
    private latestTestId: string | null = null;

    /**
     * Generate a unique test ID
     */
    private generateTestId(): string {
        return `test_${randomBytes(16).toString('hex')}`;
    }

    /**
     * Store an analysis result
     * @param result - Analysis result to store
     * @param fileName - Optional file name
     * @returns Test ID
     */
    storeResult(result: AnalysisResult, fileName?: string): string {
        const testId = this.generateTestId();
        const testResult: TestResult = {
            testId,
            result,
            timestamp: new Date(),
            fileName
        };

        this.results.set(testId, testResult);
        this.latestTestId = testId;

        // Clean up old results if we exceed maxResults
        if (this.results.size > this.maxResults) {
            const oldestKey = Array.from(this.results.keys())[0];
            this.results.delete(oldestKey);
        }

        return testId;
    }

    /**
     * Get a specific test result by ID
     * @param testId - Test ID to retrieve
     * @returns Test result or null if not found
     */
    getResult(testId: string): TestResult | null {
        return this.results.get(testId) || null;
    }

    /**
     * Get the most recent test result
     * @returns Latest test result or null if no results
     */
    getLatestResult(): TestResult | null {
        if (!this.latestTestId) {
            return null;
        }
        return this.getResult(this.latestTestId);
    }

    /**
     * Clear all stored results
     */
    clearResults(): void {
        this.results.clear();
        this.latestTestId = null;
    }

    /**
     * Get all test IDs (for debugging)
     */
    getAllTestIds(): string[] {
        return Array.from(this.results.keys());
    }
}

// Singleton instance
const storage = new TestStorage();

export default storage;
