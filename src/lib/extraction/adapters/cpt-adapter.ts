/**
 * CPT Adapter
 * Translates medical documentation into CPT (Current Procedural Terminology) codes
 * 
 * EDUCATIONAL NOTE - What are CPT codes?
 * ===================================
 * CPT codes represent PROCEDURES and SERVICES (what the doctor DID)
 * vs ICD-10 codes which represent DIAGNOSES (what's wrong with the patient)
 * 
 * Most important CPT category: E/M (Evaluation & Management) codes
 * - Office visits: 99211-99215 (established), 99202-99205 (new)
 * - The number determines complexity: 99213 (low) vs 99215 (high)
 * - Higher complexity = more $ reimbursement
 * 
 * Example billing scenario:
 * - Patient with diabetes visits for follow-up
 * - CPT 99214 (moderate complexity office visit) → $131
 * - ICD-10 E11.65 (diabetes with hyperglycemia) → why they came
 * 
 * KEY INSIGHT: Documentation complexity drives CPT level!
 * More chronic conditions, more complexity, higher E/M code justified.
 */

import type {
    CodeAdapter,
    ExtractedCode,
    DocumentContext,
    MedicalEntity,
    ConfidenceScore,
    EvidenceLocation,
} from '../types';
import { CPT_CODES, type CPTCode } from '@/lib/cpt-database';
import { getContextConfidenceAdjustment } from '../context-analyzer';

/**
 * Complexity indicators for E/M level determination
 * 
 * EDUCATIONAL NOTE - How do we determine E/M level?
 * ================================================
 * The 2021 E/M guidelines focus on:
 * 1. Medical Decision Making (MDM) - most important
 * 2. Total Time spent on the encounter
 * 
 * MDM has 3 components:
 * - Number/Complexity of problems addressed
 * - Amount/Complexity of data reviewed
 * - Risk of complications/morbidity/mortality
 * 
 * We approximate this by counting:
 * - Chronic conditions (diabetes, COPD, CHF, etc.)
 * - Acute problems (pneumonia, fracture, etc.)
 * - Medications reviewed
 * - Labs/imaging ordered
 * - Risk factors (unstable conditions, new diagnosis)
 */
interface ComplexityIndicators {
    chronicConditionCount: number;    // E.g., diabetes, hypertension
    acuteIssueCount: number;          // E.g., pneumonia, injury
    stableChronicCount: number;        // E.g., "HTN well controlled"
    unstableChronicCount: number;      // E.g., "COPD exacerbation"
    medicationCount: number;           // Number of meds mentioned
    hasLabsOrders: boolean;            // Lab tests ordered?
    hasImagingOrders: boolean;         // Imaging ordered?
    hasNewDiagnosis: boolean;          // New condition diagnosed?
    hasHighRiskCondition: boolean;     // Conditions like CHF, sepsis
}

/**
 * E/M Level thresholds
 * 
 * EDUCATIONAL NOTE - The "2 of 3" rule
 * ===================================
 * For established patients (99211-99215):
 * - 99213 (low): 2+ chronic conditions OR 1 acute uncomplicated
 * - 99214 (moderate): 3+ chronic OR 1+ chronic + 1+ acute OR new diagnosis
 * - 99215 (high): Multiple chronic (4+) with exacerbation OR high risk
 * 
 * This is a simplified model. Real-world coding requires:
 * - Detailed documentation review
 * - Medical necessity justification
 * - Compliance with payer-specific rules
 */
const EM_LEVEL_CRITERIA = {
    // Straightforward (99212/99202)
    straightforward: {
        minProblems: 1,
        maxProblems: 1,
        riskLevel: 'minimal',
    },
    // Low complexity (99213/99203)
    low: {
        minProblems: 2,
        maxProblems: 2,
        chronicConditions: 2,
        riskLevel: 'low',
    },
    // Moderate complexity (99214/99204)
    moderate: {
        minProblems: 3,
        chronicConditions: 3,
        orNewDiagnosis: true,
        orUnstableCondition: true,
        riskLevel: 'moderate',
    },
    // High complexity (99215/99205)
    high: {
        minProblems: 4,
        chronicConditions: 4,
        orHighRisk: true,
        orExacerbation: true,
        riskLevel: 'high',
    },
};

/**
 * CPT Adapter
 */
export class CPTAdapter implements CodeAdapter {
    readonly codeSystem = 'cpt' as const;

    /**
     * Extract CPT codes from document context
     * 
     * EDUCATIONAL NOTE - CPT extraction strategy
     * =========================================
     * Unlike ICD-10 (which matches text to codes), CPT extraction is ANALYTICAL:
     * 1. Analyze document complexity (# of conditions, problems addressed)
     * 2. Determine appropriate E/M level (99213, 99214, 99215)
     * 3. Check for add-on code opportunities (CCM, TCM, RPM)
     * 4. Validate documentation supports the selected level
     * 
     * This is why CPT coding is harder - it's not "find keyword X → code Y"
     * It's "analyze entire encounter → determine justified level"
     */
    extractSync(context: DocumentContext, entities: MedicalEntity[]): ExtractedCode[] {
        const codes: ExtractedCode[] = [];

        // Step 1: Determine E/M level based on documented complexity
        const emCode = this.determineEMLevel(context, entities);
        if (emCode) {
            codes.push(emCode);
        }

        // Step 2: Check for add-on codes (CCM, TCM, etc.)
        const addOnCodes = this.detectAddOnCodes(context, entities);
        codes.push(...addOnCodes);

        return codes;
    }

    /**
     * Determine E/M (Evaluation & Management) level
     * 
     * This is the core of CPT extraction - figuring out if the visit
     * qualifies as 99213 (low), 99214 (moderate), or 99215 (high)
     */
    private determineEMLevel(
        context: DocumentContext,
        entities: MedicalEntity[]
    ): ExtractedCode | null {
        // Analyze complexity indicators
        const indicators = this.analyzeComplexity(context, entities);

        // Determine appropriate level based on indicators
        const level = this.calculateEMLevel(indicators);

        // Map to CPT code (assume established patient for now)
        const cptCode = this.getEstablishedPatientEMCode(level);

        if (!cptCode) return null;

        const codeInfo = CPT_CODES[cptCode];
        if (!codeInfo) return null;

        // Create evidence
        const evidence: EvidenceLocation[] = [{
            text: `${indicators.chronicConditionCount} chronic conditions, ${indicators.acuteIssueCount} acute issues`,
            section: 'assessment',
            snippet: `Complexity analysis: ${level} level encounter`,
        }];

        // Calculate confidence
        const confidence = this.scoreEMConfidence(indicators, level);

        return {
            code: cptCode,
            codeSystem: 'cpt',
            description: codeInfo.description,
            evidence,
            matchType: 'inferred', // CPT is always inferred from documentation
            confidence,
            category: codeInfo.category,
            rvu: codeInfo.rvu,
        };
    }

    /**
     * Analyze document complexity
     * 
     * EDUCATIONAL NOTE - What makes a visit "complex"?
     * ==============================================
     * We count:
     * - Chronic conditions: Each adds to complexity
     * - Stable vs unstable: "COPD exacerbation" > "COPD stable"
     * - Acute issues: "Pneumonia" is acute, adds complexity
     * - Multiple medications: Shows complexity of management
     * - Data reviewed: Labs, imaging, records
     * - Risk: CHF, sepsis, etc. are high-risk conditions
     */
    private analyzeComplexity(
        context: DocumentContext,
        entities: MedicalEntity[]
    ): ComplexityIndicators {
        const indicators: ComplexityIndicators = {
            chronicConditionCount: 0,
            acuteIssueCount: 0,
            stableChronicCount: 0,
            unstableChronicCount: 0,
            medicationCount: 0,
            hasLabsOrders: false,
            hasImagingOrders: false,
            hasNewDiagnosis: false,
            hasHighRiskCondition: false,
        };

        // Count chronic vs acute conditions
        for (const entity of entities) {
            const text = entity.normalizedText.toLowerCase();

            // Chronic conditions (diabetes, hypertension, COPD, etc.)
            if (this.isChronicCondition(text)) {
                indicators.chronicConditionCount++;

                // Check if stable or unstable
                const context = entity.span.text.toLowerCase();
                if (this.isStableCondition(context)) {
                    indicators.stableChronicCount++;
                } else if (this.isUnstableCondition(context)) {
                    indicators.unstableChronicCount++;
                }

                // High-risk conditions
                if (this.isHighRiskCondition(text)) {
                    indicators.hasHighRiskCondition = true;
                }
            }

            // Acute issues (pneumonia, fracture, etc.)
            if (this.isAcuteCondition(text)) {
                indicators.acuteIssueCount++;
            }

            // New diagnosis
            if (entity.context.temporality === 'current' && !entity.context.isNegated) {
                // If mentioned in plan section, might be new
                if (entity.context.section === 'plan') {
                    indicators.hasNewDiagnosis = true;
                }
            }
        }

        // Check for medications in text
        const text = context.originalText.toLowerCase();
        const medicationPatterns = [
            /metformin/gi, /lisinopril/gi, /atorvastatin/gi,
            /insulin/gi, /aspirin/gi, /levothyroxine/gi,
            /medication/gi, /\bmeds?\b/gi,
        ];
        let medCount = 0;
        for (const pattern of medicationPatterns) {
            const matches = text.match(pattern);
            medCount += matches ? matches.length : 0;
        }
        indicators.medicationCount = Math.min(medCount, 10); // Cap at 10

        // Check for labs/imaging
        if (/\b(labs?|laboratory|blood work|cbc|cmp|hba1c|lipid panel)\b/i.test(text)) {
            indicators.hasLabsOrders = true;
        }
        if (/\b(x-?ray|imaging|ct scan|mri|ultrasound|mammogram)\b/i.test(text)) {
            indicators.hasImagingOrders = true;
        }

        return indicators;
    }

    /**
     * Calculate E/M level from complexity indicators
     * 
     * EDUCATIONAL NOTE - The decision tree
     * ===================================
     * Think of this as a decision tree:
     * - 4+ chronic conditions? → 99215 (high)
     * - 3 chronic OR 1 acute + 1 chronic? → 99214 (moderate)
     * - 2 chronic OR 1 acute uncomplicated? → 99213 (low)
     * - Single minor issue? → 99212 (straightforward)
     * 
     * Special cases bump up the level:
     * - Unstable condition (exacerbation) → +1 level
     * - High-risk condition (CHF, sepsis) → +1 level
     * - New diagnosis requiring workup → +1 level
     */
    private calculateEMLevel(indicators: ComplexityIndicators): 'straightforward' | 'low' | 'moderate' | 'high' {
        const totalProblems = indicators.chronicConditionCount + indicators.acuteIssueCount;

        // High complexity (99215)
        if (
            totalProblems >= 4 ||
            indicators.unstableChronicCount >= 2 ||
            indicators.hasHighRiskCondition ||
            (indicators.chronicConditionCount >= 3 && indicators.acuteIssueCount >= 1)
        ) {
            return 'high';
        }

        // Moderate complexity (99214)
        if (
            totalProblems >= 3 ||
            indicators.unstableChronicCount >= 1 ||
            indicators.hasNewDiagnosis ||
            (indicators.chronicConditionCount >= 2 && indicators.acuteIssueCount >= 1)
        ) {
            return 'moderate';
        }

        // Low complexity (99213)
        if (totalProblems >= 2 || indicators.chronicConditionCount >= 2) {
            return 'low';
        }

        // Straightforward (99212)
        return 'straightforward';
    }

    /**
     * Get established patient E/M code for level
     */
    private getEstablishedPatientEMCode(level: string): string {
        const mapping: Record<string, string> = {
            'straightforward': '99212',
            'low': '99213',
            'moderate': '99214',
            'high': '99215',
        };
        return mapping[level] || '99213'; // Default to low complexity
    }

    /**
     * Detect add-on codes (CCM, TCM, RPM)
     * 
     * EDUCATIONAL NOTE - Add-on codes = extra revenue!
     * ==============================================
     * These are codes billed IN ADDITION to the E/M visit:
     * 
     * CCM (Chronic Care Management) - 99490
     * - Patient has 2+ chronic conditions
     * - 20 minutes of non-face-to-face care per month
     * - Care plan created/updated
     * - Revenue: $43-$92/month PER PATIENT
     * 
     * TCM (Transitional Care Management) - 99495/99496
     * - Patient discharged from hospital
     * - Contact within 2 days, visit within 7-14 days
     * - Revenue: $167-$237 per discharge
     * 
     * This is a HUGE revenue opportunity many clinics miss!
     */
    private detectAddOnCodes(
        context: DocumentContext,
        entities: MedicalEntity[]
    ): ExtractedCode[] {
        const codes: ExtractedCode[] = [];

        // Check for CCM eligibility
        const chronicCount = entities.filter(e =>
            e.type === 'condition' && !e.context.isNegated
        ).length;

        if (chronicCount >= 2) {
            const ccmCode = CPT_CODES['99490'];
            if (ccmCode) {
                codes.push({
                    code: '99490',
                    codeSystem: 'cpt',
                    description: ccmCode.description + ' (OPPORTUNITY)',
                    evidence: [{
                        text: `${chronicCount} chronic conditions documented`,
                        section: 'assessment',
                        snippet: 'CCM-eligible patient',
                    }],
                    matchType: 'inferred',
                    confidence: {
                        overall: 0.7,
                        breakdown: {
                            match: 0.7,
                            context: 1.0,
                            specificity: 0.8,
                            documentation: 0.6, // Lower because we need additional documentation
                        },
                        reasoning: 'Patient has 2+ chronic conditions (CCM-eligible). Requires 20 minutes non-face-to-face care and care plan documentation.',
                    },
                    category: ccmCode.category,
                    rvu: ccmCode.rvu,
                });
            }
        }

        // Could add TCM, RPM detection here

        return codes;
    }

    /**
     * Helper: Is this a chronic condition?
     */
    private isChronicCondition(condition: string): boolean {
        const chronicKeywords = [
            'diabetes', 'hypertension', 'copd', 'asthma', 'ckd', 'chronic kidney',
            'heart failure', 'chf', 'cad', 'coronary artery', 'obesity',
            'depression', 'anxiety', 'bipolar', 'arthritis', 'osteoarthritis',
        ];
        return chronicKeywords.some(kw => condition.includes(kw));
    }

    /**
     * Helper: Is this an acute condition?
     */
    private isAcuteCondition(condition: string): boolean {
        const acuteKeywords = [
            'pneumonia', 'bronchitis', 'uti', 'fracture', 'injury',
            'acute', 'exacerbation', 'infection',
        ];
        return acuteKeywords.some(kw => condition.includes(kw));
    }

    /**
     * Helper: Is condition documented as stable?
     */
    private isStableCondition(contextText: string): boolean {
        return /\b(stable|controlled|well.controlled|managed)\b/i.test(contextText);
    }

    /**
     * Helper: Is condition documented as unstable?
     */
    private isUnstableCondition(contextText: string): boolean {
        return /\b(unstable|uncontrolled|exacerbation|flare|acute on chronic)\b/i.test(contextText);
    }

    /**
     * Helper: Is this a high-risk condition?
     */
    private isHighRiskCondition(condition: string): boolean {
        const highRiskKeywords = [
            'heart failure', 'chf', 'sepsis', 'stroke', 'myocardial infarction',
            'respiratory failure', 'kidney failure', 'cancer',
        ];
        return highRiskKeywords.some(kw => condition.includes(kw));
    }

    /**
     * Score confidence for E/M level selection
     */
    private scoreEMConfidence(
        indicators: ComplexityIndicators,
        level: string
    ): ConfidenceScore {
        let overall = 0.75; // Base confidence for MDM-based determination

        // Higher confidence if clear complexity indicators
        if (indicators.chronicConditionCount >= 3) {
            overall += 0.1;
        }
        if (indicators.hasLabsOrders || indicators.hasImagingOrders) {
            overall += 0.05;
        }

        overall = Math.min(1.0, overall);

        return {
            overall,
            breakdown: {
                match: 0.8, // Analytical match
                context: 1.0,
                specificity: 0.7,
                documentation: overall,
            },
            reasoning: `${level} complexity visit based on ${indicators.chronicConditionCount} chronic conditions, ${indicators.acuteIssueCount} acute issues. E/M level determination requires medical decision making analysis.`,
        };
    }

    /**
     * Required by CodeAdapter interface
     */
    resolveConflicts(codes: ExtractedCode[]): ExtractedCode[] {
        // CPT codes don't typically conflict like ICD-10
        // Can only bill one E/M level per encounter
        const emCodes = codes.filter(c => /^992\d\d$/.test(c.code));
        const addOnCodes = codes.filter(c => !/^992\d\d$/.test(c.code));

        // Keep highest E/M level
        if (emCodes.length > 1) {
            const highest = emCodes.sort((a, b) => b.code.localeCompare(a.code))[0];
            return [highest, ...addOnCodes];
        }

        return codes;
    }

    /**
     * Required by CodeAdapter interface
     */
    scoreConfidence(code: ExtractedCode, context: any): ConfidenceScore {
        // Already scored in determineEMLevel
        return code.confidence;
    }
}
