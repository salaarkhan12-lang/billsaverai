/**
 * MIPS (Merit-based Incentive Payment System) Database & Analyzer
 * 
 * Analyzes documentation for MIPS quality measure compliance and
 * projects potential payment adjustments.
 * 
 * Key Features:
 * - Quality measure detection from documentation
 * - Section-aware analysis (excludes Family History, Social History)
 * - Score projection (0-100)
 * - Payment adjustment calculation (-9% to +9%)
 * - Measure-specific recommendations
 * 
 * Based on CMS Quality Payment Program (QPP) 2024 specifications
 */

import { detectSections } from '../extraction/section-detector';

// ============================================================================
// TYPES
// ============================================================================

export interface MIPSMeasure {
    measureId: string;           // e.g., "001", "236"
    title: string;
    description: string;
    category: 'quality' | 'improvement_activity' | 'promoting_interoperability' | 'cost';
    specialty: string[];         // Applicable specialties
    conditions: string[];        // ICD-10 codes that make this measure applicable
    numeratorPatterns: string[]; // Patterns indicating measure is met
    denominatorPatterns: string[]; // Patterns indicating measure applies
    exclusionPatterns: string[]; // Patterns for exclusions
    benchmark: string;           // Target for high performance
    maxPoints: number;
    highPerformanceThreshold: number;
}

export interface MIPSMeasureResult {
    measure: MIPSMeasure;
    isApplicable: boolean;
    isMet: boolean;
    isExcluded: boolean;
    evidence: string[];
    points: number;
    recommendation: string;
}

export interface MIPSAnalysisResult {
    applicableMeasures: MIPSMeasureResult[];
    projectedScore: number;      // 0-100
    performanceCategory: 'exceptional' | 'high' | 'moderate' | 'low' | 'insufficient';
    paymentAdjustment: number;   // -9% to +9%
    recommendations: MIPSRecommendation[];
    categoryScores: {
        quality: number;
        improvementActivity: number;
        promotingInteroperability: number;
        cost: number;
    };
}

export interface MIPSRecommendation {
    priority: 'high' | 'medium' | 'low';
    measureId: string;
    title: string;
    action: string;
    impact: string;
    exampleDocumentation: string[];
}

// ============================================================================
// MIPS QUALITY MEASURES DATABASE
// Priority measures for primary care
// ============================================================================

export const MIPS_MEASURES: MIPSMeasure[] = [
    // ============================================================================
    // #001 - Diabetes: Hemoglobin A1c Poor Control (> 9%)
    // High-priority measure for diabetic patients
    // ============================================================================
    {
        measureId: '001',
        title: 'Diabetes: Hemoglobin A1c Poor Control (> 9%)',
        description: 'Percentage of patients 18-75 years of age with diabetes who had hemoglobin A1c > 9.0% during the measurement period',
        category: 'quality',
        specialty: ['Family Medicine', 'Internal Medicine', 'Endocrinology'],
        conditions: ['E11', 'E11.9', 'E11.65', 'E10', 'E10.9'],
        numeratorPatterns: [
            // Note: This is an INVERSE measure - LOWER is better
            // Numerator = patients with A1c > 9% (poor control)
            'a1c\\s*(?:<|less|below|=|of)?\\s*(?:[0-8]|8\\.\\d|9\\.0)',
            'a1c\\s+(?:at|within|in)\\s+(?:goal|target|control)',
            'well[\\s-]?controlled\\s+(?:diabetes|dm)',
            'diabetes.*(?:good|excellent)\\s+control',
            'hemoglobin\\s+a1c\\s*(?:<|less)?\\s*9',
        ],
        denominatorPatterns: [
            'diabetes',
            'dm\\s+type\\s*(?:1|2|i|ii)',
            'type\\s*(?:1|2)\\s+diabetes',
            'diabetic',
            'a1c',
        ],
        exclusionPatterns: [
            'hospice',
            'palliative\\s+care',
            'end\\s+stage\\s+renal',
            'esrd',
        ],
        benchmark: 'A1c ≤ 9% (lower percentage = better performance)',
        maxPoints: 10,
        highPerformanceThreshold: 85,  // % of patients at goal
    },

    // ============================================================================
    // #236 - Controlling High Blood Pressure
    // Essential hypertension management measure
    // ============================================================================
    {
        measureId: '236',
        title: 'Controlling High Blood Pressure',
        description: 'Percentage of patients 18-85 years of age who had a diagnosis of hypertension (HTN) and whose blood pressure was adequately controlled (<140/90) during the measurement period',
        category: 'quality',
        specialty: ['Family Medicine', 'Internal Medicine', 'Cardiology'],
        conditions: ['I10', 'I11', 'I12', 'I13'],
        numeratorPatterns: [
            'bp\\s*(?:of|is|was|=)?\\s*(?:1[0-3]\\d|\\d{2})\\/(?:[0-8]\\d)',
            '(?:blood\\s+pressure|bp).*(?:controlled|at\\s+goal)',
            '(?:blood\\s+pressure|bp)\\s*(?:<|less|below)\\s*140\\/90',
            'hypertension.*controlled',
            'blood\\s+pressure\\s+(?:1[0-3]\\d|\\d{2})\\/(?:[0-8]\\d)',
            // Separate systolic/diastolic patterns
            'systolic.*(?:less|below|under|<)\\s*(?:130|140)',
            'diastolic.*(?:less|below|under|<)\\s*(?:80|90)',
            'systolic\\s+(?:blood\\s+)?pressure.*\\d{2,3}',
            'diastolic\\s+(?:blood\\s+)?pressure.*\\d{2,3}',
        ],
        denominatorPatterns: [
            'hypertension',
            'htn',
            'elevated\\s+(?:blood\\s+)?pressure',
            'high\\s+blood\\s+pressure',
        ],
        exclusionPatterns: [
            'esrd',
            'hospice',
            'pregnancy',
            'pregnant',
        ],
        benchmark: 'BP < 140/90 mmHg',
        maxPoints: 10,
        highPerformanceThreshold: 72,
    },

    // ============================================================================
    // #317 - Preventive Care and Screening: Screening for High Blood Pressure
    // ============================================================================
    {
        measureId: '317',
        title: 'Preventive Care and Screening: Screening for High Blood Pressure and Follow-Up Documented',
        description: 'Percentage of patients aged 18 years and older seen during the reporting period who were screened for high blood pressure AND a recommended follow-up plan is documented',
        category: 'quality',
        specialty: ['Family Medicine', 'Internal Medicine', 'General Practice'],
        conditions: [], // Applies to all adult visits
        numeratorPatterns: [
            'bp\\s*(?:of|is|was|=)?\\s*\\d{2,3}\\/\\d{2,3}',
            'blood\\s+pressure\\s+(?:taken|recorded|measured|checked)',
            'vital\\s+signs.*bp',
            'bp\\s+\\d{2,3}\\/\\d{2,3}',
            '(?:follow[\\s-]?up|f\\/u).*(?:bp|blood\\s+pressure|hypertension)',
        ],
        denominatorPatterns: [
            'adult',
            'patient',
            'visit',
        ],
        exclusionPatterns: [
            'medical\\s+reason.*not\\s+(?:take|check)',
            'patient\\s+(?:declined|refused)',
        ],
        benchmark: 'BP documented with follow-up plan if elevated',
        maxPoints: 10,
        highPerformanceThreshold: 90,
    },

    // ============================================================================
    // #497 - Preventive Care and Screening: Preventive Care Composite
    // Covers multiple preventive services (simplified component tracking)
    // ============================================================================
    {
        measureId: '497-BMI',
        title: 'Preventive Care: BMI Screening and Follow-Up',
        description: 'Percentage of patients aged 18 and older with a BMI documented and if BMI is outside normal parameters, a follow-up plan documented',
        category: 'quality',
        specialty: ['Family Medicine', 'Internal Medicine'],
        conditions: [],
        numeratorPatterns: [
            'bmi\\s*(?:of|is|=)?\\s*\\d{2}',
            'body\\s+mass\\s+index',
            'height.*weight',
            'weight.*height',
            'weight\\s+management',
            'diet\\s+(?:counseling|education)',
            'nutritional\\s+counseling',
        ],
        denominatorPatterns: [
            'adult',
            'patient',
        ],
        exclusionPatterns: [
            'pregnant',
            'pregnancy',
            'terminal',
        ],
        benchmark: 'BMI documented with follow-up if abnormal',
        maxPoints: 10,
        highPerformanceThreshold: 88,
    },
    {
        measureId: '497-TOBACCO',
        title: 'Preventive Care: Tobacco Use Screening and Cessation',
        description: 'Percentage of patients aged 18 and older screened for tobacco use and provided cessation counseling if needed',
        category: 'quality',
        specialty: ['Family Medicine', 'Internal Medicine'],
        conditions: [],
        numeratorPatterns: [
            'tobacco\\s+(?:screening|screen|use|status)',
            '(?:smoking|smoker|smokes)\\s+(?:status|history)',
            'non[\\s-]?smoker',
            'former\\s+smoker',
            'cessation\\s+(?:counseling|resources|advice)',
            'quit(?:ting)?\\s+(?:smoking|tobacco)',
            'smoke[\\s-]?free',
            'tobacco\\s+(?:use|dependence)\\s+(?:counseled|addressed)',
            // Never smoked patterns
            'never\\s+smok(?:ed|er|es)?',
            'never\\s+(?:used\\s+)?tobacco',
            'denies\\s+(?:tobacco|smoking)',
            'no\\s+(?:tobacco|smoking)\\s+(?:use|history)',
            'does\\s+not\\s+(?:smoke|use\\s+tobacco)',
            'not\\s+a\\s+smoker',
        ],
        denominatorPatterns: [
            'adult',
            'patient',
        ],
        exclusionPatterns: [],
        benchmark: 'Tobacco use documented with cessation if applicable',
        maxPoints: 10,
        highPerformanceThreshold: 90,
    },
    {
        measureId: '497-DEPRESSION',
        title: 'Preventive Care: Depression Screening and Follow-Up',
        description: 'Percentage of patients aged 12 and older screened for depression and with follow-up plan documented if positive',
        category: 'quality',
        specialty: ['Family Medicine', 'Internal Medicine', 'Psychiatry'],
        conditions: [],
        numeratorPatterns: [
            '(?:phq|depression)\\s*(?:-?\\d|screen)',
            'depression\\s+(?:screen|screening)',
            'phq[\\s-]?(?:2|9)',
            '(?:negative|positive)\\s+(?:for\\s+)?depression\\s+screen',
            'depression\\s+(?:absent|present)',
            'mental\\s+health\\s+(?:screen|assessment)',
        ],
        denominatorPatterns: [
            'patient',
        ],
        exclusionPatterns: [
            'already\\s+(?:diagnosed|treated)\\s+(?:for\\s+)?depression',
            'bipolar',
        ],
        benchmark: 'Depression screening documented with plan if positive',
        maxPoints: 10,
        highPerformanceThreshold: 85,
    },
];

// ============================================================================
// PAYMENT ADJUSTMENT CALCULATION
// Based on 2024 MIPS payment adjustment methodology
// ============================================================================

const PAYMENT_ADJUSTMENT_MAP: { minScore: number; maxScore: number; adjustment: number }[] = [
    { minScore: 0, maxScore: 10, adjustment: -9.0 },
    { minScore: 11, maxScore: 20, adjustment: -7.0 },
    { minScore: 21, maxScore: 30, adjustment: -5.0 },
    { minScore: 31, maxScore: 40, adjustment: -3.0 },
    { minScore: 41, maxScore: 50, adjustment: -1.0 },
    { minScore: 51, maxScore: 60, adjustment: 0.0 },
    { minScore: 61, maxScore: 70, adjustment: 1.0 },
    { minScore: 71, maxScore: 80, adjustment: 3.0 },
    { minScore: 81, maxScore: 90, adjustment: 5.0 },
    { minScore: 91, maxScore: 100, adjustment: 9.0 },
];

// ============================================================================
// MAIN ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Analyze document for MIPS quality measures
 * Uses section-aware analysis to exclude Family History, Social History, and procedure orders
 */
export function analyzeMIPSMeasures(
    documentText: string,
    documentedConditions: string[] = []
): MIPSAnalysisResult {
    // Parse document into sections
    const sections = detectSections(documentText);

    // For condition detection (denominator), use ONLY diagnosis sections
    // This excludes: Family History, Social History, Plan/Orders (which have measure applicability tags)
    const diagnosisSections = sections.filter(s =>
        s.type === 'assessment' || s.type === 'diagnosis'
    );
    const diagnosisText = diagnosisSections.map(s => s.text).join('\n').toLowerCase();

    // Full text for evidence detection (measure can be met anywhere in document)
    const fullText = documentText.toLowerCase();

    const measureResults: MIPSMeasureResult[] = [];

    for (const measure of MIPS_MEASURES) {
        // Use diagnosis text for denominator (condition detection - excludes procedure orders)
        // Use full text for numerator (evidence of measure being met)
        const result = analyzeSingleMeasure(measure, fullText, diagnosisText, documentedConditions);
        measureResults.push(result);
    }

    // Filter to applicable measures
    const applicableMeasures = measureResults.filter(r => r.isApplicable);

    // Calculate projected score
    const projectedScore = calculateProjectedScore(applicableMeasures);

    // Determine performance category
    const performanceCategory = getPerformanceCategory(projectedScore);

    // Calculate payment adjustment
    const paymentAdjustment = calculatePaymentAdjustment(projectedScore);

    // Generate recommendations
    const recommendations = generateMIPSRecommendations(measureResults);

    // Category breakdown (simplified - using quality for now)
    const categoryScores = {
        quality: projectedScore,
        improvementActivity: 0,  // Placeholder for future implementation
        promotingInteroperability: 0,
        cost: 0,
    };

    return {
        applicableMeasures,
        projectedScore,
        performanceCategory,
        paymentAdjustment,
        recommendations,
        categoryScores,
    };
}

/**
 * Check if a specific measure applies to given conditions
 */
export function isMeasureApplicable(
    measureId: string,
    conditions: string[]
): boolean {
    const measure = MIPS_MEASURES.find(m => m.measureId === measureId);
    if (!measure) return false;

    // If no specific conditions required, measure applies to all
    if (measure.conditions.length === 0) return true;

    // Check if any documented condition matches measure conditions
    return conditions.some(code =>
        measure.conditions.some(mCode =>
            code.startsWith(mCode) || mCode.startsWith(code)
        )
    );
}

/**
 * Get measure details by ID
 */
export function getMeasureById(measureId: string): MIPSMeasure | null {
    return MIPS_MEASURES.find(m => m.measureId === measureId) || null;
}

/**
 * Calculate payment adjustment from final score
 */
export function calculatePaymentAdjustment(score: number): number {
    for (const range of PAYMENT_ADJUSTMENT_MAP) {
        if (score >= range.minScore && score <= range.maxScore) {
            return range.adjustment;
        }
    }
    return 0;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function analyzeSingleMeasure(
    measure: MIPSMeasure,
    fullText: string,        // Full document text for evidence detection
    _diagnosisText: string,  // Kept for API compatibility but no longer used for condition matching
    documentedConditions: string[]
): MIPSMeasureResult {
    // Check if measure applies
    // CLEAN APPROACH: Only use explicit ICD-10 codes for condition-based measures
    // No text pattern matching fallback - this was causing false positives
    let isApplicable = false;

    if (measure.conditions.length === 0) {
        // Universal measure - applies to all patients (e.g., #317 BP Screening, #497 Preventive)
        isApplicable = true;
    } else {
        // Condition-specific measure (e.g., #236 requires HTN, #001 requires DM)
        // ONLY check against actual documented ICD-10 codes - no text pattern fallback
        isApplicable = documentedConditions.some(code =>
            measure.conditions.some(mCode =>
                code.startsWith(mCode) || mCode.startsWith(code)
            )
        );
        // NOTE: Removed text pattern fallback that was causing false positives
        // If patient has HTN, they should have an I10 code documented
    }

    // Check for exclusions (use full text - exclusions can be anywhere)
    const isExcluded = measure.exclusionPatterns.some(p => {
        try {
            return new RegExp(p, 'i').test(fullText);
        } catch {
            return fullText.includes(p);
        }
    });

    // Check if measure is met (numerator) - use FULL TEXT for evidence
    const evidence: string[] = [];
    let isMet = false;

    for (const pattern of measure.numeratorPatterns) {
        try {
            const regex = new RegExp(pattern, 'gi');
            const matches = fullText.match(regex);
            if (matches) {
                isMet = true;
                evidence.push(...matches.slice(0, 2));
            }
        } catch {
            if (fullText.includes(pattern)) {
                isMet = true;
                evidence.push(pattern);
            }
        }
    }

    // Calculate points
    let points = 0;
    if (isApplicable && !isExcluded) {
        if (isMet) {
            points = measure.maxPoints;
        }
    }

    // Generate recommendation with improved exclusion messages
    let recommendation: string;
    if (isExcluded) {
        // Provide clearer exclusion messages based on measure type
        if (measure.measureId === '497-DEPRESSION') {
            recommendation = 'Already diagnosed with depression/bipolar - screening not applicable per CMS';
        } else {
            recommendation = 'Patient excluded from this measure (hospice, pregnancy, or other exclusion criteria)';
        }
    } else if (!isApplicable) {
        recommendation = 'Measure not applicable for this encounter';
    } else if (isMet) {
        recommendation = `✅ Measure met (${points}/${measure.maxPoints} points)`;
    } else {
        recommendation = `Add documentation for: ${measure.title}`;
    }

    return {
        measure,
        isApplicable,
        isMet,
        isExcluded,
        evidence,
        points,
        recommendation,
    };
}

function calculateProjectedScore(measures: MIPSMeasureResult[]): number {
    if (measures.length === 0) return 0;

    const totalPoints = measures.reduce((sum, m) => sum + m.points, 0);
    const maxPossible = measures.reduce((sum, m) => sum + m.measure.maxPoints, 0);

    if (maxPossible === 0) return 0;

    return Math.round((totalPoints / maxPossible) * 100);
}

function getPerformanceCategory(
    score: number
): 'exceptional' | 'high' | 'moderate' | 'low' | 'insufficient' {
    if (score >= 90) return 'exceptional';
    if (score >= 75) return 'high';
    if (score >= 50) return 'moderate';
    if (score >= 25) return 'low';
    return 'insufficient';
}

function generateMIPSRecommendations(
    measures: MIPSMeasureResult[]
): MIPSRecommendation[] {
    const recommendations: MIPSRecommendation[] = [];

    // Find unmet measures that are applicable
    const unmetMeasures = measures.filter(m =>
        m.isApplicable && !m.isMet && !m.isExcluded
    );

    for (const result of unmetMeasures) {
        const measure = result.measure;

        // Get example documentation from numerator patterns
        const examples: string[] = [];
        if (measure.measureId === '001') {
            examples.push(
                'A1c of 7.8%, diabetes well controlled',
                'Hemoglobin A1c at goal (<9%)',
            );
        } else if (measure.measureId === '236') {
            examples.push(
                'BP 128/78, hypertension controlled',
                'Blood pressure at goal <140/90',
            );
        } else if (measure.measureId.startsWith('497')) {
            examples.push(
                'BMI 28.5, discussed weight management',
                'Tobacco use: never smoker',
                'PHQ-2 negative, depression screening performed',
            );
        }

        recommendations.push({
            priority: measure.maxPoints >= 10 ? 'high' : 'medium',
            measureId: measure.measureId,
            title: measure.title,
            action: `Document ${measure.benchmark}`,
            impact: `+${measure.maxPoints} MIPS points available`,
            exampleDocumentation: examples,
        });
    }

    return recommendations.slice(0, 5);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    MIPS_MEASURES as MIPS_MEASURES_DATABASE,
    PAYMENT_ADJUSTMENT_MAP,
};
