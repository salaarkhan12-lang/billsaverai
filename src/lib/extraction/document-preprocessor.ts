/**
 * Document Preprocessor
 * Normalizes and tokenizes medical text for extraction
 */

import type { DocumentContext, TextSpan } from './types';

/**
 * Preprocess raw medical document text
 */
export function preprocessDocument(text: string): DocumentContext {
    const startTime = performance.now();

    // Step 1: Normalize text
    const normalized = normalizeText(text);

    // Step 2: Split into sentences
    const sentences = tokenizeSentences(normalized);

    // Step 3: Section detection happens in section-detector.ts
    // We'll integrate it in the main engine

    const processingTime = performance.now() - startTime;

    return {
        originalText: text,
        sections: [], // Will be populated by section detector
        sentences,
        metadata: {
            length: text.length,
            sectionCount: 0, // Will be updated
            estimatedComplexity: estimateComplexity(text),
        },
    };
}

/**
 * Normalize text: clean whitespace, handle special characters
 */
function normalizeText(text: string): string {
    return text
        // Normalize line endings
        .replace(/\r\n/g, '\n')
        // Remove excessive whitespace
        .replace(/[ \t]+/g, ' ')
        // Remove excessive newlines (but keep structure)
        .replace(/\n{3,}/g, '\n\n')
        // Trim each line
        .split('\n')
        .map(line => line.trim())
        .join('\n')
        // Final trim
        .trim();
}

/**
 * Split text into sentences for analysis
 * Handles medical abbreviations (Dr., pt., vs., etc.)
 */
function tokenizeSentences(text: string): TextSpan[] {
    const sentences: TextSpan[] = [];

    // Medical abbreviations that end with periods but aren't sentence endings
    const abbreviations = [
        'Dr', 'Mr', 'Mrs', 'Ms', 'pt', 'pts', 'mg', 'ml', 'cc',
        'vs', 'approx', 'etc', 'i.e', 'e.g', 'cf', 'no', 'nos',
        'hx', 'fx', 'rx', 'tx', 'dx', 'sx', 'bx', 'sx',
    ];

    // Create abbreviation pattern
    const abbrevPattern = new RegExp(`\\b(${abbreviations.join('|')})\\.`, 'gi');

    // Temporarily replace abbreviation periods with placeholder
    const ABBREV_PLACEHOLDER = '<!ABBREV!>';
    let protectedText = text.replace(abbrevPattern, `$1${ABBREV_PLACEHOLDER}`);

    // Split on sentence boundaries
    // Look for: period/question mark/exclamation followed by space and capital letter
    const sentencePattern = /([.!?]+)(\s+|$)/g;

    let lastIndex = 0;
    let match;

    while ((match = sentencePattern.exec(protectedText)) !== null) {
        const endIndex = match.index + match[1].length;
        const sentenceText = protectedText.slice(lastIndex, endIndex).trim();

        if (sentenceText.length > 0) {
            // Restore abbreviation periods
            const restored = sentenceText.replace(new RegExp(ABBREV_PLACEHOLDER, 'g'), '.');

            sentences.push({
                text: restored,
                startIndex: lastIndex,
                endIndex,
            });
        }

        lastIndex = endIndex + match[2].length;
    }

    // Add remaining text as final sentence
    if (lastIndex < protectedText.length) {
        const remaining = protectedText.slice(lastIndex).trim();
        if (remaining.length > 0) {
            const restored = remaining.replace(new RegExp(ABBREV_PLACEHOLDER, 'g'), '.');
            sentences.push({
                text: restored,
                startIndex: lastIndex,
                endIndex: protectedText.length,
            });
        }
    }

    return sentences;
}

/**
 * Estimate document complexity based on length and structure
 */
function estimateComplexity(text: string): 'low' | 'moderate' | 'high' {
    const length = text.length;
    const lineCount = text.split('\n').length;
    const numberListPattern = /^\s*\d+[\.)]/gm;
    const bulletPattern = /^\s*[•\-\*]/gm;

    const hasNumberedLists = numberListPattern.test(text);
    const hasBullets = bulletPattern.test(text);
    const avgLineLength = length / lineCount;

    // Simple heuristics
    if (length < 1000 && !hasNumberedLists) {
        return 'low';
    }

    if (length > 3000 || (hasNumberedLists && hasBullets) || avgLineLength > 100) {
        return 'high';
    }

    return 'moderate';
}

/**
 * Extract line structure (bullets, numbered lists, structured data)
 */
export interface LineStructure {
    lineNumber: number;
    text: string;
    type: 'bullet' | 'numbered' | 'header' | 'normal';
    indentLevel: number;
}

export function analyzeLineStructure(text: string): LineStructure[] {
    const lines = text.split('\n');
    const structures: LineStructure[] = [];

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return; // Skip empty lines

        // Detect indent level
        const indentMatch = line.match(/^(\s*)/);
        const indentLevel = indentMatch ? Math.floor(indentMatch[1].length / 2) : 0;

        // Detect line type
        let type: LineStructure['type'] = 'normal';

        if (/^\s*[•\-\*]\s/.test(line)) {
            type = 'bullet';
        } else if (/^\s*\d+[\.)]\s/.test(line)) {
            type = 'numbered';
        } else if (/^[A-Z][A-Za-z\s]+:?\s*$/i.test(trimmed) && trimmed.length < 50) {
            // Likely a section header (short, title-case, may end with colon)
            type = 'header';
        }

        structures.push({
            lineNumber: index + 1,
            text: trimmed,
            type,
            indentLevel,
        });
    });

    return structures;
}

/**
 * Normalize medical terminology
 * E.g., "Diabetes Mellitus Type II" → "type 2 diabetes mellitus"
 */
export function normalizeMedicalTerm(term: string): string {
    return term
        .toLowerCase()
        .trim()
        // Normalize Roman numerals to Arabic
        .replace(/\btype\s+ii\b/gi, 'type 2')
        .replace(/\btype\s+i\b/gi, 'type 1')
        // Normalize common abbreviations
        .replace(/\bhtn\b/gi, 'hypertension')
        .replace(/\bdm\b/gi, 'diabetes mellitus')
        .replace(/\bdm2\b/gi, 'type 2 diabetes')
        .replace(/\bdm1\b/gi, 'type 1 diabetes')
        .replace(/\bcopd\b/gi, 'chronic obstructive pulmonary disease')
        .replace(/\bckd\b/gi, 'chronic kidney disease')
        .replace(/\bcad\b/gi, 'coronary artery disease')
        .replace(/\bchf\b/gi, 'congestive heart failure')
        .replace(/\bgerd\b/gi, 'gastroesophageal reflux disease')
        .replace(/\bibs\b/gi, 'irritable bowel syndrome')
        // Remove extra whitespace
        .replace(/\s+/g, ' ')
        .trim();
}
