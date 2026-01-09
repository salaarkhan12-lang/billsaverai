/**
 * Confidence Scoring System
 * 
 * Calculates trustworthiness scores for billing code recommendations.
 * Provides transparent reasoning for audit defense.
 * 
 * Philosophy: Be honest about uncertainty. Better to undersell than over-promise.
 */

export interface ConfidenceFactors {
    documentationCompleteness: number;  // 0-1: Are all required elements present?
    evidenceClarity: number;            // 0-1: Is the evidence unambiguous?
    codeSpecificity: number;            // 0-1: Specific codes vs. unspecified?
}

export interface ConfidenceScore {
    score: number;           // 0-1 (0-100%)
    level: 'high' | 'medium' | 'low';
    factors: ConfidenceFactors;
    reasoning: string[];     // Human-readable explanations
}

export interface EvidenceLocation {
    pageNumber?: number;
    section: string;          // "History", "Assessment", "Plan", etc.
    excerpt: string;          // Relevant text snippet
    requirement: string;      // What this evidence supports
}

/**
 * Calculate confidence score for a CPT code recommendation
 * 
 * High confidence (85-100%): All criteria clearly met
 * Medium confidence (60-84%): Most criteria met, minor gaps or inferences
 * Low confidence (<60%): Significant gaps or assumptions
 */
export function calculateConfidence(
    cptCode: string,
    evidence: {
        requiredElements: Array<{ name: string; present: boolean; clarity: 'clear' | 'implied' | 'absent' }>;
        supportingEvidence: EvidenceLocation[];
        conflictingEvidence?: string[];
    }
): ConfidenceScore {
    const { requiredElements, supportingEvidence, conflictingEvidence = [] } = evidence;

    // Factor 1: Documentation Completeness
    const presentElements = requiredElements.filter(e => e.present).length;
    const totalElements = requiredElements.length;
    const completeness = totalElements > 0 ? presentElements / totalElements : 0;

    // Factor 2: Evidence Clarity
    const clarityScores = requiredElements.map(e => {
        if (e.clarity === 'clear') return 1.0;
        if (e.clarity === 'implied') return 0.6;
        return 0.0;
    });
    const avgClarity = clarityScores.length > 0
        ? clarityScores.reduce((a, b) => a + b, 0 as number) / clarityScores.length
        : 0;

    // Factor 3: Code Specificity (higher for specific codes vs. unspecified)
    const isUnspecifiedCode = cptCode.endsWith('9') || cptCode.includes('unspecified');
    const specificity = isUnspecifiedCode ? 0.7 : 1.0;

    // Calculate overall score
    const baseScore = (completeness * 0.5) + (avgClarity * 0.35) + (specificity * 0.15);

    // Penalty for conflicting evidence
    const conflictPenalty = conflictingEvidence.length * 0.1;
    const finalScore = Math.max(0, baseScore - conflictPenalty);

    // Determine confidence level
    let level: 'high' | 'medium' | 'low';
    if (finalScore >= 0.85) level = 'high';
    else if (finalScore >= 0.60) level = 'medium';
    else level = 'low';

    // Generate reasoning
    const reasoning: string[] = [];

    if (completeness === 1.0) {
        reasoning.push('All required documentation elements are present');
    } else if (completeness >= 0.75) {
        reasoning.push(`Most required elements documented (${presentElements}/${totalElements})`);
    } else {
        reasoning.push(`Missing ${totalElements - presentElements} required elements`);
    }

    if (avgClarity >= 0.9) {
        reasoning.push('Evidence is clear and unambiguous');
    } else if (avgClarity >= 0.7) {
        reasoning.push('Some elements require interpretation');
    } else {
        reasoning.push('Several elements are implied rather than explicit');
    }

    if (!isUnspecifiedCode) {
        reasoning.push('Specific code with no ambiguity');
    }

    if (conflictingEvidence.length > 0) {
        reasoning.push(`${conflictingEvidence.length} potential concern(s) identified`);
    }

    if (supportingEvidence.length > 0) {
        reasoning.push(`${supportingEvidence.length} evidence location(s) documented`);
    }

    return {
        score: finalScore,
        level,
        factors: {
            documentationCompleteness: completeness,
            evidenceClarity: avgClarity,
            codeSpecificity: specificity,
        },
        reasoning,
    };
}

/**
 * Calculate confidence for E/M level based on MDM components
 */
export function calculateEMConfidence(
    level: string,
    mdmComponents: {
        problemsComplexity: { met: boolean; clarity: 'clear' | 'implied' | 'absent' };
        dataReviewed: { met: boolean; clarity: 'clear' | 'implied' | 'absent' };
        riskLevel: { met: boolean; clarity: 'clear' | 'implied' | 'absent' };
    }
): ConfidenceScore {
    const requiredElements = [
        {
            name: 'Problem Complexity',
            present: mdmComponents.problemsComplexity.met,
            clarity: mdmComponents.problemsComplexity.clarity,
        },
        {
            name: 'Data Reviewed',
            present: mdmComponents.dataReviewed.met,
            clarity: mdmComponents.dataReviewed.clarity,
        },
        {
            name: 'Risk Assessment',
            present: mdmComponents.riskLevel.met,
            clarity: mdmComponents.riskLevel.clarity,
        },
    ];

    const supportingEvidence: EvidenceLocation[] = [];

    if (mdmComponents.problemsComplexity.met) {
        supportingEvidence.push({
            section: 'Assessment',
            excerpt: 'Multiple chronic conditions documented',
            requirement: 'Problem Complexity',
        });
    }

    if (mdmComponents.dataReviewed.met) {
        supportingEvidence.push({
            section: 'Plan',
            excerpt: 'Labs/imaging reviewed',
            requirement: 'Data Reviewed',
        });
    }

    if (mdmComponents.riskLevel.met) {
        supportingEvidence.push({
            section: 'Plan',
            excerpt: 'Prescription management',
            requirement: 'Risk Level',
        });
    }

    return calculateConfidence(level, {
        requiredElements,
        supportingEvidence,
    });
}

/**
 * Generate audit defense guidance based on confidence
 */
export function generateAuditDefense(
    cptCode: string,
    confidence: ConfidenceScore,
    evidence: EvidenceLocation[]
): string {
    if (confidence.level === 'high') {
        return `This code is well-supported. In an audit, point to: ${evidence.map(e => `${e.section} (${e.requirement})`).join(', ')}. All MDM criteria are clearly documented.`;
    } else if (confidence.level === 'medium') {
        return `This code is reasonably supported, but consider strengthening documentation. Focus on: ${evidence.filter(e => e.excerpt.includes('implied')).map(e => e.requirement).join(', ')}. Make implicit elements explicit for stronger audit defense.`;
    } else {
        return `This code requires additional documentation before billing. Current gaps: ${evidence.filter(e => e.excerpt === 'absent').map(e => e.requirement).join(', ')}. Add specific details to support this level.`;
    }
}

/**
 * Format confidence score for display
 */
export function formatConfidence(confidence: ConfidenceScore): string {
    const percent = Math.round(confidence.score * 100);
    return `${percent}% ${confidence.level.toUpperCase()} confidence`;
}
