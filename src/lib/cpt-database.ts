/**
 * CPT Code Database
 * 
 * Comprehensive database of Current Procedural Terminology (CPT) codes
 * with Medicare 2024 baseline rates. Commercial payers typically reimburse
 * at 1.2-1.5x these baseline rates.
 * 
 * Rates based on 2024 Medicare Physician Fee Schedule (non-facility)
 * National average (no geographic adjustment)
 */

export type CPTCategory =
    | 'office-visit'
    | 'preventive'
    | 'chronic-care'
    | 'transitional-care'
    | 'procedure'
    | 'consultation';

export interface CPTCode {
    code: string;
    description: string;
    category: CPTCategory;
    baseRate: number;  // Medicare 2024 national average
    rvu?: number;      // Relative Value Units (optional, for advanced calculations)
}

/**
 * CPT Code Database
 * Organized by category for easy reference
 */
export const CPT_CODES: Record<string, CPTCode> = {
    // ============================================================================
    // OFFICE/OUTPATIENT VISITS - Established Patient
    // Most common E/M codes for established patients
    // ============================================================================
    '99211': {
        code: '99211',
        description: 'Office visit, established patient, minimal (nurse visit)',
        category: 'office-visit',
        baseRate: 24.00,
        rvu: 0.18,
    },
    '99212': {
        code: '99212',
        description: 'Office visit, established patient, level 1 (straightforward)',
        category: 'office-visit',
        baseRate: 55.00,
        rvu: 0.70,
    },
    '99213': {
        code: '99213',
        description: 'Office visit, established patient, level 2 (low complexity)',
        category: 'office-visit',
        baseRate: 93.00,
        rvu: 1.30,
    },
    '99214': {
        code: '99214',
        description: 'Office visit, established patient, level 3 (moderate complexity)',
        category: 'office-visit',
        baseRate: 131.00,
        rvu: 1.92,
    },
    '99215': {
        code: '99215',
        description: 'Office visit, established patient, level 4 (high complexity)',
        category: 'office-visit',
        baseRate: 185.00,
        rvu: 2.80,
    },

    // ============================================================================
    // OFFICE/OUTPATIENT VISITS - New Patient
    // Higher reimbursement for new patient encounters
    // ============================================================================
    '99201': {
        code: '99201',
        description: 'Office visit, new patient, level 1 (deleted 2021, kept for reference)',
        category: 'office-visit',
        baseRate: 0.00,  // Code deleted
        rvu: 0.00,
    },
    '99202': {
        code: '99202',
        description: 'Office visit, new patient, level 1 (straightforward)',
        category: 'office-visit',
        baseRate: 76.00,
        rvu: 0.93,
    },
    '99203': {
        code: '99203',
        description: 'Office visit, new patient, level 2 (low complexity)',
        category: 'office-visit',
        baseRate: 111.00,
        rvu: 1.60,
    },
    '99204': {
        code: '99204',
        description: 'Office visit, new patient, level 3 (moderate complexity)',
        category: 'office-visit',
        baseRate: 167.00,
        rvu: 2.60,
    },
    '99205': {
        code: '99205',
        description: 'Office visit, new patient, level 4 (high complexity)',
        category: 'office-visit',
        baseRate: 224.00,
        rvu: 3.50,
    },

    // ============================================================================
    // PREVENTIVE CARE - New Patient
    // Annual wellness visits and physicals
    // ============================================================================
    '99381': {
        code: '99381',
        description: 'Preventive visit, new patient, infant (age < 1 year)',
        category: 'preventive',
        baseRate: 150.00,
        rvu: 2.22,
    },
    '99382': {
        code: '99382',
        description: 'Preventive visit, new patient, child (age 1-4 years)',
        category: 'preventive',
        baseRate: 157.00,
        rvu: 2.33,
    },
    '99383': {
        code: '99383',
        description: 'Preventive visit, new patient, child (age 5-11 years)',
        category: 'preventive',
        baseRate: 164.00,
        rvu: 2.43,
    },
    '99384': {
        code: '99384',
        description: 'Preventive visit, new patient, adolescent (age 12-17 years)',
        category: 'preventive',
        baseRate: 176.00,
        rvu: 2.61,
    },
    '99385': {
        code: '99385',
        description: 'Preventive visit, new patient, adult (age 18-39 years)',
        category: 'preventive',
        baseRate: 183.00,
        rvu: 2.71,
    },
    '99386': {
        code: '99386',
        description: 'Preventive visit, new patient, adult (age 40-64 years)',
        category: 'preventive',
        baseRate: 202.00,
        rvu: 2.99,
    },
    '99387': {
        code: '99387',
        description: 'Preventive visit, new patient, senior (age 65+ years)',
        category: 'preventive',
        baseRate: 220.00,
        rvu: 3.25,
    },

    // ============================================================================
    // PREVENTIVE CARE - Established Patient
    // ============================================================================
    '99391': {
        code: '99391',
        description: 'Preventive visit, established patient, infant (age < 1 year)',
        category: 'preventive',
        baseRate: 130.00,
        rvu: 1.92,
    },
    '99392': {
        code: '99392',
        description: 'Preventive visit, established patient, child (age 1-4 years)',
        category: 'preventive',
        baseRate: 137.00,
        rvu: 2.03,
    },
    '99393': {
        code: '99393',
        description: 'Preventive visit, established patient, child (age 5-11 years)',
        category: 'preventive',
        baseRate: 144.00,
        rvu: 2.13,
    },
    '99394': {
        code: '99394',
        description: 'Preventive visit, established patient, adolescent (age 12-17 years)',
        category: 'preventive',
        baseRate: 156.00,
        rvu: 2.31,
    },
    '99395': {
        code: '99395',
        description: 'Preventive visit, established patient, adult (age 18-39 years)',
        category: 'preventive',
        baseRate: 163.00,
        rvu: 2.41,
    },
    '99396': {
        code: '99396',
        description: 'Preventive visit, established patient, adult (age 40-64 years)',
        category: 'preventive',
        baseRate: 182.00,
        rvu: 2.69,
    },
    '99397': {
        code: '99397',
        description: 'Preventive visit, established patient, senior (age 65+ years)',
        category: 'preventive',
        baseRate: 200.00,
        rvu: 2.96,
    },

    // ============================================================================
    // CHRONIC CARE MANAGEMENT (CCM)
    // High-value add-on codes for managing chronic conditions
    // ============================================================================
    '99490': {
        code: '99490',
        description: 'Chronic care management, first 20 minutes/month',
        category: 'chronic-care',
        baseRate: 43.00,
        rvu: 0.61,
    },
    '99491': {
        code: '99491',
        description: 'Chronic care management, first 30 minutes/month',
        category: 'chronic-care',
        baseRate: 92.00,
        rvu: 1.30,
    },
    '99437': {
        code: '99437',
        description: 'Chronic care management, each additional 20 minutes',
        category: 'chronic-care',
        baseRate: 50.00,
        rvu: 0.70,
    },
    '99439': {
        code: '99439',
        description: 'Chronic care management, each additional 20 minutes (complex)',
        category: 'chronic-care',
        baseRate: 50.00,
        rvu: 0.70,
    },

    // ============================================================================
    // PRINCIPAL CARE MANAGEMENT (PCM)
    // For single high-risk chronic condition
    // ============================================================================
    '99424': {
        code: '99424',
        description: 'Principal care management, first 30 minutes/month',
        category: 'chronic-care',
        baseRate: 87.00,
        rvu: 1.23,
    },
    '99425': {
        code: '99425',
        description: 'Principal care management, each additional 30 minutes',
        category: 'chronic-care',
        baseRate: 62.00,
        rvu: 0.87,
    },

    // ============================================================================
    // TRANSITIONAL CARE MANAGEMENT (TCM)
    // Post-discharge follow-up within 7-14 days
    // ============================================================================
    '99495': {
        code: '99495',
        description: 'Transitional care management, moderate complexity (14-day contact)',
        category: 'transitional-care',
        baseRate: 167.00,
        rvu: 2.43,
    },
    '99496': {
        code: '99496',
        description: 'Transitional care management, high complexity (7-day contact)',
        category: 'transitional-care',
        baseRate: 234.00,
        rvu: 3.40,
    },

    // ============================================================================
    // CONSULTATION CODES (for reference, often replaced by office visit codes)
    // ============================================================================
    '99241': {
        code: '99241',
        description: 'Office consultation, level 1 (not covered by Medicare)',
        category: 'consultation',
        baseRate: 0.00,  // Not covered by Medicare
    },
    '99242': {
        code: '99242',
        description: 'Office consultation, level 2 (not covered by Medicare)',
        category: 'consultation',
        baseRate: 0.00,
    },
    '99243': {
        code: '99243',
        description: 'Office consultation, level 3 (not covered by Medicare)',
        category: 'consultation',
        baseRate: 0.00,
    },
    '99244': {
        code: '99244',
        description: 'Office consultation, level 4 (not covered by Medicare)',
        category: 'consultation',
        baseRate: 0.00,
    },
    '99245': {
        code: '99245',
        description: 'Office consultation, level 5 (not covered by Medicare)',
        category: 'consultation',
        baseRate: 0.00,
    },
};

/**
 * Get CPT code details by code
 * @param code CPT code (e.g., "99214")
 * @returns CPT code details or null if not found
 */
export function getCPTCode(code: string): CPTCode | null {
    return CPT_CODES[code] || null;
}

/**
 * Get all CPT codes by category
 * @param category CPT category
 * @returns Array of CPT codes in that category
 */
export function getCPTCodesByCategory(category: CPTCategory): CPTCode[] {
    return Object.values(CPT_CODES).filter(cpt => cpt.category === category);
}

/**
 * Get all office visit codes (most common for gap analysis)
 * @returns Array of office visit CPT codes
 */
export function getOfficeVisitCodes(): CPTCode[] {
    return getCPTCodesByCategory('office-visit');
}

/**
 * Validate if a CPT code exists and is active (not deleted)
 * @param code CPT code to validate
 * @returns True if code exists and has non-zero base rate
 */
export function isValidCPTCode(code: string): boolean {
    const cpt = getCPTCode(code);
    return cpt !== null && cpt.baseRate > 0;
}

/**
 * Get upgrade path suggestions for a given CPT code
 * @param currentCode Current CPT code
 * @returns Array of potential upgrade codes with higher reimbursement
 */
export function getUpgradePath(currentCode: string): CPTCode[] {
    const current = getCPTCode(currentCode);
    if (!current) return [];

    // Only suggest upgrades within same category
    return getCPTCodesByCategory(current.category)
        .filter(cpt => cpt.baseRate > current.baseRate)
        .sort((a, b) => a.baseRate - b.baseRate);
}
