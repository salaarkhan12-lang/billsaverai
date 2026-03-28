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
import { CPT_CODES as CPT_DATABASE, getCPTCode, type CPTCode as CPTCodeInfo } from './cpt-database';
import { ICD10_DATABASE, doCodesConflict, getCodeConflictReason as getICD10ConflictReason } from './icd10-database';
import {
    analyzeUpgradeOpportunity,
    type UpgradeOpportunity,
    type UpgradeRecommendation,
    type TimeConflict,
} from './validation/upgrade-analyzer';

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
        overcoded?: CPTCode;  // The claimed code that exceeds documentation support
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
    upgradeGuidance?: UpgradeOpportunity;  // How to achieve higher level
    timeConflict?: TimeConflict;           // Time vs claimed code conflict
}

// Re-export upgrade types for UI consumption
export type { UpgradeOpportunity, UpgradeRecommendation, TimeConflict };

/**
 * Helper to format CPT reimbursement as a range string
 * Converts baseRate to a display string format
 */
function formatReimbursement(baseRate: number): string {
    // Create a realistic range around the base rate
    const lowEnd = Math.round(baseRate * 0.85);
    const highEnd = Math.round(baseRate * 1.15);
    return `$${lowEnd}-${highEnd}`;
}

/**
 * Helper to determine complexity level from CPT code
 */
function getComplexity(code: string): 'low' | 'moderate' | 'high' {
    const level = code.slice(-1);  // Last digit indicates level
    if (level === '4') return 'moderate';
    if (level === '5') return 'high';
    return 'low';
}

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
 * @deprecated Use doCodesConflict from icd10-database.ts directly
 */
function codesConflict(code1: string, code2: string): boolean {
    return doCodesConflict(code1, code2);
}

/**
 * Determine which CPT codes are billable based on current documentation
 */
function determineCPTEligibility(
    currentLevel: string,
    suggestedLevel: string,
    gaps: DocumentationGap[],
    isOvercoding: boolean = false
): { current: CPTCode[]; potential: CPTCode[]; overcoded?: CPTCode } {
    const current: CPTCode[] = [];
    const potential: CPTCode[] = [];
    let overcoded: CPTCode | undefined;

    // Current level is the documentation-supported billable level
    const currentCPT = getCPTCode(currentLevel);
    if (currentCPT) {
        current.push({
            code: currentLevel,
            description: currentCPT.description,
            reimbursement: formatReimbursement(currentCPT.baseRate),
            status: 'ready',
            complexity: getComplexity(currentLevel),
        });
    }

    // Handle overcoding case - show claimed level as overcoded warning
    if (isOvercoding) {
        const claimedCPT = getCPTCode(suggestedLevel); // In overcoding case, suggestedLevel is the claimed code
        if (claimedCPT) {
            overcoded = {
                code: suggestedLevel,
                description: claimedCPT.description + ' (OVERCODED - not supported by documentation)',
                reimbursement: formatReimbursement(claimedCPT.baseRate),
                status: 'needs-fixes',
                complexity: getComplexity(suggestedLevel),
            };
        }
        return { current, potential, overcoded };
    }

    // Normal case: suggested level and higher are potential upgrades
    const levels = ['99211', '99212', '99213', '99214', '99215'];
    const suggestedIndex = levels.indexOf(suggestedLevel);
    const currentIndex = levels.indexOf(currentLevel);

    if (suggestedIndex > currentIndex) {
        // Add suggested level
        const criticalGaps = gaps.filter(g => g.category === 'critical');
        const majorGaps = gaps.filter(g => g.category === 'major');
        const suggestedCPT = getCPTCode(suggestedLevel);

        if (suggestedCPT) {
            potential.push({
                code: suggestedLevel,
                description: suggestedCPT.description,
                reimbursement: formatReimbursement(suggestedCPT.baseRate),
                status: 'needs-fixes',
                requiredFixes: [...criticalGaps, ...majorGaps].slice(0, 3).map(g => g.id),
                complexity: getComplexity(suggestedLevel),
            });
        }

        // Add highest level if not already suggested
        if (suggestedLevel !== '99215' && criticalGaps.length + majorGaps.length >= 3) {
            const highestCPT = getCPTCode('99215');
            if (highestCPT) {
                potential.push({
                    code: '99215',
                    description: highestCPT.description,
                    reimbursement: formatReimbursement(highestCPT.baseRate),
                    status: 'needs-fixes',
                    requiredFixes: gaps.filter(g => g.category !== 'minor').map(g => g.id),
                    complexity: getComplexity('99215'),
                });
            }
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
    // When overcoding is detected, the "currently billable" should be the SUPPORTED level
    // (suggestedEMLevel), not the claimed level (currentEMLevel)
    const isOvercoding = result.isOvercoded === true;
    const actualBillableLevel = isOvercoding ? result.suggestedEMLevel : result.currentEMLevel;

    const cptCodes = determineCPTEligibility(
        actualBillableLevel,
        isOvercoding ? result.currentEMLevel : result.suggestedEMLevel, // Show claimed as "potential" if overcoded
        result.gaps,
        isOvercoding
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

    // Calculate revenue impact - use the SUPPORTED level for current billing
    const supportedLevel = isOvercoding ? result.suggestedEMLevel : result.currentEMLevel;
    const supportedCPTInfo = getCPTCode(supportedLevel);
    const currentRev = supportedCPTInfo ? formatReimbursement(supportedCPTInfo.baseRate) : '$0';
    const potentialRev = cptCodes.potential[0]?.reimbursement || currentRev;

    // Analyze upgrade opportunities (only when NOT overcoding)
    let upgradeGuidance: UpgradeOpportunity | undefined;
    let timeConflict: TimeConflict | undefined;

    if (!isOvercoding && result.emValidation && documentText) {
        const upgradeResult = analyzeUpgradeOpportunity(
            result.emValidation,
            documentText,
            result.currentEMLevel
        );
        if (upgradeResult) {
            upgradeGuidance = upgradeResult;
            timeConflict = upgradeResult.timeConflict;
        }
    }

    return {
        cptCodes: {
            current: cptCodes.current,
            potential: cptCodes.potential,
            overcoded: cptCodes.overcoded,
        },
        icdCodes: {
            documented,
            missing,
        },
        revenueImpact: {
            current: currentRev,
            potential: potentialRev,
            difference: result.totalPotentialRevenueLoss,
        },
        upgradeGuidance,
        timeConflict,
    };
}

/**
 * Get a human-readable explanation of why codes might conflict
 * @deprecated Use getCodeConflictReason from icd10-database.ts directly
 */
export function getCodeConflictReason(code1: string, code2: string): string | null {
    return getICD10ConflictReason(code1, code2);
}
