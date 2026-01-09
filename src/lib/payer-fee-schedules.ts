/**
 * Commercial Payer Fee Schedules
 * 
 * Fee schedules for major commercial insurance companies.
 * Rates are expressed as multipliers of Medicare baseline rates.
 * 
 * Commercial payers typically reimburse at 120-150% of Medicare rates.
 * Actual rates vary by:
 * - Contract negotiation
 * - Geographic locality
 * - Provider network tier (in-network vs out-of-network)
 * - Specialty
 * 
 * DATA SOURCE: Industry averages from billing companies and public filings
 * Last updated: January 2024
 */

import { getCPTCode } from './cpt-database';

export interface PayerFeeSchedule {
    payerId: string;
    payerName: string;
    payerShortName: string;
    rateMultiplier: number;      // Multiplier applied to Medicare base rates
    customRates?: Record<string, number>;  // Optional: specific code overrides
    locality?: string;            // Geographic region (e.g., "National", "NYC Metro")
    networkTier?: 'in-network' | 'out-of-network';
    effectiveDate: string;        // YYYY-MM-DD
    notes?: string;               // Additional context
}

/**
 * Commercial Payer Fee Schedules
 * 
 * These represent industry-average reimbursement rates for commercial insurers.
 * Actual contract rates may vary significantly based on negotiation.
 */
export const PAYER_FEE_SCHEDULES: Record<string, PayerFeeSchedule> = {
    // ============================================================================
    // BLUE CROSS BLUE SHIELD (BCBS)
    // Largest insurer in US, rates vary by state plan
    // ============================================================================
    'bcbs-national': {
        payerId: 'bcbs-national',
        payerName: 'Blue Cross Blue Shield (National Average)',
        payerShortName: 'BCBS',
        rateMultiplier: 1.35,  // 135% of Medicare
        locality: 'National Average',
        networkTier: 'in-network',
        effectiveDate: '2024-01-01',
        notes: 'Conservative estimate. Actual rates range from 130-145% depending on state plan.',
    },

    // ============================================================================
    // UNITEDHEALTHCARE (UHC)
    // Second largest insurer, competitive rates
    // ============================================================================
    'uhc-national': {
        payerId: 'uhc-national',
        payerName: 'UnitedHealthcare (National Average)',
        payerShortName: 'UHC',
        rateMultiplier: 1.30,  // 130% of Medicare
        locality: 'National Average',
        networkTier: 'in-network',
        effectiveDate: '2024-01-01',
        notes: 'Optum-affiliated providers may see higher rates (135-140%).',
    },

    // ============================================================================
    // AETNA (CVS Health)
    // Competitive rates, especially for chronic care
    // ============================================================================
    'aetna-national': {
        payerId: 'aetna-national',
        payerName: 'Aetna (National Average)',
        payerShortName: 'Aetna',
        rateMultiplier: 1.40,  // 140% of Medicare
        locality: 'National Average',
        networkTier: 'in-network',
        effectiveDate: '2024-01-01',
        notes: 'Higher multipliers for specialty care. CCM codes often at 150%.',
        customRates: {
            // Aetna pays premium for chronic care management
            '99490': 64.50,  // 43 × 1.5 = 64.50
            '99491': 138.00, // 92 × 1.5 = 138.00
        },
    },

    // ============================================================================
    // CIGNA
    // Strong commercial rates, especially for preventive care
    // ============================================================================
    'cigna-national': {
        payerId: 'cigna-national',
        payerName: 'Cigna (National Average)',
        payerShortName: 'Cigna',
        rateMultiplier: 1.38,  // 138% of Medicare
        locality: 'National Average',
        networkTier: 'in-network',
        effectiveDate: '2024-01-01',
        notes: 'Preventive care incentive programs may boost rates to 145%.',
    },

    // ============================================================================
    // HUMANA
    // Lower commercial tier but still above Medicare
    // ============================================================================
    'humana-national': {
        payerId: 'humana-national',
        payerName: 'Humana (National Average)',
        payerShortName: 'Humana',
        rateMultiplier: 1.25,  // 125% of Medicare
        locality: 'National Average',
        networkTier: 'in-network',
        effectiveDate: '2024-01-01',
        notes: 'Lower commercial rates but still above Medicare Advantage rates.',
    },

    // ============================================================================
    // CUSTOM/OTHER PAYER
    // Default for unlisted commercial payers
    // ============================================================================
    'custom': {
        payerId: 'custom',
        payerName: 'Custom/Other Commercial Payer',
        payerShortName: 'Custom',
        rateMultiplier: 1.25,  // Conservative default: 125% of Medicare
        locality: 'User-Defined',
        networkTier: 'in-network',
        effectiveDate: '2024-01-01',
        notes: 'Default rate for unlisted commercial payers. User can configure.',
    },

    // ============================================================================
    // REGIONAL PAYER EXAMPLES (for future expansion)
    // ============================================================================
    'bcbs-ny': {
        payerId: 'bcbs-ny',
        payerName: 'Blue Cross Blue Shield of New York',
        payerShortName: 'BCBS NY',
        rateMultiplier: 1.45,  // NYC area typically higher
        locality: 'New York Metro',
        networkTier: 'in-network',
        effectiveDate: '2024-01-01',
        notes: 'Higher NYC cost of living adjustment.',
    },

    'bcbs-ca': {
        payerId: 'bcbs-ca',
        payerName: 'Blue Shield of California',
        payerShortName: 'BCBS CA',
        rateMultiplier: 1.42,  // California competitive market
        locality: 'California',
        networkTier: 'in-network',
        effectiveDate: '2024-01-01',
        notes: 'Competitive California market drives higher rates.',
    },
};

/**
 * Get payer fee schedule by payer ID
 * @param payerId Payer identifier (e.g., "bcbs-national")
 * @returns Payer fee schedule or null if not found
 */
export function getPayerFeeSchedule(payerId: string): PayerFeeSchedule | null {
    return PAYER_FEE_SCHEDULES[payerId] || null;
}

/**
 * Get all available payers
 * @returns Array of all payer fee schedules
 */
export function getAllPayers(): PayerFeeSchedule[] {
    return Object.values(PAYER_FEE_SCHEDULES);
}

/**
 * Get payers by region/locality
 * @param locality Geographic region (e.g., "National Average", "New York Metro")
 * @returns Array of payers serving that region
 */
export function getPayersByLocality(locality: string): PayerFeeSchedule[] {
    return Object.values(PAYER_FEE_SCHEDULES).filter(
        payer => payer.locality === locality
    );
}

/**
 * Calculate payer-specific rate for a CPT code
 * @param cptCode CPT code (e.g., "99214")
 * @param payerId Payer identifier
 * @returns Payer-specific reimbursement rate in dollars
 */
export function calculatePayerRate(cptCode: string, payerId: string): number {
    const cpt = getCPTCode(cptCode);
    const payer = getPayerFeeSchedule(payerId);

    if (!cpt || !payer) {
        console.warn(`Invalid CPT code or payer: ${cptCode}, ${payerId}`);
        return 0;
    }

    // Check for custom rate override first
    if (payer.customRates && payer.customRates[cptCode]) {
        return payer.customRates[cptCode];
    }

    // Apply multiplier to base rate
    const payerRate = cpt.baseRate * payer.rateMultiplier;

    // Round to 2 decimal places (standard for currency)
    return Math.round(payerRate * 100) / 100;
}

/**
 * Get rate comparison across all payers for a given CPT code
 * @param cptCode CPT code to compare
 * @returns Array of {payerName, rate} sorted by rate descending
 */
export function comparePayerRates(cptCode: string): Array<{
    payerName: string;
    payerShortName: string;
    rate: number;
}> {
    const cpt = getCPTCode(cptCode);
    if (!cpt) return [];

    return Object.values(PAYER_FEE_SCHEDULES)
        .filter(payer => payer.locality === 'National Average') // Only national for fair comparison
        .map(payer => ({
            payerName: payer.payerName,
            payerShortName: payer.payerShortName,
            rate: calculatePayerRate(cptCode, payer.payerId),
        }))
        .sort((a, b) => b.rate - a.rate);
}

/**
 * Format rate as currency string
 * @param rate Dollar amount
 * @returns Formatted currency string (e.g., "$125.55")
 */
export function formatCurrency(rate: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(rate);
}
