/**
 * E/M Upgrade Analyzer
 * 
 * Analyzes documentation to identify specific improvements needed
 * to achieve a higher E/M level than currently supported.
 * 
 * Key Feature: Shows what's MISSING from documentation to reach
 * the next level, with actionable recommendations.
 */

import type { ValidationResult } from './types';
import {
    PROBLEM_COMPLEXITY_CRITERIA,
    DATA_REVIEW_CRITERIA,
    RISK_CRITERIA,
    EM_THRESHOLDS,
    getEMThreshold,
    getNextHigherCode,
    checkTimeConflict,
    type ProblemCriteria,
    type DataCriteria,
    type RiskCriteria,
    type ProblemComplexityLevel,
    type DataReviewLevel,
    type RiskLevel,
} from './mdm-requirements-database';

// ============================================================================
// TYPES
// ============================================================================

export interface UpgradeOpportunity {
    currentCode: string;
    targetCode: string;
    currentLevel: string;
    targetLevel: string;
    revenueIncrease: number;
    achievable: boolean;  // True if gap can reasonably be bridged
    requirements: UpgradeRequirements;
    recommendations: UpgradeRecommendation[];
    timeConflict?: TimeConflict;
}

export interface UpgradeRequirements {
    problems: {
        currentLevel: ProblemComplexityLevel;
        requiredLevel: ProblemComplexityLevel;
        met: boolean;
        gap?: string;
    };
    data: {
        currentLevel: DataReviewLevel;
        requiredLevel: DataReviewLevel;
        met: boolean;
        gap?: string;
    };
    risk: {
        currentLevel: RiskLevel;
        requiredLevel: RiskLevel;
        met: boolean;
        gap?: string;
    };
    elementsMet: number;  // Need 2 of 3 for MDM
}

export interface UpgradeRecommendation {
    id: string;
    category: 'problem' | 'data' | 'risk';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    examplePhrases: string[];
    impact: string;
}

export interface TimeConflict {
    hasConflict: boolean;
    documentedTime?: number;
    claimedCode: string;
    supportedCode?: string;
    details: string;
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze upgrade opportunities from supported level to next higher level
 */
export function analyzeUpgradeOpportunity(
    validationResult: ValidationResult,
    documentText: string,
    claimedCode?: string
): UpgradeOpportunity | null {
    const supportedCode = validationResult.supportedLevel;
    const targetCode = getNextHigherCode(supportedCode);

    // Already at highest level
    if (!targetCode) {
        return null;
    }

    const currentThreshold = getEMThreshold(supportedCode);
    const targetThreshold = getEMThreshold(targetCode);

    if (!currentThreshold || !targetThreshold) {
        return null;
    }

    // Analyze what's needed for upgrade
    const requirements = analyzeRequirements(
        validationResult,
        documentText,
        currentThreshold,
        targetThreshold
    );

    // Generate specific recommendations
    const recommendations = generateRecommendations(
        requirements,
        documentText,
        targetThreshold
    );

    // Check for time conflicts by extracting time from document
    let timeConflict: TimeConflict | undefined;
    if (claimedCode) {
        const documentedMinutes = extractDocumentedTime(documentText);
        if (documentedMinutes > 0) {
            const conflict = checkTimeConflict(documentedMinutes, claimedCode);
            if (conflict.hasConflict) {
                timeConflict = {
                    hasConflict: true,
                    documentedTime: documentedMinutes,
                    claimedCode,
                    supportedCode: conflict.supportedCode,
                    details: conflict.details || '',
                };
            }
        }
    }

    // Calculate revenue increase (approximate)
    const revenueIncrease = calculateRevenueIncrease(supportedCode, targetCode);

    return {
        currentCode: supportedCode,
        targetCode,
        currentLevel: currentThreshold.displayName,
        targetLevel: targetThreshold.displayName,
        revenueIncrease,
        achievable: requirements.elementsMet >= 1, // Already have 1, need 1 more
        requirements,
        recommendations,
        timeConflict,
    };
}

// ============================================================================
// TIME EXTRACTION FROM DOCUMENT
// ============================================================================

/**
 * Extract documented time in minutes from document text
 */
function extractDocumentedTime(documentText: string): number {
    const lowerText = documentText.toLowerCase();

    // Common patterns for documenting time
    const patterns = [
        // "Total time: 35 minutes", "Time spent: 45 min"
        /(?:total|visit|encounter|face.?to.?face)?\s*time[:\s]+(\d+)\s*(?:min|minutes)/i,
        // "35 minutes face-to-face"
        /(\d+)\s*(?:min|minutes)\s*(?:of\s+)?(?:face.?to.?face|total|spent)/i,
        // "spent 40 minutes"
        /spent\s+(\d+)\s*(?:min|minutes)/i,
        // "45 min visit"
        /(\d+)\s*(?:min|minutes)\s*(?:visit|encounter)/i,
        // "Time with patient: 30 minutes"
        /time\s*(?:with\s*patient|spent)[:\s]+(\d+)\s*(?:min|minutes)?/i,
    ];

    for (const pattern of patterns) {
        const match = lowerText.match(pattern);
        if (match && match[1]) {
            return parseInt(match[1], 10);
        }
    }

    return 0; // No time documented
}

// ============================================================================
// REQUIREMENT ANALYSIS
// ============================================================================

function analyzeRequirements(
    validationResult: ValidationResult,
    documentText: string,
    currentThreshold: { minimumProblems: ProblemComplexityLevel; minimumData: DataReviewLevel; minimumRisk: RiskLevel },
    targetThreshold: { minimumProblems: ProblemComplexityLevel; minimumData: DataReviewLevel; minimumRisk: RiskLevel }
): UpgradeRequirements {
    const lowerText = documentText.toLowerCase();

    // Analyze current levels from validation result or document
    const problemLevel = detectProblemLevel(lowerText);
    const dataLevel = detectDataLevel(lowerText);
    const riskLevel = detectRiskLevel(lowerText);

    const problemMet = compareLevels(problemLevel, targetThreshold.minimumProblems, 'problem');
    const dataMet = compareLevels(dataLevel, targetThreshold.minimumData, 'data');
    const riskMet = compareLevels(riskLevel, targetThreshold.minimumRisk, 'risk');

    const elementsMet = [problemMet, dataMet, riskMet].filter(Boolean).length;

    return {
        problems: {
            currentLevel: problemLevel,
            requiredLevel: targetThreshold.minimumProblems,
            met: problemMet,
            gap: problemMet ? undefined : `Need ${targetThreshold.minimumProblems} complexity, have ${problemLevel}`,
        },
        data: {
            currentLevel: dataLevel,
            requiredLevel: targetThreshold.minimumData,
            met: dataMet,
            gap: dataMet ? undefined : `Need ${targetThreshold.minimumData} data, have ${dataLevel}`,
        },
        risk: {
            currentLevel: riskLevel,
            requiredLevel: targetThreshold.minimumRisk,
            met: riskMet,
            gap: riskMet ? undefined : `Need ${targetThreshold.minimumRisk} risk, have ${riskLevel}`,
        },
        elementsMet,
    };
}

function detectProblemLevel(text: string): ProblemComplexityLevel {
    // Check from highest to lowest
    for (const criteria of PROBLEM_COMPLEXITY_CRITERIA.filter(c => c.level === 'high')) {
        if (criteria.patterns.some(p => new RegExp(p, 'i').test(text))) {
            return 'high';
        }
    }
    for (const criteria of PROBLEM_COMPLEXITY_CRITERIA.filter(c => c.level === 'moderate')) {
        if (criteria.patterns.some(p => new RegExp(p, 'i').test(text))) {
            return 'moderate';
        }
    }
    for (const criteria of PROBLEM_COMPLEXITY_CRITERIA.filter(c => c.level === 'low')) {
        if (criteria.patterns.some(p => new RegExp(p, 'i').test(text))) {
            return 'low';
        }
    }
    return 'minimal';
}

function detectDataLevel(text: string): DataReviewLevel {
    let points = 0;

    for (const criteria of DATA_REVIEW_CRITERIA) {
        if (criteria.patterns.some(p => new RegExp(p, 'i').test(text))) {
            points += criteria.points;
        }
    }

    // Point thresholds based on 2021 guidelines
    if (points >= 6) return 'extensive';
    if (points >= 4) return 'moderate';
    if (points >= 2) return 'limited';
    return 'minimal';
}

function detectRiskLevel(text: string): RiskLevel {
    // Check from highest to lowest
    for (const criteria of RISK_CRITERIA.filter(c => c.level === 'high')) {
        if (criteria.patterns.some(p => new RegExp(p, 'i').test(text))) {
            return 'high';
        }
    }
    for (const criteria of RISK_CRITERIA.filter(c => c.level === 'moderate')) {
        if (criteria.patterns.some(p => new RegExp(p, 'i').test(text))) {
            return 'moderate';
        }
    }
    for (const criteria of RISK_CRITERIA.filter(c => c.level === 'low')) {
        if (criteria.patterns.some(p => new RegExp(p, 'i').test(text))) {
            return 'low';
        }
    }
    return 'minimal';
}

function compareLevels(current: string, required: string, type: 'problem' | 'data' | 'risk'): boolean {
    const levelOrders = {
        problem: ['minimal', 'low', 'moderate', 'high'],
        data: ['minimal', 'limited', 'moderate', 'extensive'],
        risk: ['minimal', 'low', 'moderate', 'high'],
    };

    const order = levelOrders[type];
    return order.indexOf(current) >= order.indexOf(required);
}

// ============================================================================
// RECOMMENDATION GENERATION
// ============================================================================

function generateRecommendations(
    requirements: UpgradeRequirements,
    documentText: string,
    targetThreshold: { minimumProblems: ProblemComplexityLevel; minimumData: DataReviewLevel; minimumRisk: RiskLevel }
): UpgradeRecommendation[] {
    const recommendations: UpgradeRecommendation[] = [];
    const lowerText = documentText.toLowerCase();

    // Problem recommendations
    if (!requirements.problems.met) {
        const problemRecs = generateProblemRecommendations(
            requirements.problems.currentLevel,
            targetThreshold.minimumProblems,
            lowerText
        );
        recommendations.push(...problemRecs);
    }

    // Data recommendations
    if (!requirements.data.met) {
        const dataRecs = generateDataRecommendations(
            requirements.data.currentLevel,
            targetThreshold.minimumData,
            lowerText
        );
        recommendations.push(...dataRecs);
    }

    // Risk recommendations
    if (!requirements.risk.met) {
        const riskRecs = generateRiskRecommendations(
            requirements.risk.currentLevel,
            targetThreshold.minimumRisk,
            lowerText
        );
        recommendations.push(...riskRecs);
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
}

function generateProblemRecommendations(
    currentLevel: ProblemComplexityLevel,
    requiredLevel: ProblemComplexityLevel,
    documentText: string
): UpgradeRecommendation[] {
    const recommendations: UpgradeRecommendation[] = [];

    // Find criteria that would meet the required level
    const eligibleCriteria = PROBLEM_COMPLEXITY_CRITERIA.filter(c => {
        const levelOrder = ['minimal', 'low', 'moderate', 'high'];
        return levelOrder.indexOf(c.level) >= levelOrder.indexOf(requiredLevel);
    });

    // Find criteria NOT already documented
    for (const criteria of eligibleCriteria) {
        const alreadyDocumented = criteria.patterns.some(p =>
            new RegExp(p, 'i').test(documentText)
        );

        if (!alreadyDocumented) {
            recommendations.push({
                id: `problem-${criteria.id}`,
                category: 'problem',
                priority: criteria.level === requiredLevel ? 'high' : 'medium',
                title: criteria.description,
                description: `Adding this would elevate your problem complexity to "${criteria.level}"`,
                examplePhrases: criteria.examples,
                impact: `Achieves ${criteria.level} problem complexity`,
            });
        }
    }

    return recommendations.slice(0, 3); // Limit to top 3
}

function generateDataRecommendations(
    currentLevel: DataReviewLevel,
    requiredLevel: DataReviewLevel,
    documentText: string
): UpgradeRecommendation[] {
    const recommendations: UpgradeRecommendation[] = [];

    // Find data elements NOT already documented
    for (const criteria of DATA_REVIEW_CRITERIA) {
        const alreadyDocumented = criteria.patterns.some(p =>
            new RegExp(p, 'i').test(documentText)
        );

        if (!alreadyDocumented && criteria.points >= 2) {
            recommendations.push({
                id: `data-${criteria.id}`,
                category: 'data',
                priority: criteria.points >= 3 ? 'high' : 'medium',
                title: criteria.description,
                description: `Adding this contributes ${criteria.points} points toward data complexity`,
                examplePhrases: criteria.examples,
                impact: `+${criteria.points} data points (category: ${criteria.category})`,
            });
        }
    }

    return recommendations.slice(0, 3);
}

function generateRiskRecommendations(
    currentLevel: RiskLevel,
    requiredLevel: RiskLevel,
    documentText: string
): UpgradeRecommendation[] {
    const recommendations: UpgradeRecommendation[] = [];

    const eligibleCriteria = RISK_CRITERIA.filter(c => {
        const levelOrder = ['minimal', 'low', 'moderate', 'high'];
        return levelOrder.indexOf(c.level) >= levelOrder.indexOf(requiredLevel);
    });

    for (const criteria of eligibleCriteria) {
        const alreadyDocumented = criteria.patterns.some(p =>
            new RegExp(p, 'i').test(documentText)
        );

        if (!alreadyDocumented) {
            recommendations.push({
                id: `risk-${criteria.id}`,
                category: 'risk',
                priority: criteria.level === requiredLevel ? 'high' : 'medium',
                title: criteria.description,
                description: `Documenting this would establish "${criteria.level}" risk level`,
                examplePhrases: criteria.examples,
                impact: `Achieves ${criteria.level} risk (category: ${criteria.category})`,
            });
        }
    }

    return recommendations.slice(0, 3);
}

// ============================================================================
// REVENUE CALCULATION
// ============================================================================

function calculateRevenueIncrease(fromCode: string, toCode: string): number {
    // Approximate Medicare 2024 rates
    const rates: Record<string, number> = {
        '99212': 55,
        '99213': 93,
        '99214': 131,
        '99215': 185,
        '99202': 76,
        '99203': 111,
        '99204': 167,
        '99205': 224,
    };

    const fromRate = rates[fromCode] || 0;
    const toRate = rates[toCode] || 0;

    return toRate - fromRate;
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export {
    checkTimeConflict,
    getNextHigherCode,
    getEMThreshold,
};
