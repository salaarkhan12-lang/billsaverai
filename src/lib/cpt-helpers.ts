/**
 * CPT Code Helper Functions
 * Utilities for detecting and working with CPT codes, especially E/M codes
 */

/**
 * Detect if CPT code is a new patient E/M visit (99202-99205)
 * 
 * @param cptCode - CPT code to check
 * @returns true if code is new patient E/M visit
 * 
 * @example
 * isNewPatientEM('99204') // true
 * isNewPatientEM('99213') // false
 */
export function isNewPatientEM(cptCode: string): boolean {
    return /^9920[2-5]$/.test(cptCode);
}

/**
 * Detect if CPT code is an established patient E/M visit (99211-99215)
 * 
 * @param cptCode - CPT code to check
 * @returns true if code is established patient E/M visit
 * 
 * @example
 * isEstablishedPatientEM('99213') // true
 * isEstablishedPatientEM('99204') // false
 */
export function isEstablishedPatientEM(cptCode: string): boolean {
    return /^9921[1-5]$/.test(cptCode);
}

/**
 * Detect if CPT code is any office/outpatient E/M visit
 * 
 * @param cptCode - CPT code to check
 * @returns true if code is office E/M visit (new or established)
 */
export function isOfficeEM(cptCode: string): boolean {
    return isNewPatientEM(cptCode) || isEstablishedPatientEM(cptCode);
}

/**
 * Get the next E/M level for upgrade suggestions
 * Handles both new patient (99202→99203→99204→99205) and 
 * established patient (99211→99212→99213→99214→99215) codes
 * 
 * @param currentCPT - Current CPT code
 * @returns Next level CPT code, or null if already at max or not an E/M code
 * 
 * @example
 * getNextEMLevel('99204') // '99205'
 * getNextEMLevel('99205') // null (already max)
 * getNextEMLevel('99213') // '99214'
 * getNextEMLevel('99490') // null (not an E/M code)
 */
export function getNextEMLevel(currentCPT: string): string | null {
    // New patient: 99202 → 99203 → 99204 → 99205
    if (currentCPT === '99202') return '99203';
    if (currentCPT === '99203') return '99204';
    if (currentCPT === '99204') return '99205';
    if (currentCPT === '99205') return null; // Already max

    // Established patient: 99211 → 99212 → 99213 → 99214 → 99215
    if (currentCPT === '99211') return '99212';
    if (currentCPT === '99212') return '99213';
    if (currentCPT === '99213') return '99214';
    if (currentCPT === '99214') return '99215';
    if (currentCPT === '99215') return null; // Already max

    // Not an office E/M code
    return null;
}

/**
 * Get E/M visit type (new vs established)
 * 
 * @param cptCode - CPT code to check
 * @returns 'new', 'established', or 'unknown'
 * 
 * @example
 * getEMVisitType('99204') // 'new'
 * getEMVisitType('99213') // 'established'
 * getEMVisitType('99490') // 'unknown'
 */
export function getEMVisitType(cptCode: string): 'new' | 'established' | 'unknown' {
    if (isNewPatientEM(cptCode)) return 'new';
    if (isEstablishedPatientEM(cptCode)) return 'established';
    return 'unknown';
}

/**
 * Get E/M complexity level (1-5)
 * 
 * @param cptCode - CPT code
 * @returns Complexity level 1-5, or null if not an E/M code
 * 
 * @example
 * getEMLevel('99204') // 4 (new patient level 4)
 * getEMLevel('99213') // 3 (established level 3, but numbered as 2)
 */
export function getEMLevel(cptCode: string): number | null {
    // New patient: 99202-99205 (levels 1-4)
    if (cptCode === '99202') return 1;
    if (cptCode === '99203') return 2;
    if (cptCode === '99204') return 3;
    if (cptCode === '99205') return 4;

    // Established patient: 99211-99215 (levels 0-4, but 99211 is minimal)
    if (cptCode === '99211') return 0; // Minimal/nurse visit
    if (cptCode === '99212') return 1;
    if (cptCode === '99213') return 2;
    if (cptCode === '99214') return 3;
    if (cptCode === '99215') return 4;

    return null;
}
