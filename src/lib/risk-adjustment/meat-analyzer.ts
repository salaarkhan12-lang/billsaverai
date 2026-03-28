/**
 * MEAT Documentation Analyzer
 * 
 * Validates that chronic conditions have proper MEAT criteria documentation
 * for Medicare Advantage HCC recapture and risk adjustment compliance.
 * 
 * MEAT = Monitoring, Evaluating, Assessing, Treating
 * 
 * Requirements:
 * - Each chronic condition must be "touched" annually with MEAT elements
 * - At least 2-3 MEAT elements recommended per condition per encounter
 * - Full MEAT documentation maximizes audit defensibility
 * 
 * Based on CMS Risk Adjustment guidelines and industry best practices
 */

// ============================================================================
// TYPES
// ============================================================================

export interface MEATElement {
    type: 'M' | 'E' | 'A' | 'T';
    name: string;
    description: string;
    detected: boolean;
    evidence: string[];  // Matched phrases from documentation
    confidence: 'high' | 'medium' | 'low';
}

export interface ConditionMEATAnalysis {
    conditionCode: string;
    conditionDescription: string;
    isHCC: boolean;
    meatElements: MEATElement[];
    meatScore: number;          // 0-4 (count of elements present)
    complianceLevel: 'complete' | 'partial' | 'insufficient' | 'missing';
    recommendations: string[];
    annualRecaptureRisk: boolean;  // True if condition may not be recaptured
}

export interface MEATAnalysisResult {
    conditions: ConditionMEATAnalysis[];
    overallMEATScore: number;   // Average across all conditions
    hccConditionsCount: number;
    compliantConditionsCount: number;
    atRiskConditionsCount: number;
    recommendations: MEATRecommendation[];
}

export interface MEATRecommendation {
    priority: 'high' | 'medium' | 'low';
    conditionCode: string;
    conditionDescription: string;
    missingElements: string[];
    suggestion: string;
    examplePhrases: string[];
}

// ============================================================================
// MEAT PATTERN DATABASE
// Comprehensive patterns for each MEAT element
// ============================================================================

interface MEATPattern {
    type: 'M' | 'E' | 'A' | 'T';
    name: string;
    description: string;
    patterns: string[];
    examplePhrases: string[];
    weight: number;  // Confidence weight (1-10)
}

export const MEAT_PATTERNS: MEATPattern[] = [
    // ============================================================================
    // M - MONITORING
    // Shows ongoing tracking and follow-up of the condition
    // ============================================================================
    {
        type: 'M',
        name: 'Monitoring',
        description: 'Ongoing tracking and follow-up of the condition',
        patterns: [
            'monitor(?:ing|ed)?',
            'follow(?:ing)?[\\s-]?up',
            'track(?:ing|ed)?',
            'check(?:ing|ed)?(?:\\s+on)?',
            'review(?:ing|ed)?(?:\\s+(?:status|progress))?',
            'surveillance',
            'watch(?:ing)?(?:\\s+closely)?',
            'recheck',
            'reassess',
            'f\\/u',
            'return\\s+(?:for|in)\\s+\\d+',
            'see\\s+(?:in|back)',
            'schedule(?:d)?\\s+(?:follow|return)',
        ],
        examplePhrases: [
            'Continue to monitor diabetes control',
            'Follow-up in 3 months with A1C',
            'Tracking blood pressure at home',
            'Will recheck labs in 6 weeks',
        ],
        weight: 8,
    },

    // ============================================================================
    // E - EVALUATING
    // Reviews data, test results, or objective findings
    // ============================================================================
    {
        type: 'E',
        name: 'Evaluating',
        description: 'Review of data, test results, or objective findings',
        patterns: [
            'evaluat(?:ed|ing|ion)',
            'results?\\s+(?:show|indicate|reveal|demonstrate)',
            'labs?\\s+(?:show|indicate|reveal|reviewed)',
            'test(?:s|ing)?\\s+(?:show|indicate|reveal)',
            'a1c\\s*(?:is|was|=|of)?\\s*\\d',
            'bp\\s*(?:is|was|=|of)?\\s*\\d{2,3}',
            'egfr\\s*(?:is|was|=|of)?\\s*\\d',
            'bmi\\s*(?:is|was|=|of)?\\s*\\d',
            'ef\\s*(?:is|was|=|of)?\\s*\\d',
            'review(?:ed)?\\s+(?:labs?|results?|imaging|echo|ekg)',
            "today(?:'s)?\\\\s+(?:labs?|results?)",
            'most\\s+recent',
            'per\\s+(?:labs?|results?|echo)',
        ],
        examplePhrases: [
            'Evaluated A1C results: 7.8%',
            'Labs show improved renal function',
            'BP is 142/88 today',
            'EF 35% per recent echo',
        ],
        weight: 9,
    },

    // ============================================================================
    // A - ASSESSING / ADDRESSING
    // Documents status, severity, or clinical judgment
    // ============================================================================
    {
        type: 'A',
        name: 'Assessing',
        description: 'Status assessment and clinical judgment of condition',
        patterns: [
            'assess(?:ed|ing|ment)?',
            'status\\s+(?:is|remains?)',
            'stable',
            'controlled',
            'uncontrolled',
            'well[\\s-]?controlled',
            'poorly[\\s-]?controlled',
            'improved',
            'worsening',
            'unchanged',
            'progressing',
            'at\\s+(?:goal|target)',
            'not\\s+at\\s+(?:goal|target)',
            'compliant',
            'non[\\s-]?compliant',
            'adherent',
            'compensated',
            'decompensated',
            'exacerbation',
            'remission',
            'mild|moderate|severe',
            'stage\\s*(?:1|2|3|4|5|i|ii|iii|iv|v)',
            'class\\s*(?:1|2|3|4|i|ii|iii|iv)',
            'nyha\\s*(?:class)?\\s*(?:1|2|3|4|i|ii|iii|iv)',
        ],
        examplePhrases: [
            'Diabetes well-controlled at goal',
            'Heart failure stable, NYHA Class II',
            'COPD status unchanged from last visit',
            'Hypertension poorly controlled, above target',
        ],
        weight: 10,
    },

    // ============================================================================
    // T - TREATING
    // Documents active management or treatment plan
    // ============================================================================
    {
        type: 'T',
        name: 'Treating',
        description: 'Active treatment or management plan',
        patterns: [
            'treat(?:ed|ing|ment)?',
            'continu(?:e|ed|ing)',
            'prescri(?:bed?|bing|ption)',
            'start(?:ed|ing)?(?:\\s+on)?',
            'add(?:ed|ing)?',
            'increas(?:e|ed|ing)',
            'decreas(?:e|ed|ing)',
            'adjust(?:ed|ing)?',
            'titrat(?:e|ed|ing)',
            'counsel(?:ed|ing)?',
            'education',
            'advised?',
            'recommend(?:ed|ation)',
            'referred?(?:\\s+to)?',
            'order(?:ed|ing)?',
            'manage(?:d|ment)?',
            'therap(?:y|ies)',
            'regimen',
            'diet',
            'exercise',
            'lifestyle',
            'goal\\s+(?:is|of)',
            'target\\s+(?:is|of)',
            'will\\s+(?:start|add|increase|continue|order)',
            'refill(?:ed)?',
            'renew(?:ed)?',
        ],
        examplePhrases: [
            'Continue metformin 1000mg BID',
            'Started lisinopril 10mg for BP control',
            'Counseled on diet and exercise',
            'Adjusted insulin regimen',
            'Referred to cardiology for further management',
        ],
        weight: 9,
    },
];

// ============================================================================
// MAIN ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Analyze MEAT documentation for a specific condition
 */
export function analyzeConditionMEAT(
    conditionCode: string,
    conditionDescription: string,
    isHCC: boolean,
    documentText: string
): ConditionMEATAnalysis {
    const lowerText = documentText.toLowerCase();
    const meatElements: MEATElement[] = [];
    let meatScore = 0;

    // Analyze each MEAT element
    for (const pattern of MEAT_PATTERNS) {
        const { detected, evidence, confidence } = detectMEATElement(
            pattern,
            lowerText,
            conditionDescription
        );

        meatElements.push({
            type: pattern.type,
            name: pattern.name,
            description: pattern.description,
            detected,
            evidence,
            confidence,
        });

        if (detected) {
            meatScore++;
        }
    }

    // Determine compliance level
    const complianceLevel = determineComplianceLevel(meatScore, isHCC);

    // Generate recommendations
    const recommendations = generateConditionRecommendations(
        conditionCode,
        conditionDescription,
        meatElements,
        isHCC
    );

    // Check annual recapture risk
    const annualRecaptureRisk = isHCC && meatScore < 2;

    return {
        conditionCode,
        conditionDescription,
        isHCC,
        meatElements,
        meatScore,
        complianceLevel,
        recommendations,
        annualRecaptureRisk,
    };
}

/**
 * Analyze MEAT documentation for all conditions in a document
 */
export function analyzeMEATCompliance(
    conditions: Array<{ code: string; description: string; isHCC: boolean }>,
    documentText: string
): MEATAnalysisResult {
    const conditionAnalyses: ConditionMEATAnalysis[] = [];
    let totalMEATScore = 0;
    let compliantCount = 0;
    let atRiskCount = 0;
    const hccConditions = conditions.filter(c => c.isHCC);

    for (const condition of conditions) {
        const analysis = analyzeConditionMEAT(
            condition.code,
            condition.description,
            condition.isHCC,
            documentText
        );

        conditionAnalyses.push(analysis);
        totalMEATScore += analysis.meatScore;

        if (analysis.complianceLevel === 'complete' || analysis.complianceLevel === 'partial') {
            compliantCount++;
        }

        if (analysis.annualRecaptureRisk) {
            atRiskCount++;
        }
    }

    // Generate overall recommendations
    const recommendations = generateOverallRecommendations(conditionAnalyses);

    return {
        conditions: conditionAnalyses,
        overallMEATScore: conditions.length > 0 ? totalMEATScore / conditions.length : 0,
        hccConditionsCount: hccConditions.length,
        compliantConditionsCount: compliantCount,
        atRiskConditionsCount: atRiskCount,
        recommendations,
    };
}

/**
 * Check if MEAT is sufficient for a single condition
 */
export function isMEATSufficient(
    documentText: string,
    minElements: number = 2
): boolean {
    const lowerText = documentText.toLowerCase();
    let detectedCount = 0;

    for (const pattern of MEAT_PATTERNS) {
        const { detected } = detectMEATElement(pattern, lowerText, '');
        if (detected) {
            detectedCount++;
        }
    }

    return detectedCount >= minElements;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function detectMEATElement(
    pattern: MEATPattern,
    lowerText: string,
    conditionContext: string
): { detected: boolean; evidence: string[]; confidence: 'high' | 'medium' | 'low' } {
    const evidence: string[] = [];
    let highConfidenceMatch = false;

    for (const p of pattern.patterns) {
        try {
            const regex = new RegExp(p, 'gi');
            const matches = lowerText.match(regex);

            if (matches) {
                // Extract surrounding context for evidence
                for (const match of matches) {
                    const index = lowerText.indexOf(match.toLowerCase());
                    if (index !== -1) {
                        const start = Math.max(0, index - 30);
                        const end = Math.min(lowerText.length, index + match.length + 30);
                        const context = lowerText.slice(start, end).trim();
                        evidence.push(`...${context}...`);

                        // Check if match is near condition context
                        if (conditionContext && context.toLowerCase().includes(conditionContext.toLowerCase().slice(0, 10))) {
                            highConfidenceMatch = true;
                        }
                    }
                }
            }
        } catch {
            // Fallback to simple includes
            if (lowerText.includes(p)) {
                evidence.push(p);
            }
        }
    }

    const detected = evidence.length > 0;
    let confidence: 'high' | 'medium' | 'low' = 'low';

    if (detected) {
        confidence = highConfidenceMatch ? 'high' : (evidence.length >= 2 ? 'medium' : 'low');
    }

    return { detected, evidence: evidence.slice(0, 3), confidence };
}

function determineComplianceLevel(
    meatScore: number,
    isHCC: boolean
): 'complete' | 'partial' | 'insufficient' | 'missing' {
    if (meatScore === 4) return 'complete';
    if (meatScore >= 2) return 'partial';
    if (meatScore === 1) return 'insufficient';
    return 'missing';
}

function generateConditionRecommendations(
    conditionCode: string,
    conditionDescription: string,
    meatElements: MEATElement[],
    isHCC: boolean
): string[] {
    const recommendations: string[] = [];
    const missingElements = meatElements.filter(e => !e.detected);

    if (missingElements.length === 0) {
        return ['MEAT documentation complete for this condition'];
    }

    for (const element of missingElements) {
        const pattern = MEAT_PATTERNS.find(p => p.type === element.type);
        if (pattern) {
            recommendations.push(
                `Add ${element.name}: ${pattern.examplePhrases[0]}`
            );
        }
    }

    if (isHCC && missingElements.length >= 3) {
        recommendations.unshift(
            '⚠️ HIGH RISK: Insufficient MEAT documentation may jeopardize HCC recapture'
        );
    }

    return recommendations;
}

function generateOverallRecommendations(
    conditions: ConditionMEATAnalysis[]
): MEATRecommendation[] {
    const recommendations: MEATRecommendation[] = [];

    // Prioritize HCC conditions with insufficient documentation
    const atRiskConditions = conditions
        .filter(c => c.isHCC && c.meatScore < 2)
        .sort((a, b) => a.meatScore - b.meatScore);

    for (const condition of atRiskConditions) {
        const missingElements = condition.meatElements
            .filter(e => !e.detected)
            .map(e => e.name);

        const pattern = MEAT_PATTERNS.find(p =>
            !condition.meatElements.find(e => e.type === p.type && e.detected)
        );

        recommendations.push({
            priority: condition.meatScore === 0 ? 'high' : 'medium',
            conditionCode: condition.conditionCode,
            conditionDescription: condition.conditionDescription,
            missingElements,
            suggestion: `Add ${missingElements.join(', ')} documentation to support HCC capture`,
            examplePhrases: pattern?.examplePhrases || [],
        });
    }

    return recommendations.slice(0, 5);  // Limit to top 5
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    MEAT_PATTERNS as MEAT_PATTERN_DATABASE,
};
