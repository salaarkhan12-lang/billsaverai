import { describe, test, expect } from 'vitest';
import { extractICD10FromDocument, fuzzyMatchICD10 } from '../lib/icd10-extractor.legacy';

describe('ICD-10 Extraction - Keyword Matching', () => {
    test('extracts PTSD from "PTSD (post-traumatic stress disorder)"', () => {
        const result = fuzzyMatchICD10('PTSD (post-traumatic stress disorder)');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('F43.10');
    });

    test('extracts bipolar from "Bipolar disorder, unspecified"', () => {
        const result = fuzzyMatchICD10('Bipolar disorder, unspecified');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('F31.9');
    });

    test('extracts IBS from "IBS (irritable bowel syndrome)"', () => {
        const result = fuzzyMatchICD10('IBS (irritable bowel syndrome)');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('K58.9');
    });

    test('extracts back pain from "Back pain"', () => {
        const result = fuzzyMatchICD10('Back pain');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('M54.50');
    });

    test('extracts obesity from "Obesity"', () => {
        const result = fuzzyMatchICD10('Obesity');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('E66.9');
    });

    test('extracts fatty liver from "Fatty liver"', () => {
        const result = fuzzyMatchICD10('Fatty liver');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('K76.0');
    });

    test('extracts hidradenitis from "Hidradenitis suppurativa"', () => {
        const result = fuzzyMatchICD10('Hidradenitis suppurativa');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('L73.2');
    });

    test('extracts housing insecurity from "Housing insecurity"', () => {
        const result = fuzzyMatchICD10('Housing insecurity');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('Z59.819');
    });

    test('WORD BOUNDARY: "TIA" matches as standalone word', () => {
        const result = fuzzyMatchICD10('TIA');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('G45.9');
    });

    test('WORD BOUNDARY: "confidenTIAl" does NOT match TIA', () => {
        const result = fuzzyMatchICD10('Privileged and Confidential');
        expect(result).toHaveLength(0); // Should not extract G45.9
    });

    test('only returns 1 diabetes code, not 10', () => {
        const result = fuzzyMatchICD10('Diabetes mellitus');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('E11.9'); // General code only
    });
});

describe('ICD-10 Extraction - Family History Filtering', () => {
    test('excludes diagnosis with "Mother" relationship word', () => {
        const document = `
      Family History
      Diabetes mellitus: Mother, Grandfather - Paternal
      Hypertension: Mother, Father
    `;
        const result = extractICD10FromDocument(document);
        // Should NOT extract diabetes or hypertension from Family History
        expect(result.find(c => c.code === 'E11.9')).toBeUndefined();
        expect(result.find(c => c.code === 'I10')).toBeUndefined();
    });

    test('includes diagnosis from Problem List without family context', () => {
        const document = `
      Problem List
      Diabetes mellitus
      Hypertension
    `;
        const result = extractICD10FromDocument(document);
        // Should extract from Problem List
        expect(result.find(c => c.code === 'E11.9')).toBeDefined();
        expect(result.find(c => c.code === 'I10')).toBeDefined();
    });

    test('excludes line with "Maternal Grandmother"', () => {
        const document = 'Heart disease: Maternal Grandmother and Uncle';
        const result = extractICD10FromDocument(document);
        expect(result).toHaveLength(0);
    });
});

describe('ICD-10 Extraction - Integration Test (Real Note)', () => {
    const realisticNote = `
    BMG FAM PmHbr W 2939 Alternate 19 Palm Harbor, FL
    
    Problem List/Past Medical History
    Ongoing
    Back pain
    Bipolar disorder, unspecified
    Fatty liver
    Hidradenitis suppurativa  
    Housing insecurity
    Obesity
    IBS (irritable bowel syndrome)
    PTSD (post-traumatic stress disorder)
    
    Family History
    Diabetes mellitus: Mother, Grandfather - Paternal
    Hypertension: Mother, Grandmother - Maternal
    Heart disease: Father, Uncle
    
    Assessment/Plan
    Some other clinical notes here
    
    Privileged and Confidential Do Not Re-Release
  `;

    test('extracts all 9 expected codes from Problem List', () => {
        const expected = ['F43.10', 'F31.9', 'K58.9', 'K76.0', 'E66.9', 'M54.50', 'L73.2', 'Z59.819'];
        const result = extractICD10FromDocument(realisticNote);

        const extractedCodes = result.map(c => c.code);
        expected.forEach(code => {
            expect(extractedCodes).toContain(code);
        });
    });

    test('does NOT extract Family History false positives', () => {
        const forbidden = ['E11.9', 'I10']; // Diabetes and Hypertension from FH
        const result = extractICD10FromDocument(realisticNote);

        forbidden.forEach(code => {
            expect(result.find(c => c.code === code)).toBeUndefined();
        });
    });

    test('does NOT extract G45.9 from "confidenTIAl" footer', () => {
        const result = extractICD10FromDocument(realisticNote);
        expect(result.find(c => c.code === 'G45.9')).toBeUndefined();
    });

    test('total extracted count is reasonable (not excessive)', () => {
        const result = extractICD10FromDocument(realisticNote);
        expect(result.length).toBeLessThanOrEqual(10); // Max 10 codes
        expect(result.length).toBeGreaterThanOrEqual(8); // Min 8 codes
    });
});

describe('ICD-10 Extraction - Edge Cases', () => {
    test('handles empty document gracefully', () => {
        const result = extractICD10FromDocument('');
        expect(result).toEqual([]);
    });

    test('handles document with no diagnoses', () => {
        const result = extractICD10FromDocument('Just some random text without any medical conditions');
        expect(result).toEqual([]);
    });

    test('case insensitive: "ptsd", "PTSD", "Ptsd" all match', () => {
        const lowercase = fuzzyMatchICD10('ptsd');
        const uppercase = fuzzyMatchICD10('PTSD');
        const mixed = fuzzyMatchICD10('Ptsd');

        expect(lowercase[0].code).toBe('F43.10');
        expect(uppercase[0].code).toBe('F43.10');
        expect(mixed[0].code).toBe('F43.10');
    });

    test('filters PDF header/footer boilerplate', () => {
        const boilerplate = 'BMG FAM PmHbr W 2939 Alternate 19 Palm Harbor, FL';
        const result = extractICD10FromDocument(boilerplate);
        expect(result).toEqual([]);
    });

    test('no duplicate codes extracted', () => {
        const document = `
      Diabetes
      Type 2 Diabetes
      Diabetes mellitus
    `;
        const result = extractICD10FromDocument(document);
        const codes = result.map(c => c.code);
        const uniqueCodes = [...new Set(codes)];
        expect(codes).toEqual(uniqueCodes); // No duplicates
    });
});

describe('Phase 3: Medical Abbreviations', () => {
    test('T2DM extracts Type 2 Diabetes (E11.9)', () => {
        const result = fuzzyMatchICD10('T2DM');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('E11.9');
    });

    test('CVA extracts Stroke (I63.9)', () => {
        const result = fuzzyMatchICD10('CVA');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('I63.9');
    });

    test('MI extracts Myocardial Infarction (I21.9)', () => {
        const result = fuzzyMatchICD10('MI');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('I21.9');
    });

    test('OSA extracts Obstructive Sleep Apnea (G47.33)', () => {
        const result = fuzzyMatchICD10('OSA');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('G47.33');
    });

    test('PE extracts Pulmonary Embolism (I26.99)', () => {
        const result = fuzzyMatchICD10('PE');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('I26.99');
    });

    test('DVT extracts Deep Vein Thrombosis (I82.90)', () => {
        const result = fuzzyMatchICD10('DVT');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('I82.90');
    });

    test('ESRD extracts End-Stage Renal Disease (N18.6)', () => {
        const result = fuzzyMatchICD10('ESRD');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('N18.6');
    });

    test('CABG extracts Post-CABG status (Z95.1)', () => {
        const result = fuzzyMatchICD10('CABG');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('Z95.1');
    });
});

describe('Phase 3: Synonym Mapping', () => {
    test('Morbid obesity extracts E66.01 (more specific)', () => {
        const result = fuzzyMatchICD10('Morbid obesity');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('E66.01');
    });

    test('Essential hypertension extracts I10', () => {
        const result = fuzzyMatchICD10('Essential hypertension');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('I10');
    });

    test('Generalized anxiety extracts F41.1', () => {
        const result = fuzzyMatchICD10('Generalized anxiety');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('F41.1');
    });

    test('Major depression extracts F33.9', () => {
        const result = fuzzyMatchICD10('Major depression');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('F33.9');
    });

    test('Low back pain extracts M54.50 (same as back pain)', () => {
        const result = fuzzyMatchICD10('Low back pain');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('M54.50');
    });
});

