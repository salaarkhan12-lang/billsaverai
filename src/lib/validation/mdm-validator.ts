/**
 * MDM-Based E/M Validator
 * 
 * Validates E/M documentation based on Medical Decision Making (MDM) complexity.
 * Uses 2021 E/M guidelines: 2 of 3 components must meet level threshold.
 * 
 * Components:
 * 1. Problem Complexity - Number and severity of problems addressed
 * 2. Data Complexity - Amount/complexity of data reviewed
 * 3. Risk - Risk of complications, morbidity, mortality
 */

import type {
    ValidationResult,
    ValidationInput,
    MDMComplexityScore,
    ClaimedCodeValidation,
} from './types';

/**
 * Main MDM validation function
 */
export function validateByMDM(input: ValidationInput): ValidationResult {
    const { documentText, claimedCode, visitType } = input;

    // Step 1: Analyze the 3 MDM components
    const problemScore = analyzeProblemComplexity(documentText);
    const dataScore = analyzeDataComplexity(documentText);
    const riskScore = analyzeRiskComplexity(documentText);

    // Step 2: Determine MDM level using 2-of-3 rule
    const mdmLevel = determineMDMLevel(problemScore, dataScore, riskScore);

    // Step 3: Map MDM level to CPT code
    const supportedLevel = mapMDMToCPT(mdmLevel, visitType);

    // Step 4: Calculate confidence
    const confidence = calculateMDMConfidence(problemScore, dataScore, riskScore);

    // Step 5: Validate against claimed code (if provided)
    const validation = claimedCode
        ? validateClaimedCode(claimedCode, supportedLevel)
        : undefined;

    // Step 6: Build result
    return {
        supportedLevel,
        confidence,
        methodology: 'mdm',
        breakdown: {
            score: mdmLevel,
            threshold: getMDMLabel(mdmLevel),
            reasoning: [
                `**MDM Level: ${getMDMLabel(mdmLevel)}** (2 of 3 components must meet)`,
                ``,
                `**Problem Complexity**: ${problemScore.label} (${problemScore.score}/4)`,
                ...problemScore.evidence.map(e => `  • ${e}`),
                ``,
                `**Data Complexity**: ${dataScore.label} (${dataScore.score}/4)`,
                ...dataScore.evidence.map(e => `  • ${e}`),
                ``,
                `**Risk Level**: ${riskScore.label} (${riskScore.score}/4)`,
                ...riskScore.evidence.map(e => `  • ${e}`),
            ],
            evidence: [
                ...problemScore.evidence,
                ...dataScore.evidence,
                ...riskScore.evidence,
            ],
        },
        validation,
    };
}

/**
 * Analyze problem complexity (number and severity of problems)
 * 
 * Scoring (2021 guidelines):
 * 1 = Straightforward: 1 self-limited/minor problem
 * 2 = Low: 2+ self-limited problems OR 1 stable chronic condition
 * 3 = Moderate: 1+ chronic with exacerbation OR 2+ stable chronic OR 1 undiagnosed new problem
 * 4 = High: 1+ chronic with severe exacerbation OR acute/chronic illness that poses threat to life/function
 */
function analyzeProblemComplexity(text: string): MDMComplexityScore {
    const evidence: string[] = [];
    let score = 1; // Start with Straightforward

    // Count chronic conditions
    const chronicPatterns = [
        /diabetes/i,
        /hypertension/i,
        /copd|chronic obstructive/i,
        /asthma/i,
        /heart failure|chf/i,
        /chronic kidney|ckd/i,
        /depression/i,
        /anxiety/i,
        /hyperlipidemia/i,
        /hypothyroid/i,
    ];

    const chronicCount = chronicPatterns.filter(pattern => pattern.test(text)).length;
    if (chronicCount > 0) {
        evidence.push(`${chronicCount} chronic condition${chronicCount > 1 ? 's' : ''} managed`);
    }

    // Check for exacerbations or progression
    const exacerbationPatterns = /exacerbat|worsen|decompens|uncontrol|poorly controlled/i;
    const hasExacerbation = exacerbationPatterns.test(text);
    if (hasExacerbation) {
        evidence.push('Condition with exacerbation or progression');
    }

    // Check for acute problems
    const acutePatterns = /acute|new onset|sudden|emergency/i;
    const hasAcute = acutePatterns.test(text);
    if (hasAcute) {
        evidence.push('Acute illness or new problem');
    }

    // Check for undiagnosed problems
    const undiagnosedPatterns = /uncertain|unclear|rule out|r\/o|differential/i;
    const hasUndiagnosed = undiagnosedPatterns.test(text);
    if (hasUndiagnosed) {
        evidence.push('Undiagnosed new problem requiring workup');
    }

    // Determine score based on findings
    if (hasExacerbation && chronicCount >= 1) {
        score = 4; // High: chronic with severe exacerbation
        evidence.push('Meets High complexity (chronic condition with exacerbation)');
    } else if (chronicCount >= 2 || hasUndiagnosed) {
        score = 3; // Moderate: 2+ chronic or undiagnosed
        evidence.push(`Meets Moderate complexity (${chronicCount >= 2 ? '2+ chronic conditions' : 'undiagnosed problem'})`);
    } else if (chronicCount === 1 || hasAcute) {
        score = 2; // Low: 1 stable chronic or acute problem
        evidence.push('Meets Low complexity (stable chronic or acute problem)');
    } else {
        score = 1; // Straightforward
        evidence.push('Meets Straightforward complexity (self-limited problem)');
    }

    return {
        score,
        label: getMDMLabel(score),
        evidence,
        confidence: chronicCount > 0 || hasAcute ? 0.8 : 0.6,
    };
}

/**
 * Analyze data complexity (amount and complexity of data reviewed)
 * 
 * Scoring (2021 guidelines):
 * 1 = Minimal: None or minimal data review
 * 2 = Limited: Review of external notes or independent historian
 * 3 = Moderate: Independent interpretation of tests OR review + ordering of tests
 * 4 = Extensive: Discussion with external providers OR independent historian + extensive review
 */
function analyzeDataComplexity(text: string): MDMComplexityScore {
    const evidence: string[] = [];
    let score = 1;

    // Category 1: Tests and imaging
    const labPatterns = /lab|blood work|cbc|cmp|a1c|lipid panel|urinalysis/i;
    const imagingPatterns = /x-ray|ct|mri|ultrasound|echocardiogram|ekg/i;
    const hasLabs = labPatterns.test(text);
    const hasImaging = imagingPatterns.test(text);

    if (hasLabs) {
        evidence.push('Laboratory results reviewed');
        score = Math.max(score, 2);
    }
    if (hasImaging) {
        evidence.push('Imaging results reviewed');
        score = Math.max(score, 2);
    }

    // Category 2: External records
    const externalRecordsPattern = /external record|outside record|previous record|records obtained/i;
    if (externalRecordsPattern.test(text)) {
        evidence.push('External records reviewed');
        score = Math.max(score, 3);
    }

    // Category 3: Ordering tests
    const orderingPattern = /ordered|will order|plan.*lab|plan.*imaging/i;
    if (orderingPattern.test(text)) {
        evidence.push('Tests ordered');
        if (hasLabs || hasImaging) {
            score = Math.max(score, 3); // Ordering + review = Moderate
        }
    }

    // Category 4: Discussion with providers
    const discussionPattern = /discussed with|consulted|spoke with(?!.*patient)/i;
    if (discussionPattern.test(text)) {
        evidence.push('Discussion with external provider');
        score = Math.max(score, 4); // High
    }

    if (evidence.length === 0) {
        evidence.push('No significant data review documented');
    }

    return {
        score,
        label: getMDMLabel(score),
        evidence,
        confidence: evidence.length > 1 ? 0.75 : 0.6,
    };
}

/**
 * Analyze risk of complications
 * 
 * Scoring (2021 guidelines):
 * 1 = Minimal: Self-care, OTC drugs
 * 2 = Low: Prescription drug management
 * 3 = Moderate: Prescription management requiring monitoring OR minor surgery
 * 4 = High: Drug therapy requiring intensive monitoring OR major surgery/invasive procedure
 */
function analyzeRiskComplexity(text: string): MDMComplexityScore {
    const evidence: string[] = [];
    let score = 1;

    // High risk indicators
    const highRiskPatterns = /emergency|hospital admission|iv medication|parenteral|controlled substance.*monitoring|major surgery/i;
    if (highRiskPatterns.test(text)) {
        evidence.push('High-risk condition or intervention');
        score = 4;
    }

    // Moderate risk: Prescription management
    const prescriptionPatterns = /prescription|rx|prescrib|medication.*adjust|start.*medication/i;
    const monitoringPatterns = /monitor|follow.?up.*lab|recheck/i;
    const hasPrescription = prescriptionPatterns.test(text);
    const hasMonitoring = monitoringPatterns.test(text);

    if (hasPrescription) {
        evidence.push('Prescription drug management');
        score = Math.max(score, 2);

        if (hasMonitoring) {
            evidence.push('Medication requiring monitoring');
            score = Math.max(score, 3);
        }
    }

    // Chronic conditions increase risk
    const chronicSevere = /heart failure|copd|ckd stage [3-5]|malignant/i;
    if (chronicSevere.test(text)) {
        evidence.push('Severe chronic illness managed');
        score = Math.max(score, 3);
    }

    if (evidence.length === 0) {
        evidence.push('Minimal risk (self-care or OTC management)');
    }

    return {
        score,
        label: getMDMLabel(score),
        evidence,
        confidence: score >= 3 ? 0.8 : 0.7,
    };
}

/**
 * Determine MDM level using 2-of-3 rule
 * Two of the three components must meet or exceed the level
 */
function determineMDMLevel(
    problem: MDMComplexityScore,
    data: MDMComplexityScore,
    risk: MDMComplexityScore
): number {
    const scores = [problem.score, data.score, risk.score].sort((a, b) => b - a);

    // Return the second-highest score (2 of 3 rule)
    return scores[1];
}

/**
 * Map MDM level to CPT code
 */
function mapMDMToCPT(mdmLevel: number, visitType: 'new' | 'established'): string {
    const codes = visitType === 'new'
        ? ['99202', '99203', '99204', '99205']  // Straightforward, Low, Moderate, High
        : ['99212', '99213', '99214', '99215'];

    return codes[mdmLevel - 1] || codes[0];
}

/**
 * Get human-readable MDM label
 */
function getMDMLabel(score: number): 'Straightforward' | 'Low' | 'Moderate' | 'High' {
    const labels: Array<'Straightforward' | 'Low' | 'Moderate' | 'High'> = ['Straightforward', 'Low', 'Moderate', 'High'];
    return labels[score - 1] || 'Straightforward';
}

/**
 * Calculate overall confidence in MDM determination
 */
function calculateMDMConfidence(
    problem: MDMComplexityScore,
    data: MDMComplexityScore,
    risk: MDMComplexityScore
): number {
    // Average confidence of all three components
    return (problem.confidence + data.confidence + risk.confidence) / 3;
}

/**
 * Validate claimed code against supported level
 */
function validateClaimedCode(
    claimedCode: string,
    supportedLevel: string
): ClaimedCodeValidation {
    const claimed = parseInt(claimedCode.substring(3, 5));
    const supported = parseInt(supportedLevel.substring(3, 5));

    const isSupported = claimed === supported;

    if (isSupported) {
        return {
            claimedCode,
            isSupported: true,
        };
    }

    // Determine type and severity of discrepancy
    const type = claimed > supported ? 'overcoding' : 'undercoding';
    const levelDiff = Math.abs(claimed - supported);

    let riskLevel: 'high' | 'medium' | 'low';
    if (type === 'overcoding' && levelDiff >= 2) {
        riskLevel = 'high';
    } else if (type === 'overcoding') {
        riskLevel = 'medium';
    } else {
        riskLevel = 'low';
    }

    return {
        claimedCode,
        isSupported: false,
        discrepancy: {
            type,
            suggestedCode: supportedLevel,
            riskLevel,
            auditRisk: type === 'overcoding'
                ? `Claimed level ${claimedCode.slice(-2)} exceeds documented MDM complexity. High audit risk.`
                : `Documented MDM supports higher level (${supportedLevel}) than claimed. Revenue opportunity.`,
        },
    };
}
