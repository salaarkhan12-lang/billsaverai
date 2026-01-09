import { describe, test, expect } from 'vitest';
import { preprocessDocument, normalizeMedicalTerm } from '../document-preprocessor';
import { detectSections, getDiagnosisSections, extractDiagnosisLines } from '../section-detector';

describe('Document Preprocessor', () => {
    test('normalizes text with excessive whitespace', () => {
        const text = '  Test    line  \r\n\r\n\r\n  Another   line  ';
        const result = preprocessDocument(text);
        expect(result.originalText).toBe(text);
        expect(result.metadata.length).toBe(text.length);
    });

    test('tokenizes simple sentences', () => {
        const text = 'Patient has diabetes. Blood pressure is elevated.';
        const result = preprocessDocument(text);
        expect(result.sentences.length).toBe(2);
        expect(result.sentences[0].text).toContain('diabetes');
        expect(result.sentences[1].text).toContain('Blood pressure');
    });

    test('handles medical abbreviations in sentences', () => {
        const text = 'The pt. was seen by Dr. Smith. Vital signs were stable.';
        const result = preprocessDocument(text);
        // Should not split on "pt." or "Dr."
        expect(result.sentences.length).toBe(2);
    });

    test('normalizes medical terminology', () => {
        expect(normalizeMedicalTerm('Type II Diabetes')).toBe('type 2 diabetes');
        expect(normalizeMedicalTerm('HTN')).toBe('hypertension');
        expect(normalizeMedicalTerm('DM2')).toBe('type 2 diabetes');
        expect(normalizeMedicalTerm('COPD')).toBe('chronic obstructive pulmonary disease');
    });

    test('estimates complexity correctly', () => {
        const simpleText = 'Assessment: Diabetes';
        const simple = preprocessDocument(simpleText);
        expect(simple.metadata.estimatedComplexity).toBe('low');

        const complexText = 'A'.repeat(5000) + '\n1. Item1\n2. Item2\n• Bullet';
        const complex = preprocessDocument(complexText);
        expect(complex.metadata.estimatedComplexity).toBe('high');
    });
});

describe('Section Detector', () => {
    test('detects assessment section', () => {
        const text = `
            Assessment:
            1. Diabetes
            2. Hypertension
        `;
        const sections = detectSections(text);
        expect(sections.length).toBeGreaterThan(0);
        expect(sections[0].type).toBe('assessment');
    });

    test('excludes family history section', () => {
        const text = `
            Assessment:
            Diabetes
            
            Family History:
            Mother has diabetes
        `;
        const sections = detectSections(text);
        const diagnosisSections = getDiagnosisSections(sections);

        // Should have assessment but not family history
        expect(diagnosisSections.some(s => s.type === 'assessment')).toBe(true);
        expect(diagnosisSections.some(s => s.type === 'family-history')).toBe(false);
    });

    test('handles Problem List as diagnosis section', () => {
        const text = `
            Problem List
            • Diabetes
            • Hypertension
        `;
        const sections = detectSections(text);
        expect(sections.length).toBeGreaterThan(0);
        expect(sections[0].type).toBe('assessment'); // Problem List maps to assessment
    });

    test('extracts diagnosis lines correctly', () => {
        const text = `
            Assessment:
            1. Type 2 diabetes
            2. Hypertension, stable
            3. Low back pain
        `;
        const lines = extractDiagnosisLines(text);
        expect(lines.length).toBe(3);
        expect(lines).toContain('Type 2 diabetes');
        expect(lines).toContain('Hypertension, stable');
    });

    test('filters out generic lines', () => {
        const text = `
            Assessment:
            Ongoing
            None
            Diabetes
        `;
        const lines = extractDiagnosisLines(text);
        expect(lines).not.toContain('Ongoing');
        expect(lines).not.toContain('None');
        expect(lines).toContain('Diabetes');
    });
});
