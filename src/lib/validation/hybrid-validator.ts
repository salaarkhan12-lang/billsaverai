/**
 * Hybrid E/M Validator (Aggregator)
 * Part of the E/M Documentation Validation System.
 * 
 * ARCHITECTURE: "Two Independent Validators + One Hybrid Aggregator"
 * 
 * Combines MDM-based and Time-based validation results with intelligent weighting.
 * This module acts as the "Hybrid Aggregator" that synthesizes results from the 
 * independent Rule-Based (MDM) and Context-Aware (Context/Time) validators.
 * 
 * Logic:
 * 1. If both MDM and Time agree → High confidence
 * 2. If Time unavailable/invalid → Use MDM only
 * 3. If they disagree → Use higher confidence result, show both
 */

import type { ValidationResult, ValidationInput } from './types';
import { validateByMDM } from './mdm-validator';
import { validateByTime } from './time-validator';

/**
 * Main hybrid validation function
 * Runs both validators and intelligently combines results
 */
export function validateHybrid(input: ValidationInput): ValidationResult {
    // Run both validators independently
    const mdmResult = validateByMDM(input);
    const timeResult = validateByTime(input);

    // Case 1: Time not available or invalid (confidence = 0)
    if (timeResult.confidence === 0) {
        return {
            ...mdmResult,
            methodology: 'hybrid',
            breakdown: {
                ...mdmResult.breakdown,
                reasoning: [
                    '**Methodology: MDM-Based** (time not documented or counseling <50%)',
                    '',
                    ...mdmResult.breakdown.reasoning,
                ],
            },
        };
    }

    // Case 2: Both validators agree on supported level
    if (mdmResult.supportedLevel === timeResult.supportedLevel) {
        const combinedConfidence = Math.max(mdmResult.confidence, timeResult.confidence);

        return {
            ...mdmResult,
            methodology: 'hybrid',
            confidence: combinedConfidence,
            breakdown: {
                ...mdmResult.breakdown,
                reasoning: [
                    `**✓ MDM and Time validation AGREE → ${mdmResult.supportedLevel}**`,
                    `Combined confidence: ${(combinedConfidence * 100).toFixed(0)}%`,
                    '',
                    '**MDM Analysis:**',
                    ...mdmResult.breakdown.reasoning.map(r => `  ${r}`),
                    '',
                    '**Time Analysis:**',
                    ...timeResult.breakdown.reasoning.map(r => `  ${r}`),
                ],
                evidence: [
                    ...mdmResult.breakdown.evidence,
                    ...timeResult.breakdown.evidence,
                ],
            },
            validation: mdmResult.validation || timeResult.validation,
        };
    }

    // Case 3: Disagreement - use higher confidence, show both
    const primary = mdmResult.confidence >= timeResult.confidence ? mdmResult : timeResult;
    const secondary = primary === mdmResult ? timeResult : mdmResult;
    const primaryMethod = primary.methodology.toUpperCase();
    const secondaryMethod = secondary.methodology.toUpperCase();

    return {
        ...primary,
        methodology: 'hybrid',
        breakdown: {
            ...primary.breakdown,
            reasoning: [
                `**Primary: ${primaryMethod}-Based → ${primary.supportedLevel}** (${(primary.confidence * 100).toFixed(0)}% confidence)`,
                ...primary.breakdown.reasoning.map(r => `  ${r}`),
                '',
                `**Alternative: ${secondaryMethod}-Based → ${secondary.supportedLevel}** (${(secondary.confidence * 100).toFixed(0)}% confidence)`,
                ...secondary.breakdown.reasoning.map(r => `  ${r}`),
                '',
                '**Recommendation**: Use primary method unless provider explicitly documented time for counseling-dominant visit.',
            ],
            evidence: [
                ...primary.breakdown.evidence,
                ...secondary.breakdown.evidence,
            ],
        },
        validation: primary.validation || secondary.validation,
    };
}

/**
 * Convenience function to get just the supported level
 * Useful when you only need the code without full breakdown
 */
export function getSupportedLevel(input: ValidationInput): string {
    const result = validateHybrid(input);
    return result.supportedLevel;
}

/**
 * Check if a claimed code is supported by documentation
 * Returns true if supported, false with reason if not
 */
export function isClaimedCodeSupported(
    documentText: string,
    claimedCode: string,
    visitType: 'new' | 'established'
): { isSupported: boolean; reason?: string; suggestedCode?: string } {
    const result = validateHybrid({
        documentText,
        claimedCode,
        visitType,
    });

    if (result.validation?.isSupported) {
        return { isSupported: true };
    }

    return {
        isSupported: false,
        reason: result.validation?.discrepancy?.auditRisk,
        suggestedCode: result.validation?.discrepancy?.suggestedCode,
    };
}
