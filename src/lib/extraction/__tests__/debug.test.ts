import { describe, test, expect } from 'vitest';
import { ExtractionEngine } from '../extraction-engine';

describe('Debug: Simple CPT Extraction', () => {
    test('debug extraction step by step', () => {
        const note = `
            Assessment:
            1. Type 2 diabetes, well controlled
            2. Hypertension, stable
            
            Plan:
            Continue current medications
        `;

        const engine = new ExtractionEngine();
        const result = engine.extractSync(note, { codeSystems: ['icd10', 'cpt'] });

        console.log('===== DEBUG OUTPUT =====');
        console.log('Sections found:', result.metadata.sectionsAnalyzed);
        console.log('Entities found:', result.metadata.entitiesFound);
        console.log('Codes extracted:', result.metadata.codesExtracted);
        console.log('\nExtracted codes:');
        result.codes.forEach(code => {
            console.log(`  ${code.codeSystem}: ${code.code} - ${code.description}`);
        });
        console.log('========================');

        // This should pass now
        expect(result.metadata.codesExtracted).toBeGreaterThan(0);
    });
});
