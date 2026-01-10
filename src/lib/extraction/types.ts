/**
 * Core Type Definitions for Extraction Engine
 * Defines interfaces that all components use
 */

import type { ICD10Code } from '@/data/icd10-database';

// ============================================================================
// Document Structure Types
// ============================================================================

/**
 * A section within a medical document
 */
export interface DocumentSection {
    name: string;
    type: SectionType;
    startLine: number;
    endLine: number;
    text: string;
    parent?: string; // For hierarchical sections
    confidence: number; // 0-1, how confident we are about this section
}

/**
 * Types of sections in medical documentation
 */
export type SectionType =
    | 'assessment'
    | 'diagnosis'
    | 'plan'
    | 'hpi'
    | 'ros'
    | 'physical-exam'
    | 'family-history'
    | 'social-history'
    | 'medications'
    | 'allergies'
    | 'procedures'
    | 'orders'
    | 'other';

/**
 * A sentence or phrase within a document
 */
export interface TextSpan {
    text: string;
    startIndex: number;
    endIndex: number;
    section?: string; // Which section this span belongs to
}

/**
 * Preprocessed document ready for extraction
 */
export interface DocumentContext {
    originalText: string;
    sections: DocumentSection[];
    sentences: TextSpan[];
    metadata: {
        length: number;
        sectionCount: number;
        estimatedComplexity: 'low' | 'moderate' | 'high';
    };
}

// ============================================================================
// Entity Types
// ============================================================================

/**
 * A medical entity found in text
 */
export interface MedicalEntity {
    text: string; // "Type 2 diabetes with hyperglycemia"
    normalizedText: string; // "type 2 diabetes mellitus with hyperglycemia"
    type: EntityType;
    span: TextSpan;
    context: EntityContext;
}

/**
 * Type of medical entity
 */
export type EntityType =
    | 'condition'    // Medical condition (diabetes, hypertension)
    | 'symptom'      // Symptom (pain, headache)
    | 'procedure'    // Medical procedure
    | 'medication'   // Medication/drug
    | 'test'         // Lab test or diagnostic
    | 'code-icd10'   // Explicit ICD-10 code (Layer 1)
    | 'code-cpt'     // Explicit CPT code (Layer 1)
    | 'other';       // Other medical entity

/**
 * Context surrounding an entity
 */
export interface EntityContext {
    isNegated: boolean; // "No diabetes" → true
    negationTrigger?: string; // "no", "denies", "ruled out"

    temporality: 'current' | 'historical' | 'future' | 'unknown';
    temporalTrigger?: string; // "history of", "will check for"

    attribution: 'patient' | 'family' | 'differential' | 'unknown';
    attributionTrigger?: string; // "mother", "r/o"

    certainty: 'confirmed' | 'suspected' | 'ruled-out' | 'unknown';
    certaintyTrigger?: string; // "diagnosed with", "possible", "negative for"

    section: SectionType;
}

// ============================================================================
// Extracted Code Types
// ============================================================================

/**
 * Generic extracted medical code (ICD-10, CPT, etc.)
 */
export interface ExtractedCode {
    code: string;
    codeSystem: CodeSystem;
    description: string;

    // Evidence
    evidence: EvidenceLocation[];
    matchType: 'exact' | 'keyword' | 'fuzzy' | 'inferred';

    // Confidence \u0026 Quality
    confidence: ConfidenceScore;

    // Metadata
    category?: string;
    isHCC?: boolean;
    rvu?: number; // For CPT codes
}

export type CodeSystem = 'icd10' | 'cpt' | 'snomed' | 'hcpcs' | 'rxnorm';

/**
 * Where in the document this code was found
 */
export interface EvidenceLocation {
    text: string; // The specific text that supports this code
    section: string;
    lineNumber?: number;
    snippet: string; // Surrounding context (±50 chars)
}

/**
 * Confidence scoring for extracted codes
 */
export interface ConfidenceScore {
    overall: number; // 0-1
    breakdown: {
        match: number; // How well did text match code description?
        context: number; // Was context appropriate? (not negated, right section)
        specificity: number; // Is this the most specific code available?
        documentation: number; // Is documentation sufficient for billing?
    };
    reasoning: string; // Human-readable explanation
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for extraction engine
 */
export interface ExtractionConfig {
    // Which code systems to extract
    codeSystems: CodeSystem[];

    // NLP features
    nlp: {
        enableNegation: boolean;
        enableTemporal: boolean;
        enableFamilyHistoryFilter: boolean;
        enableDifferentialFilter: boolean;
        confidenceThreshold: number; // Minimum confidence to return (0-1)
    };

    // ICD-10 specific
    icd10?: {
        preferSpecific: boolean; // Prefer E11.65 over E11.9
        includeHCCFlags: boolean;
        maxCodesPerCondition: number;
        sectionFilters: SectionType[]; // Only extract from these sections
    };

    // CPT specific
    cpt?: {
        suggestUpgrades: boolean; // Suggest higher E/M levels
        includeAddOnCodes: boolean; // CCM, TCM, etc.
        conservativeMode: boolean; // Only suggest high-confidence codes
    };

    // Performance
    performance: {
        enableCaching: boolean;
        maxProcessingTimeMs: number;
    };
}

/**
 * Default configuration profiles
 */
export const DEFAULT_CONFIG: ExtractionConfig = {
    codeSystems: ['icd10', 'cpt'],
    nlp: {
        enableNegation: true,
        enableTemporal: true,
        enableFamilyHistoryFilter: true,
        enableDifferentialFilter: true,
        confidenceThreshold: 0.6, // 60%
    },
    icd10: {
        preferSpecific: true,
        includeHCCFlags: true,
        maxCodesPerCondition: 3,
        sectionFilters: ['assessment', 'diagnosis', 'plan', 'hpi'],
    },
    cpt: {
        suggestUpgrades: true,
        includeAddOnCodes: true,
        conservativeMode: false,
    },
    performance: {
        enableCaching: true,
        maxProcessingTimeMs: 5000, // 5 seconds max
    },
};

// ============================================================================
// Extraction Result Types
// ============================================================================

/**
 * Result from extraction engine
 */
export interface ExtractionResult {
    codes: ExtractedCode[];
    metadata: ExtractionMetadata;
    warnings: ExtractionWarning[];
}

export interface ExtractionMetadata {
    processingTimeMs: number;
    documentComplexity: 'low' | 'moderate' | 'high';
    sectionsAnalyzed: number;
    entitiesFound: number;
    codesExtracted: number;
    averageConfidence: number;
}

export interface ExtractionWarning {
    type: 'conflict' | 'low-confidence' | 'missing-section' | 'performance';
    message: string;
    affectedCodes?: string[];
}

// ============================================================================
// Adapter Interface
// ============================================================================

/**
 * Interface that all code adapters must implement
 */
export interface CodeAdapter {
    readonly codeSystem: CodeSystem;

    /**
     * Extract codes from document context (synchronous)
     */
    extractSync(context: DocumentContext, entities: MedicalEntity[]): ExtractedCode[];

    /**
     * Resolve conflicts between extracted codes
     */
    resolveConflicts(codes: ExtractedCode[]): ExtractedCode[];

    /**
     * Calculate confidence score for a code
     */
    scoreConfidence(code: ExtractedCode, context: EntityContext): ConfidenceScore;
}

// ============================================================================
// Backward Compatibility with Existing Types
// ============================================================================

/**
 * Re-export existing ICD10Code type for backward compatibility
 */
export type { ICD10Code };

/**
 * Convert ExtractedCode to ICD10Code (for backward compatibility)
 */
export function toICD10Code(extractedCode: ExtractedCode): ICD10Code {
    if (extractedCode.codeSystem !== 'icd10') {
        throw new Error(`Cannot convert ${extractedCode.codeSystem} code to ICD10Code`);
    }

    return {
        code: extractedCode.code,
        description: extractedCode.description,
        category: extractedCode.category as 'chronic' | 'acute' | 'symptom',
        isHCC: extractedCode.isHCC,
        source: extractedCode.matchType === 'inferred' ? 'recommended' : 'documented',
    };
}
