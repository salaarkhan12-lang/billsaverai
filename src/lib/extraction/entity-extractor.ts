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
 * Extract entities from sentences
 * Uses layered approach:
 * - Layer 1: Direct code extraction (explicit ICD/CPT codes)
 * - Layer 2: Keyword matching (medical terms)
 */
export function extractEntities(
    sentences: TextSpan[],
    sectionName?: string
): MedicalEntity[] {
    const entities: MedicalEntity[] = [];

    for (const sentence of sentences) {
        // Layer 1: Extract explicit codes first (baseline)
        const explicitCodes = extractExplicitCodes(sentence, sectionName);
        entities.push(...explicitCodes);

        // Layer 2: Extract from keyword matching
        const sentenceEntities = extractFromSentence(sentence, sectionName);
        entities.push(...sentenceEntities);
    }

    // Deduplicate entities (same text, same location)
    const unique = deduplicateEntities(entities);

    return unique;
}

/**
 * Layer 1: Extract explicit medical codes from text
 * This catches codes written directly in the document (A12.34, 99204, etc.)
 */
function extractExplicitCodes(
    span: TextSpan,
    sectionName?: string
): MedicalEntity[] {
    const entities: MedicalEntity[] = [];
    const text = span.text;

    // Pattern 1: ICD-10 codes (A12.34 format)
    // Matches: E11.65, I10, Z59.00, etc.
    const icd10Pattern = /\b([A-Z][0-9]{2}\.?[0-9]{0,2})\b/g;
    let match;


    while ((match = icd10Pattern.exec(text)) !== null) {
        const code = match[1];
        const matchIndex = match.index;


        // Validate it looks like a real ICD-10 code
        if (isValidICD10Format(code)) {

            const entitySpan: TextSpan = {
                text: span.text,
                startIndex: span.startIndex + matchIndex,
                endIndex: span.startIndex + matchIndex + code.length,
                section: sectionName,
            };

            const context = analyzeContext(
                code,
                entitySpan,
                sectionName as any || 'other'
            );

            entities.push({
                text: code,
                normalizedText: code.toUpperCase(),
                type: 'code-icd10' as any,
                span: entitySpan,
                context,
            });
        } else {
        }
    }


    // Pattern 2: CPT codes (99204, 80061, etc.)
    // 5-digit numeric codes
    const cptPattern = /\b([0-9]{5})\b/g;

    while ((match = cptPattern.exec(text)) !== null) {
        const code = match[1];
        const matchIndex = match.index;


        // Only extract if it looks like a procedure code (not a random number)
        if (isLikelyCPTCode(code, text, matchIndex)) {

            const entitySpan: TextSpan = {
                text: span.text,
                startIndex: span.startIndex + matchIndex,
                endIndex: span.startIndex + matchIndex + code.length,
                section: sectionName,
            };

            const context = analyzeContext(
                code,
                entitySpan,
                sectionName as any || 'other'
            );

            entities.push({
                text: code,
                normalizedText: code,
                type: 'code-cpt' as any,
                span: entitySpan,
                context,
            });
        } else {
        }
    }


    // Pattern 3: E/M Level Text (convert to CPT codes)
    // Matches: "Level: Office/Outpt Visit, New, Lvl IV" → 99204
    const emLevelMatch = text.match(/Level:\s*([^,]+),\s*(New|Established),\s*Lvl\s*(I{1,3}V?|V)/i);

    if (emLevelMatch) {
        const visitType = emLevelMatch[2].toLowerCase(); // "new" or "established"
        const level = emLevelMatch[3]; // "IV", "III", "II", "I", "V"


        // Map E/M level to CPT code
        const cptCode = mapEMLevelToCPT(visitType, level);

        if (cptCode) {

            const matchIndex = emLevelMatch.index!;
            const matchText = emLevelMatch[0];

            const entitySpan: TextSpan = {
                text: span.text,
                startIndex: span.startIndex + matchIndex,
                endIndex: span.startIndex + matchIndex + matchText.length,
                section: sectionName,
            };

            const context = analyzeContext(
                cptCode,
                entitySpan,
                sectionName as any || 'other'
            );

            entities.push({
                text: matchText,
                normalizedText: cptCode,
                type: 'code-cpt' as any,
                span: entitySpan,
                context,
            });
        } else {
        }
    }


    return entities;
}

/**
 * Validate ICD-10 code format
 */
function isValidICD10Format(code: string): boolean {
    // ICD-10 starts with letter, followed by 2 digits
    // May have decimal and 1-2 more digits
    const pattern = /^[A-Z][0-9]{2}\.?[0-9]{0,2}$/;
    return pattern.test(code);
}

/**
 * Check if a 5-digit number is likely a CPT code
 * Uses context clues to avoid false positives (dates, phone numbers, etc.)
 */
function isLikelyCPTCode(code: string, text: string, index: number): boolean {
    // CPT codes are typically in ranges:
    // 99000-99999 (E/M, medicine)
    // 80000-89999 (pathology/lab)
    // 90000-99999 (medicine)
    // 00100-09999 (anesthesia)
    const codeNum = parseInt(code, 10);

    // Quick range check
    if (codeNum < 10000) {
        // Could be anesthesia code (00100-09999)
        // Be more strict
        const contextBefore = text.substring(Math.max(0, index - 20), index).toLowerCase();
        if (contextBefore.includes('cpt') || contextBefore.includes('code') || contextBefore.includes('procedure')) {
            return true;
        }
        return false;
    }

    if (codeNum >= 80000 && codeNum <= 99999) {
        // Likely CPT range
        return true;
    }

    // Context clues for other ranges
    const contextBefore = text.substring(Math.max(0, index - 30), index).toLowerCase();
    const contextAfter = text.substring(index + 5, Math.min(text.length, index + 35)).toLowerCase();

    // Look for CPT-related keywords
    if (
        contextBefore.includes('cpt') ||
        contextBefore.includes('code') ||
        contextBefore.includes('procedure') ||
        contextBefore.includes('level') ||
        contextAfter.includes('office') ||
        contextAfter.includes('visit') ||
        contextAfter.includes('consultation')
    ) {
        return true;
    }

    return false;
}

/**
 * Map E/M level text to CPT code
 * Converts "New, Lvl IV" → 99204
 */
function mapEMLevelToCPT(visitType: string, level: string): string | null {
    // Normalize level (IV, III, II, I, V)
    const levelMap: Record<string, number> = {
        'I': 1,
        'II': 2,
        'III': 3,
        'IV': 4,
        'V': 5,
    };

    const levelNum = levelMap[level.toUpperCase()];
    if (!levelNum) return null;

    // Map to CPT codes
    if (visitType === 'new') {
        // New patient: 99202-99205 (99201 deleted in 2021)
        // Level I → 99202, Level II → 99203, Level III → 99204, Level IV → 99205
        const codes = ['99202', '99203', '99204', '99205'];
        return codes[levelNum - 1] || null;
    } else if (visitType === 'established') {
        // Established patient: 99211-99215
        // Level I → 99211, Level II → 99212, etc.
        const codes = ['99211', '99212', '99213', '99214', '99215'];
        return codes[levelNum - 1] || null;
    }

    return null;
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
    const filtered = entities.filter(entity => {
        // CRITICAL: Always preserve explicit codes (Layer 1)
        // These are codes written directly in the document and should NEVER be filtered
        if (entity.type === 'code-icd10' || entity.type === 'code-cpt') {
            return true;
        }

        // For keyword-based entities (Layer 2), apply contextual filtering

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

    return filtered;
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
