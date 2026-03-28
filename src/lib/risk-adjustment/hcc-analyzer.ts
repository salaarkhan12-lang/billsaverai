/**
 * HCC (Hierarchical Condition Category) Analyzer
 * 
 * Analyzes documentation to identify HCC opportunities for Medicare Advantage
 * risk adjustment. Calculates RAF (Risk Adjustment Factor) scores and
 * identifies missed HCC capture opportunities.
 * 
 * Key Features:
 * - HCC gap detection from clinical documentation
 * - RAF score calculation (current vs potential)
 * - Specificity upgrade recommendations
 * - Annual recapture tracking
 * 
 * Based on CMS-HCC Risk Adjustment Model Version 24 (2024)
 */

import { ICD10_DATABASE, type ICD10CodeInfo } from '../icd10-database';

// ============================================================================
// TYPES
// ============================================================================

export interface HCCOpportunity {
    icd10Code: string;
    description: string;
    hccCategory: number;
    hccDescription: string;
    rafWeight: number;
    annualValue: number;          // Estimated annual revenue at $1,000/RAF point
    source: 'documented' | 'potential' | 'upgrade';
    upgradeFrom?: string;         // If upgrade, the current less-specific code
    confidence: 'high' | 'medium' | 'low';
    documentationRequired?: string[];
}

export interface HCCAnalysisResult {
    documentedHCCs: HCCOpportunity[];
    potentialHCCs: HCCOpportunity[];
    upgradeOpportunities: HCCOpportunity[];
    currentRAF: number;
    potentialRAF: number;
    currentAnnualValue: number;
    potentialAnnualValue: number;
    gapValue: number;
    recommendations: HCCRecommendation[];
}

export interface HCCRecommendation {
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    annualImpact: number;
    actionRequired: string;
    exampleDocumentation: string[];
}

// ============================================================================
// HCC DETECTION PATTERNS
// Pattern-based detection for conditions not explicitly coded
// ============================================================================

interface HCCDetectionPattern {
    hccCategory: number;
    hccDescription: string;
    suggestedCode: string;
    rafWeight: number;
    patterns: string[];
    requiredContext?: string[];  // Additional context needed for high confidence
    documentationHints: string[];
}

const HCC_DETECTION_PATTERNS: HCCDetectionPattern[] = [
    // HCC 18: Diabetes with Chronic Complications
    {
        hccCategory: 18,
        hccDescription: 'Diabetes with Chronic Complications',
        suggestedCode: 'E11.65',
        rafWeight: 0.302,
        patterns: [
            'diabetes.*(?:hyperglycemia|uncontrolled|poorly\\s+controlled)',
            'a1c\\s*(?:>|greater|above|over)\\s*(?:9|10|11|12)',
            'dm\\s*(?:type\\s*(?:1|2|ii))?\\s*(?:with|complicated\\s+by)\\s*(?:neuropathy|nephropathy|retinopathy)',
            'diabetic\\s+(?:neuropathy|nephropathy|retinopathy|foot\\s+ulcer)',
        ],
        requiredContext: ['diabetes', 'dm', 'type 2', 'type 1'],
        documentationHints: [
            'Type 2 diabetes with hyperglycemia, A1C 9.5%',
            'Diabetes complicated by peripheral neuropathy',
            'DM with diabetic nephropathy, CKD stage 3',
        ],
    },
    // HCC 85: Congestive Heart Failure
    {
        hccCategory: 85,
        hccDescription: 'Congestive Heart Failure',
        suggestedCode: 'I50.22',
        rafWeight: 0.323,
        patterns: [
            'heart\\s+failure',
            'chf',
            'congestive\\s+heart',
            'systolic\\s+(?:heart\\s+)?failure',
            'diastolic\\s+(?:heart\\s+)?failure',
            'hfref|hfpef',
            'reduced\\s+ejection\\s+fraction',
            'ef\\s*(?:<|less|below)\\s*(?:40|35|30)',
        ],
        documentationHints: [
            'Chronic systolic heart failure, EF 35%',
            'CHF with reduced ejection fraction',
            'Heart failure, NYHA Class III',
        ],
    },
    // HCC 111: COPD
    {
        hccCategory: 111,
        hccDescription: 'Chronic Obstructive Pulmonary Disease',
        suggestedCode: 'J44.9',
        rafWeight: 0.335,
        patterns: [
            'copd',
            'chronic\\s+obstructive\\s+pulmonary',
            'emphysema',
            'chronic\\s+bronchitis',
            '(?:fev1|fev1\\/fvc)\\s*(?:<|less|below)\\s*(?:70|0\\.7)',
        ],
        documentationHints: [
            'COPD, stable on current inhalers',
            'Chronic obstructive pulmonary disease with acute exacerbation',
            'Emphysema, requires supplemental oxygen',
        ],
    },
    // HCC 22: Morbid Obesity
    {
        hccCategory: 22,
        hccDescription: 'Morbid Obesity',
        suggestedCode: 'E66.01',
        rafWeight: 0.250,
        patterns: [
            'morbid(?:ly)?\\s+obes',
            'bmi\\s*(?:>|greater|above|over|of|=)\\s*(?:40|45|50)',
            'severe\\s+(?:or\\s+)?morbid\\s+obesity',
            'class\\s*(?:3|iii)\\s+obesity',
        ],
        documentationHints: [
            'Morbid obesity, BMI 42',
            'Class III obesity due to excess calories',
            'Severe obesity with BMI 45.3',
        ],
    },
    // HCC 12: Breast, Prostate, and Other Cancers
    {
        hccCategory: 12,
        hccDescription: 'Breast, Prostate, and Other Cancers',
        suggestedCode: 'C50.9',
        rafWeight: 0.146,
        patterns: [
            '(?:breast|prostate|lung|colon)\\s*cancer',
            'carcinoma\\s+of\\s+(?:breast|prostate|lung|colon)',
            'malignant\\s+neoplasm',
            'metastatic\\s+(?:disease|cancer)',
        ],
        documentationHints: [
            'History of breast cancer, in remission',
            'Prostate cancer, currently on active surveillance',
        ],
    },
];

// ============================================================================
// RAF VALUE CONSTANT
// Average per-RAF-point annual value in Medicare Advantage
// ============================================================================

const RAF_ANNUAL_VALUE = 1000; // $1,000 per RAF point (conservative estimate)

// ============================================================================
// MAIN ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Analyze document for HCC opportunities
 */
export function analyzeHCCOpportunities(
    documentText: string,
    documentedCodes: string[] = []
): HCCAnalysisResult {
    const lowerText = documentText.toLowerCase();

    // 1. Analyze documented codes
    const documentedHCCs = analyzeDocumentedCodes(documentedCodes);

    // 2. Find potential HCCs from text patterns
    const potentialHCCs = findPotentialHCCs(lowerText, documentedCodes);

    // 3. Find upgrade opportunities
    const upgradeOpportunities = findUpgradeOpportunities(documentedCodes, lowerText);

    // 4. Calculate RAF scores
    const currentRAF = calculateRAFScore(documentedHCCs);
    const allPotential = [...documentedHCCs, ...potentialHCCs, ...upgradeOpportunities];
    const potentialRAF = calculateRAFScore(deduplicateHCCs(allPotential));

    // 5. Calculate annual values
    const currentAnnualValue = currentRAF * RAF_ANNUAL_VALUE;
    const potentialAnnualValue = potentialRAF * RAF_ANNUAL_VALUE;
    const gapValue = potentialAnnualValue - currentAnnualValue;

    // 6. Generate recommendations
    const recommendations = generateHCCRecommendations(
        potentialHCCs,
        upgradeOpportunities
    );

    return {
        documentedHCCs,
        potentialHCCs,
        upgradeOpportunities,
        currentRAF,
        potentialRAF,
        currentAnnualValue,
        potentialAnnualValue,
        gapValue,
        recommendations,
    };
}

/**
 * Calculate total RAF score from HCC list
 */
export function calculateRAFScore(hccs: HCCOpportunity[]): number {
    // Deduplicate by HCC category (only count each HCC once)
    const uniqueHCCs = new Map<number, HCCOpportunity>();

    for (const hcc of hccs) {
        const existing = uniqueHCCs.get(hcc.hccCategory);
        if (!existing || hcc.rafWeight > existing.rafWeight) {
            uniqueHCCs.set(hcc.hccCategory, hcc);
        }
    }

    // Sum RAF weights
    let totalRAF = 0;
    const hccValues = Array.from(uniqueHCCs.values());
    for (const hcc of hccValues) {
        totalRAF += hcc.rafWeight;
    }

    return Math.round(totalRAF * 1000) / 1000; // Round to 3 decimal places
}

/**
 * Find HCCs missed in documentation that may be present
 */
export function findMissedHCCs(
    documentText: string,
    documentedCodes: string[]
): HCCOpportunity[] {
    const result = analyzeHCCOpportunities(documentText, documentedCodes);
    return [...result.potentialHCCs, ...result.upgradeOpportunities];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function analyzeDocumentedCodes(codes: string[]): HCCOpportunity[] {
    const opportunities: HCCOpportunity[] = [];

    for (const code of codes) {
        const icdInfo = ICD10_DATABASE[code];
        if (icdInfo?.isHCC && icdInfo.hccCategory && icdInfo.rafWeight) {
            opportunities.push({
                icd10Code: code,
                description: icdInfo.description,
                hccCategory: icdInfo.hccCategory,
                hccDescription: icdInfo.hccDescription || `HCC ${icdInfo.hccCategory}`,
                rafWeight: icdInfo.rafWeight,
                annualValue: icdInfo.rafWeight * RAF_ANNUAL_VALUE,
                source: 'documented',
                confidence: 'high',
            });
        }
    }

    return opportunities;
}

function findPotentialHCCs(
    lowerText: string,
    documentedCodes: string[]
): HCCOpportunity[] {
    const opportunities: HCCOpportunity[] = [];
    const documentedHCCs = new Set<number>();

    // Track which HCCs are already documented
    for (const code of documentedCodes) {
        const icdInfo = ICD10_DATABASE[code];
        if (icdInfo?.hccCategory) {
            documentedHCCs.add(icdInfo.hccCategory);
        }
    }

    // Search for patterns
    for (const pattern of HCC_DETECTION_PATTERNS) {
        // Skip if already documented
        if (documentedHCCs.has(pattern.hccCategory)) {
            continue;
        }

        // Check if any pattern matches
        const matched = pattern.patterns.some(p => {
            try {
                return new RegExp(p, 'i').test(lowerText);
            } catch {
                return false;
            }
        });

        if (matched) {
            // Check required context for confidence
            let confidence: 'high' | 'medium' | 'low' = 'medium';
            if (pattern.requiredContext) {
                const contextMatched = pattern.requiredContext.some(ctx =>
                    lowerText.includes(ctx.toLowerCase())
                );
                confidence = contextMatched ? 'high' : 'low';
            }

            opportunities.push({
                icd10Code: pattern.suggestedCode,
                description: ICD10_DATABASE[pattern.suggestedCode]?.description || pattern.hccDescription,
                hccCategory: pattern.hccCategory,
                hccDescription: pattern.hccDescription,
                rafWeight: pattern.rafWeight,
                annualValue: pattern.rafWeight * RAF_ANNUAL_VALUE,
                source: 'potential',
                confidence,
                documentationRequired: pattern.documentationHints,
            });
        }
    }

    return opportunities;
}

function findUpgradeOpportunities(
    documentedCodes: string[],
    lowerText: string
): HCCOpportunity[] {
    const opportunities: HCCOpportunity[] = [];

    for (const code of documentedCodes) {
        const icdInfo = ICD10_DATABASE[code];

        // Check if there's a specificity upgrade available
        if (icdInfo?.specificityUpgrade) {
            const upgradeInfo = ICD10_DATABASE[icdInfo.specificityUpgrade];

            if (upgradeInfo && upgradeInfo.rafWeight && upgradeInfo.rafWeight > (icdInfo.rafWeight || 0)) {
                // Check if documentation supports upgrade
                const supportsUpgrade = checkUpgradeDocumentation(
                    code,
                    icdInfo.specificityUpgrade,
                    lowerText
                );

                opportunities.push({
                    icd10Code: icdInfo.specificityUpgrade,
                    description: upgradeInfo.description,
                    hccCategory: upgradeInfo.hccCategory || 0,
                    hccDescription: upgradeInfo.hccDescription || '',
                    rafWeight: upgradeInfo.rafWeight,
                    annualValue: upgradeInfo.rafWeight * RAF_ANNUAL_VALUE,
                    source: 'upgrade',
                    upgradeFrom: code,
                    confidence: supportsUpgrade ? 'high' : 'medium',
                    documentationRequired: getUpgradeDocumentationHints(code, icdInfo.specificityUpgrade),
                });
            }
        }
    }

    return opportunities;
}

function checkUpgradeDocumentation(
    fromCode: string,
    toCode: string,
    lowerText: string
): boolean {
    // Check for documentation that supports the upgrade
    const upgradePatterns: Record<string, string[]> = {
        // E11.9 -> E11.65 (DM without -> DM with hyperglycemia)
        'E11.9->E11.65': [
            'hyperglycemia',
            'uncontrolled',
            'poorly controlled',
            'a1c.*(?:>|above|over)\\s*9',
            'glucose.*elevated',
        ],
        // E11.9 -> E11.22 (DM without -> DM with CKD)
        'E11.9->E11.22': [
            'ckd',
            'chronic kidney',
            'renal',
            'nephropathy',
            'egfr.*(?:<|below)\\s*60',
        ],
        // I50.9 -> I50.22 (HF unspecified -> Chronic systolic)
        'I50.9->I50.22': [
            'systolic',
            'hfref',
            'reduced ejection',
            'ef.*(?:<|below)\\s*40',
        ],
        // E66.9 -> E66.01 (Obesity -> Morbid obesity)
        'E66.9->E66.01': [
            'morbid',
            'bmi.*(?:>|above|over)\\s*40',
            'class\\s*(?:3|iii)',
        ],
    };

    const key = `${fromCode}->${toCode}`;
    const patterns = upgradePatterns[key];

    if (!patterns) return false;

    return patterns.some(p => {
        try {
            return new RegExp(p, 'i').test(lowerText);
        } catch {
            return lowerText.includes(p);
        }
    });
}

function getUpgradeDocumentationHints(
    fromCode: string,
    toCode: string
): string[] {
    const hints: Record<string, string[]> = {
        'E11.9->E11.65': [
            'Document current A1C value (if elevated)',
            'Note "uncontrolled" or "poorly controlled" diabetes',
            'Include mention of hyperglycemia',
        ],
        'E11.9->E11.22': [
            'Document CKD stage if present',
            'Include eGFR value',
            'Note diabetic nephropathy if diagnosed',
        ],
        'I50.9->I50.22': [
            'Document ejection fraction percentage',
            'Specify systolic vs diastolic heart failure',
            'Note NYHA classification if available',
        ],
        'E66.9->E66.01': [
            'Document BMI (must be ≥ 40 for morbid obesity)',
            'Specify "morbid" or "severe" obesity',
            'Note if Class III obesity',
        ],
    };

    return hints[`${fromCode}->${toCode}`] || [
        'Document specific complications or severity',
        'Include relevant lab values or measurements',
    ];
}

function deduplicateHCCs(hccs: HCCOpportunity[]): HCCOpportunity[] {
    const unique = new Map<number, HCCOpportunity>();

    for (const hcc of hccs) {
        const existing = unique.get(hcc.hccCategory);
        // Keep the one with higher RAF weight or documented source
        if (!existing ||
            hcc.rafWeight > existing.rafWeight ||
            (hcc.source === 'documented' && existing.source !== 'documented')) {
            unique.set(hcc.hccCategory, hcc);
        }
    }

    return Array.from(unique.values());
}

function generateHCCRecommendations(
    potentialHCCs: HCCOpportunity[],
    upgradeOpportunities: HCCOpportunity[]
): HCCRecommendation[] {
    const recommendations: HCCRecommendation[] = [];

    // Upgrade recommendations (highest priority - already documented conditions)
    for (const upgrade of upgradeOpportunities) {
        const annualImpact = upgrade.annualValue;

        recommendations.push({
            priority: annualImpact > 250 ? 'high' : annualImpact > 100 ? 'medium' : 'low',
            title: `Upgrade ${upgrade.upgradeFrom} to ${upgrade.icd10Code}`,
            description: `Documenting ${upgrade.hccDescription} increases HCC capture. Current code may not reflect full clinical picture.`,
            annualImpact,
            actionRequired: `Add specificity to upgrade from ${upgrade.upgradeFrom} to ${upgrade.icd10Code}`,
            exampleDocumentation: upgrade.documentationRequired || [],
        });
    }

    // Potential HCC recommendations
    for (const potential of potentialHCCs) {
        recommendations.push({
            priority: potential.confidence === 'high' ? 'high' : 'medium',
            title: `Capture ${potential.hccDescription}`,
            description: `Documentation suggests ${potential.description} may be present but not coded.`,
            annualImpact: potential.annualValue,
            actionRequired: `Add ICD-10 code ${potential.icd10Code} if clinically appropriate`,
            exampleDocumentation: potential.documentationRequired || [],
        });
    }

    // Sort by annual impact
    recommendations.sort((a, b) => b.annualImpact - a.annualImpact);

    return recommendations;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    HCC_DETECTION_PATTERNS,
    RAF_ANNUAL_VALUE,
};
