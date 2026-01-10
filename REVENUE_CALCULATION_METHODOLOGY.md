# Revenue Calculation Methodology - Technical Documentation

## Overview

BillSaver uses a **precise, transparent revenue calculation system** based on official Medicare fee schedules and industry-standard commercial payer multipliers. This document explains the methodology, data sources, and validation approach.

---

## Data Sources

### 1. Medicare Physician Fee Schedule (2024)

**Primary Source**: Centers for Medicare & Medicaid Services (CMS)  
**Official URL**: https://www.cms.gov/medicare/payment/fee-schedules/physician

**Key CPT Codes Used**:

| CPT Code | Description | 2024 Medicare National Average |
|----------|-------------|-------------------------------|
| 99211 | Office Visit Level 1 (Minimal) | $24.63 |
| 99212 | Office Visit Level 2 (Straightforward) | $55.00 |
| 99213 | Office Visit Level 3 (Low Complexity) | $93.00 |
| 99214 | Office Visit Level 4 (Moderate Complexity) | $131.00 |
| 99215 | Office Visit Level 5 (High Complexity) | $185.00 |

**Geographic Variation**: These are national averages. Actual reimbursement varies by locality using a Geographic Practice Cost Index (GPCI). BillSaver uses conservative national averages for consistency.

### 2. Commercial Payer Multipliers

**Industry Standard Approach**: Commercial payers typically reimburse as a percentage of Medicare rates.

**Multipliers Used** (Conservative Estimates):

| Payer | Multiplier | Typical Range | Source |
|-------|------------|---------------|---------|
| Blue Cross Blue Shield | 1.35x | 130-145% | Industry benchmarks |
| UnitedHealthcare | 1.30x | 125-140% | Industry benchmarks |
| Aetna | 1.40x | 135-150% | Industry benchmarks |
| Cigna | 1.38x | 130-145% | Industry benchmarks |
| Humana | 1.33x | 128-140% | Industry benchmarks |

**Validation Sources**:
- Medical Group Management Association (MGMA) surveys
- Healthcare Financial Management Association (HFMA) reports
- Published payer contracts (where available)

**Conservative Approach**: BillSaver uses the **lower end** of typical ranges to ensure credible, defensible estimates that won't overstate potential revenue.

---

## Calculation Methodology

### Step 1: Base Rate Lookup

```typescript
// Example: CPT 99213
const cptCode = getCPTCode('99213');
// Returns: { baseRate: 93.00, description: "Office Visit Level 3", ... }
```

### Step 2: Apply Payer Multiplier

```typescript
// Example: Blue Cross Blue Shield (1.35x multiplier)
const payerRate = baseRate * multiplier;
// 93.00 × 1.35 = 125.55
```

### Step 3: Calculate Per-Visit Gap

```typescript
const perVisitGap = potentialPayerRate - currentPayerRate;
// Example: 99214 ($176.85) - 99213 ($125.55) = $51.30
```

### Step 4: Annualize Based on Visit Frequency

```typescript
const annualizedGap = perVisitGap × visitsPerYear;
// Example: $51.30 × 52 visits = $2,667.60/year
```

### Step 5: Apply Confidence Factor

```typescript
// Confidence based on documentation strength
// High (0.85+): Strong supporting documentation
// Medium (0.65-0.84): Moderate documentation
// Low (<0.65): Weak or uncertain documentation

const adjustedGap = baseGap × confidence;
// Used for conservative estimates when documentation is unclear
```

---

## Confidence Scoring

### Confidence Levels

| Level | Range | Color | Meaning |
|-------|-------|-------|---------|
| **High** | 85-100% | 🟢 Green | Strong documentation supports upgrade |
| **Medium** | 65-84% | 🟡 Yellow | Moderate documentation, likely achievable |
| **Low** | <65% | 🟠 Orange | Weak documentation, uncertain |

### Factors Affecting Confidence

1. **Documentation Completeness** (40%)
   - HPI elements present
   - ROS documented
   - Physical exam findings
   - Assessment and plan clarity

2. **MDM Complexity Indicators** (30%)
   - Number and complexity of problems addressed
   - Data reviewed and analyzed
   - Risk of complications

3. **Time Documentation** (15%)
   - Total encounter time documented
   - Counseling/coordination time noted

4. **MEAT Criteria for HCC** (15%)
   - Monitored
   - Evaluated
   - Assessed/Addressed
   - Treated

---

## Validation & Quality Assurance

### Automated Validation

The system includes `validateRevenueCalculation()` which checks:

✅ **Upgrade Logic**: Ensures potential > current (no downgrades)  
✅ **Multiplier Range**: Flags if payer multiplier is outside 0.8x - 2.0x  
✅ **Rate Reasonableness**: Warns if rates exceed $1,000 (likely error)  
✅ **Payer Validity**: Confirms payer exists in fee schedule database

**Example**:
```typescript
const validation = validateRevenueCalculation(calc);
if (!validation.isValid) {
    // Errors block calculation
}
if (validation.warnings.length > 0) {
    // Warnings shown to user for transparency
}
```

### Manual Validation Process

**Recommended Steps**:
1. Cross-reference CPT base rates against official CMS fee schedule
2. Compare payer multipliers to known contracts (if available)
3. Test with sample patient documentation
4. Verify calculations manually for key scenarios

---

## Example Calculation Walkthrough

### Scenario: Inadequate HPI Documentation

**Problem**: Patient has 2 HPI elements documented (need 4 for 99214)

**Current Billing**: CPT 99213  
**Potential Billing**: CPT 99214 (with improved documentation)  
**Payer**: Blue Cross Blue Shield National  
**Visit Frequency**: 52 visits/year (weekly chronic disease patient)  
**Confidence**: 80% (moderate - documentation slightly weak but addressable)

**Step-by-Step**:

```
1. Medicare Base Rates:
   CPT 99213: $93.00
   CPT 99214: $131.00

2. Apply BCBS Multiplier (1.35x):
   CPT 99213 Commercial: $93.00 × 1.35 = $125.55
   CPT 99214 Commercial: $131.00 × 1.35 = $176.85

3. Calculate Per-Visit Gap:
   $176.85 - $125.55 = $51.30/visit

4. Annualize:
   $51.30 × 52 visits = $2,667.60/year

5. Display (with confidence):
   Revenue Gap: $51.30/visit ($2,667.60/year)
   Confidence: 80% (High)
```

---

## Edge Cases & Limitations

### Known Limitations

1. **Geographic Variation**: Uses national averages; actual rates vary by ZIP code
2. **Contract Specifics**: Actual payer contracts may differ from industry averages
3. **Modifiers**: Doesn't account for billing modifiers that may affect reimbursement
4. **Bundling Rules**: Assumes unbundled services (no CCI edits considered)

### Conservative Assumptions

To maintain credibility, BillSaver **intentionally underestimates** in several ways:

- Uses **lower-end** payer multipliers (e.g., 1.35x instead of 1.45x for BCBS)
- Applies **confidence discounting** when documentation is uncertain
- Uses **national averages** (many localities have higher GPCI adjustments)
- Assumes **standard visit frequency** (52/year; some patients visit more)

**Result**: Actual revenue capture is likely **higher** than BillSaver estimates, adding safety margin for investor pitches.

---

## API Reference

### Primary Functions

#### `calculateRevenue(options)`

Calculates precise revenue gap for CPT code upgrade.

```typescript
const result = calculateRevenue({
    currentCPT: '99213',
    potentialCPT: '99214',
    payerId: 'bcbs-national',
    visitsPerYear: 52,
    confidence: 0.85
});
```

**Returns**: `RevenueCalculation` object with per-visit and annualized gaps.

#### `generateRevenueBreakdown(calc)`

Creates detailed, investor-ready breakdown with explanations.

```typescript
const breakdown = generateRevenueBreakdown(revenueCalc);
// Access: breakdown.calculation, breakdown.sources, etc.
```

**Returns**: `RevenueBreakdown` with step-by-step calculation and source citations.

#### `validateRevenueCalculation(calc)`

Validates calculation for accuracy and reasonableness.

```typescript
const validation = validateRevenueCalculation(revenueCalc);
if (validation.isValid) {
    // Proceed with confidence
}
```

**Returns**: `ValidationResult` with errors and warnings arrays.

---

## Testing & Accuracy

### Unit Test Coverage

**Test Suite**: `revenue-validation.test.ts` (18 comprehensive tests)

✅ Basic calculations with multiple payer scenarios  
✅ Validation edge cases (downgrades, invalid codes)  
✅ Total revenue aggregation (no double-counting)  
✅ Breakdown generation completeness  
✅ Error handling and fallbacks

**All tests passing** ✅

### Manual Validation Examples

| Scenario | Expected | Actual | Match |
|----------|----------|--------|-------|
| 99213→99214 (BCBS) | $51.30/visit | $51.30/visit | ✅ |
| 99212→99213 (UHC) | $49.40/visit | $49.40/visit | ✅ |
| 99214→99215 (Aetna) | $75.60/visit | $75.60/visit | ✅ |

---

## Updates & Maintenance

### Annual Updates Required

**Medicare Fee Schedule**: Updated annually (typically January)  
**Action**: Update `cpt-database.ts` base rates  
**Source**: https://www.cms.gov/medicare/payment/fee-schedules/physician

**Commercial Payer Rates**: Review annually  
**Action**: Verify multipliers remain within industry norms  
**Source**: MGMA cost surveys, HFMA reports

### Version History

- **v1.4.0** (Jan 2026): Initial precise calculation system
- **v1.4.1** (Jan 2026): Added Context-Aware gap integration, Phase 3 documentation
- **v1.7.0** (Jan 2026): Aligning version with Hybrid E/M Architecture release

---

## Disclosure & Legal

**Important**: BillSaver provides **estimates** based on industry-standard methodologies and publicly available data. Actual reimbursement depends on:

- Specific payer contracts
- Geographic locality
- Proper documentation and coding
- Payer claims processing policies
- Medical necessity requirements

**Not Medical Coding Advice**: BillSaver is a documentation quality assessment tool. Healthcare providers should consult certified professional coders and billing specialists for final coding decisions.

**Data Sources**: All calculations use publicly available Medicare fee schedules and industry-standard commercial payer benchmarks. No proprietary payer contract data is used.

---

## For Investors

### Why This Matters

**Precision = Credibility**: Unlike competitors showing rough estimates, BillSaver provides:
- ✅ Exact calculations based on official fee schedules
- ✅ Transparent methodology with source citations
- ✅ Conservative estimates (reducing overpromise risk)
- ✅ Validation checks preventing errors

**Market Opportunity**: Most documentation tools show generic "risk" warnings. BillSaver **quantifies the exact dollar impact** with supporting data, making the value proposition immediately clear to providers.

### Defensibility

Every number shown can be traced back to:
1. Official CMS fee schedule (public data)
2. Industry-standard payer multipliers (documented benchmarks)
3. Validated calculation methodology (18 unit tests passing)

**No black box** - complete transparency builds trust with both users and investors.

---

**Last Updated**: January 9, 2026  
**Version**: 1.7.0  
**Maintained By**: BillSaver Development Team
