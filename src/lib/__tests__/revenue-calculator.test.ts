/**
 * Revenue Calculator Unit Tests
 * 
 * Tests for CPT pricing and commercial payer revenue calculations
 */

import { describe, it, expect } from 'vitest';
import {
    calculateRevenue,
    calculateTotalRevenue,
    formatRevenueGap,
    getRevenueBracket,
    estimateVisitsPerYear,
    toLegacyRevenueString,
    generateRevenueSummary,
    calculateProcedureRevenue, // NEW import
} from '../revenue-calculator';
import { PAYER_FEE_SCHEDULES } from '../payer-fee-schedules';
import { CPT_CODES } from '../cpt-database';

describe('Revenue Calculator', () => {
    describe('calculateRevenue', () => {
        it('calculates BCBS rates correctly (1.35x multiplier)', () => {
            const calc = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99214',
                payerId: 'bcbs-national',
                visitsPerYear: 52,
                confidence: 0.90,
            });

            // BCBS is 1.35x Medicare
            expect(calc.currentLevel.payerRate).toBe(125.55); // 93 × 1.35
            expect(calc.potentialLevel.payerRate).toBe(176.85); // 131 × 1.35
            expect(calc.perVisitGap).toBe(51.30);
            expect(calc.annualizedGap).toBe(2667.60); // 51.30 × 52
            expect(calc.confidence).toBe(0.90);
        });

        it('calculates UHC rates correctly (1.30x multiplier)', () => {
            const calc = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99214',
                payerId: 'uhc-national',
                visitsPerYear: 52,
            });

            // UHC is 1.30x Medicare
            expect(calc.currentLevel.payerRate).toBe(120.90); // 93 × 1.30
            expect(calc.potentialLevel.payerRate).toBe(170.30); // 131 × 1.30
            expect(calc.perVisitGap).toBe(49.40);
        });

        it('calculates Aetna rates with custom rate override', () => {
            const calc = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99490', // Chronic care - Aetna has custom rate
                payerId: 'aetna-national',
            });

            // 99213: 93 × 1.40 = 130.20
            // 99490: Custom rate 64.50 (overrides 43 × 1.40)
            expect(calc.currentLevel.payerRate).toBe(130.20);
            expect(calc.potentialLevel.payerRate).toBe(64.50);
        });

        it('throws error for invalid CPT code', () => {
            expect(() => {
                calculateRevenue({
                    currentCPT: 'INVALID',
                    potentialCPT: '99214',
                    payerId: 'bcbs-national',
                });
            }).toThrow('Invalid current CPT code');
        });

        it('throws error for invalid payer ID', () => {
            expect(() => {
                calculateRevenue({
                    currentCPT: '99213',
                    potentialCPT: '99214',
                    payerId: 'invalid-payer',
                });
            }).toThrow('Invalid payer ID');
        });

        it('uses default visits per year (52)', () => {
            const calc = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99214',
                payerId: 'bcbs-national',
            });

            // Default: 52 visits/year
            expect(calc.annualizedGap).toBe(calc.perVisitGap * 52);
        });

        it('uses default confidence (0.85)', () => {
            const calc = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99214',
                payerId: 'bcbs-national',
            });

            expect(calc.confidence).toBe(0.85);
        });
    });

    describe('calculateTotalRevenue', () => {
        it('sums revenue for different CPT upgrades', () => {
            const gap1 = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99214',
                payerId: 'bcbs-national',
                visitsPerYear: 52,
            });

            const gap2 = calculateRevenue({
                currentCPT: '99212',
                potentialCPT: '99213',
                payerId: 'bcbs-national',
                visitsPerYear: 52,
            });

            const total = calculateTotalRevenue([gap1, gap2]);

            expect(total.perVisit).toBeCloseTo(gap1.perVisitGap + gap2.perVisitGap, 2);
            expect(total.annualized).toBeCloseTo(gap1.annualizedGap + gap2.annualizedGap, 2);
        });

        it('handles empty array', () => {
            const total = calculateTotalRevenue([]);
            expect(total.perVisit).toBe(0);
            expect(total.annualized).toBe(0);
        });

        it('deduplicates revenue for same CPT upgrade', () => {
            // Three gaps all preventing the same 99213->99214 upgrade
            // Should NOT sum all three, but take the max (they're all identical anyway)
            const gap1 = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99214',
                payerId: 'bcbs-national',
                visitsPerYear: 52,
            });

            const gap2 = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99214',
                payerId: 'bcbs-national',
                visitsPerYear: 52,
            });

            const gap3 = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99214',
                payerId: 'bcbs-national',
                visitsPerYear: 52,
            });

            const total = calculateTotalRevenue([gap1, gap2, gap3]);

            // Should equal ONE gap's value, not the sum of all three
            expect(total.perVisit).toBe(gap1.perVisitGap);
            expect(total.annualized).toBe(gap1.annualizedGap);
            expect(total.annualized).not.toBe(gap1.annualizedGap * 3);
        });

        it('handles mix of duplicate and unique CPT upgrades', () => {
            // Two gaps for 99213->99214 (duplicates)
            const hpiGap = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99214',
                payerId: 'bcbs-national',
                visitsPerYear: 52,
            });

            const timeGap = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99214',
                payerId: 'bcbs-national',
                visitsPerYear: 52,
            });

            // One gap for different upgrade (99212->99213)
            const differentGap = calculateRevenue({
                currentCPT: '99212',
                potentialCPT: '99213',
                payerId: 'bcbs-national',
                visitsPerYear: 52,
            });

            const total = calculateTotalRevenue([hpiGap, timeGap, differentGap]);

            // Should be: max(hpiGap, timeGap) + differentGap
            // Since hpiGap and timeGap are identical, max = hpiGap
            const expected = hpiGap.annualizedGap + differentGap.annualizedGap;
            expect(total.annualized).toBeCloseTo(expected, 2);
            expect(total.perVisit).toBeCloseTo(hpiGap.perVisitGap + differentGap.perVisitGap, 2);
        });
    });

    describe('formatRevenueGap', () => {
        it('formats revenue with currency symbols', () => {
            const calc = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99214',
                payerId: 'bcbs-national',
            });

            const formatted = formatRevenueGap(calc);
            expect(formatted).toMatch(/\$51\.30\/visit/);
            expect(formatted).toMatch(/\$2,667\.60\/year/);
        });
    });

    describe('getRevenueBracket', () => {
        it('categorizes minimal revenue (<$10)', () => {
            expect(getRevenueBracket(5)).toBe('minimal');
        });

        it('categorizes low revenue ($10-30)', () => {
            expect(getRevenueBracket(20)).toBe('low');
        });

        it('categorizes medium revenue ($30-60)', () => {
            expect(getRevenueBracket(45)).toBe('medium');
        });

        it('categorizes high revenue ($60-100)', () => {
            expect(getRevenueBracket(75)).toBe('high');
        });

        it('categorizes critical revenue (>=$100)', () => {
            expect(getRevenueBracket(150)).toBe('critical');
        });
    });

    describe('estimateVisitsPerYear', () => {
        it('estimates acute patient visits (12/year)', () => {
            expect(estimateVisitsPerYear('acute')).toBe(12);
        });

        it('estimates chronic patient visits (26/year)', () => {
            expect(estimateVisitsPerYear('chronic')).toBe(26);
        });

        it('estimates preventive care visits (4/year)', () => {
            expect(estimateVisitsPerYear('preventive')).toBe(4);
        });

        it('estimates complex patient visits (52/year)', () => {
            expect(estimateVisitsPerYear('complex')).toBe(52);
        });
    });

    describe('toLegacyRevenueString', () => {
        it('converts to new human-readable format', () => {
            const calc = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99214',
                payerId: 'bcbs-national',
            });

            const legacy = toLegacyRevenueString(calc);
            // New format: "$51/visit ($2,667/year)"
            expect(legacy).toMatch(/\$\d+\/visit \(\$[\d,]+\/year\)/);
            expect(legacy).toContain('/visit');
            expect(legacy).toContain('/year');
        });
    });

    describe('generateRevenueSummary', () => {
        it('generates human-readable summary', () => {
            const calc = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99214',
                payerId: 'bcbs-national',
                confidence: 0.90,
            });

            const summary = generateRevenueSummary(calc);

            expect(summary.current).toContain('99213');
            expect(summary.current).toContain('$125.55');
            expect(summary.potential).toContain('99214');
            expect(summary.potential).toContain('$176.85');
            expect(summary.gap).toContain('$51.30');
            expect(summary.payer).toContain('Blue Cross Blue Shield');
            expect(summary.confidence).toBe('90% confidence');
        });
    });

    describe('Real-world scenarios', () => {
        it('calculates 99212 -> 99214 upgrade with Cigna', () => {
            const calc = calculateRevenue({
                currentCPT: '99212',
                potentialCPT: '99214',
                payerId: 'cigna-national',
                visitsPerYear: 26, // Bi-weekly
            });

            // 99212: 55 × 1.38 = 75.90
            // 99214: 131 × 1.38 = 180.78
            // Gap: 104.88/visit
            // Annual: 104.88 × 26 = 2726.88

            expect(calc.currentLevel.payerRate).toBe(75.90);
            expect(calc.potentialLevel.payerRate).toBe(180.78);
            expect(calc.perVisitGap).toBe(104.88);
            expect(calc.annualizedGap).toBeCloseTo(2726.88, 2);
        });

        it('calculates preventive upgrade with Humana', () => {
            const calc = calculateRevenue({
                currentCPT: '99213',
                potentialCPT: '99215',
                payerId: 'humana-national',
                visitsPerYear: 12, // Monthly
            });

            //99213: 93 × 1.25 = 116.25
            // 99215: 185 × 1.25 = 231.25
            // Gap: 115.00/visit
            // Annual: 115.00 × 12 = 1380.00

            expect(calc.perVisitGap).toBe(115.00);
            expect(calc.annualizedGap).toBe(1380.00);
        });
    });

    describe('calculateProcedureRevenue', () => {
        it('calculates lab panel revenue correctly', () => {
            const lipidPanel = calculateProcedureRevenue('80061', 'bcbs-national', 1);

            // Lipid Panel: Medicare $18 × BCBS 1.35x = $24.30
            expect(lipidPanel.cptCode).toBe('80061');
            expect(lipidPanel.description).toContain('Lipid');
            expect(lipidPanel.revenue).toBe(24.30);
        });

        it('calculates immunization revenue correctly', () => {
            const immunization = calculateProcedureRevenue('90471', 'uhc-national', 1);

            // Immunization: Medicare $23 × UHC 1.30x = $29.90
            expect(immunization.cptCode).toBe('90471');
            expect(immunization.description).toContain('Immunization');
            expect(immunization.revenue).toBe(29.90);
        });

        it('calculates procedure revenue correctly', () => {
            const woundRepair = calculateProcedureRevenue('12001', 'aetna-national', 1);

            // Wound Repair: Medicare $125 × Aetna 1.40x = $175.00
            expect(woundRepair.cptCode).toBe('12001');
            expect(woundRepair.description).toContain('Wound');
            expect(woundRepair.revenue).toBe(175.00);
        });

        it('handles multiple occurrences', () => {
            const multipleImmunizations = calculateProcedureRevenue('90472', 'bcbs-national', 3);

            // Additional immunization: Medicare $18 × BCBS 1.35x × 3 = $72.90
            expect(multipleImmunizations.revenue).toBe(72.90);
        });

        it('throws error for invalid CPT code', () => {
            expect(() => {
                calculateProcedureRevenue('INVALID', 'bcbs-national', 1);
            }).toThrow('Invalid CPT code');
        });
    });
});
