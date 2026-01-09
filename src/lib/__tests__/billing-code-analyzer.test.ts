import { describe, it, expect } from '@jest/globals';
import { analyzeBillingCodes, getCodeConflictReason } from '../billing-code-analyzer';
import type { AnalysisResult } from '../billing-rules';

describe('Billing Code Analyzer', () => {
    describe('ICD-10 Conflict Detection', () => {
        it('should NOT recommend E11.9 when E11.65 is documented', () => {
            const mockResult: AnalysisResult = {
                overallScore: 75,
                documentationLevel: 'Good',
                totalPotentialRevenueLoss: '$100-200',
                suggestedEMLevel: '99214',
                currentEMLevel: '99213',
                potentialUpcodeOpportunity: true,
                mdmComplexity: 'Moderate',
                timeDocumented: true,
                meatCriteriaMet: false,
                gaps: [
                    {
                        id: 'gap-1',
                        title: 'Missing MEAT Criteria',
                        category: 'critical',
                        description: 'Test gap',
                        impact: 'Test impact',
                        recommendation: 'Test recommendation',
                        potentialRevenueLoss: '$100',
                        icdCodes: ['E11.9'], // Recommending E11.9
                        cptCodes: [],
                    },
                ],
                strengths: [],
            };

            // Simulate that E11.65 is already documented
            mockResult.gaps.push({
                id: 'gap-documented',
                title: 'Documented Diabetes',
                category: 'minor',
                description: 'Already documented',
                impact: '',
                recommendation: '',
                potentialRevenueLoss: '$0',
                icdCodes: ['E11.65'], // Already has complication code
                cptCodes: [],
            });

            const analysis = analyzeBillingCodes(mockResult);

            // E11.65 should be in documented
            expect(analysis.icdCodes.documented.some(c => c.code === 'E11.65')).toBe(true);

            // E11.9 should NOT be in missing (because it conflicts with E11.65)
            expect(analysis.icdCodes.missing.some(c => c.code === 'E11.9')).toBe(false);
        });

        it('should explain why codes conflict', () => {
            const reason = getCodeConflictReason('E11.9', 'E11.65');
            expect(reason).toBeTruthy();
            expect(reason).toContain('specific');
        });

        it('should allow E11.65 and I10 together (no conflict)', () => {
            const mockResult: AnalysisResult = {
                overallScore: 75,
                documentationLevel: 'Good',
                totalPotentialRevenueLoss: '$100-200',
                suggestedEMLevel: '99214',
                currentEMLevel: '99213',
                potentialUpcodeOpportunity: true,
                mdmComplexity: 'Moderate',
                timeDocumented: true,
                meatCriteriaMet: false,
                gaps: [
                    {
                        id: 'gap-1',
                        title: 'Gap',
                        category: 'critical',
                        description: 'Test',
                        impact: '',
                        recommendation: '',
                        potentialRevenueLoss: '$50',
                        icdCodes: ['I10'],
                        cptCodes: [],
                    },
                    {
                        id: 'gap-2',
                        title: 'Documented',
                        category: 'minor',
                        description: 'Already present',
                        impact: '',
                        recommendation: '',
                        potentialRevenueLoss: '$0',
                        icdCodes: ['E11.65'],
                        cptCodes: [],
                    },
                ],
                strengths: [],
            };

            const analysis = analyzeBillingCodes(mockResult);

            // Both should be present
            expect(analysis.icdCodes.documented.some(c => c.code === 'E11.65')).toBe(true);
            expect(analysis.icdCodes.missing.some(c => c.code === 'I10')).toBe(true);
        });
    });

    describe('CPT Code Determination', () => {
        it('should show current level as ready', () => {
            const mockResult: AnalysisResult = {
                overallScore: 75,
                documentationLevel: 'Good',
                totalPotentialRevenueLoss: '$50-100',
                suggestedEMLevel: '99214',
                currentEMLevel: '99213',
                potentialUpcodeOpportunity: true,
                mdmComplexity: 'Moderate',
                timeDocumented: true,
                meatCriteriaMet: false,
                gaps: [],
                strengths: [],
            };

            const analysis = analyzeBillingCodes(mockResult);

            expect(analysis.cptCodes.current).toHaveLength(1);
            expect(analysis.cptCodes.current[0].code).toBe('99213');
            expect(analysis.cptCodes.current[0].status).toBe('ready');
        });

        it('should show suggested level as potential with required fixes', () => {
            const mockResult: AnalysisResult = {
                overallScore: 62,
                documentationLevel: 'Fair',
                totalPotentialRevenueLoss: '$100-200',
                suggestedEMLevel: '99214',
                currentEMLevel: '99213',
                potentialUpcodeOpportunity: true,
                mdmComplexity: 'Moderate',
                timeDocumented: true,
                meatCriteriaMet: false,
                gaps: [
                    {
                        id: 'gap-1',
                        title: 'Missing MDM',
                        category: 'critical',
                        description: 'Test',
                        impact: '',
                        recommendation: '',
                        potentialRevenueLoss: '$100',
                        icdCodes: [],
                        cptCodes: ['99214'],
                    },
                ],
                strengths: [],
            };

            const analysis = analyzeBillingCodes(mockResult);

            expect(analysis.cptCodes.potential.length).toBeGreaterThan(0);
            const potential99214 = analysis.cptCodes.potential.find(c => c.code === '99214');
            expect(potential99214).toBeDefined();
            expect(potential99214?.status).toBe('needs-fixes');
            expect(potential99214?.requiredFixes).toContain('gap-1');
        });
    });

    describe('Revenue Impact', () => {
        it('should calculate revenue difference correctly', () => {
            const mockResult: AnalysisResult = {
                overallScore: 62,
                documentationLevel: 'Fair',
                totalPotentialRevenueLoss: '$100-200',
                suggestedEMLevel: '99214',
                currentEMLevel: '99213',
                potentialUpcodeOpportunity: true,
                mdmComplexity: 'Moderate',
                timeDocumented: true,
                meatCriteriaMet: false,
                gaps: [],
                strengths: [],
            };

            const analysis = analyzeBillingCodes(mockResult);

            expect(analysis.revenueImpact.current).toBe('$75-110');
            expect(analysis.revenueImpact.potential).toBe('$110-150');
            expect(analysis.revenueImpact.difference).toBe('$100-200');
        });
    });
});
