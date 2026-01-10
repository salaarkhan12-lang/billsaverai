/**
 * MDM Complexity Scoring Helpers
 * 
 * Shared utilities for MDM complexity analysis.
 * These can be expanded with more sophisticated pattern matching in the future.
 */

/**
 * Common chronic condition patterns for problem complexity scoring
 */
export const CHRONIC_CONDITIONS = [
    { pattern: /diabetes|dm(?:\s|,|\.)/i, name: 'Diabetes' },
    { pattern: /hypertension|htn(?:\s|,|\.)/i, name: 'Hypertension' },
    { pattern: /copd|chronic obstructive/i, name: 'COPD' },
    { pattern: /asthma/i, name: 'Asthma' },
    { pattern: /heart failure|chf/i, name: 'Heart Failure' },
    { pattern: /chronic kidney|ckd/i, name: 'Chronic Kidney Disease' },
    { pattern: /depression/i, name: 'Depression' },
    { pattern: /anxiety/i, name: 'Anxiety' },
    { pattern: /hyperlipidemia/i, name: 'Hyperlipidemia' },
    { pattern: /hypothyroid/i, name: 'Hypothyroidism' },
    { pattern: /atrial fibrillation|afib/i, name: 'Atrial Fibrillation' },
    { pattern: /osteoarthritis/i, name: 'Osteoarthritis' },
    { pattern: /gerd/i, name: 'GERD' },
] as const;

/**
 * High-risk condition patterns
 */
export const HIGH_RISK_CONDITIONS = [
    /emergency/i,
    /hospital admission/i,
    /life.?threatening/i,
    /malignant/i,
    /cancer/i,
    /acute.*coronary/i,
    /stroke/i,
    /sepsis/i,
] as const;

/**
 * Lab/imaging test patterns for data complexity
 */
export const LAB_PATTERNS = [
    /\bcbc\b/i,
    /\bcmp\b/i,
    /\bbmp\b/i,
    /\ba1c\b/i,
    /hemoglobin a1c/i,
    /lipid panel/i,
    /cholesterol/i,
    /urinalysis/i,
    /\bua\b/i,
    /blood work/i,
    /lab.*result/i,
] as const;

export const IMAGING_PATTERNS = [
    /x-?ray/i,
    /\bct\b/i,
    /computed tomography/i,
    /\bmri\b/i,
    /magnetic resonance/i,
    /ultrasound/i,
    /echocardiogram/i,
    /\bekg\b/i,
    /\becg\b/i,
    /electrocardiogram/i,
] as const;

/**
 * Prescription management patterns for risk complexity
 */
export const PRESCRIPTION_PATTERNS = [
    /prescri/i,
    /\brx\b/i,
    /start.*medication/i,
    /adjust.*dose/i,
    /titrat/i,
    /medication.*change/i,
] as const;

/**
 * Count pattern matches in text
 */
export function countPatternMatches(text: string, patterns: readonly RegExp[]): number {
    return patterns.filter(pattern => pattern.test(text)).length;
}

/**
 * Extract matched condition names from text
 */
export function extractConditionNames(
    text: string,
    conditions: readonly { pattern: RegExp; name: string }[]
): string[] {
    return conditions
        .filter(condition => condition.pattern.test(text))
        .map(condition => condition.name);
}
