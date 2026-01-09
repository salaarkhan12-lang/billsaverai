/**
 * Context Analyzer
 * Analyzes context around medical entities (negation, temporal, attribution, certainty)
 * This is the "smart" part - understanding what NOT to extract
 */

import type { EntityContext, TextSpan, SectionType } from './types';

/**
 * Negation triggers that indicate a condition is being ruled out or denied
 */
const NEGATION_TRIGGERS = [
    'no', 'not', 'denies', 'denied', 'negative', 'negative for',
    'absent', 'without', 'rule out', 'r/o', 'ruled out',
    'free of', 'free from', 'unremarkable', 'within normal limits',
    'wnl', 'non-diagnostic', 'no evidence of', 'no signs of',
    'no history of', 'never', 'does not have',
];

/**
 * Temporal triggers that indicate historical vs current vs future
 */
const TEMPORAL_TRIGGERS = {
    historical: ['history of', 'h/o', 'past', 'previous', 'prior', 'former', 'old', 'resolved'],
    current: ['current', 'active', 'ongoing', 'present', 'acute', 'today', 'now'],
    future: ['at risk for', 'risk of', 'likely to develop', 'may develop', 'will check for', 'r/o'],
};

/**
 * Attribution triggers that indicate who has the condition
 */
const ATTRIBUTION_TRIGGERS = {
    family: ['mother', 'father', 'sister', 'brother', 'maternal', 'paternal',
        'grandmother', 'grandfather', 'aunt', 'uncle', 'sibling', 'family'],
    differential: ['r/o', 'rule out', 'possible', 'consider', 'differential', 'versus', 'vs'],
};

/**
 * Certainty triggers
 */
const CERTAINTY_TRIGGERS = {
    confirmed: ['diagnosed with', 'has', 'positive for', 'confirmed'],
    suspected: ['possible', 'likely', 'probable', 'suspicious for', 'concerning for', 'question of'],
    ruledOut: ['negative for', 'ruled out', 'not', 'no evidence of'],
};

/**
 * Analyze context for a medical entity
 */
export function analyzeContext(
    entity: string,
    span: TextSpan,
    section: SectionType
): EntityContext {
    // Get surrounding text (±50 chars for context)
    const contextStart = Math.max(0, span.startIndex - 50);
    const contextEnd = Math.min(span.text.length, span.endIndex + 50);
    const contextText = span.text.substring(contextStart, contextEnd).toLowerCase();

    // Extract the text before the entity (for negation/temporal/attribution analysis)
    const beforeEntity = span.text.substring(contextStart, span.startIndex).toLowerCase();
    const afterEntity = span.text.substring(span.endIndex, contextEnd).toLowerCase();

    // Analyze negation
    const negation = analyzeNegation(beforeEntity, afterEntity, entity);

    // Analyze temporality
    const temporal = analyzeTemporality(beforeEntity, afterEntity);

    // Analyze attribution
    const attribution = analyzeAttribution(beforeEntity, span.text);

    // Analyze certainty
    const certainty = analyzeCertainty(beforeEntity, afterEntity, negation.isNegated);

    return {
        isNegated: negation.isNegated,
        negationTrigger: negation.trigger,

        temporality: temporal.temporality,
        temporalTrigger: temporal.trigger,

        attribution: attribution.attribution,
        attributionTrigger: attribution.trigger,

        certainty: certainty.certainty,
        certaintyTrigger: certainty.trigger,

        section,
    };
}

/**
 * Analyze negation in context
 * Returns whether the entity is negated and the trigger word
 */
function analyzeNegation(
    before: string,
    after: string,
    entity: string
): { isNegated: boolean; trigger?: string } {
    // Check for negation triggers before the entity
    for (const trigger of NEGATION_TRIGGERS) {
        // Look for trigger within last 30 chars before entity
        const searchText = before.slice(-30);

        if (searchText.includes(trigger)) {
            // Check if negation scope extends to this entity
            // Negation scope typically ends at punctuation or conjunctions
            const scopeBreakers = ['.', '!', '?', ',', 'but', 'however', 'although', 'except'];
            const textBetween = before.slice(before.lastIndexOf(trigger) + trigger.length);

            const scopeBroken = scopeBreakers.some(breaker => textBetween.includes(breaker));

            if (!scopeBroken) {
                return { isNegated: true, trigger };
            }
        }
    }

    // Check for double negatives ("not ruling out" = suspected, not negated)
    if (before.includes('not ruling out') || before.includes('not rule out')) {
        return { isNegated: false };
    }

    return { isNegated: false };
}

/**
 * Analyze temporality (when did/does/will this condition occur?)
 */
function analyzeTemporality(
    before: string,
    after: string
): { temporality: EntityContext['temporality']; trigger?: string } {
    // Check for historical markers
    for (const trigger of TEMPORAL_TRIGGERS.historical) {
        if (before.includes(trigger)) {
            return { temporality: 'historical', trigger };
        }
    }

    // Check for current/active markers
    for (const trigger of TEMPORAL_TRIGGERS.current) {
        if (before.includes(trigger) || after.includes(trigger)) {
            return { temporality: 'current', trigger };
        }
    }

    // Check for future/risk markers
    for (const trigger of TEMPORAL_TRIGGERS.future) {
        if (before.includes(trigger)) {
            return { temporality: 'future', trigger };
        }
    }

    // Default: assume current if in Assessment/Plan section
    return { temporality: 'current' };
}

/**
 * Analyze attribution (whose condition is this?)
 */
function analyzeAttribution(
    before: string,
    fullText: string
): { attribution: EntityContext['attribution']; trigger?: string } {
    // Check for family history markers - these are highest priority
    for (const trigger of ATTRIBUTION_TRIGGERS.family) {
        // Check in the full line, not just before
        if (fullText.toLowerCase().includes(trigger)) {
            return { attribution: 'family', trigger };
        }
    }

    // Check for differential diagnosis markers
    for (const trigger of ATTRIBUTION_TRIGGERS.differential) {
        if (before.includes(trigger)) {
            return { attribution: 'differential', trigger };
        }
    }

    // Default: assume patient's condition
    return { attribution: 'patient' };
}

/**
 * Analyze certainty level
 */
function analyzeCertainty(
    before: string,
    after: string,
    isNegated: boolean
): { certainty: EntityContext['certainty']; trigger?: string } {
    // If negated, it's ruled out
    if (isNegated) {
        return { certainty: 'ruled-out' };
    }

    // Check for confirmation markers
    for (const trigger of CERTAINTY_TRIGGERS.confirmed) {
        if (before.includes(trigger)) {
            return { certainty: 'confirmed', trigger };
        }
    }

    // Check for suspected markers
    for (const trigger of CERTAINTY_TRIGGERS.suspected) {
        if (before.includes(trigger) || after.includes(trigger)) {
            return { certainty: 'suspected', trigger };
        }
    }

    // Default: if none of the above, assume confirmed (in medical notes, stated = confirmed)
    return { certainty: 'confirmed' };
}

/**
 * Check if entity should be excluded based on context
 */
export function shouldExcludeEntity(context: EntityContext): boolean {
    // Exclude if negated
    if (context.isNegated) {
        return true;
    }

    // Exclude if family history
    if (context.attribution === 'family') {
        return true;
    }

    // Exclude if differential/rule-out (these go to "missing" codes for documentation improvement)
    if (context.attribution === 'differential') {
        return true;
    }

    // Exclude if ruled out
    if (context.certainty === 'ruled-out') {
        return true;
    }

    return false;
}

/**
 * Calculate confidence adjustment based on context
 * Returns a multiplier (0-1) to adjust base confidence
 */
export function getContextConfidenceAdjustment(context: EntityContext): number {
    let adjustment = 1.0;

    // Section adjustments
    if (context.section === 'plan') {
        adjustment *= 0.8; // Lower confidence in plan section (intent, not confirmed)
    } else if (context.section === 'assessment' || context.section === 'diagnosis') {
        adjustment *= 1.0; // Full confidence in diagnosis sections
    } else if (context.section === 'hpi') {
        adjustment *= 0.95; // Slightly lower in HPI
    }

    // Temporal adjustments
    if (context.temporality === 'historical') {
        adjustment *= 1.05; // Historical is good (risk adjustment)
    } else if (context.temporality === 'future') {
        adjustment *= 0.6; // Future/risk is less certain
    }

    // Certainty adjustments
    if (context.certainty === 'suspected') {
        adjustment *= 0.7; // Suspected conditions are less certain
    } else if (context.certainty === 'confirmed') {
        adjustment *= 1.0; // Confirmed is full confidence
    }

    // Attribution adjustments
    if (context.attribution === 'differential') {
        adjustment *= 0.5; // Differential diagnoses are uncertain
    }

    return Math.max(0, Math.min(1, adjustment));
}
