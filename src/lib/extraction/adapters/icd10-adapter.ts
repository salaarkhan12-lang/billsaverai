/**
 * ICD-10 Adapter
 * Translates medical entities into ICD-10 codes
 * Implements the CodeAdapter interface for the extraction engine
 */

import type {
    CodeAdapter,
    ExtractedCode,
    DocumentContext,
    MedicalEntity,
    ConfidenceScore,
    EvidenceLocation,
} from '../types';
import { ICD10_DATABASE, type ICD10Code } from '@/data/icd10-database';
import { extractEntities, filterEntitiesByContext } from '../entity-extractor';
import { getContextConfidenceAdjustment } from '../context-analyzer';
import { getDiagnosisSections } from '../section-detector';

/**
 * Map medical terms/aliases to ICD-10 codes
 * Migrated from icd10-extractor.ts MEDICAL_TERM_ALIASES
 */
const TERM_TO_ICD10: Record<string, string[]> = {
    // Mental Health
    'ptsd': ['F43.10', 'F43.12'],
    'post traumatic stress': ['F43.10', 'F43.12'],
    'bipolar': ['F31.9', 'F31.81', 'F31.0', 'F31.1'],
    'adhd': ['F90.0', 'F90.1', 'F90.2', 'F90.9'],
    'add': ['F90.0'],
    'depression': ['F33.0', 'F33.1', 'F33.2', 'F32.9', 'F33.9'],
    'anxiety': ['F41.1', 'F41.9', 'F41.0'],
    'panic': ['F41.0'],
    'ocd': ['F42.2'],

    // GI/Digestive
    'ibs': ['K58.9', 'K58.0'],
    'irritable bowel': ['K58.9', 'K58.0'],
    'gerd': ['K21.9', 'K21.0'],
    'reflux': ['K21.9'],
    'fatty liver': ['K76.0'],
    'cirrhosis': ['K74.60', 'K70.30'],

    // Endocrine/Metabolic
    'diabetes': ['E11.9', 'E11.65', 'E10.9'],
    'type 2 diabetes': ['E11.9', 'E11.65'],
    'type 1 diabetes': ['E10.9', 'E10.65'],
    'obesity': ['E66.9', 'E66.01'],
    'hypothyroid': ['E03.9'],
    'hyperthyroid': ['E05.90'],

    // Cardiovascular
    'hypertension': ['I10'],
    'htn': ['I10'],
    'high blood pressure': ['I10'],
    'afib': ['I48.91', 'I48.0'],
    'atrial fibrillation': ['I48.91'],
    'heart failure': ['I50.9', 'I50.23'],
    'chf': ['I50.9'],
    'cad': ['I25.10'],
    'coronary artery disease': ['I25.10'],

    // Respiratory
    'copd': ['J44.9', 'J44.1'],
    'asthma': ['J45.909', 'J45.40'],
    'pneumonia': ['J18.9'],
    'sleep apnea': ['G47.33', 'G47.30'],

    // Musculoskeletal
    'back pain': ['M54.50'],
    'low back pain': ['M54.50'],
    'neck pain': ['M54.2'],
    'arthritis': ['M19.90', 'M06.9'],
    'osteoarthritis': ['M19.90', 'M15.0'],
    'gout': ['M10.9', 'M10.00'],

    // Renal
    'ckd': ['N18.9', 'N18.3', 'N18.4'],
    'chronic kidney disease': ['N18.9', 'N18.3'],
    'kidney failure': ['N19'],
    'uti': ['N39.0'],
    'urinary tract infection': ['N39.0'],

    // Neurological
    'migraine': ['G43.909'],
    'headache': ['R51.9', 'G44.209'],
    'stroke': ['I63.9'],
    'tia': ['G45.9'],
    'seizure': ['G40.909'],
    'epilepsy': ['G40.909'],
    'parkinsons': ['G20'],
    'alzheimers': ['G30.9'],
    'dementia': ['G30.9'],

    // Dermatological
    'hidradenitis': ['L73.2'],
    'psoriasis': ['L40.9'],

    // Social/Housing
    'housing': ['Z59.819'],
    'housing insecurity': ['Z59.819'],
    'homeless': ['Z59.00'],
};

/**
 * ICD-10 Code Adapter
 */
export class ICD10Adapter implements CodeAdapter {
    readonly codeSystem = 'icd10' as const;

    /**
     * Extract ICD-10 codes from document context (synchronous)
     */
    extractSync(context: DocumentContext, entities: MedicalEntity[]): ExtractedCode[] {
        const codes: ExtractedCode[] = [];

        // Filter entities by context (exclude negated, family history, etc.)
        const validEntities = filterEntitiesByContext(entities);

        // Map entities to ICD-10 codes
        for (const entity of validEntities) {
            const entityCodes = this.mapEntityToICD10(entity);
            codes.push(...entityCodes);
        }

        // Resolve conflicts (parent-child codes)
        const resolved = this.resolveConflicts(codes);

        // Deduplicate
        const unique = this.deduplicateCodes(resolved);

        return unique;
    }

    /**
     * Map a medical entity to ICD-10 codes
     */
    private mapEntityToICD10(entity: MedicalEntity): ExtractedCode[] {
        const codes: ExtractedCode[] = [];
        const normalizedTerm = entity.normalizedText.toLowerCase();

        // Check if we have a mapping for this term
        const icd10Codes = TERM_TO_ICD10[normalizedTerm] || TERM_TO_ICD10[entity.text.toLowerCase()];

        if (!icd10Codes || icd10Codes.length === 0) {
            return codes;
        }

        // For each potential ICD-10 code, create an ExtractedCode
        for (const codeStr of icd10Codes) {
            const codeInfo = ICD10_DATABASE[codeStr];
            if (!codeInfo) continue;

            // Create evidence
            const evidence: EvidenceLocation[] = [{
                text: entity.text,
                section: entity.context.section,
                snippet: entity.span.text.substring(
                    Math.max(0, entity.span.startIndex - 30),
                    Math.min(entity.span.text.length, entity.span.endIndex + 30)
                ),
            }];

            // Calculate confidence
            const confidence = this.scoreConfidence({
                code: codeStr,
                codeSystem: 'icd10',
                description: codeInfo.description,
                evidence,
                matchType: 'keyword',
            } as ExtractedCode, entity.context);

            codes.push({
                code: codeStr,
                codeSystem: 'icd10',
                description: codeInfo.description,
                evidence,
                matchType: 'keyword',
                confidence,
                category: codeInfo.category,
                isHCC: codeInfo.isHCC,
            });
        }

        // If multiple codes available, prefer most specific
        if (codes.length > 1) {
            return this.selectMostSpecific(codes);
        }

        return codes;
    }

    /**
     * Select most specific code(s) from a list
     * For diabetes: prefer E11.65 (with hyperglycemia) over E11.9 (without complications)
     */
    private selectMostSpecific(codes: ExtractedCode[]): ExtractedCode[] {
        // Group codes by base (e.g., E11.9 and E11.65 both start with E11)
        const groups = new Map<string, ExtractedCode[]>();

        for (const code of codes) {
            const base = code.code.split('.')[0]; // E11, I50, etc.
            if (!groups.has(base)) {
                groups.set(base, []);
            }
            groups.get(base)!.push(code);
        }

        const result: ExtractedCode[] = [];

        // For each group, select the most specific
        for (const group of groups.values()) {
            if (group.length === 1) {
                result.push(group[0]);
            } else {
                // Sort by specificity (longer code = more specific)
                const sorted = group.sort((a, b) => b.code.length - a.code.length);
                // Take the most specific one
                result.push(sorted[0]);
            }
        }

        return result;
    }

    /**
     * Resolve conflicts between codes
     * Example: Don't include both E11.9 and E11.65 (parent-child conflict)
     */
    resolveConflicts(codes: ExtractedCode[]): ExtractedCode[] {
        const resolved: ExtractedCode[] = [];
        const codeStrings = new Set<string>();

        for (const code of codes) {
            // Check if this code conflicts with any already-included code
            let hasConflict = false;

            for (const existingCode of resolved) {
                if (this.codesConflict(code.code, existingCode.code)) {
                    hasConflict = true;

                    // Keep the more specific one (longer code)
                    if (code.code.length > existingCode.code.length) {
                        // Replace existing with more specific
                        const index = resolved.indexOf(existingCode);
                        resolved[index] = code;
                        codeStrings.delete(existingCode.code);
                        codeStrings.add(code.code);
                    }
                    // Otherwise, skip this code (keep existing)
                    break;
                }
            }

            if (!hasConflict && !codeStrings.has(code.code)) {
                resolved.push(code);
                codeStrings.add(code.code);
            }
        }

        return resolved;
    }

    /**
     * Check if two codes conflict (parent-child relationship)
     */
    private codesConflict(code1: string, code2: string): boolean {
        // Same code = conflict
        if (code1 === code2) return true;

        // Check if one is parent of the other
        // E.g., E11 is parent of E11.9, E11.65, etc.
        const base1 = code1.split('.')[0];
        const base2 = code2.split('.')[0];

        // Same base category (E11.x vs E11.y)
        if (base1 === base2 && code1 !== code2) {
            // They conflict if one is less specific
            // E11.9 (unspecified) conflicts with E11.65 (specific complication)
            const isUnspecified1 = code1.endsWith('.9') || code1.endsWith('.90');
            const isUnspecified2 = code2.endsWith('.9') || code2.endsWith('.90');

            if (isUnspecified1 || isUnspecified2) {
                return true; // One is generic, one is specific = conflict
            }
        }

        return false;
    }

    /**
     * Deduplicate codes
     */
    private deduplicateCodes(codes: ExtractedCode[]): ExtractedCode[] {
        const seen = new Set<string>();
        const unique: ExtractedCode[] = [];

        for (const code of codes) {
            if (!seen.has(code.code)) {
                seen.add(code.code);
                unique.push(code);
            }
        }

        return unique;
    }

    /**
     * Calculate confidence score for extracted code
     */
    scoreConfidence(code: ExtractedCode, context: any): ConfidenceScore {
        let matchScore = 0.85; // Base score for keyword match
        let contextScore = 1.0;
        let specificityScore = 1.0;
        let documentationScore = 1.0;

        // Match quality
        if (code.matchType === 'exact') {
            matchScore = 0.95;
        } else if (code.matchType === 'fuzzy') {
            matchScore = 0.75;
        } else if (code.matchType === 'inferred') {
            matchScore = 0.60;
        }

        // Context adjustments (from context analyzer)
        if (context) {
            contextScore = getContextConfidenceAdjustment(context);
        }

        // Specificity bonus
        if (!code.code.endsWith('.9') && !code.code.endsWith('.90')) {
            specificityScore = 1.05; // Bonus for specific codes
        }

        // Documentation check
        if (code.evidence && code.evidence.length > 0) {
            documentationScore = 1.0;
        } else {
            documentationScore = 0.8;
        }

        const overall = Math.min(1.0, matchScore * contextScore * specificityScore * documentationScore);

        return {
            overall,
            breakdown: {
                match: matchScore,
                context: contextScore,
                specificity: specificityScore,
                documentation: documentationScore,
            },
            reasoning: this.generateReasoning(code, context, overall),
        };
    }

    /**
     * Generate human-readable reasoning for confidence score
     */
    private generateReasoning(code: ExtractedCode, context: any, overall: number): string {
        const reasons: string[] = [];

        if (code.matchType === 'keyword') {
            reasons.push('Found via keyword match');
        }

        if (context?.section === 'assessment' || context?.section === 'diagnosis') {
            reasons.push('documented in diagnosis section');
        }

        if (context?.certainty === 'confirmed') {
            reasons.push('confirmed diagnosis');
        } else if (context?.certainty === 'suspected') {
            reasons.push('suspected (not confirmed)');
        }

        if (!code.code.endsWith('.9')) {
            reasons.push('specific code (not unspecified)');
        }

        if (overall >= 0.9) {
            return `High confidence: ${reasons.join(', ')}`;
        } else if (overall >= 0.7) {
            return `Good confidence: ${reasons.join(', ')}`;
        } else {
            return `Moderate confidence: ${reasons.join(', ')}`;
        }
    }
}

/**
 * Backward-compatible extraction function
 * Matches the signature of existing extractICD10FromDocument
 */
export async function extractICD10Codes(
    documentText: string
): Promise<ICD10Code[]> {
    // This will be implemented in the main engine
    // For now, return empty array
    return [];
}
