/**
 * Revenue Calculator
 * 
 * Calculates precise revenue impact for documentation gaps.
 * Compares current billable level vs potential level with proper documentation.
 * 
 * Commercial payer rates are applied based on selected insurance company.
 */

import { getCPTCode } from './cpt-database';
import {
    calculatePayerRate,
    getPayerFeeSchedule,
    formatCurrency,
} from './payer-fee-schedules';

/**
 * Revenue calculation result
 * Contains detailed breakdown of current vs potential revenue
 */
export interface RevenueCalculation {
    currentLevel: {
        cptCode: string;
        description: string;
        baseRate: number;      // Medicare baseline
        payerRate: number;     // Commercial payer rate
        payer: string;
    };
    potentialLevel: {
        cptCode: string;
        description: string;
        baseRate: number;
        payerRate: number;
    };
    perVisitGap: number;     // Dollar gap per visit
    annualizedGap: number;   // Estimated annual revenue loss
    confidence: number;      // 0-1 scale (how confident we are in this calculation)
}

/**
 * Options for revenue calculation
 */
export interface RevenueCalculationOptions {
    currentCPT: string;        // Current billable CPT code
    potentialCPT: string;      // Potential CPT code with better documentation
    payerId: string;           // Payer identifier (e.g., "bcbs-national")
    visitsPerYear?: number;    // Estimated visits per year (default: 52)
    confidence?: number;       // Confidence in upgrade potential (default: 0.85)
}

/**
 * Calculate revenue impact of documentation gap
 * 
 * @param options Revenue calculation parameters
 * @returns Detailed revenue calculation
 * @throws Error if CPT codes are invalid
 * 
 * @example
 * ```typescript
 * const revenue = calculateRevenue({
 *   currentCPT: '99213',
 *   potentialCPT: '99214',
 *   payerId: 'bcbs-national',
 *   visitsPerYear: 52,
 *   confidence: 0.90,
 * });
 * 
 * console.log(formatCurrency(revenue.perVisitGap));  // "$51.30"
 * console.log(formatCurrency(revenue.annualizedGap)); // "$2,667.60"
 * ```
 */
export function calculateRevenue(
    options: RevenueCalculationOptions
): RevenueCalculation {
    const {
        currentCPT,
        potentialCPT,
        payerId,
        visitsPerYear = 52,  // Default: weekly patient (~1 visit/week)
        confidence = 0.85,   // Default: 85% confidence
    } = options;

    // Validate CPT codes
    const currentCode = getCPTCode(currentCPT);
    const potentialCode = getCPTCode(potentialCPT);

    if (!currentCode) {
        throw new Error(`Invalid current CPT code: ${currentCPT}`);
    }

    if (!potentialCode) {
        throw new Error(`Invalid potential CPT code: ${potentialCPT}`);
    }

    // Validate that potential is actually higher (upgrade, not downgrade)
    if (potentialCode.baseRate <= currentCode.baseRate) {
        console.warn(
            `Potential CPT ${potentialCPT} ($${potentialCode.baseRate}) is not an upgrade from ${currentCPT} ($${currentCode.baseRate})`
        );
    }

    // Validate payer
    const payer = getPayerFeeSchedule(payerId);
    if (!payer) {
        throw new Error(`Invalid payer ID: ${payerId}`);
    }

    // Calculate payer-specific rates
    const currentPayerRate = calculatePayerRate(currentCPT, payerId);
    const potentialPayerRate = calculatePayerRate(potentialCPT, payerId);

    // Calculate gaps
    const perVisitGap = potentialPayerRate - currentPayerRate;
    const annualizedGap = Math.round(perVisitGap * visitsPerYear * 100) / 100;

    return {
        currentLevel: {
            cptCode: currentCPT,
            description: currentCode.description,
            baseRate: currentCode.baseRate,
            payerRate: currentPayerRate,
            payer: payerId,
        },
        potentialLevel: {
            cptCode: potentialCPT,
            description: potentialCode.description,
            baseRate: potentialCode.baseRate,
            payerRate: potentialPayerRate,
        },
        perVisitGap,
        annualizedGap,
        confidence,
    };
}

/**
 * Calculate total revenue impact for multiple gaps
 * 
 * @param gaps Array of revenue calculations
 * @returns Total per-visit and annualized revenue loss
 */
export function calculateTotalRevenue(
    gaps: RevenueCalculation[]
): { perVisit: number; annualized: number } {
    const perVisit = gaps.reduce((sum, gap) => sum + gap.perVisitGap, 0);
    const annualized = gaps.reduce((sum, gap) => sum + gap.annualizedGap, 0);

    return {
        perVisit: Math.round(perVisit * 100) / 100,
        annualized: Math.round(annualized * 100) / 100,
    };
}

/**
 * Format revenue calculation as human-readable string
 * 
 * @param calc Revenue calculation
 * @returns Formatted string (e.g., "$51.30/visit ($2,667.60/year)")
 */
export function formatRevenueGap(calc: RevenueCalculation): string {
    return `${formatCurrency(calc.perVisitGap)}/visit (${formatCurrency(calc.annualizedGap)}/year)`;
}

/**
 * Get revenue bracket for categorization
 * Useful for UI styling (color-coding by severity)
 * 
 * @param perVisitGap Revenue gap per visit
 * @returns Severity category
 */
export function getRevenueBracket(
    perVisitGap: number
): 'minimal' | 'low' | 'medium' | 'high' | 'critical' {
    if (perVisitGap < 10) return 'minimal';
    if (perVisitGap < 30) return 'low';
    if (perVisitGap < 60) return 'medium';
    if (perVisitGap < 100) return 'high';
    return 'critical';
}

/**
 * Estimate visits per year based on patient type
 * Helper function for common scenarios
 * 
 * @param patientType Type of patient
 * @returns Estimated visits per year
 */
export function estimateVisitsPerYear(
    patientType: 'acute' | 'chronic' | 'preventive' | 'complex'
): number {
    switch (patientType) {
        case 'acute':
            return 12;       // Monthly acute visits
        case 'chronic':
            return 26;       // Bi-weekly chronic disease management
        case 'preventive':
            return 4;        // Quarterly preventive care
        case 'complex':
            return 52;       // Weekly complex chronic condition
        default:
            return 12;       // Default: monthly visits
    }
}

/**
 * BACKWARD COMPATIBILITY: Convert new RevenueCalculation to old string format
 * This allows us to populate the legacy `potentialRevenueLoss` field
 * while migrating to the new structured format
 * 
 * @param calc Revenue calculation
 * @returns Legacy string format (e.g., "$51/visit ($2,667/year)")
 */
export function toLegacyRevenueString(calc: RevenueCalculation): string {
    // Format with proper currency and labels: "$51/visit ($2,667/year)"
    const perVisit = Math.round(calc.perVisitGap);
    const annualized = Math.round(calc.annualizedGap);

    return `$${perVisit}/visit ($${annualized.toLocaleString()}/year)`;
}

/**
 * Create a revenue calculation summary for display
 * Used in UI cards and reports
 */
export interface RevenueSummary {
    current: string;           // "99213 - $125.55/visit"
    potential: string;         // "99214 - $176.85/visit"
    gap: string;              // "$51.30/visit"
    annualImpact: string;     // "$2,667.60/year"
    payer: string;            // "Blue Cross Blue Shield"
    confidence: string;       // "90% confidence"
}

/**
 * Generate human-readable revenue summary
 * 
 * @param calc Revenue calculation
 * @returns Formatted summary for display
 */
export function generateRevenueSummary(
    calc: RevenueCalculation
): RevenueSummary {
    const payer = getPayerFeeSchedule(calc.currentLevel.payer);
    const confidencePercent = Math.round(calc.confidence * 100);

    return {
        current: `${calc.currentLevel.cptCode} - ${formatCurrency(calc.currentLevel.payerRate)}/visit`,
        potential: `${calc.potentialLevel.cptCode} - ${formatCurrency(calc.potentialLevel.payerRate)}/visit`,
        gap: `${formatCurrency(calc.perVisitGap)}/visit`,
        annualImpact: `${formatCurrency(calc.annualizedGap)}/year`,
        payer: payer?.payerName || 'Unknown Payer',
        confidence: `${confidencePercent}% confidence`,
    };
}
