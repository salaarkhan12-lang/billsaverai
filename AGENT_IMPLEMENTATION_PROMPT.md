# Claude Opus 4.5 (Thinking) Implementation Prompt

## Mission

You are implementing a **MIPS & Risk Adjustment Optimization Platform** for BillSaver - a medical documentation analysis tool. Your goal is to execute the implementation plan with surgical precision, leveraging existing infrastructure.

---

## Phase 1: Understand the Codebase

Before writing ANY code, you MUST read and understand:

### Critical Architecture Files
1. `README.md` - Project overview and current capabilities
2. `ARCHITECTURE.md` - System design, component hierarchy, data flow
3. `DEVELOPMENT_PHASES.md` - What's been built and what's planned
4. `REVENUE_CALCULATION_METHODOLOGY.md` - How revenue is calculated

### Core Source Files (Study These)
```
src/lib/
├── icd10-database.ts          # ICD-10 codes - YOU WILL EXPAND THIS
├── cpt-database.ts            # CPT codes structure
├── billing-code-analyzer.ts   # Main analysis orchestrator
├── billing-rules.ts           # Analysis engine
└── validation/
    ├── types.ts               # Core validation interfaces
    ├── mdm-validator.ts       # MDM scoring logic
    ├── hybrid-validator.ts    # Validator orchestration
    ├── upgrade-analyzer.ts    # E/M upgrade recommendations
    └── mdm-requirements-database.ts  # PATTERN LIBRARY (STUDY THIS!)
```

### Key Insight
The `mdm-requirements-database.ts` file contains the **pattern recognition architecture** you must follow. Study its structure - you will replicate this pattern for HCC, MEAT, and MIPS analyzers.

---

## Phase 2: Study the Knowledge Base

Read and internalize EVERY section of:
```
.agent/workflows/mips-risk-adjustment-knowledge.md
```

This contains:
- HCC categories with RAF weights (0.105 - 0.335)
- M.E.A.T. documentation criteria and detection patterns
- Priority MIPS quality measures (#001, #236, #317, #497)
- Code specificity upgrade paths (E11.9 → E11.65 = +$2,000/yr)
- Implementation patterns for BillSaver

---

## Phase 3: Execute Implementation

### NEXT_STEPS.md Checklist (Execute In Order)

#### Phase 1: HCC Optimization Engine 🔥 PRIORITY

**1.1 Expand ICD-10 Database**
File: `src/lib/icd10-database.ts`

Add to EACH relevant ICD-10 entry:
```typescript
interface ICD10Entry {
  // Existing fields...
  hccCategory?: number;        // HCC category (1-86+)
  hccDescription?: string;     // "Diabetes with Chronic Complications"
  rafWeight?: number;          // 0.302 for HCC 18, etc.
  specificityUpgrade?: string; // More specific code if available
}
```

Priority HCCs to add:
| HCC | RAF | Codes |
|-----|-----|-------|
| 18 | 0.302 | E11.22, E11.40, E11.65 |
| 19 | 0.105 | E11.9 |
| 85 | 0.323 | I50.22, I50.32 |
| 111 | 0.335 | J44.0, J44.1 |
| 22 | 0.250 | E66.01 |

**1.2 Create HCC Analyzer**
File: `src/lib/risk-adjustment/hcc-analyzer.ts` (NEW)

Follow the pattern from `upgrade-analyzer.ts`. Implement:
- `analyzeHCCOpportunities(text, existingCodes)` 
- `calculateRAFScore(hccList)`
- `findMissedHCCs(text, documentedCodes)`

---

#### Phase 2: MEAT Documentation Analyzer

**2.1 Create MEAT Analyzer**
File: `src/lib/risk-adjustment/meat-analyzer.ts` (NEW)

Detection patterns (from knowledge base):
```typescript
const MEAT_PATTERNS = {
  monitoring: ["monitoring", "follow-up", "tracking", "checked", "reviewed"],
  evaluating: ["evaluated", "results show", "labs indicate", "test reveals"],
  assessing: ["assessed", "status is", "stable", "controlled", "worsening"],
  treating: ["continue", "prescribed", "counseled", "adjusted", "started"]
};
```

---

#### Phase 3: Code Specificity Analyzer

**3.1 Create Specificity Database**
File: `src/lib/risk-adjustment/specificity-database.ts` (NEW)

Priority upgrades:
- E11.9 → E11.65 (HCC 19→18, +$2,000+/yr)
- E11.9 → E11.22 (DM+CKD link)
- I10 → I11.0 (HTN heart disease)
- F32.9 → F32.1 (Depression specificity)

---

#### Phase 4: MIPS Quality Measures

**4.1 Create MIPS Database**
File: `src/lib/mips/mips-database.ts` (NEW)

Measures to implement:
- #001: Diabetes A1C ≤ 9%
- #236: BP Control < 140/90
- #317: BP Screening w/ Follow-Up
- #497: Preventive Care Composite

---

#### Phase 5: Dashboard Integration

Update `src/components/billing/RecommendedBillingCodes.tsx` with:
- RAF Score Summary
- HCC Gap List
- MIPS Score Preview
- MEAT Compliance Grid

---

## Critical Implementation Rules

1. **Follow Existing Patterns** - Study `mdm-requirements-database.ts` and replicate its structure
2. **TypeScript Strict** - All new files must have proper interfaces and types
3. **Compile Check** - Run `npx tsc --noEmit` after each file to verify
4. **Modular Design** - Each analyzer should be self-contained and importable
5. **Test As You Go** - Verify each function works before moving to the next

---

## Success Criteria

- [ ] ICD-10 database expanded with HCC mappings
- [ ] HCC analyzer detects missed HCC opportunities
- [ ] MEAT analyzer validates chronic condition documentation
- [ ] Specificity analyzer recommends code upgrades
- [ ] MIPS analyzer projects scores
- [ ] UI displays all new analysis sections
- [ ] TypeScript compiles without errors

---

## Begin

Start by reading the files listed in Phase 1. Confirm your understanding by briefly summarizing:
1. The current architecture
2. How `mdm-requirements-database.ts` works
3. Your implementation approach

Then proceed systematically through NEXT_STEPS.md, phase by phase.
