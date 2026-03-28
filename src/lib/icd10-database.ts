/**
 * ICD-10 Code Database
 * 
 * Comprehensive database of ICD-10-CM diagnosis codes commonly used
 * in outpatient medical documentation. Includes HCC (Hierarchical
 * Condition Category) flags for risk adjustment and exclusion rules
 * for proper code hierarchy.
 * 
 * Structure:
 * - Codes organized by body system/condition category
 * - Parent-child relationships for code hierarchy
 * - Exclusion rules to prevent conflicting code combinations
 * - HCC flags for Medicare Advantage risk adjustment
 */

export interface ICD10CodeInfo {
    code: string;
    description: string;
    category: 'chronic' | 'acute' | 'symptom';
    isHCC?: boolean;
    excludes?: string[];  // Codes that conflict with this one
    parent?: string;      // Parent code in hierarchy
    // HCC Risk Adjustment Fields
    hccCategory?: number;        // HCC category number (1-86+)
    hccDescription?: string;     // Human-readable HCC category name
    rafWeight?: number;          // Risk Adjustment Factor weight (e.g., 0.302)
    specificityUpgrade?: string; // More specific code if available for upgrade
}

/**
 * ICD-10 Code Database
 * Organized by condition category for easy reference
 */
export const ICD10_DATABASE: Record<string, ICD10CodeInfo> = {
    // ============================================================================
    // DIABETES MELLITUS
    // Type 1 and Type 2 with varying complications
    // HCC 18: DM with Complications (RAF 0.302) - Higher value
    // HCC 19: DM without Complications (RAF 0.105) - Lower value, upgrade target
    // ============================================================================
    'E11': { code: 'E11', description: 'Type 2 Diabetes Mellitus', category: 'chronic', isHCC: true, hccCategory: 19, hccDescription: 'Diabetes without Complications', rafWeight: 0.105 },
    'E11.9': { code: 'E11.9', description: 'Type 2 DM without complications', category: 'chronic', isHCC: true, parent: 'E11', hccCategory: 19, hccDescription: 'Diabetes without Complications', rafWeight: 0.105, specificityUpgrade: 'E11.65' },
    'E11.65': { code: 'E11.65', description: 'Type 2 DM with hyperglycemia', category: 'chronic', isHCC: true, parent: 'E11', excludes: ['E11.9'], hccCategory: 18, hccDescription: 'Diabetes with Chronic Complications', rafWeight: 0.302 },
    'E11.22': { code: 'E11.22', description: 'Type 2 DM with chronic kidney disease', category: 'chronic', isHCC: true, parent: 'E11', excludes: ['E11.9'], hccCategory: 18, hccDescription: 'Diabetes with Chronic Complications', rafWeight: 0.302 },
    'E11.40': { code: 'E11.40', description: 'Type 2 DM with diabetic neuropathy', category: 'chronic', isHCC: true, parent: 'E11', excludes: ['E11.9'], hccCategory: 18, hccDescription: 'Diabetes with Chronic Complications', rafWeight: 0.302 },
    'E11.3': { code: 'E11.3', description: 'Type 2 DM with ophthalmic complications', category: 'chronic', isHCC: true, parent: 'E11', excludes: ['E11.9'], hccCategory: 18, hccDescription: 'Diabetes with Chronic Complications', rafWeight: 0.302 },
    'E10': { code: 'E10', description: 'Type 1 Diabetes Mellitus', category: 'chronic', isHCC: true, hccCategory: 19, hccDescription: 'Diabetes without Complications', rafWeight: 0.105 },
    'E10.9': { code: 'E10.9', description: 'Type 1 DM without complications', category: 'chronic', isHCC: true, parent: 'E10' },

    // ============================================================================
    // HYPERTENSION
    // Essential and secondary hypertension with complications
    // ============================================================================
    'I10': { code: 'I10', description: 'Essential (primary) hypertension', category: 'chronic', isHCC: false },
    'I11': { code: 'I11', description: 'Hypertensive heart disease', category: 'chronic', isHCC: true, parent: 'I10' },
    'I12': { code: 'I12', description: 'Hypertensive chronic kidney disease', category: 'chronic', isHCC: true, parent: 'I10' },
    'I13': { code: 'I13', description: 'Hypertensive heart and chronic kidney disease', category: 'chronic', isHCC: true, parent: 'I10' },

    // ============================================================================
    // HEART FAILURE
    // Various types and acuity levels
    // HCC 85: Congestive Heart Failure (RAF 0.323) - High value HCC
    // ============================================================================
    'I50': { code: 'I50', description: 'Heart failure', category: 'chronic', isHCC: true, hccCategory: 85, hccDescription: 'Congestive Heart Failure', rafWeight: 0.323 },
    'I50.9': { code: 'I50.9', description: 'Heart failure, unspecified', category: 'chronic', isHCC: true, parent: 'I50', hccCategory: 85, hccDescription: 'Congestive Heart Failure', rafWeight: 0.323, specificityUpgrade: 'I50.22' },
    'I50.21': { code: 'I50.21', description: 'Acute systolic heart failure', category: 'acute', isHCC: true, parent: 'I50', hccCategory: 85, hccDescription: 'Congestive Heart Failure', rafWeight: 0.323 },
    'I50.22': { code: 'I50.22', description: 'Chronic systolic heart failure', category: 'chronic', isHCC: true, parent: 'I50', hccCategory: 85, hccDescription: 'Congestive Heart Failure', rafWeight: 0.323 },
    'I50.23': { code: 'I50.23', description: 'Acute on chronic systolic heart failure', category: 'chronic', isHCC: true, parent: 'I50', hccCategory: 85, hccDescription: 'Congestive Heart Failure', rafWeight: 0.323 },
    'I50.31': { code: 'I50.31', description: 'Acute diastolic heart failure', category: 'acute', isHCC: true, parent: 'I50', hccCategory: 85, hccDescription: 'Congestive Heart Failure', rafWeight: 0.323 },
    'I50.32': { code: 'I50.32', description: 'Chronic diastolic heart failure', category: 'chronic', isHCC: true, parent: 'I50', hccCategory: 85, hccDescription: 'Congestive Heart Failure', rafWeight: 0.323 },
    'I50.33': { code: 'I50.33', description: 'Acute on chronic diastolic heart failure', category: 'chronic', isHCC: true, parent: 'I50', hccCategory: 85, hccDescription: 'Congestive Heart Failure', rafWeight: 0.323 },

    // ============================================================================
    // LIPID DISORDERS
    // Hyperlipidemia and related conditions
    // ============================================================================
    'E78.5': { code: 'E78.5', description: 'Hyperlipidemia, unspecified', category: 'chronic', isHCC: false },
    'E78.0': { code: 'E78.0', description: 'Pure hypercholesterolemia', category: 'chronic', isHCC: false },
    'E78.2': { code: 'E78.2', description: 'Mixed hyperlipidemia', category: 'chronic', isHCC: false },

    // ============================================================================
    // CHRONIC KIDNEY DISEASE
    // CKD stages 1-5 and ESRD
    // ============================================================================
    'N18': { code: 'N18', description: 'Chronic kidney disease', category: 'chronic', isHCC: true },
    'N18.1': { code: 'N18.1', description: 'Chronic kidney disease, stage 1', category: 'chronic', isHCC: false },
    'N18.2': { code: 'N18.2', description: 'Chronic kidney disease, stage 2', category: 'chronic', isHCC: false },
    'N18.3': { code: 'N18.3', description: 'Chronic kidney disease, stage 3', category: 'chronic', isHCC: true },
    'N18.4': { code: 'N18.4', description: 'Chronic kidney disease, stage 4', category: 'chronic', isHCC: true },
    'N18.5': { code: 'N18.5', description: 'Chronic kidney disease, stage 5', category: 'chronic', isHCC: true },
    'N18.6': { code: 'N18.6', description: 'End stage renal disease', category: 'chronic', isHCC: true },
    'N18.9': { code: 'N18.9', description: 'Chronic kidney disease, unspecified', category: 'chronic', isHCC: true, parent: 'N18' },

    // ============================================================================
    // RESPIRATORY CONDITIONS
    // COPD, Asthma, and related conditions
    // HCC 111: Chronic Obstructive Pulmonary Disease (RAF 0.335) - High value HCC
    // ============================================================================
    'J44.9': { code: 'J44.9', description: 'COPD, unspecified', category: 'chronic', isHCC: true, hccCategory: 111, hccDescription: 'Chronic Obstructive Pulmonary Disease', rafWeight: 0.335 },
    'J44.0': { code: 'J44.0', description: 'COPD with acute lower respiratory infection', category: 'acute', isHCC: true, parent: 'J44.9', hccCategory: 111, hccDescription: 'Chronic Obstructive Pulmonary Disease', rafWeight: 0.335 },
    'J44.1': { code: 'J44.1', description: 'COPD with acute exacerbation', category: 'acute', isHCC: true, parent: 'J44.9', hccCategory: 111, hccDescription: 'Chronic Obstructive Pulmonary Disease', rafWeight: 0.335 },
    'J45': { code: 'J45', description: 'Asthma', category: 'chronic', isHCC: false },
    'J45.20': { code: 'J45.20', description: 'Mild intermittent asthma, uncomplicated', category: 'chronic', isHCC: false },

    // ============================================================================
    // CARDIAC ARRHYTHMIAS & ISCHEMIC HEART DISEASE
    // ============================================================================
    'I48': { code: 'I48', description: 'Atrial fibrillation and flutter', category: 'chronic', isHCC: true },
    'I48.91': { code: 'I48.91', description: 'Atrial fibrillation, unspecified', category: 'chronic', isHCC: true, parent: 'I48' },
    'I25': { code: 'I25', description: 'Chronic ischemic heart disease', category: 'chronic', isHCC: true },
    'I25.10': { code: 'I25.10', description: 'Atherosclerotic heart disease without angina', category: 'chronic', isHCC: true, parent: 'I25' },

    // ============================================================================
    // MUSCULOSKELETAL PAIN
    // Common pain syndromes
    // ============================================================================
    'M54.5': { code: 'M54.5', description: 'Low back pain', category: 'symptom', isHCC: false },
    'M54.9': { code: 'M54.9', description: 'Dorsalgia, unspecified (back pain)', category: 'symptom', isHCC: false },
    'M25.511': { code: 'M25.511', description: 'Pain in right shoulder', category: 'symptom', isHCC: false },
    'M25.512': { code: 'M25.512', description: 'Pain in left shoulder', category: 'symptom', isHCC: false },
    'M25.50': { code: 'M25.50', description: 'Pain in unspecified joint', category: 'symptom', isHCC: false },
    'M25.559': { code: 'M25.559', description: 'Pain in unspecified hip', category: 'symptom', isHCC: false },
    'M25.569': { code: 'M25.569', description: 'Pain in unspecified knee', category: 'symptom', isHCC: false },
    'M79.1': { code: 'M79.1', description: 'Myalgia (muscle pain)', category: 'symptom', isHCC: false },
    'M79.3': { code: 'M79.3', description: 'Panniculitis, unspecified', category: 'symptom', isHCC: false },

    // ============================================================================
    // FOOT CONDITIONS
    // ============================================================================
    'M21.612': { code: 'M21.612', description: 'Bunion of left foot', category: 'chronic', isHCC: false },
    'M21.611': { code: 'M21.611', description: 'Bunion of right foot', category: 'chronic', isHCC: false },
    'M21.619': { code: 'M21.619', description: 'Bunion, unspecified foot', category: 'chronic', isHCC: false },

    // ============================================================================
    // NEUROLOGICAL CONDITIONS
    // ============================================================================
    'G57.12': { code: 'G57.12', description: 'Meralgia paresthetica, left lower limb', category: 'chronic', isHCC: false },
    'G57.11': { code: 'G57.11', description: 'Meralgia paresthetica, right lower limb', category: 'chronic', isHCC: false },
    'R51': { code: 'R51', description: 'Headache', category: 'symptom', isHCC: false },
    'G43': { code: 'G43', description: 'Migraine', category: 'chronic', isHCC: false },
    'G43.909': { code: 'G43.909', description: 'Migraine, unspecified', category: 'chronic', isHCC: false },

    // ============================================================================
    // MENTAL HEALTH - MOOD DISORDERS
    // ============================================================================
    'F31': { code: 'F31', description: 'Bipolar disorder', category: 'chronic', isHCC: true },
    'F31.9': { code: 'F31.9', description: 'Bipolar disorder, unspecified', category: 'chronic', isHCC: true },
    'F31.10': { code: 'F31.10', description: 'Bipolar disorder, current manic episode, unspecified', category: 'chronic', isHCC: true },
    'F31.30': { code: 'F31.30', description: 'Bipolar disorder, current depressive episode, unspecified', category: 'chronic', isHCC: true },
    'F32': { code: 'F32', description: 'Major depressive disorder, single episode', category: 'chronic', isHCC: true },
    'F32.9': { code: 'F32.9', description: 'Major depressive disorder, unspecified', category: 'chronic', isHCC: true, parent: 'F32' },
    'F33': { code: 'F33', description: 'Major depressive disorder, recurrent', category: 'chronic', isHCC: true },
    'F33.9': { code: 'F33.9', description: 'Major depressive disorder, recurrent, unspecified', category: 'chronic', isHCC: true },

    // ============================================================================
    // MENTAL HEALTH - ANXIETY & TRAUMA
    // ============================================================================
    'F41.1': { code: 'F41.1', description: 'Generalized anxiety disorder', category: 'chronic', isHCC: false },
    'F41.9': { code: 'F41.9', description: 'Anxiety disorder, unspecified', category: 'chronic', isHCC: false },
    'F43.10': { code: 'F43.10', description: 'Post-traumatic stress disorder (PTSD)', category: 'chronic', isHCC: true },
    'F43.12': { code: 'F43.12', description: 'Post-traumatic stress disorder, chronic', category: 'chronic', isHCC: true },

    // ============================================================================
    // SUBSTANCE USE DISORDERS
    // ============================================================================
    'F10': { code: 'F10', description: 'Alcohol related disorders', category: 'chronic', isHCC: true },
    'F10.20': { code: 'F10.20', description: 'Alcohol dependence, uncomplicated', category: 'chronic', isHCC: true },
    'F10.21': { code: 'F10.21', description: 'Alcohol dependence, in remission', category: 'chronic', isHCC: true },
    'F11': { code: 'F11', description: 'Opioid related disorders', category: 'chronic', isHCC: true },
    'F11.20': { code: 'F11.20', description: 'Opioid dependence, uncomplicated', category: 'chronic', isHCC: true },
    'F11.21': { code: 'F11.21', description: 'Opioid dependence, in remission', category: 'chronic', isHCC: true },
    'F19': { code: 'F19', description: 'Other psychoactive substance related disorders', category: 'chronic', isHCC: true },
    'F19.20': { code: 'F19.20', description: 'Other drug dependence, uncomplicated', category: 'chronic', isHCC: true },
    'F19.21': { code: 'F19.21', description: 'Other drug dependence, in remission', category: 'chronic', isHCC: true },
    'Z72.0': { code: 'Z72.0', description: 'Tobacco use', category: 'chronic', isHCC: false },
    'F17.210': { code: 'F17.210', description: 'Nicotine dependence, cigarettes, uncomplicated', category: 'chronic', isHCC: false },
    'F17.211': { code: 'F17.211', description: 'Nicotine dependence, cigarettes, in remission', category: 'chronic', isHCC: false },
    'F17.220': { code: 'F17.220', description: 'Nicotine dependence, other tobacco, uncomplicated', category: 'chronic', isHCC: false },

    // ============================================================================
    // GASTROINTESTINAL DISORDERS
    // ============================================================================
    'K58.9': { code: 'K58.9', description: 'Irritable bowel syndrome (IBS)', category: 'chronic', isHCC: false },
    'K58.0': { code: 'K58.0', description: 'IBS with diarrhea', category: 'chronic', isHCC: false },
    'K76.0': { code: 'K76.0', description: 'Fatty liver, not elsewhere classified', category: 'chronic', isHCC: false },
    'K76.9': { code: 'K76.9', description: 'Liver disease, unspecified', category: 'chronic', isHCC: false },

    // ============================================================================
    // DERMATOLOGIC CONDITIONS
    // ============================================================================
    'L73.2': { code: 'L73.2', description: 'Hidradenitis suppurativa', category: 'chronic', isHCC: false },
    'R61': { code: 'R61', description: 'Generalized hyperhidrosis', category: 'symptom', isHCC: false },
    'L40.9': { code: 'L40.9', description: 'Psoriasis, unspecified', category: 'chronic', isHCC: false },
    'L40.0': { code: 'L40.0', description: 'Psoriasis vulgaris', category: 'chronic', isHCC: false },

    // ============================================================================
    // ENCOUNTERS & Z-CODES
    // Reason for visit and health status codes
    // ============================================================================
    'Z48.02': { code: 'Z48.02', description: 'Encounter for removal of sutures', category: 'acute', isHCC: false },
    'Z00.00': { code: 'Z00.00', description: 'General adult medical examination without abnormal findings', category: 'acute', isHCC: false },
    'Z00.01': { code: 'Z00.01', description: 'General adult medical examination with abnormal findings', category: 'acute', isHCC: false },
    'Z79.4': { code: 'Z79.4', description: 'Long term use of insulin', category: 'chronic', isHCC: false },
    'Z79.84': { code: 'Z79.84', description: 'Long term use of oral hypoglycemic drugs', category: 'chronic', isHCC: false },
    'Z59.1': { code: 'Z59.1', description: 'Inadequate housing (housing insecurity)', category: 'acute', isHCC: false },
    'Z59.0': { code: 'Z59.0', description: 'Homelessness', category: 'acute', isHCC: false },

    // ============================================================================
    // OBESITY & METABOLIC
    // HCC 22: Morbid Obesity (RAF 0.250) - Requires BMI ≥ 40
    // ============================================================================
    'E66': { code: 'E66', description: 'Overweight and obesity', category: 'chronic', isHCC: false },
    'E66.9': { code: 'E66.9', description: 'Obesity, unspecified', category: 'chronic', isHCC: false, parent: 'E66', specificityUpgrade: 'E66.01' },
    'E66.01': { code: 'E66.01', description: 'Morbid obesity due to excess calories', category: 'chronic', isHCC: true, parent: 'E66', hccCategory: 22, hccDescription: 'Morbid Obesity', rafWeight: 0.250 },

    // ============================================================================
    // THYROID DISORDERS
    // ============================================================================
    'E03': { code: 'E03', description: 'Hypothyroidism', category: 'chronic', isHCC: false },
    'E03.9': { code: 'E03.9', description: 'Hypothyroidism, unspecified', category: 'chronic', isHCC: false, parent: 'E03' },

    // ============================================================================
    // INFECTIONS
    // ============================================================================
    'A41.9': { code: 'A41.9', description: 'Sepsis, unspecified organism', category: 'acute', isHCC: true },
    'L02.91': { code: 'L02.91', description: 'Cutaneous abscess, unspecified', category: 'acute', isHCC: false },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get ICD-10 code information
 * @param code ICD-10 code
 * @returns Code information or null if not found
 */
export function getICD10Code(code: string): ICD10CodeInfo | null {
    return ICD10_DATABASE[code] || null;
}

/**
 * Get all ICD-10 codes by category
 * @param category Code category (chronic, acute, symptom)
 * @returns Array of codes in that category
 */
export function getICD10CodesByCategory(category: 'chronic' | 'acute' | 'symptom'): ICD10CodeInfo[] {
    return Object.values(ICD10_DATABASE).filter(icd => icd.category === category);
}

/**
 * Get all HCC (Hierarchical Condition Category) codes
 * These are important for Medicare Advantage risk adjustment
 * @returns Array of HCC codes
 */
export function getHCCCodes(): ICD10CodeInfo[] {
    return Object.values(ICD10_DATABASE).filter(icd => icd.isHCC);
}

/**
 * Check if two ICD-10 codes conflict with each other
 * Codes conflict if one excludes the other or if they're in a parent-child hierarchy
 * @param code1 First ICD-10 code
 * @param code2 Second ICD-10 code
 * @returns True if codes conflict
 */
export function doCodesConflict(code1: string, code2: string): boolean {
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
 * Get a human-readable explanation of why codes conflict
 * @param code1 First ICD-10 code
 * @param code2 Second ICD-10 code
 * @returns Conflict explanation or null if codes don't conflict
 */
export function getCodeConflictReason(code1: string, code2: string): string | null {
    if (!doCodesConflict(code1, code2)) return null;

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

/**
 * Validate if an ICD-10 code exists in the database
 * @param code ICD-10 code to validate
 * @returns True if code exists
 */
export function isValidICD10Code(code: string): boolean {
    return ICD10_DATABASE[code] !== undefined;
}
