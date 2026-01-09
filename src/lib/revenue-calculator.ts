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

// ============================================================================
// INVESTOR-READY ENHANCEMENTS
// Added for transparent, credible revenue presentation
// ============================================================================

/**
 * Validation result for revenue calculations
 * Helps catch edge cases and ensure accuracy
 */
export interface ValidationResult {
    isValid: boolean;
    warnings: string[];
    errors: string[];
}

/**
 * Validate revenue calculation for accuracy and reasonableness
 * 
 * Catches edge cases like:
 * - Negative gaps (downgrades instead of upgrades)
 * - Unrealistic multipliers
 * - Missing payer data
 * - Invalid CPT codes
 * 
 * @param calc Revenue calculation to validate
 * @returns Validation result with warnings and errors
 */
export function validateRevenueCalculation(
    calc: RevenueCalculation
): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check for downgrade (potential < current)
    if (calc.perVisitGap < 0) {
        warnings.push(
            `Negative gap detected: ${calc.potentialLevel.cptCode} ($${calc.potentialLevel.payerRate}) ` +
            `is lower than ${calc.currentLevel.cptCode} ($${calc.currentLevel.payerRate}). ` +
            `This represents a downgrade, not an upgrade opportunity.`
        );
    }

    // Check for zero gap
    if (calc.perVisitGap === 0) {
        warnings.push(
            `Zero gap: ${calc.currentLevel.cptCode} and ${calc.potentialLevel.cptCode} have the same reimbursement rate.`
        );
    }

    // Check for missing payer info
    if (!calc.currentLevel.payer || calc.currentLevel.payer === 'Unknown Payer') {
        errors.push('Payer information is missing or invalid.');
    }

    // Check for unrealistic rates (sanity check)
    if (calc.currentLevel.payerRate > 1000 || calc.potentialLevel.payerRate > 1000) {
        warnings.push(
            `Unusually high reimbursement rates detected. Current: $${calc.currentLevel.payerRate}, ` +
            `Potential: $${calc.potentialLevel.payerRate}. Please verify fee schedule.`
        );
    }

    // Check for reasonable payer multiplier (should be 1.0x - 2.0x Medicare)
    const currentMultiplier = calc.currentLevel.payerRate / calc.currentLevel.baseRate;
    const potentialMultiplier = calc.potentialLevel.payerRate / calc.potentialLevel.baseRate;

    if (currentMultiplier < 0.8 || currentMultiplier > 2.0) {
        warnings.push(
            `Current payer multiplier (${currentMultiplier.toFixed(2)}x) is outside typical range (0.8x - 2.0x Medicare).`
        );
    }

    if (potentialMultiplier < 0.8 || potentialMultiplier > 2.0) {
        warnings.push(
            `Potential payer multiplier (${potentialMultiplier.toFixed(2)}x) is outside typical range (0.8x - 2.0x Medicare).`
        );
    }

    return {
        isValid: errors.length === 0,
        warnings,
        errors,
    };
}

/**
 * Detailed revenue breakdown for transparent UI display
 * Shows step-by-step calculation with context
 */
export interface RevenueBreakdown {
    currentLevel: {
        code: string;              // "99213"
        description: string;       // "Office visit, level 3 (low complexity)"
        baseRate: number;          // Medicare baseline: $93.00
        payerRate: number;         // Commercial rate: $125.55
        payerName: string;         // "Blue Cross Blue Shield"
        multiplier: number;        // 1.35x
    };
    potentialLevel: {
        code: string;              // "99214"
        description: string;       // "Office visit, level 4 (moderate complexity)"
        baseRate: number;          // Medicare baseline: $131.00
        payerRate: number;         // Commercial rate: $176.85
        multiplier: number;        // 1.35x
    };
    gap: {
        perVisit: number;          // $51.30
        annualized: number;        // $2,667.60
        percentIncrease: number;   // 29% increase
        visitsPerYear: number;     // 52 visits used in calculation
    };
    confidence: {
        score: number;             // 0.85
        percentage: string;        // "85%"
        level: 'low' | 'medium' | 'high';  // "high"
    };
    explanation: string;           // Human-readable explanation
    calculation: string;           // Step-by-step calculation
    sources: {
        medicareSchedule: string;  // "2024 Medicare Physician Fee Schedule"
        payerData: string;         // "Industry-average commercial rates"
    };
}

/**
 * Generate detailed breakdown for transparent UI display
 * 
 * Shows complete calculation with all intermediate steps
 * Perfect for investor demos and user trust building
 * 
 * @param calc Revenue calculation
 * @returns Detailed breakdown with explanations
 */
export function generateRevenueBreakdown(
    calc: RevenueCalculation
): RevenueBreakdown {
    const payer = getPayerFeeSchedule(calc.currentLevel.payer);
    const currentMultiplier = calc.currentLevel.payerRate / calc.currentLevel.baseRate;
    const potentialMultiplier = calc.potentialLevel.payerRate / calc.potentialLevel.baseRate;
    const percentIncrease = ((calc.perVisitGap / calc.currentLevel.payerRate) * 100);

    // Determine confidence level
    let confidenceLevel: 'low' | 'medium' | 'high';
    if (calc.confidence >= 0.75) confidenceLevel = 'high';
    else if (calc.confidence >= 0.50) confidenceLevel = 'medium';
    else confidenceLevel = 'low';

    // Calculate visits per year (reverse from annualized)
    const visitsPerYear = Math.round(calc.annualizedGap / calc.perVisitGap);

    return {
        currentLevel: {
            code: calc.currentLevel.cptCode,
            description: calc.currentLevel.description,
            baseRate: calc.currentLevel.baseRate,
            payerRate: calc.currentLevel.payerRate,
            payerName: payer?.payerName || 'Unknown Payer',
            multiplier: Math.round(currentMultiplier * 100) / 100,
        },
        potentialLevel: {
            code: calc.potentialLevel.cptCode,
            description: calc.potentialLevel.description,
            baseRate: calc.potentialLevel.baseRate,
            payerRate: calc.potentialLevel.payerRate,
            multiplier: Math.round(potentialMultiplier * 100) / 100,
        },
        gap: {
            perVisit: calc.perVisitGap,
            annualized: calc.annualizedGap,
            percentIncrease: Math.round(percentIncrease * 10) / 10,
            visitsPerYear,
        },
        confidence: {
            score: calc.confidence,
            percentage: `${Math.round(calc.confidence * 100)}%`,
            level: confidenceLevel,
        },
        explanation: `With proper documentation, this encounter could support CPT ${calc.potentialLevel.cptCode} ` +
            `instead of ${calc.currentLevel.cptCode}, resulting in an additional ${formatCurrency(calc.perVisitGap)} ` +
            `per visit (${calc.confidence >= 0.75 ? 'high' : calc.confidence >= 0.50 ? 'moderate' : 'low'} confidence).`,
        calculation:
            `1. Current Level: ${calc.currentLevel.cptCode}\n` +
            `   Medicare Base: ${formatCurrency(calc.currentLevel.baseRate)}\n` +
            `   ${payer?.payerShortName || 'Payer'} Rate (${currentMultiplier.toFixed(2)}x): ${formatCurrency(calc.currentLevel.payerRate)}\n\n` +
            `2. Potential Level: ${calc.potentialLevel.cptCode}\n` +
            `   Medicare Base: ${formatCurrency(calc.potentialLevel.baseRate)}\n` +
            `   ${payer?.payerShortName || 'Payer'} Rate (${potentialMultiplier.toFixed(2)}x): ${formatCurrency(calc.potentialLevel.payerRate)}\n\n` +
            `3. Revenue Gap:\n` +
            `   Per Visit: ${formatCurrency(calc.potentialLevel.payerRate)} - ${formatCurrency(calc.currentLevel.payerRate)} = ${formatCurrency(calc.perVisitGap)}\n` +
            `   Annualized: ${formatCurrency(calc.perVisitGap)} × ${visitsPerYear} visits = ${formatCurrency(calc.annualizedGap)}`,
        sources: {
            medicareSchedule: '2024 Medicare Physician Fee Schedule (National Average)',
            payerData: `${payer?.payerName || 'Commercial payer'} rates based on industry averages (${(currentMultiplier * 100).toFixed(0)}% of Medicare)`,
        },
    };
}

// ============================================================================
// PAYER COMPARISON - INVESTOR DEMO FEATURE
// Compare revenue scenarios across multiple insurance providers
// ============================================================================

/**
 * Payer comparison result for side-by-side display
 */
export interface PayerComparison {
    payerId: string;
    payerName: string;
    payerShortName: string;
    multiplier: number;
    calculation: RevenueCalculation;
    breakdown: RevenueBreakdown;
    rank: number; // 1 = highest revenue, etc.
}

/**
 * Compare revenue scenarios across multiple payers
 * 
 * Perfect for investor demos to show revenue variation across insurance providers
 * 
 * @param currentCPT Current CPT code being billed
 * @param potentialCPT Potential upgraded CPT code
 * @param payerIds Array of payer IDs to compare (defaults to top 4)
 * @param visitsPerYear Number of patient visits annually
 * @param confidence Confidence level for upgrade scenario
 * @returns Array of payer comparisons sorted by revenue (highest first)
 * 
 * @example
 * const comparison = comparePayerScenarios('99213', '99214');
 * comparison.forEach(p => {
 *   console.log(`${p.payerName}: $${p.calculation.annualizedGap}/year`);
 * });
 * // Output:
 * // Aetna: $3,456/year
 * // Blue Cross Blue Shield: $2,668/year
 * // Cigna: $2,580/year
 * // UnitedHealthcare: $2,145/year
 */
export function comparePayerScenarios(
    currentCPT: string,
    potentialCPT: string,
    payerIds: string[] = ['bcbs-national', 'uhc-national', 'aetna-national', 'cigna-national'],
    visitsPerYear: number = 52,
    confidence: number = 0.85
): PayerComparison[] {
    const comparisons: PayerComparison[] = [];

    // Calculate for each payer
    for (const payerId of payerIds) {
        try {
            const calculation = calculateRevenue({
                currentCPT,
                potentialCPT,
                payerId,
                visitsPerYear,
                confidence,
            });

            const breakdown = generateRevenueBreakdown(calculation);
            const payer = getPayerFeeSchedule(payerId);

            if (payer) {
                comparisons.push({
                    payerId,
                    payerName: payer.payerName,
                    payerShortName: payer.payerShortName,
                    multiplier: payer.rateMultiplier,
                    calculation,
                    breakdown,
                    rank: 0, // Will be set after sorting
                });
            }
        } catch (error) {
            console.warn(`Skipping payer ${payerId} due to calculation error:`, error);
        }
    }

    // Sort by annualized gap (highest first)
    comparisons.sort((a, b) => b.calculation.annualizedGap - a.calculation.annualizedGap);

    // Assign ranks
    comparisons.forEach((comp, index) => {
        comp.rank = index + 1;
    });

    return comparisons;
}

/**
 * Get summary statistics from payer comparison
 * Useful for showing "Best Case" vs "Average" vs "Worst Case"
 */
export function getPayerComparisonStats(comparisons: PayerComparison[]) {
    if (comparisons.length === 0) {
        return null;
    }

    const annualGaps = comparisons.map(c => c.calculation.annualizedGap);
    const perVisitGaps = comparisons.map(c => c.calculation.perVisitGap);

    return {
        best: {
            payer: comparisons[0].payerShortName,
            annual: Math.max(...annualGaps),
            perVisit: Math.max(...perVisitGaps),
        },
        average: {
            annual: annualGaps.reduce((sum, val) => sum + val, 0) / annualGaps.length,
            perVisit: perVisitGaps.reduce((sum, val) => sum + val, 0) / perVisitGaps.length,
        },
        worst: {
            payer: comparisons[comparisons.length - 1].payerShortName,
            annual: Math.min(...annualGaps),
            perVisit: Math.min(...perVisitGaps),
        },
        range: {
            annual: Math.max(...annualGaps) - Math.min(...annualGaps),
            perVisit: Math.max(...perVisitGaps) - Math.min(...perVisitGaps),
        },
    };
}
