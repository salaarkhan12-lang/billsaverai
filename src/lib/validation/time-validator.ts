/**
 * Time-Based E/M Validator
 * 
 * Validates E/M documentation based on total time spent when >50% of visit is
 * counseling/coordination of care (per 2021 E/M guidelines).
 * 
 * Time thresholds based on CPT guidelines.
 */

import type {
    ValidationResult,
    ValidationInput,
    TimeDocumentation,
    ClaimedCodeValidation,
} from './types';
import { EM_LEVEL_THRESHOLDS } from './types';

/**
 * Main time-based validation function
 */
export function validateByTime(input: ValidationInput): ValidationResult {
    const { documentText, claimedCode, visitType } = input;

    // Step 1: Extract time from documentation
    const timeData = extractTimeFromNote(documentText);

    // If no time documented, return low-confidence result
    if (!timeData) {
        return {
            supportedLevel: 'unknown',
            confidence: 0,
            methodology: 'time',
            breakdown: {
                score: 0,
                threshold: 'No time documented',
                reasoning: [
                    'No time documentation found in note',
                    'Time-based billing requires explicit documentation of total time',
                ],
                evidence: [],
            },
        };
    }

    // Step 2: Determine if counseling/coordination is dominant
    const isCounselingDominant = detectCounselingDominant(documentText);

    // Time-based billing only valid if >50% counseling
    if (!isCounselingDominant) {
        return {
            supportedLevel: 'unknown',
            confidence: 0.3,
            methodology: 'time',
            breakdown: {
                score: timeData.minutes,
                threshold: `${timeData.minutes} minutes (insufficient counseling)`,
                reasoning: [
                    `Total time documented: ${timeData.minutes} minutes`,
                    'Counseling/coordination does NOT appear to be >50% of visit',
                    '**Use MDM-based coding instead**',
                ],
                evidence: timeData.evidence,
            },
        };
    }

    // Step 3: Map time to CPT code
    const supportedLevel = mapTimeToCPT(timeData.minutes, visitType);

    // Step 4: Calculate confidence
    const confidence = calculateTimeConfidence(timeData);

    // Step 5: Validate against claimed code
    const validation = claimedCode
        ? validateClaimedCode(claimedCode, supportedLevel)
        : undefined;

    // Step 6: Build result
    return {
        supportedLevel,
        confidence,
        methodology: 'time',
        breakdown: {
            score: timeData.minutes,
            threshold: getTimeRange(supportedLevel, visitType),
            reasoning: [
                `**Total Time**: ${timeData.minutes} minutes`,
                `**Counseling/Coordination**: >50% of visit (time-based billing valid)`,
                ``,
                `Time range for ${supportedLevel}: ${getTimeRange(supportedLevel, visitType)}`,
            ],
            evidence: [
                ...timeData.evidence,
                ...timeData.counselingEvidence,
            ],
        },
        validation,
    };
}

/**
 * Extract time from clinical documentation
 * Looks for common time documentation patterns
 */
function extractTimeFromNote(text: string): TimeDocumentation | null {
    const evidence: string[] = [];
    const counselingEvidence: string[] = [];

    // Common time documentation patterns
    const timePatterns = [
        /total time[:\s]+(\d+)\s*(?:min|minute)/i,
        /time spent[:\s]+(\d+)\s*(?:min|minute)/i,
        /(\d+)\s*(?:min|minute)s?\s+total/i,
        /visit duration[:\s]+(\d+)\s*(?:min|minute)/i,
        /(\d+)\s*(?:min|minute)s?\s+(?:of|spent)/i,
    ];

    let minutes = 0;
    let explicit = false;

    // Try each pattern
    for (const pattern of timePatterns) {
        const match = text.match(pattern);
        if (match) {
            minutes = parseInt(match[1]);
            explicit = true;

            // Extract the full sentence for evidence
            const sentenceMatch = text.match(new RegExp(`.{0,50}${match[0]}.{0,50}`));
            if (sentenceMatch) {
                evidence.push(sentenceMatch[0].trim());
            }
            break;
        }
    }

    if (minutes === 0) {
        return null;
    }

    // Check for counseling documentation
    const counselingDominant = detectCounselingDominant(text);

    return {
        minutes,
        evidence,
        explicit,
        counselingDominant,
        counselingEvidence,
    };
}

/**
 * Detect if counseling/coordination is >50% of visit
 * Required for time-based billing per E/M guidelines
 */
function detectCounselingDominant(text: string): boolean {
    // Explicit statements
    const explicitPatterns = [
        />?\s*50%.*counsel/i,
        /more than half.*counsel/i,
        /majority.*counsel/i,
        /primarily.*counsel/i,
        /mostly.*counsel/i,
    ];

    for (const pattern of explicitPatterns) {
        if (pattern.test(text)) {
            return true;
        }
    }

    // Infer from documentation - counseling-heavy keywords
    const counselingKeywords = [
        /counsel/gi,
        /discussed/gi,
        /explained/gi,
        /educat/gi,
        /coordinat/gi,
        /advised/gi,
        /reviewed.*with patient/gi,
    ];

    // Count counseling mentions
    let counselingMentions = 0;
    for (const keyword of counselingKeywords) {
        const matches = text.match(keyword);
        if (matches) {
            counselingMentions += matches.length;
        }
    }

    // If counseling mentioned 3+ times, likely dominant
    // This is a heuristic - actual >50% should be explicitly documented
    return counselingMentions >= 3;
}

/**
 * Map total time to appropriate CPT code
 */
function mapTimeToCPT(minutes: number, visitType: 'new' | 'established'): string {
    const thresholds = EM_LEVEL_THRESHOLDS.time[visitType];

    // Find the appropriate code based on time range
    for (const [code, range] of Object.entries(thresholds)) {
        if (minutes >= range.min && minutes <= range.max) {
            return code;
        }
    }

    // If time exceeds all ranges, return highest level
    const codes = Object.keys(thresholds);
    return codes[codes.length - 1];
}

/**
 * Get time range for a given CPT code
 */
function getTimeRange(code: string, visitType: 'new' | 'established'): string {
    const thresholds = EM_LEVEL_THRESHOLDS.time[visitType];

    // Type-safe check - use 'as any' since TypeScript can't narrow the union type properly
    if (code in thresholds) {
        const range = (thresholds as any)[code];
        return `${range.min}-${range.max} minutes`;
    }

    return 'Unknown';
}

/**
 * Calculate confidence in time-based determination
 */
function calculateTimeConfidence(timeData: TimeDocumentation): number {
    let confidence = 0.5; // Base

    // Explicit time documentation increases confidence
    if (timeData.explicit) {
        confidence += 0.25;
    }

    // Counseling dominance documented increases confidence
    if (timeData.counselingDominant) {
        confidence += 0.25;
    }

    return Math.min(confidence, 1.0);
}

/**
 * Validate claimed code against supported level
 */
function validateClaimedCode(
    claimedCode: string,
    supportedLevel: string
): ClaimedCodeValidation {
    const claimed = parseInt(claimedCode.substring(3, 5));
    const supported = parseInt(supportedLevel.substring(3, 5));

    const isSupported = claimed === supported;

    if (isSupported) {
        return {
            claimedCode,
            isSupported: true,
        };
    }

    // Determine type and severity
    const type = claimed > supported ? 'overcoding' : 'undercoding';
    const levelDiff = Math.abs(claimed - supported);

    let riskLevel: 'high' | 'medium' | 'low';
    if (type === 'overcoding' && levelDiff >= 2) {
        riskLevel = 'high';
    } else if (type === 'overcoding') {
        riskLevel = 'medium';
    } else {
        riskLevel = 'low';
    }

    return {
        claimedCode,
        isSupported: false,
        discrepancy: {
            type,
            suggestedCode: supportedLevel,
            riskLevel,
            auditRisk: type === 'overcoding'
                ? `Claimed time-based level ${claimedCode.slice(-2)} exceeds documented time. Audit risk.`
                : `Documented time supports higher level (${supportedLevel}). Revenue opportunity.`,
        },
    };
}
