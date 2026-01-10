/**
 * E/M Documentation Validation System - Shared Types
 * 
 * This module defines the common interfaces used by all validators (MDM, Time, Hybrid).
 * By using a shared contract, validators can work independently or be combined without code rewrite.
 */

/**
 * Standard validation result - all validators return this interface
 */
export interface ValidationResult {
    /**
     * What E/M level does the documentation support?
     * e.g., '99214', '99205'
     */
    supportedLevel: string;

    /**
     * Confidence in this determination (0-1)
     * Higher = more certain the documentation supports this level
     */
    confidence: number;

    /**
     * How was this determined?
     */
    methodology: 'mdm' | 'time' | 'hybrid';

    /**
     * Detailed breakdown of how we arrived at this determination
     */
    breakdown: ValidationBreakdown;

    /**
     * Optional: Validation against a claimed code
     * Only present if claimedCode was provided in input
     */
    validation?: ClaimedCodeValidation;
}

/**
 * Detailed breakdown of validation reasoning
 */
export interface ValidationBreakdown {
    /**
     * Raw score used for determination
     * For MDM: average of problem/data/risk scores (0-4)
     * For Time: total minutes documented
     */
    score: number;

    /**
     * Human-readable threshold that was met
     * For MDM: 'Straightforward', 'Low', 'Moderate', 'High'
     * For Time: '30-44 minutes', etc.
     */
    threshold: string;

    /**
     * Step-by-step reasoning for audit trail
     * e.g., ["Problem complexity: Moderate", "Data complexity: Limited", ...]
     */
    reasoning: string[];

    /**
     * Specific documentation snippets that support this determination
     * e.g., ["3 chronic conditions managed", "Lab results reviewed", ...]
     */
    evidence: string[];
}

/**
 * Validation of claimed code against supported level
 */
export interface ClaimedCodeValidation {
    /**
     * The code claimed in the documentation
     */
    claimedCode: string;

    /**
     * Does documentation support the claimed code?
     */
    isSupported: boolean;

    /**
     * If not supported, details about the discrepancy
     */
    discrepancy?: CodeDiscrepancy;
}

/**
 * Details when claimed code doesn't match supported level
 */
export interface CodeDiscrepancy {
    /**
     * Type of issue
     * - overcoding: Claimed higher than supported (audit risk)
     * - undercoding: Claimed lower than supported (revenue loss)
     */
    type: 'overcoding' | 'undercoding';

    /**
     * What code should be used based on documentation
     */
    suggestedCode: string;

    /**
     * Severity of audit risk
     * - high: Significant overcoding, likely to be flagged
     * - medium: Moderate discrepancy
     * - low: Minor issue or undercoding
     */
    riskLevel: 'high' | 'medium' | 'low';

    /**
     * Human-readable audit risk explanation
     */
    auditRisk: string;

    /**
     * Revenue impact of the discrepancy
     */
    revenueImpact?: {
        claimed: number;    // Revenue from claimed code
        supported: number;  // Revenue from supported code
        difference: number; // Positive = lost revenue, Negative = audit risk
    };
}

/**
 * Input for all validators
 */
export interface ValidationInput {
    /**
     * Full text of the clinical documentation
     */
    documentText: string;

    /**
     * Optional: E/M code claimed in the documentation
     * If provided, validator will check if documentation supports it
     */
    claimedCode?: string;

    /**
     * Type of visit (affects CPT code mapping)
     */
    visitType: 'new' | 'established';
}

/**
 * MDM Complexity Score (used internally by MDM validator)
 */
export interface MDMComplexityScore {
    /**
     * Numeric score (1-4)
     * 1 = Straightforward, 2 = Low, 3 = Moderate, 4 = High
     */
    score: number;

    /**
     * Human-readable label
     */
    label: 'Straightforward' | 'Low' | 'Moderate' | 'High';

    /**
     * Evidence found in documentation
     */
    evidence: string[];

    /**
     * Confidence in this score (0-1)
     */
    confidence: number;
}

/**
 * Time Documentation Data (used internally by Time validator)
 */
export interface TimeDocumentation {
    /**
     * Total time in minutes
     */
    minutes: number;

    /**
     * Where time was documented (for audit trail)
     */
    evidence: string[];

    /**
     * Was time explicitly stated or inferred?
     */
    explicit: boolean;

    /**
     * Is counseling/coordination >50% of visit?
     * Required for time-based billing
     */
    counselingDominant: boolean;

    /**
     * Evidence of counseling dominance
     */
    counselingEvidence: string[];
}

/**
 * E/M Level Thresholds (for mapping complexity to CPT codes)
 */
export const EM_LEVEL_THRESHOLDS = {
    mdm: {
        1: 'Straightforward',    // 99202/99212
        2: 'Low',                // 99203/99213
        3: 'Moderate',           // 99204/99214
        4: 'High',               // 99205/99215
    },
    time: {
        new: {
            99202: { min: 15, max: 29 },
            99203: { min: 30, max: 44 },
            99204: { min: 45, max: 59 },
            99205: { min: 60, max: 74 },
        },
        established: {
            99212: { min: 10, max: 19 },
            99213: { min: 20, max: 29 },
            99214: { min: 30, max: 39 },
            99215: { min: 40, max: 54 },
        },
    },
} as const;
