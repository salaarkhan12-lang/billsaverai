/**
 * Revenue Calculation Validation Tests
 * 
 * Tests for ensuring accuracy and reliability of revenue calculations
 * Critical for investor demo credibility
 */

import {
    calculateRevenue,
    validateRevenueCalculation,
    generateRevenueBreakdown,
    calculateTotalRevenue,
    type RevenueCalculation,
} from '../revenue-calculator';

describe('Revenue Calculator - Accuracy Validation', () => {
    describe('Basic Calculation Tests', () => {
        test('99213 to 99214 upgrade with BCBS National', () => {
            const result = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99214',
                payerId: 'bcbs-national',
                visitsPerYear: 52,
                confidence: 0.85,
            });

            // Medicare baseline rates (2024)
            expect(result.currentLevel.baseRate).toBe(93.00);
            expect(result.potentialLevel.baseRate).toBe(131.00);

            // BCBS National multiplier: 1.35x
            expect(result.currentLevel.payerRate).toBe(125.55); // 93 × 1.35
            expect(result.potentialLevel.payerRate).toBe(176.85); // 131 × 1.35

            // Gap calculations
            expect(result.perVisitGap).toBe(51.30); // 176.85 - 125.55
            expect(result.annualizedGap).toBe(2667.60); // 51.30 × 52
        });

        test('99212 to 99213 upgrade with UHC', () => {
            const result = calculateRevenue({
                currentCPT: '99212',
                potentialCPT: '99213',
                payerId: 'uhc-national',
                visitsPerYear: 26,
                confidence: 0.75,
            });

            // Medicare baseline rates
            expect(result.currentLevel.baseRate).toBe(55.00);
            expect(result.potentialLevel.baseRate).toBe(93.00);

            // UHC multiplier: 1.30x
            expect(result.currentLevel.payerRate).toBe(71.50); // 55 × 1.3
            expect(result.potentialLevel.payerRate).toBe(120.90); // 93 × 1.3

            // Gap calculations
            expect(result.perVisitGap).toBe(49.40); // 120.90 - 71.50
            expect(result.annualizedGap).toBe(1284.40); // 49.40 × 26
        });

        test('99214 to 99215 upgrade with Aetna', () => {
            const result = calculateRevenue({
                currentCPT: '99214',
                potentialCPT: '99215',
                payerId: 'aetna-national',
                visitsPerYear: 52,
                confidence: 0.90,
            });

            // Medicare baseline rates
            expect(result.currentLevel.baseRate).toBe(131.00);
            expect(result.potentialLevel.baseRate).toBe(185.00);

            // Aetna multiplier: 1.40x
            expect(result.currentLevel.payerRate).toBe(183.40); // 131 × 1.4
            expect(result.potentialLevel.payerRate).toBe(259.00); // 185 × 1.4

            // Gap calculations
            expect(result.perVisitGap).toBe(75.60); // 259.00 - 183.40
            expect(result.annualizedGap).toBe(3931.20); // 75.60 × 52
        });
    });

    describe('Validation Tests', () => {
        test('valid upgrade calculation passes validation', () => {
            const calc = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99214',
                payerId: 'bcbs-national',
                visitsPerYear: 52,
            });

            const validation = validateRevenueCalculation(calc);

            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });

        test('detects negative gap (downgrade)', () => {
            // Intentionally reversed to create downgrade
            const calc = calculateRevenue({
                currentCPT: '99214',
                potentialCPT: '99213', // Lower level
                payerId: 'bcbs-national',
                visitsPerYear: 52,
            });

            const validation = validateRevenueCalculation(calc);

            expect(validation.isValid).toBe(true); // Still valid, just warning
            expect(validation.warnings.length).toBeGreaterThan(0);
            expect(validation.warnings[0]).toContain('Negative gap');
        });

        test('detects unrealistic payer multipliers', () => {
            // Create a mock calculation with extreme multiplier
            const calc: RevenueCalculation = {
                currentLevel: {
                    cptCode: '99213',
                    description: 'Test',
                    baseRate: 93.00,
                    payerRate: 200.00, // 2.15x - outside normal range
                    payer: 'test-payer',
                },
                potentialLevel: {
                    cptCode: '99214',
                    description: 'Test',
                    baseRate: 131.00,
                    payerRate: 280.00,
                },
                perVisitGap: 80.00,
                annualizedGap: 4160.00,
                confidence: 0.85,
            };

            const validation = validateRevenueCalculation(calc);

            expect(validation.warnings.length).toBeGreaterThan(0);
            expect(validation.warnings.some(w => w.includes('multiplier'))).toBe(true);
        });
    });

    describe('Total Revenue Calculation Tests', () => {
        test('correctly sums multiple revenue gaps', () => {
            const gap1 = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99214',
                payerId: 'bcbs-national',
                visitsPerYear: 52,
            });

            const gap2 = calculateRevenue({
                currentCPT: '99214',
                potentialCPT: '99215',
                payerId: 'bcbs-national',
                visitsPerYear: 52,
            });

            const total = calculateTotalRevenue([gap1, gap2]);

            // Should sum both per-visit and annualized correctly
            expect(total.perVisit).toBe(gap1.perVisitGap + gap2.perVisitGap);
            expect(total.annualized).toBe(gap1.annualizedGap + gap2.annualizedGap);
        });

        test('handles empty gaps array', () => {
            const total = calculateTotalRevenue([]);

            expect(total.perVisit).toBe(0);
            expect(total.annualized).toBe(0);
        });

        test('rounds correctly to 2 decimal places', () => {
            const gap1 = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99214',
                payerId: 'bcbs-national',
                visitsPerYear: 52,
            });

            const total = calculateTotalRevenue([gap1]);

            // Ensure no floating point precision errors
            expect(total.perVisit).toBe(Math.round(total.perVisit * 100) / 100);
            expect(total.annualized).toBe(Math.round(total.annualized * 100) / 100);
        });
    });

    describe('Revenue Breakdown Generation', () => {
        test('generates complete breakdown with all fields', () => {
            const calc = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99214',
                payerId: 'bcbs-national',
                visitsPerYear: 52,
                confidence: 0.85,
            });

            const breakdown = generateRevenueBreakdown(calc);

            // Check all required fields exist
            expect(breakdown.currentLevel.code).toBe('99213');
            expect(breakdown.potentialLevel.code).toBe('99214');
            expect(breakdown.gap.perVisit).toBe(51.30);
            expect(breakdown.gap.annualized).toBe(2667.60);
            expect(breakdown.gap.visitsPerYear).toBe(52);
            expect(breakdown.confidence.level).toBe('high'); // 0.85 >= 0.75
            expect(breakdown.explanation).toBeTruthy();
            expect(breakdown.calculation).toBeTruthy();
            expect(breakdown.sources.medicareSchedule).toBeTruthy();
        });

        test('correctly calculates percent increase', () => {
            const calc = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99214',
                payerId: 'bcbs-national',
                visitsPerYear: 52,
            });

            const breakdown = generateRevenueBreakdown(calc);

            // 51.30 / 125.55 * 100 = 40.9%
            expect(breakdown.gap.percentIncrease).toBeCloseTo(40.9, 1);
        });

        test('assigns correct confidence levels', () => {
            const highConfidence = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99214',
                payerId: 'bcbs-national',
                visitsPerYear: 52,
                confidence: 0.85,
            });

            const mediumConfidence = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99214',
                payerId: 'bcbs-national',
                visitsPerYear: 52,
                confidence: 0.65,
            });

            const lowConfidence = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99214',
                payerId: 'bcbs-national',
                visitsPerYear: 52,
                confidence: 0.45,
            });

            expect(generateRevenueBreakdown(highConfidence).confidence.level).toBe('high');
            expect(generateRevenueBreakdown(mediumConfidence).confidence.level).toBe('medium');
            expect(generateRevenueBreakdown(lowConfidence).confidence.level).toBe('low');
        });

        test('includes step-by-step calculation explanation', () => {
            const calc = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99214',
                payerId: 'bcbs-national',
                visitsPerYear: 52,
            });

            const breakdown = generateRevenueBreakdown(calc);

            // Calculation should include all steps
            expect(breakdown.calculation).toContain('Current Level');
            expect(breakdown.calculation).toContain('Potential Level');
            expect(breakdown.calculation).toContain('Revenue Gap');
            expect(breakdown.calculation).toContain('$93.00'); // Medicare base
            expect(breakdown.calculation).toContain('$125.55'); // BCBS rate
            expect(breakdown.calculation).toContain('1.35x'); // Multiplier
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('handles same CPT codes (zero gap)', () => {
            const result = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99213', // Same code
                payerId: 'bcbs-national',
                visitsPerYear: 52,
            });

            expect(result.perVisitGap).toBe(0);
            expect(result.annualizedGap).toBe(0);

            const validation = validateRevenueCalculation(result);
            expect(validation.warnings.some(w => w.includes('Zero gap'))).toBe(true);
        });

        test('throws error for invalid CPT code', () => {
            expect(() => {
                calculateRevenue({
                    currentCPT: '99999', // Invalid code
                    potentialCPT: '99214',
                    payerId: 'bcbs-national',
                    visitsPerYear: 52,
                });
            }).toThrow('Invalid current CPT code');
        });

        test('throws error for invalid payer', () => {
            expect(() => {
                calculateRevenue({
                    currentCPT: '99213',
                    potentialCPT: '99214',
                    payerId: 'invalid-payer', // Invalid payer
                    visitsPerYear: 52,
                });
            }).toThrow('Invalid payer ID');
        });

        test('handles very low visit counts', () => {
            const result = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99214',
                payerId: 'bcbs-national',
                visitsPerYear: 1, // Only 1 visit per year
            });

            expect(result.perVisitGap).toBe(51.30);
            expect(result.annualizedGap).toBe(51.30); // Same as per-visit
        });

        test('handles very high visit counts', () => {
            const result = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99214',
                payerId: 'bcbs-national',
                visitsPerYear: 365, // Daily visits
            });

            expect(result.perVisitGap).toBe(51.30);
            expect(result.annualizedGap).toBe(51.30 * 365);
        });
    });
});
