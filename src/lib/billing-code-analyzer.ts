/**
 * Billing Code Analyzer
 * Extracts and categorizes CPT and ICD-10 codes from analysis results
 * Ensures logical consistency (no contradictory code recommendations)
 * Now includes confidence scoring and transparent reasoning for audit defense
 */

import type { AnalysisResult, DocumentationGap } from './billing-rules';
import {
    calculateConfidence,
    generateAuditDefense,
    type ConfidenceScore,
    type EvidenceLocation
} from './confidence-scoring';

export interface CPTCode {
    code: string;
    description: string;
    reimbursement: string;
    status: 'ready' | 'needs-fixes';
    requiredFixes?: string[];
    complexity?: 'low' | 'moderate' | 'high';

    // NEW: Credibility & audit defense features
    confidence?: ConfidenceScore;
    reasoning?: {
        supported: string[];      // Why this code IS supported
        concerns: string[];       // Any concerns or limitations
        auditDefense: string;     // How to defend in audit
    };
    evidenceLocations?: EvidenceLocation[];
}

export interface ICD10Code {
    code: string;
    description: string;
    category: 'chronic' | 'acute' | 'symptom';
    isHCC?: boolean;
    riskScore?: number;
    source?: 'documented' | 'recommended';
}

export interface BillingCodeAnalysis {
    cptCodes: {
        current: CPTCode[];
        potential: CPTCode[];
    };
    icdCodes: {
        documented: ICD10Code[];
        missing: ICD10Code[];
    };
    revenueImpact: {
        current: string;
        potential: string;
        difference: string;
    };
}

// CPT Code definitions with reimbursement ranges
const CPT_CODES: Record<string, { description: string; reimbursement: string; complexity: 'low' | 'moderate' | 'high' }> = {
    '99211': { description: 'Office Visit Level 1 (Minimal)', reimbursement: '$25-45', complexity: 'low' },
    '99212': { description: 'Office Visit Level 2 (Straightforward)', reimbursement: '$50-75', complexity: 'low' },
    '99213': { description: 'Office Visit Level 3 (Low Complexity)', reimbursement: '$75-110', complexity: 'low' },
    '99214': { description: 'Office Visit Level 4 (Moderate Complexity)', reimbursement: '$110-150', complexity: 'moderate' },
    '99215': { description: 'Office Visit Level 5 (High Complexity)', reimbursement: '$150-210', complexity: 'high' },
};

// ICD-10 Code knowledge base with hierarchical relationships (MASSIVELY EXPANDED)
const ICD10_DATABASE: Record<string, {
    description: string;
    category: 'chronic' | 'acute' | 'symptom';
    isHCC?: boolean;
    excludes?: string[];
    parent?: string;
}> = {
    // Diabetes
    'E11': { description: 'Type 2 Diabetes Mellitus', category: 'chronic', isHCC: true },
    'E11.9': { description: 'Type 2 DM without complications', category: 'chronic', isHCC: true, parent: 'E11' },
    'E11.65': { description: 'Type 2 DM with hyperglycemia', category: 'chronic', isHCC: true, parent: 'E11', excludes: ['E11.9'] },
    'E11.22': { description: 'Type 2 DM with chronic kidney disease', category: 'chronic', isHCC: true, parent: 'E11', excludes: ['E11.9'] },
    'E11.40': { description: 'Type 2 DM with diabetic neuropathy', category: 'chronic', isHCC: true, parent: 'E11', excludes: ['E11.9'] },
    'E11.3': { description: 'Type 2 DM with ophthalmic complications', category: 'chronic', isHCC: true, parent: 'E11', excludes: ['E11.9'] },
    'E10': { description: 'Type 1 Diabetes Mellitus', category: 'chronic', isHCC: true },
    'E10.9': { description: 'Type 1 DM without complications', category: 'chronic', isHCC: true, parent: 'E10' },

    // Hypertension
    'I10': { description: 'Essential (primary) hypertension', category: 'chronic', isHCC: false },
    'I11': { description: 'Hypertensive heart disease', category: 'chronic', isHCC: true, parent: 'I10' },
    'I12': { description: 'Hypertensive chronic kidney disease', category: 'chronic', isHCC: true, parent: 'I10' },
    'I13': { description: 'Hypertensive heart and chronic kidney disease', category: 'chronic', isHCC: true, parent: 'I10' },

    // Heart failure
    'I50': { description: 'Heart failure', category: 'chronic', isHCC: true },
    'I50.9': { description: 'Heart failure, unspecified', category: 'chronic', isHCC: true, parent: 'I50' },
    'I50.21': { description: 'Acute systolic heart failure', category: 'acute', isHCC: true, parent: 'I50' },
    'I50.23': { description: 'Acute on chronic systolic heart failure', category: 'chronic', isHCC: true, parent: 'I50' },
    'I50.31': { description: 'Acute diastolic heart failure', category: 'acute', isHCC: true, parent: 'I50' },
    'I50.33': { description: 'Acute on chronic diastolic heart failure', category: 'chronic', isHCC: true, parent: 'I50' },

    // Lipids
    'E78.5': { description: 'Hyperlipidemia, unspecified', category: 'chronic', isHCC: false },
    'E78.0': { description: 'Pure hypercholesterolemia', category: 'chronic', isHCC: false },
    'E78.2': { description: 'Mixed hyperlipidemia', category: 'chronic', isHCC: false },

    // CKD
    'N18': { description: 'Chronic kidney disease', category: 'chronic', isHCC: true },
    'N18.1': { description: 'Chronic kidney disease, stage 1', category: 'chronic', isHCC: false },
    'N18.2': { description: 'Chronic kidney disease, stage 2', category: 'chronic', isHCC: false },
    'N18.3': { description: 'Chronic kidney disease, stage 3', category: 'chronic', isHCC: true },
    'N18.4': { description: 'Chronic kidney disease, stage 4', category: 'chronic', isHCC: true },
    'N18.5': { description: 'Chronic kidney disease, stage 5', category: 'chronic', isHCC: true },
    'N18.6': { description: 'End stage renal disease', category: 'chronic', isHCC: true },
    'N18.9': { description: 'Chronic kidney disease, unspecified', category: 'chronic', isHCC: true, parent: 'N18' },

    // Respiratory
    'J44.9': { description: 'COPD, unspecified', category: 'chronic', isHCC: true },
    'J44.0': { description: 'COPD with acute lower respiratory infection', category: 'acute', isHCC: true, parent: 'J44.9' },
    'J44.1': { description: 'COPD with acute exacerbation', category: 'acute', isHCC: true, parent: 'J44.9' },
    'J45': { description: 'Asthma', category: 'chronic', isHCC: false },
    'J45.20': { description: 'Mild intermittent asthma, uncomplicated', category: 'chronic', isHCC: false },

    // Cardiac
    'I48': { description: 'Atrial fibrillation and flutter', category: 'chronic', isHCC: true },
    'I48.91': { description: 'Atrial fibrillation, unspecified', category: 'chronic', isHCC: true, parent: 'I48' },
    'I25': { description: 'Chronic ischemic heart disease', category: 'chronic', isHCC: true },
    'I25.10': { description: 'Atherosclerotic heart disease without angina', category: 'chronic', isHCC: true, parent: 'I25' },

    // Pain - Musculoskeletal
    'M54.5': { description: 'Low back pain', category: 'symptom', isHCC: false },
    'M54.9': { description: 'Dorsalgia, unspecified (back pain)', category: 'symptom', isHCC: false },
    'M25.511': { description: 'Pain in right shoulder', category: 'symptom', isHCC: false },
    'M25.512': { description: 'Pain in left shoulder', category: 'symptom', isHCC: false },
    'M25.50': { description: 'Pain in unspecified joint', category: 'symptom', isHCC: false },
    'M25.559': { description: 'Pain in unspecified hip', category: 'symptom', isHCC: false },
    'M25.569': { description: 'Pain in unspecified knee', category: 'symptom', isHCC: false },
    'M79.1': { description: 'Myalgia (muscle pain)', category: 'symptom', isHCC: false },
    'M79.3': { description: 'Panniculitis, unspecified', category: 'symptom', isHCC: false },

    // Foot conditions
    'M21.612': { description: 'Bunion of left foot', category: 'chronic', isHCC: false },
    'M21.611': { description: 'Bunion of right foot', category: 'chronic', isHCC: false },
    'M21.619': { description: 'Bunion, unspecified foot', category: 'chronic', isHCC: false },

    // Neurological
    'G57.12': { description: 'Meralgia paresthetica, left lower limb', category: 'chronic', isHCC: false },
    'G57.11': { description: 'Meralgia paresthetica, right lower limb', category: 'chronic', isHCC: false },
    'R51': { description: 'Headache', category: 'symptom', isHCC: false },
    'G43': { description: 'Migraine', category: 'chronic', isHCC: false },
    'G43.909': { description: 'Migraine, unspecified', category: 'chronic', isHCC: false },

    // Mental Health - Mood Disorders
    'F31': { description: 'Bipolar disorder', category: 'chronic', isHCC: true },
    'F31.9': { description: 'Bipolar disorder, unspecified', category: 'chronic', isHCC: true },
    'F31.10': { description: 'Bipolar disorder, current manic episode, unspecified', category: 'chronic', isHCC: true },
    'F31.30': { description: 'Bipolar disorder, current depressive episode, unspecified', category: 'chronic', isHCC: true },
    'F32': { description: 'Major depressive disorder, single episode', category: 'chronic', isHCC: true },
    'F32.9': { description: 'Major depressive disorder, unspecified', category: 'chronic', isHCC: true, parent: 'F32' },
    'F33': { description: 'Major depressive disorder, recurrent', category: 'chronic', isHCC: true },
    'F33.9': { description: 'Major depressive disorder, recurrent, unspecified', category: 'chronic', isHCC: true },

    // Mental Health - Anxiety & Trauma
    'F41.1': { description: 'Generalized anxiety disorder', category: 'chronic', isHCC: false },
    'F41.9': { description: 'Anxiety disorder, unspecified', category: 'chronic', isHCC: false },
    'F43.10': { description: 'Post-traumatic stress disorder (PTSD)', category: 'chronic', isHCC: true },
    'F43.12': { description: 'Post-traumatic stress disorder, chronic', category: 'chronic', isHCC: true },

    // Substance Use
    'F10': { description: 'Alcohol related disorders', category: 'chronic', isHCC: true },
    'F10.20': { description: 'Alcohol dependence, uncomplicated', category: 'chronic', isHCC: true },
    'F10.21': { description: 'Alcohol dependence, in remission', category: 'chronic', isHCC: true },
    'F11': { description: 'Opioid related disorders', category: 'chronic', isHCC: true },
    'F11.20': { description: 'Opioid dependence, uncomplicated', category: 'chronic', isHCC: true },
    'F11.21': { description: 'Opioid dependence, in remission', category: 'chronic', isHCC: true },
    'F19': { description: 'Other psychoactive substance related disorders', category: 'chronic', isHCC: true },
    'F19.20': { description: 'Other drug dependence, uncomplicated', category: 'chronic', isHCC: true },
    'F19.21': { description: 'Other drug dependence, in remission', category: 'chronic', isHCC: true },
    'Z72.0': { description: 'Tobacco use', category: 'chronic', isHCC: false },
    'F17.210': { description: 'Nicotine dependence, cigarettes, uncomplicated', category: 'chronic', isHCC: false },
    'F17.211': { description: 'Nicotine dependence, cigarettes, in remission', category: 'chronic', isHCC: false },
    'F17.220': { description: 'Nicotine dependence, other tobacco, uncomplicated', category: 'chronic', isHCC: false },

    // GI Disorders
    'K58.9': { description: 'Irritable bowel syndrome (IBS)', category: 'chronic', isHCC: false },
    'K58.0': { description: 'IBS with diarrhea', category: 'chronic', isHCC: false },
    'K76.0': { description: 'Fatty liver, not elsewhere classified', category: 'chronic', isHCC: false },
    'K76.9': { description: 'Liver disease, unspecified', category: 'chronic', isHCC: false },

    // Dermatologic
    'L73.2': { description: 'Hidradenitis suppurativa', category: 'chronic', isHCC: false },
    'R61': { description: 'Generalized hyperhidrosis', category: 'symptom', isHCC: false },
    'L40.9': { description: 'Psoriasis, unspecified', category: 'chronic', isHCC: false },
    'L40.0': { description: 'Psoriasis vulgaris', category: 'chronic', isHCC: false },

    // Encounters & Z-codes
    'Z48.02': { description: 'Encounter for removal of sutures', category: 'acute', isHCC: false },
    'Z00.00': { description: 'General adult medical examination without abnormal findings', category: 'acute', isHCC: false },
    'Z00.01': { description: 'General adult medical examination with abnormal findings', category: 'acute', isHCC: false },
    'Z79.4': { description: 'Long term use of insulin', category: 'chronic', isHCC: false },
    'Z79.84': { description: 'Long term use of oral hypoglycemic drugs', category: 'chronic', isHCC: false },
    'Z59.1': { description: 'Inadequate housing (housing insecurity)', category: 'acute', isHCC: false },
    'Z59.0': { description: 'Homelessness', category: 'acute', isHCC: false },

    // Obesity
    'E66': { description: 'Overweight and obesity', category: 'chronic', isHCC: true },
    'E66.9': { description: 'Obesity, unspecified', category: 'chronic', isHCC: true, parent: 'E66' },
    'E66.01': { description: 'Morbid obesity due to excess calories', category: 'chronic', isHCC: true, parent: 'E66' },

    // Thyroid
    'E03': { description: 'Hypothyroidism', category: 'chronic', isHCC: false },
    'E03.9': { description: 'Hypothyroidism, unspecified', category: 'chronic', isHCC: false, parent: 'E03' },

    // Infections
    'A41.9': { description: 'Sepsis, unspecified organism', category: 'acute', isHCC: true },
    'L02.91': { description: 'Cutaneous abscess, unspecified', category: 'acute', isHCC: false },
};

/**
 * Extract all unique ICD codes mentioned in gaps
 */
function extractICD10FromGaps(gaps: DocumentationGap[]): string[] {
    const codes = new Set<string>();

    gaps.forEach(gap => {
        gap.icdCodes?.forEach(code => codes.add(code));
    });

    return Array.from(codes);
}

import { ExtractionEngine } from '@/lib/extraction/extraction-engine';

/**
 * Extract both ICD-10 and CPT codes from document text
 * Uses comprehensive extraction engine with NLP features
 */
export function extractCodesFromText(text: string): {
    icd10: ICD10Code[];
    cpt: Array<{ code: string; description: string; confidence: number }>;
} {
    const engine = new ExtractionEngine();
    const result = engine.extractSync(text, {
        codeSystems: ['icd10', 'cpt'], // Extract BOTH code systems
        nlp: {
            enableNegation: true,
            enableTemporal: true,
            enableFamilyHistoryFilter: true,
            enableDifferentialFilter: true,
            confidenceThreshold: 0.6,
        },
    });

    // Convert ICD-10 codes to legacy format
    const icd10Codes: ICD10Code[] = result.codes
        .filter(code => code.codeSystem === 'icd10')
        .map(code => ({
            code: code.code,
            description: code.description,
            category: (code.category as any) || 'symptom',
            isHCC: code.isHCC,
            source: 'documented' as const,
        }));

    // Extract CPT codes in simple format for gap detection
    const cptCodes = result.codes
        .filter(code => code.codeSystem === 'cpt')
        .map(code => ({
            code: code.code,
            description: code.description,
            confidence: code.confidence.overall,
        }));

    return { icd10: icd10Codes, cpt: cptCodes };
}

/**
 * Extract ICD-10 codes from document text
 * Uses comprehensive 74K+ code database with section-aware parsing and fuzzy matching
 * 
 * @deprecated Use extractCodesFromText for both ICD-10 and CPT codes
 */
function extractICD10FromText(text: string): ICD10Code[] {
    // Use new helper and return only ICD-10 for backward compatibility
    return extractCodesFromText(text).icd10;
}

/**
 * Check if two ICD codes conflict (e.g., parent and specific child)
 * E11.9 (without complications) conflicts with E11.65 (with hyperglycemia)
 */
function codesConflict(code1: string, code2: string): boolean {
    const info1 = ICD10_DATABASE[code1];
    const info2 = ICD10_DATABASE[code2];

    if (!info1 || !info2) return false;

    // Check if code1 excludes code2
    if (info1.excludes?.includes(code2)) return true;

    // Check if code2 excludes code1
    if (info2.excludes?.includes(code1)) return true;

    // Check if one is parent and one is child (same category, different specificity)
    if (info1.parent === code2 || info2.parent === code1) return true;

    return false;
}

/**
 * Determine which CPT codes are billable based on current documentation
 */
function determineCPTEligibility(
    currentLevel: string,
    suggestedLevel: string,
    gaps: DocumentationGap[]
): { current: CPTCode[]; potential: CPTCode[] } {
    const current: CPTCode[] = [];
    const potential: CPTCode[] = [];

    // Current level is always billable
    if (CPT_CODES[currentLevel]) {
        current.push({
            code: currentLevel,
            description: CPT_CODES[currentLevel].description,
            reimbursement: CPT_CODES[currentLevel].reimbursement,
            status: 'ready',
            complexity: CPT_CODES[currentLevel].complexity,
        });
    }

    // Suggested level and higher are potential
    const levels = ['99211', '99212', '99213', '99214', '99215'];
    const suggestedIndex = levels.indexOf(suggestedLevel);
    const currentIndex = levels.indexOf(currentLevel);

    if (suggestedIndex > currentIndex) {
        // Add suggested level
        const criticalGaps = gaps.filter(g => g.category === 'critical');
        const majorGaps = gaps.filter(g => g.category === 'major');

        potential.push({
            code: suggestedLevel,
            description: CPT_CODES[suggestedLevel].description,
            reimbursement: CPT_CODES[suggestedLevel].reimbursement,
            status: 'needs-fixes',
            requiredFixes: [...criticalGaps, ...majorGaps].slice(0, 3).map(g => g.id),
            complexity: CPT_CODES[suggestedLevel].complexity,
        });

        // Add highest level if not already suggested
        if (suggestedLevel !== '99215' && criticalGaps.length + majorGaps.length >= 3) {
            potential.push({
                code: '99215',
                description: CPT_CODES['99215'].description,
                reimbursement: CPT_CODES['99215'].reimbursement,
                status: 'needs-fixes',
                requiredFixes: gaps.filter(g => g.category !== 'minor').map(g => g.id),
                complexity: CPT_CODES['99215'].complexity,
            });
        }
    }

    return { current, potential };
}

/**
 * Main analysis function
 * @param result - The analysis result from document analysis
 * @param documentText - The original document text for ICD extraction
 */
export function analyzeBillingCodes(result: AnalysisResult, documentText?: string): BillingCodeAnalysis {
    // Extract CPT codes
    const cptCodes = determineCPTEligibility(
        result.currentEMLevel,
        result.suggestedEMLevel,
        result.gaps
    );

    // Extract ICD codes directly from document text if available
    const textBasedCodes = documentText ? extractICD10FromText(documentText) : [];

    // Extract ICD codes from gaps
    const allMentionedCodes = extractICD10FromGaps(result.gaps);

    // Categorize ICD codes
    const documented: ICD10Code[] = [...textBasedCodes]; // Start with text-extracted codes
    const missing: ICD10Code[] = [];

    // Track codes we've already documented
    const documentedCodes = new Set<string>(textBasedCodes.map(c => c.code));

    // First pass: add codes from non-critical gaps
    result.gaps.forEach(gap => {
        if (gap.category !== 'critical') {
            gap.icdCodes?.forEach(code => {
                if (!documentedCodes.has(code)) {
                    const info = ICD10_DATABASE[code];
                    if (info) {
                        documentedCodes.add(code);
                        documented.push({
                            code,
                            description: info.description,
                            category: info.category,
                            isHCC: info.isHCC,
                            source: 'documented',
                        });
                    }
                }
            });
        }
    });

    // Second pass: identify missing codes (from critical gaps)
    const missingCodes = new Set<string>();
    result.gaps.forEach(gap => {
        if (gap.category === 'critical') {
            gap.icdCodes?.forEach(code => {
                // Only add if not already documented
                if (!documentedCodes.has(code)) {
                    missingCodes.add(code);
                }
            });
        }
    });

    // Add missing codes to the list, checking for conflicts
    missingCodes.forEach(code => {
        const info = ICD10_DATABASE[code];
        if (!info) return;

        // Check if this code conflicts with any documented codes
        const hasConflict = Array.from(documentedCodes).some(docCode =>
            codesConflict(code, docCode)
        );

        if (!hasConflict) {
            missing.push({
                code,
                description: info.description,
                category: info.category,
                isHCC: info.isHCC,
                source: 'recommended',
            });
        }
    });

    // Calculate revenue impact
    const currentRev = CPT_CODES[result.currentEMLevel]?.reimbursement || '$0';
    const potentialRev = cptCodes.potential[0]?.reimbursement || currentRev;

    return {
        cptCodes,
        icdCodes: {
            documented,
            missing,
        },
        revenueImpact: {
            current: currentRev,
            potential: potentialRev,
            difference: result.totalPotentialRevenueLoss,
        },
    };
}

/**
 * Get a human-readable explanation of why codes might conflict
 */
export function getCodeConflictReason(code1: string, code2: string): string | null {
    if (!codesConflict(code1, code2)) return null;

    const info1 = ICD10_DATABASE[code1];
    const info2 = ICD10_DATABASE[code2];

    if (info1?.excludes?.includes(code2)) {
        return `${code1} (${info1.description}) excludes ${code2} as it represents a more specific diagnosis.`;
    }

    if (info2?.excludes?.includes(code1)) {
        return `${code2} (${info2.description}) excludes ${code1} as it represents a more specific diagnosis.`;
    }

    return `${code1} and ${code2} represent different levels of specificity for the same condition.`;
}
