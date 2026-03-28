/**
 * Code Specificity Database & Analyzer
 * 
 * Identifies opportunities to upgrade ICD-10 codes to more specific versions
 * that may capture higher-value HCCs or improve documentation accuracy.
 * 
 * Key Features:
 * - Specificity upgrade recommendations
 * - Revenue impact calculations (RAF difference)
 * - Documentation requirements for upgrades
 * - Detection patterns for finding upgrade opportunities
 * 
 * Based on ICD-10-CM coding guidelines and CMS HCC model
 */

import { ICD10_DATABASE, type ICD10CodeInfo } from '../icd10-database';

// ============================================================================
// TYPES
// ============================================================================

export interface SpecificityUpgrade {
    fromCode: string;
    fromDescription: string;
    toCode: string;
    toDescription: string;
    reason: string;
    rafIncrease: number;         // Difference in RAF weight
    annualValueIncrease: number; // Revenue impact per year
    documentationRequired: string[];
    detectionPatterns: string[];
    category: 'hcc_upgrade' | 'complication' | 'laterality' | 'acuity' | 'severity';
}

export interface SpecificityAnalysisResult {
    currentCode: string;
    currentDescription: string;
    upgradePath: SpecificityUpgrade | null;
    documentationSupportsUpgrade: boolean;
    confidence: 'high' | 'medium' | 'low';
    missingDocumentation: string[];
    recommendation: string;
}

export interface SpecificityOverview {
    totalCodesAnalyzed: number;
    upgradesAvailable: number;
    totalAnnualOpportunity: number;
    upgradesByCategory: Record<string, number>;
    priorityUpgrades: SpecificityAnalysisResult[];
}

// ============================================================================
// SPECIFICITY UPGRADE DATABASE
// Priority upgrade paths with revenue impact
// ============================================================================

const RAF_ANNUAL_VALUE = 1000; // $1,000 per RAF point

export const SPECIFICITY_UPGRADES: SpecificityUpgrade[] = [
    // ============================================================================
    // DIABETES UPGRADES (HCC 19 → HCC 18)
    // Highest value upgrades: +$197+ per year per patient
    // ============================================================================
    {
        fromCode: 'E11.9',
        fromDescription: 'Type 2 DM without complications',
        toCode: 'E11.65',
        toDescription: 'Type 2 DM with hyperglycemia',
        reason: 'Document hyperglycemia when A1C > 9% or glucose consistently elevated',
        rafIncrease: 0.197,  // 0.302 - 0.105
        annualValueIncrease: 197,
        documentationRequired: [
            'Elevated A1C (typically > 9%) or persistent hyperglycemia',
            'Document "uncontrolled" or "poorly controlled" diabetes',
            'Include current A1C value or glucose readings',
        ],
        detectionPatterns: [
            'hyperglycemia',
            'uncontrolled\\s+(?:diabetes|dm)',
            'poorly\\s+controlled\\s+(?:diabetes|dm)',
            'a1c\\s*(?:>|greater|over|above)\\s*9',
            'glucose\\s*(?:>|greater|over|above)\\s*(?:200|250|300)',
            'diabetes\\s+(?:out\\s+of|not\\s+in|not\\s+at)\\s+control',
        ],
        category: 'hcc_upgrade',
    },
    {
        fromCode: 'E11.9',
        fromDescription: 'Type 2 DM without complications',
        toCode: 'E11.22',
        toDescription: 'Type 2 DM with CKD',
        reason: 'Link diabetes to chronic kidney disease when both present',
        rafIncrease: 0.197,
        annualValueIncrease: 197,
        documentationRequired: [
            'Document CKD stage (1-5)',
            'Include eGFR value',
            'State diabetic nephropathy or diabetes-related kidney disease',
            'Link conditions: "Type 2 diabetes with chronic kidney disease"',
        ],
        detectionPatterns: [
            'diabetic\\s+(?:kidney|nephropathy|renal)',
            'dm\\s+(?:with|and)\\s+(?:ckd|chronic\\s+kidney)',
            'type\\s*2\\s*(?:diabetes|dm)\\s+(?:with|and)\\s+(?:ckd|kidney)',
            'diabetes.*ckd',
            'ckd.*diabetes',
            'egfr\\s*(?:<|less|below)\\s*60',
        ],
        category: 'hcc_upgrade',
    },
    {
        fromCode: 'E11.9',
        fromDescription: 'Type 2 DM without complications',
        toCode: 'E11.40',
        toDescription: 'Type 2 DM with neuropathy',
        reason: 'Document diabetic neuropathy when peripheral neuropathy present',
        rafIncrease: 0.197,
        annualValueIncrease: 197,
        documentationRequired: [
            'Document peripheral neuropathy',
            'Include symptoms: numbness, tingling, burning in feet/hands',
            'State diabetic neuropathy or diabetes-related nerve damage',
            'Document monofilament testing if performed',
        ],
        detectionPatterns: [
            'diabetic\\s+neuropathy',
            'dm\\s+(?:with|and)\\s+neuropathy',
            'peripheral\\s+neuropathy.*diabetes',
            'numb(?:ness)?\\s+(?:in|of)\\s+(?:feet|hands|extremities)',
            'tingling\\s+(?:in|of)\\s+(?:feet|hands)',
            'burning\\s+(?:in|of)\\s+(?:feet|soles)',
            'loss\\s+of\\s+(?:sensation|protective\\s+sensation)',
        ],
        category: 'hcc_upgrade',
    },

    // ============================================================================
    // HEART FAILURE UPGRADES (Specificity)
    // ============================================================================
    {
        fromCode: 'I50.9',
        fromDescription: 'Heart failure, unspecified',
        toCode: 'I50.22',
        toDescription: 'Chronic systolic heart failure',
        reason: 'Specify type of heart failure when ejection fraction is known',
        rafIncrease: 0,  // Same HCC 85, but more accurate coding
        annualValueIncrease: 0,
        documentationRequired: [
            'Document ejection fraction (EF) percentage',
            'Specify systolic dysfunction',
            'Include "chronic" if ongoing condition',
            'Note HFrEF if EF ≤ 40%',
        ],
        detectionPatterns: [
            'systolic\\s+(?:heart\\s+)?failure',
            'hfref',
            'reduced\\s+ejection\\s+fraction',
            'ef\\s*(?:<|less|below|=)\\s*(?:40|35|30)',
            'systolic\\s+dysfunction',
            'lvef\\s*(?:of|is|=)?\\s*\\d{1,2}',
        ],
        category: 'acuity',
    },
    {
        fromCode: 'I50.9',
        fromDescription: 'Heart failure, unspecified',
        toCode: 'I50.32',
        toDescription: 'Chronic diastolic heart failure',
        reason: 'Specify diastolic heart failure when EF is preserved',
        rafIncrease: 0,
        annualValueIncrease: 0,
        documentationRequired: [
            'Document preserved ejection fraction (EF ≥ 50%)',
            'Specify diastolic dysfunction',
            'Note HFpEF if applicable',
        ],
        detectionPatterns: [
            'diastolic\\s+(?:heart\\s+)?failure',
            'hfpef',
            'preserved\\s+ejection\\s+fraction',
            'ef\\s*(?:>|greater|above|=)\\s*(?:50|55)',
            'diastolic\\s+dysfunction',
            'grade\\s*(?:1|2|3|i|ii|iii)\\s+diastolic',
        ],
        category: 'acuity',
    },

    // ============================================================================
    // HYPERTENSION UPGRADES
    // ============================================================================
    {
        fromCode: 'I10',
        fromDescription: 'Essential (primary) hypertension',
        toCode: 'I11.0',
        toDescription: 'Hypertensive heart disease with heart failure',
        reason: 'Link hypertension to heart disease when both present',
        rafIncrease: 0.323,  // Adds HCC 85 (CHF)
        annualValueIncrease: 323,
        documentationRequired: [
            'Document heart failure with hypertension',
            'State "hypertensive heart disease" or "heart failure due to hypertension"',
            'Include both conditions and their relationship',
        ],
        detectionPatterns: [
            'hypertensive\\s+heart\\s+(?:disease|failure)',
            'heart\\s+failure.*hypertension',
            'htn.*(?:with|and).*(?:heart\\s+failure|chf|hf)',
            'heart\\s+disease.*hypertensive',
            'lvh.*hypertension',
        ],
        category: 'complication',
    },
    {
        fromCode: 'I10',
        fromDescription: 'Essential (primary) hypertension',
        toCode: 'I12.9',
        toDescription: 'Hypertensive CKD, unspecified stage',
        reason: 'Link hypertension to CKD when both are present',
        rafIncrease: 0.069,  // Adds kidney disease component
        annualValueIncrease: 69,
        documentationRequired: [
            'Document CKD with hypertension',
            'State "hypertensive kidney disease" or causal relationship',
            'Include CKD stage if known',
        ],
        detectionPatterns: [
            'hypertensive\\s+(?:kidney|renal|ckd)',
            'kidney\\s+disease.*hypertension',
            'ckd.*(?:secondary|due).*htn',
            'hypertension.*(?:with|and).*ckd',
        ],
        category: 'complication',
    },

    // ============================================================================
    // OBESITY UPGRADES (HCC 22)
    // ============================================================================
    {
        fromCode: 'E66.9',
        fromDescription: 'Obesity, unspecified',
        toCode: 'E66.01',
        toDescription: 'Morbid obesity due to excess calories',
        reason: 'Upgrade to morbid obesity when BMI ≥ 40',
        rafIncrease: 0.250,  // Adds HCC 22
        annualValueIncrease: 250,
        documentationRequired: [
            'Document BMI ≥ 40',
            'State "morbid obesity" or "Class III obesity"',
            'Include specific BMI value',
        ],
        detectionPatterns: [
            'morbid(?:ly)?\\s+obes',
            'bmi\\s*(?:>|greater|over|of|=)\\s*(?:40|45|50)',
            'class\\s*(?:3|iii)\\s+(?:obesity|obese)',
            'severe\\s+(?:and\\s+)?morbid\\s+obesity',
        ],
        category: 'hcc_upgrade',
    },

    // ============================================================================
    // DEPRESSION UPGRADES
    // ============================================================================
    {
        fromCode: 'F32.9',
        fromDescription: 'Major depressive disorder, single episode, unspecified',
        toCode: 'F32.1',
        toDescription: 'Major depressive disorder, single episode, moderate',
        reason: 'Specify severity when documented',
        rafIncrease: 0,  // Same HCC, but more accurate
        annualValueIncrease: 0,
        documentationRequired: [
            'Document severity level: mild, moderate, or severe',
            'Include PHQ-9 score if available',
            'Note functional impairment level',
        ],
        detectionPatterns: [
            'moderate\\s+(?:depression|mdd|depressive)',
            'phq.?9\\s*(?:of|=|is)?\\s*(?:1[0-4]|10|11|12|13|14)',
            'depression.*moderate',
            'moderately\\s+(?:depressed|impaired)',
        ],
        category: 'severity',
    },
    {
        fromCode: 'F32.9',
        fromDescription: 'Major depressive disorder, single episode, unspecified',
        toCode: 'F32.2',
        toDescription: 'Major depressive disorder, single episode, severe',
        reason: 'Specify severe when symptoms are significant',
        rafIncrease: 0,
        annualValueIncrease: 0,
        documentationRequired: [
            'Document severe depression',
            'Include PHQ-9 ≥ 15 or significant impairment',
            'Note impact on daily functioning',
        ],
        detectionPatterns: [
            'severe\\s+(?:depression|mdd|depressive)',
            'phq.?9\\s*(?:of|=|is)?\\s*(?:1[5-9]|2[0-7])',
            'major\\s+depression.*severe',
            'severely\\s+(?:depressed|impaired)',
            'suicidal\\s+ideation',
        ],
        category: 'severity',
    },
];

// ============================================================================
// MAIN ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Analyze a single code for specificity upgrade opportunity
 */
export function analyzeSpecificityUpgrade(
    code: string,
    documentText: string
): SpecificityAnalysisResult {
    const icdInfo = ICD10_DATABASE[code];
    const lowerText = documentText.toLowerCase();

    // Find applicable upgrade path
    const upgrade = SPECIFICITY_UPGRADES.find(u => u.fromCode === code);

    if (!upgrade) {
        return {
            currentCode: code,
            currentDescription: icdInfo?.description || code,
            upgradePath: null,
            documentationSupportsUpgrade: false,
            confidence: 'low',
            missingDocumentation: [],
            recommendation: 'No specificity upgrade available for this code',
        };
    }

    // Check if documentation supports upgrade
    const { supports, matchedPatterns } = checkDocumentationSupport(
        upgrade.detectionPatterns,
        lowerText
    );

    // Determine confidence
    let confidence: 'high' | 'medium' | 'low';
    if (supports && matchedPatterns.length >= 2) {
        confidence = 'high';
    } else if (supports) {
        confidence = 'medium';
    } else {
        confidence = 'low';
    }

    // Find missing documentation
    const missingDocumentation = supports ? [] : upgrade.documentationRequired;

    // Generate recommendation
    let recommendation: string;
    if (supports) {
        recommendation = `✅ Documentation supports upgrade to ${upgrade.toCode} (${upgrade.toDescription}). ` +
            (upgrade.annualValueIncrease > 0
                ? `Annual revenue opportunity: +$${upgrade.annualValueIncrease}`
                : 'Improves coding accuracy');
    } else {
        recommendation = `Consider upgrading to ${upgrade.toCode} if documentation supports. ` +
            `Add: ${upgrade.documentationRequired[0]}`;
    }

    return {
        currentCode: code,
        currentDescription: icdInfo?.description || code,
        upgradePath: upgrade,
        documentationSupportsUpgrade: supports,
        confidence,
        missingDocumentation,
        recommendation,
    };
}

/**
 * Analyze all documented codes for specificity opportunities
 */
export function analyzeAllSpecificityOpportunities(
    codes: string[],
    documentText: string
): SpecificityOverview {
    const results: SpecificityAnalysisResult[] = [];
    let totalOpportunity = 0;
    const categoryCount: Record<string, number> = {};

    for (const code of codes) {
        const result = analyzeSpecificityUpgrade(code, documentText);
        results.push(result);

        if (result.upgradePath) {
            totalOpportunity += result.upgradePath.annualValueIncrease;

            const category = result.upgradePath.category;
            categoryCount[category] = (categoryCount[category] || 0) + 1;
        }
    }

    // Sort by annual value opportunity
    const priorityUpgrades = results
        .filter(r => r.upgradePath && r.upgradePath.annualValueIncrease > 0)
        .sort((a, b) => {
            const aValue = a.upgradePath?.annualValueIncrease || 0;
            const bValue = b.upgradePath?.annualValueIncrease || 0;
            return bValue - aValue;
        })
        .slice(0, 5);

    return {
        totalCodesAnalyzed: codes.length,
        upgradesAvailable: results.filter(r => r.upgradePath !== null).length,
        totalAnnualOpportunity: totalOpportunity,
        upgradesByCategory: categoryCount,
        priorityUpgrades,
    };
}

/**
 * Get all available upgrade paths from the database
 */
export function getAvailableUpgrades(): SpecificityUpgrade[] {
    return SPECIFICITY_UPGRADES;
}

/**
 * Find upgrade path for a specific code
 */
export function findUpgradePath(fromCode: string): SpecificityUpgrade | null {
    return SPECIFICITY_UPGRADES.find(u => u.fromCode === fromCode) || null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function checkDocumentationSupport(
    patterns: string[],
    lowerText: string
): { supports: boolean; matchedPatterns: string[] } {
    const matchedPatterns: string[] = [];

    for (const pattern of patterns) {
        try {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(lowerText)) {
                matchedPatterns.push(pattern);
            }
        } catch {
            // Fallback to simple includes
            if (lowerText.includes(pattern)) {
                matchedPatterns.push(pattern);
            }
        }
    }

    return {
        supports: matchedPatterns.length > 0,
        matchedPatterns,
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    SPECIFICITY_UPGRADES as SPECIFICITY_DATABASE,
    RAF_ANNUAL_VALUE,
};
