/**
 * Enhanced Section Detector
 * Builds on existing section detection with hierarchy support
 * Migrated from icd10-extractor.ts with improvements
 */

import type { DocumentSection, SectionType, DocumentContext } from './types';

/**
 * Section pattern definitions
 * Ordered by priority (family history checked first to prevent false matches)
 */
const SECTION_PATTERNS: Record<SectionType | string, RegExp> = {
    // Non-clinical sections (check first to prevent false matches)
    'family-history': /\b(family\s+history|fh)[\s:]/i,
    'social-history': /\b(social\s+history|sh)[\s:]/i,

    // Clinical sections
    'assessment': /\b(assessment|impression|diagnos[ie]s|problem\s+list|past\s+medical\s+history|pmh|a\/p)[\s:]/i,
    'plan': /\b(plan|treatment\s+plan|therapeutic\s+plan)[\s:]/i,
    'hpi': /\b(history\s+of\s+present\s+illness|hpi|chief\s+complaint|cc)[\s:]/i,
    'ros': /\b(review\s+of\s+systems|ros)[\s:]/i,
    'physical-exam': /\b(physical\s+exam|examination|pe)[\s:]/i,
    'procedures': /\b(procedure[s]?|interventions?)[\s:]/i,
    'orders': /\b(orders?|labs?|imaging|studies)[\s:]/i,

    // Administrative sections
    'medications': /\b(medications?|meds?|current\s+medications)[\s:]/i,
    'allergies': /\b(allergies|allergy)[\s:]/i,
};

/**
 * Map section names to normalized types
 */
function normalizeSectionType(sectionName: string): SectionType {
    const normalized = sectionName.toLowerCase();

    if (normalized in SECTION_PATTERNS) {
        return normalized as SectionType;
    }

    return 'other';
}

/**
 * Detect sections in medical document
 * Enhanced version of extractSections from icd10-extractor.ts
 */
export function detectSections(text: string): DocumentSection[] {
    const sections: DocumentSection[] = [];
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check each section pattern
        for (const [sectionType, pattern] of Object.entries(SECTION_PATTERNS)) {
            if (pattern.test(line)) {
                const startLine = i;
                let endLine = i + 1;

                // Find the next section header or end of text
                for (let j = i + 1; j < lines.length; j++) {
                    const isNextSection = Object.values(SECTION_PATTERNS).some(p => p.test(lines[j]));
                    if (isNextSection) {
                        endLine = j;
                        break;
                    }
                    endLine = j + 1;
                }

                const sectionText = lines.slice(startLine, endLine).join('\n');
                const type = normalizeSectionType(sectionType);

                sections.push({
                    name: sectionType,
                    type,
                    startLine,
                    endLine,
                    text: sectionText,
                    confidence: calculateSectionConfidence(line, sectionText, type),
                });

                break; // Found match, move to next line
            }
        }
    }

    return sections;
}

/**
 * Calculate confidence that this is actually a section header
 */
function calculateSectionConfidence(
    headerLine: string,
    sectionText: string,
    type: SectionType
): number {
    let confidence = 0.8; // Base confidence

    // Increase confidence if header line is short (likely a header)
    if (headerLine.trim().length < 40) {
        confidence += 0.1;
    }

    // Increase confidence if header ends with colon
    if (headerLine.trim().endsWith(':')) {
        confidence += 0.05;
    }

    // Increase confidence if header is title case
    if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+)*/.test(headerLine.trim())) {
        confidence += 0.05;
    }

    // Decrease confidence if section is very short (might be misidentified)
    if (sectionText.length < 20) {
        confidence -= 0.2;
    }

    // Cap at 0-1
    return Math.max(0, Math.min(1, confidence));
}

/**
 * Get only diagnosis sections (for ICD-10 extraction)
 * Enhanced version of getDiagnosisSections from icd10-extractor.ts
 */
export function getDiagnosisSections(sections: DocumentSection[]): DocumentSection[] {
    // Only use assessment/diagnosis sections, exclude family/social history
    return sections.filter(section => {
        const isDiagnosis = section.type === 'assessment' || section.type === 'diagnosis';
        const isExcluded = section.type === 'family-history' || section.type === 'social-history';
        return isDiagnosis && !isExcluded;
    });
}

/**
 * Get combined text from diagnosis sections
 */
export function getDiagnosisSectionsText(sections: DocumentSection[]): string {
    const diagnosisSections = getDiagnosisSections(sections);
    return diagnosisSections.map(s => s.text).join('\n');
}

/**
 * Check if a section is clinical (contains diagnosis/treatment info)
 */
export function isClinicalSection(section: DocumentSection): boolean {
    const clinicalTypes: SectionType[] = [
        'assessment',
        'diagnosis',
        'plan',
        'hpi',
        'ros',
        'physical-exam',
        'procedures',
    ];

    return clinicalTypes.includes(section.type);
}

/**
 * Check if section should be excluded from extraction
 */
export function isExcludedSection(section: DocumentSection): boolean {
    const excludedTypes: SectionType[] = [
        'family-history',
        'social-history',
        'allergies', // Unless extracting allergy codes
    ];

    return excludedTypes.includes(section.type);
}

/**
 * Integrate sections into document context
 */
export function integrateSections(context: DocumentContext): DocumentContext {
    const sections = detectSections(context.originalText);

    // Update sentences with section information
    const updatedSentences = context.sentences.map(sentence => {
        // Find which section this sentence belongs to
        const section = sections.find(s => {
            const sentenceLineStart = context.originalText.substring(0, sentence.startIndex).split('\n').length;
            return sentenceLineStart >= s.startLine && sentenceLineStart < s.endLine;
        });

        return {
            ...sentence,
            section: section?.name,
        };
    });

    return {
        ...context,
        sections,
        sentences: updatedSentences,
        metadata: {
            ...context.metadata,
            sectionCount: sections.length,
        },
    };
}

/**
 * Extract diagnosis lines from text
 * Enhanced version from icd10-extractor.ts
 */
export function extractDiagnosisLines(text: string): string[] {
    // Split by semicolons, newlines, and bullets
    const semicolonSplit = text.split(/;/).map(l => l.trim()).filter(l => l.length > 3);
    const newlineSplit = text.split(/\n/).map(l => l.trim()).filter(l => l.length >= 3 && !/^(assessment|diagnosis|impression)/i.test(l));

    const bulletPattern = /^[•\-\*\d+\.)]\s*(.+)$/;
    const bulletSplit = text.split(/\n/).map(l => {
        const match = l.trim().match(bulletPattern);
        return match ? match[1].trim() : l.trim();
    }).filter(l => l.length > 3);

    // Combine and deduplicate
    const combined = [...semicolonSplit, ...newlineSplit, ...bulletSplit];
    const unique = Array.from(new Set(combined));

    // Filter out generic/noise lines
    const filtered = unique.filter(line => {
        const tooGeneric = /^(none|n\/a|see above|as above|continued|stable|ongoing)$/i.test(line);
        const isHeader = /^(assessment|diagnosis|impression|plan|problem list|past medical history)[\s:]*$/i.test(line);
        return !tooGeneric && !isHeader;
    });

    return filtered;
}
