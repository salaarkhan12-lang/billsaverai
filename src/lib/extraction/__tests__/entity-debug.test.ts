import { describe, test, expect } from 'vitest';
import { extractEntities } from '../entity-extractor';
import { preprocessDocument } from '../document-preprocessor';
import { integrateSections } from '../section-detector';

describe('Entity Extractor Debug', () => {
    test('debug: extract hypertension', () => {
        const text = `
            Assessment:
            Hypertension
        `;

        let context = preprocessDocument(text);
        context = integrateSections(context);

        const entities = extractEntities(context.sentences);

        console.log('Sentences:', context.sentences.map(s => s.text));
        console.log('Entities found:', entities.map(e => ({ text: e.text, normalized: e.normalizedText })));

        expect(entities.length).toBeGreaterThan(0);
    });
});
