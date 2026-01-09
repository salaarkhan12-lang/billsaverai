/**
 * Entity Extractor
 * Extracts medical entities from text using keyword matching and aliases
 * Migrates MEDICAL_TERM_ALIASES from icd10-extractor.ts
 */

import type { MedicalEntity, EntityType, TextSpan, EntityContext } from './types';
import { analyzeContext } from './context-analyzer';
import { normalizeMedicalTerm } from './document-preprocessor';

/**
 * Medical term aliases (migrated from icd10-extractor.ts)
 * Maps colloquial terms to normalized medical terms
 */
export const MEDICAL_TERM_ALIASES: Record<string, string[]> = {
    // Mental Health
    'ptsd': ['post-traumatic stress disorder', 'post traumatic stress'],
    'bipolar': ['bipolar disorder'],
    'adhd': ['attention deficit hyperactivity disorder', 'attention-deficit hyperactivity disorder'],
    'add': ['attention deficit disorder'],
    'depression': ['major depressive disorder', 'depressive disorder'],
    'anxiety': ['generalized anxiety disorder', 'anxiety disorder'],
    'panic': ['panic disorder'],
    'ocd': ['obsessive compulsive disorder'],

    // GI/Digestive
    'ibs': ['irritable bowel syndrome'],
    'irritable bowel': ['irritable bowel syndrome'],
    'gerd': ['gastroesophageal reflux disease', 'gastro-esophageal reflux disease'],
    'reflux': ['gastroesophageal reflux disease'],
    'fatty liver': ['hepatic steatosis', 'fatty liver disease'],
    'cirrhosis': ['liver cirrhosis', 'hepatic cirrhosis'],

    // Endocrine/Metabolic
    'diabetes': ['diabetes mellitus'],
    'diabetes mellitus': ['diabetes mellitus'],
    'type 2 diabetes': ['type 2 diabetes mellitus', 'diabetes mellitus type 2'],
    'type 1 diabetes': ['type 1 diabetes mellitus', 'diabetes mellitus type 1'],
    'obesity': ['obesity'],
    'hypothyroid': ['hypothyroidism'],
    'hypothyroidism': ['hypothyroidism'],
    'hyperthyroid': ['hyperthyroidism'],
    'hyperthyroidism': ['hyperthyroidism'],
    'hyperlipidemia': ['hyperlipidemia'],

    // Cardiovascular
    'hypertension': ['essential hypertension', 'high blood pressure'],
    'htn': ['hypertension', 'essential hypertension'],
    'high blood pressure': ['essential hypertension', 'hypertension'],
    'afib': ['atrial fibrillation'],
    'atrial fibrillation': ['atrial fibrillation'],
    'heart failure': ['congestive heart failure', 'chf'],
    'chf': ['congestive heart failure', 'heart failure'],
    'cad': ['coronary artery disease'],
    'coronary artery disease': ['coronary artery disease'],

    // Respiratory
    'copd': ['chronic obstructive pulmonary disease'],
    'asthma': ['asthma'],
    'pneumonia': ['pneumonia'],
    'sleep apnea': ['obstructive sleep apnea', 'sleep apnea syndrome'],

    // Musculoskeletal
    'back pain': ['back pain', 'dorsalgia'],
    'low back pain': ['low back pain', 'lumbar pain'],
    'neck pain': ['cervicalgia', 'neck pain'],
    'arthritis': ['osteoarthritis', 'arthritis'],
    'osteoarthritis': ['osteoarthritis'],
    'gout': ['gout', 'gouty arthritis'],

    // Renal
    'ckd': ['chronic kidney disease'],
    'chronic kidney disease': ['chronic kidney disease'],
    'kidney failure': ['renal failure', 'kidney failure'],
    'uti': ['urinary tract infection'],
    'urinary tract infection': ['urinary tract infection'],

    // Neurological
    'migraine': ['migraine headache', 'migraine'],
    'headache': ['headache'],
    'stroke': ['cerebrovascular accident', 'cva'],
    'tia': ['transient ischemic attack'],
    'seizure': ['seizure', 'epilepsy'],
    'epilepsy': ['epilepsy'],
    'parkinsons': ['parkinson disease', 'parkinsonism'],
    'alzheimers': ['alzheimer disease', 'dementia'],
    'dementia': ['dementia'],

    // Dermatological
    'hidradenitis': ['hidradenitis suppurativa'],
    'psoriasis': ['psoriasis'],

    // Social/Housing
    'housing': ['housing insecurity', 'housing instability'],
    'housing insecurity': ['housing insecurity', 'housing instability'],
    'homeless': ['homelessness'],
};

/**
 * Extract medical entities from sentences
 */
export function extractEntities(
    sentences: TextSpan[],
    sectionName?: string
): MedicalEntity[] {
    const entities: MedicalEntity[] = [];

    for (const sentence of sentences) {
        // Extract entities from this sentence
        const sentenceEntities = extractFromSentence(sentence, sectionName);
        entities.push(...sentenceEntities);
    }

    // Deduplicate entities (same text, same location)
    const unique = deduplicateEntities(entities);

    return unique;
}

/**
 * Extract entities from a single sentence
 */
function extractFromSentence(
    span: TextSpan,
    sectionName?: string
): MedicalEntity[] {
    const entities: MedicalEntity[] = [];
    const text = span.text.toLowerCase();

    // Check for each medical term alias
    for (const [keyword, expansions] of Object.entries(MEDICAL_TERM_ALIASES)) {
        // Use word boundary regex to ensure keyword is standalone
        const wordBoundaryPattern = new RegExp(`\\b${keyword}\\b`, 'i');

        if (wordBoundaryPattern.test(text)) {
            // Found a match!
            const match = text.match(wordBoundaryPattern);
            if (!match) continue;

            const matchIndex = match.index!;
            const matchText = match[0];

            // Create entity span
            const entitySpan: TextSpan = {
                text: span.text, // Full sentence for context
                startIndex: span.startIndex + matchIndex,
                endIndex: span.startIndex + matchIndex + matchText.length,
                section: sectionName,
            };

            // Analyze context
            const context = analyzeContext(
                matchText,
                entitySpan,
                sectionName as any || 'other'
            );

            // Create entity
            const entity: MedicalEntity = {
                text: matchText,
                normalizedText: normalizeMedicalTerm(expansions[0]), // Use first expansion as normalized form
                type: determineEntityType(keyword),
                span: entitySpan,
                context,
            };

            entities.push(entity);
        }
    }

    return entities;
}

/**
 * Determine entity type from keyword
 */
function determineEntityType(keyword: string): EntityType {
    // Simple heuristics based on keyword patterns
    const conditionKeywords = [
        'diabetes', 'hypertension', 'asthma', 'copd', 'ckd', 'heart failure',
        'obesity', 'depression', 'anxiety', 'bipolar', 'arthritis', 'gout',
    ];

    const symptomKeywords = ['pain', 'headache', 'migraine'];

    if (conditionKeywords.some(k => keyword.includes(k))) {
        return 'condition';
    }

    if (symptomKeywords.some(k => keyword.includes(k))) {
        return 'symptom';
    }

    // Default to condition
    return 'condition';
}

/**
 * Deduplicate entities
 */
function deduplicateEntities(entities: MedicalEntity[]): MedicalEntity[] {
    const seen = new Set<string>();
    const unique: MedicalEntity[] = [];

    for (const entity of entities) {
        // Create a unique key based on normalized text and position
        const key = `${entity.normalizedText}-${entity.span.startIndex}`;

        if (!seen.has(key)) {
            seen.add(key);
            unique.push(entity);
        }
    }

    return unique;
}

/**
 * Filter entities based on context
 * Returns only entities that should be used for code extraction
 */
export function filterEntitiesByContext(entities: MedicalEntity[]): MedicalEntity[] {
    return entities.filter(entity => {
        // Exclude negated entities
        if (entity.context.isNegated) {
            return false;
        }

        // Exclude family history
        if (entity.context.attribution === 'family') {
            return false;
        }

        // Exclude differential diagnoses (these become "missing" codes)
        if (entity.context.attribution === 'differential') {
            return false;
        }

        // Include everything else
        return true;
    });
}

/**
 * Get entities that were excluded (for "missing" codes / documentation improvement)
 */
export function getExcludedEntities(entities: MedicalEntity[]): MedicalEntity[] {
    return entities.filter(entity => {
        // Include differential diagnoses (opportunities for documentation)
        if (entity.context.attribution === 'differential') {
            return true;
        }

        // Include suspected conditions
        if (entity.context.certainty === 'suspected') {
            return true;
        }

        return false;
    });
}
