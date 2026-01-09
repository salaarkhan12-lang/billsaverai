/**
 * ICD-10 Extractor - New Implementation
 * 
 * MIGRATION NOTE:
 * This file has been migrated to use the new smart extraction engine.
 * The old implementation is preserved in icd10-extractor.legacy.ts
 * 
 * This wrapper maintains 100% backward compatibility with existing code
 * while leveraging the new NLP-powered extraction engine under the hood.
 */

import { extractICD10FromDocument as extractFromEngine } from './extraction/extraction-engine';
import type { ICD10Code } from '@/data/icd10-database';
import type { DocumentSection } from './extraction/types';

/**
 * Extract ICD-10 codes from medical document text
 * 
 * BACKWARD COMPATIBLE API - matches old extractICD10FromDocument signature
 * 
 * Now powered by:
 * - Smart NLP pipeline (negation detection, temporal analysis)
 * - Family history filtering
 * - Context-aware extraction
 * - Confidence scoring
 * 
 * @param documentText - Raw medical note text
 * @returns Array of ICD-10 codes with metadata
 */
export function extractICD10FromDocument(documentText: string): ICD10Code[] {
    // Delegate to new extraction engine
    return extractFromEngine(documentText);
}

/**
 * Extract sections from document
 * 
 * BACKWARD COMPATIBLE - preserved for existing code
 * Re-exported from new extraction engine
 */
export { detectSections as extractSections } from './extraction/section-detector';

/**
 * Get diagnosis sections
 * 
 * BACKWARD COMPATIBLE - preserved for existing code
 */
export { getDiagnosisSections } from './extraction/section-detector';

/**
 * Extract diagnosis lines
 * 
 * BACKWARD COMPATIBLE - preserved for existing code
 */
export { extractDiagnosisLines } from './extraction/section-detector';

// Re-export types for backward compatibility
export type { DocumentSection };
