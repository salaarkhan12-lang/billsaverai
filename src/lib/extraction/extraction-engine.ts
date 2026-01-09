/**
 * Main Extraction Engine
 * Orchestrates the entire extraction pipeline
 * This is the entry point that ties all components together
 */

import type {
    DocumentContext,
    ExtractionConfig,
    ExtractionResult,
    ExtractedCode,
    ExtractionMetadata,
    ExtractionWarning,
    CodeSystem,
} from './types';
import { DEFAULT_CONFIG } from './types';
import { preprocessDocument } from './document-preprocessor';
import { integrateSections } from './section-detector';
import { extractEntities, filterEntitiesByContext } from './entity-extractor';
import { ICD10Adapter } from './adapters/icd10-adapter';
import { CPTAdapter } from './adapters/cpt-adapter';
import type { ICD10Code } from '@/data/icd10-database';
import { toICD10Code } from './types';

/**
 * Main Extraction Engine
 */
export class ExtractionEngine {
    private config: ExtractionConfig;

    constructor(config: Partial<ExtractionConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Extract codes from medical document (synchronous)
     */
    extractSync(documentText: string, config?: Partial<ExtractionConfig>): ExtractionResult {
        const startTime = performance.now();

        // Merge config
        const effectiveConfig = config ? { ...this.config, ...config } : this.config;

        // Step 1: Preprocess document
        let context = preprocessDocument(documentText);

        // Step 2: Detect sections
        context = integrateSections(context);

        // Step 3: Extract entities
        const allEntities = extractEntities(context.sentences);
        const validEntities = filterEntitiesByContext(allEntities);

        // Step 4: Run adapters
        const codes: ExtractedCode[] = [];
        const warnings: ExtractionWarning[] = [];

        // ICD-10 extraction
        if (effectiveConfig.codeSystems.includes('icd10')) {
            const icd10Adapter = new ICD10Adapter();
            const icd10Codes = icd10Adapter.extractSync(context, validEntities);
            codes.push(...icd10Codes);
        }

        // CPT extraction
        if (effectiveConfig.codeSystems.includes('cpt')) {
            const cptAdapter = new CPTAdapter();
            const cptCodes = cptAdapter.extractSync(context, validEntities);
            codes.push(...cptCodes);
        }

        // Filter by confidence threshold
        const filtered = codes.filter(code =>
            code.confidence.overall >= effectiveConfig.nlp.confidenceThreshold
        );

        // Check for low-confidence codes
        const lowConfidence = codes.filter(code =>
            code.confidence.overall < effectiveConfig.nlp.confidenceThreshold
        );

        if (lowConfidence.length > 0) {
            warnings.push({
                type: 'low-confidence',
                message: `${lowConfidence.length} codes below confidence threshold`,
                affectedCodes: lowConfidence.map(c => c.code),
            });
        }

        // Generate metadata
        const processingTime = performance.now() - startTime;
        const metadata: ExtractionMetadata = {
            processingTimeMs: processingTime,
            documentComplexity: context.metadata.estimatedComplexity,
            sectionsAnalyzed: context.sections.length,
            entitiesFound: allEntities.length,
            codesExtracted: filtered.length,
            averageConfidence: this.calculateAverageConfidence(filtered),
        };

        // Performance warning
        if (processingTime > effectiveConfig.performance.maxProcessingTimeMs) {
            warnings.push({
                type: 'performance',
                message: `Processing took ${processingTime.toFixed(0)}ms (max: ${effectiveConfig.performance.maxProcessingTimeMs}ms)`,
            });
        }

        return {
            codes: filtered,
            metadata,
            warnings,
        };
    }

    /**
     * Calculate average confidence across all codes
     */
    private calculateAverageConfidence(codes: ExtractedCode[]): number {
        if (codes.length === 0) return 0;

        const sum = codes.reduce((acc, code) => acc + code.confidence.overall, 0);
        return sum / codes.length;
    }
}

/**
 * Backward-compatible function for existing codebase
 * Matches signature of extractICD10FromDocument in icd10-extractor.ts
 */
export function extractICD10FromDocument(documentText: string): ICD10Code[] {
    const engine = new ExtractionEngine();
    const result = engine.extractSync(documentText, {
        codeSystems: ['icd10'],
        nlp: {
            enableNegation: true,
            enableTemporal: true,
            enableFamilyHistoryFilter: true,
            enableDifferentialFilter: true,
            confidenceThreshold: 0.6,
        },
    });

    // Convert ExtractedCode[] to ICD10Code[] for backward compatibility
    return result.codes
        .filter(code => code.codeSystem === 'icd10')
        .map(code => toICD10Code(code));
}

/**
 * Convenience function: extract with default config
 */
export function extract(documentText: string): ExtractionResult {
    const engine = new ExtractionEngine();
    return engine.extractSync(documentText);
}

/**
 * Convenience function: extract ICD-10 only
 */
export function extractICD10Only(documentText: string): ExtractionResult {
    const engine = new ExtractionEngine();
    return engine.extractSync(documentText, {
        codeSystems: ['icd10'],
    });
}
