/**
 * Revenue System Type Definitions
 * 
 * Centralized types for the CPT pricing and revenue calculation system.
 * Used across multiple modules for type safety.
 */

// ============================================================================
// CPT CODE TYPES
// ============================================================================

/**
 * CPT Code Categories
 * Groups codes by type of service
 */
export type CPTCategory =
    | 'office-visit'        // Outpatient E/M visits
    | 'preventive'          // Annual wellness, physicals
    | 'chronic-care'        // CCM, PCM codes
    | 'transitional-care'   // Post-discharge TCM codes
    | 'procedure'           // Surgical/procedural codes
    | 'consultation';       // Specialty consultations

/**
 * CPT Code Definition
 * Contains all metadata for a single CPT code
 */
export interface CPTCode {
    code: string;              // CPT code (e.g., "99214")
    description: string;       // Human-readable description
    category: CPTCategory;     // Code category
    baseRate: number;          // Medicare 2024 national average ($)
    rvu?: number;              // Relative Value Units (optional)
}

// ============================================================================
// PAYER TYPES
// ============================================================================

/**
 * Network tier affects reimbursement rates
 */
export type NetworkTier = 'in-network' | 'out-of-network';

/**
 * Commercial Payer Fee Schedule
 * Defines how a specific insurance company reimburses
 */
export interface PayerFeeSchedule {
    payerId: string;           // Unique identifier (e.g., "bcbs-national")
    payerName: string;         // Full name (e.g., "Blue Cross Blue Shield")
    payerShortName: string;    // Abbreviated name (e.g., "BCBS")
    rateMultiplier: number;    // Multiplier applied to Medicare rates (e.g., 1.35)
    customRates?: Record<string, number>;  // Optional code-specific overrides
    locality?: string;         // Geographic region
    networkTier?: NetworkTier; // In-network vs out-of-network
    effectiveDate: string;     // YYYY-MM-DD
    notes?: string;            // Additional context
}

// ============================================================================
// REVENUE CALCULATION TYPES
// ============================================================================

/**
 * Detailed revenue calculation result
 * Shows current vs potential billing with precise dollar amounts
 */
export interface RevenueCalculation {
    currentLevel: {
        cptCode: string;
        description: string;
        baseRate: number;      // Medicare baseline
        payerRate: number;     // Commercial payer rate
        payer: string;         // Payer ID
    };
    potentialLevel: {
        cptCode: string;
        description: string;
        baseRate: number;
        payerRate: number;
    };
    perVisitGap: number;     // Revenue gap per visit ($)
    annualizedGap: number;   // Estimated annual loss ($)
    confidence: number;      // 0-1 scale
}

/**
 * Options for calculating revenue impact
 */
export interface RevenueCalculationOptions {
    currentCPT: string;        // Current billable CPT code
    potentialCPT: string;      // Potential upgrade CPT code
    payerId: string;           // Payer identifier
    visitsPerYear?: number;    // Estimated visits/year (default: 52)
    confidence?: number;       // Confidence level (default: 0.85)
}

/**
 * Revenue summary for display in UI
 */
export interface RevenueSummary {
    current: string;           // Formatted current level
    potential: string;         // Formatted potential level
    gap: string;              // Formatted per-visit gap
    annualImpact: string;     // Formatted annual impact
    payer: string;            // Payer name
    confidence: string;       // Formatted confidence percentage
}

/**
 * Revenue impact severity brackets
 * Used for color-coding and prioritization in UI
 */
export type RevenueBracket = 'minimal' | 'low' | 'medium' | 'high' | 'critical';

/**
 * Patient type for visit frequency estimation
 */
export type PatientType = 'acute' | 'chronic' | 'preventive' | 'complex';

// ============================================================================
// INTEGRATION WITH EXISTING DOCUMENTATION GAP SYSTEM
// ============================================================================

/**
 * Extended Documentation Gap (for backward compatibility)
 * 
 * This extends the existing DocumentationGap interface
 * with the new revenueImpact field while preserving
 * the legacy potentialRevenueLoss string.
 * 
 * NOTE: This is a temporary type during migration.
 * Once all UI components are updated, we'll deprecate
 * the string-based potentialRevenueLoss field.
 */
export interface EnhancedDocumentationGap {
    // ... existing DocumentationGap fields

    // LEGACY: String-based revenue (kept for backward compatibility)
    potentialRevenueLoss: string;  // e.g., "$50-2667"

    // NEW: Detailed revenue breakdown
    revenueImpact?: RevenueCalculation;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Payer comparison result
 * Used to compare rates across multiple payers
 */
export interface PayerComparison {
    payerName: string;
    payerShortName: string;
    rate: number;
}

/**
 * Total revenue aggregation
 * Sum of multiple revenue calculations
 */
export interface TotalRevenue {
    perVisit: number;      // Total per-visit gap
    annualized: number;    // Total annualized gap
}
