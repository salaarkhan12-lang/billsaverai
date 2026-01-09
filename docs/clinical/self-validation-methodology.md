# BillSaver Self-Validation Methodology
## How We Ensure Code Recommendation Accuracy Without Access to Certified Coders

---

## Overview

BillSaver does **not** claim to replace certified medical coders or achieve "95% agreement with expert coders." Instead, we provide a **transparent, rule-based documentation improvement assistant** that helps clinics identify potential billing opportunities based on current CMS guidelines.

**Our positioning**: BillSaver is a **clinical documentation improvement (CDI) tool**, not an AI oracle.

---

## Methodology

### 1. Rule-Based Validation

All code recommendations are based on **official CMS E/M guidelines** (2021 revised framework):
- Problem complexity assessment
- Amount/complexity of data reviewed
- Risk of complications and morbidity

**Source**: [CMS 2021 E/M Guidelines](https://www.cms.gov/outreach-and-education/medicare-learning-network-mln/mlnproducts/evaluation-management-services)

### 2. Internal Consistency Checks

Every recommendation is validated for logical consistency:
- CPT code must match documented MDM level
- ICD-10 codes must not contradict each other
- Higher specificity codes preferred when documented
- No conflicting parent/child code pairs

**Example**: If E11.65 (DM with hyperglycemia) is documented, we won't recommend E11.9 (DM without complications).

### 3. Conservative Bias

**When in doubt, recommend lower.**

- Uncertain if moderate or high complexity? → Recommend moderate
- Ambiguous evidence for risk level? → Recommend lower risk
- Missing explicit documentation? → Flag as gap, don't assume

This protects practices from audit risk and establishes trust.

### 4. Transparent Uncertainty

**We show our confidence scores** for every recommendation:
- **High (85-100%)**: All criteria clearly documented
- **Medium (60-84%)**: Most criteria met, some inference required
- **Low (<60%)**: Significant gaps or assumptions

Providers see exactly how confident we are, allowing informed decisions.

### 5. Provider Override Always Available

**The provider has the final say.**

BillSaver suggests. Providers decide. We log overrides to improve our logic over time.

---

## What We DO Claim

✅ **100% based on current CMS guidelines**  
✅ **Fully transparent reasoning** (no black-box AI)  
✅ **Logical consistency** (no contradictory recommendations)  
✅ **Conservative approach** (minimize audit risk)  
✅ **Evidence-based** (point to specific note sections)

---

## What We DON'T Claim

❌ **NOT "AI-powered"** in the machine learning sense  
❌ **NOT "95% agreement with expert coders"** or similar accuracy claims  
❌ **NOT a replacement for human coders**  
❌ **NOT auto-coding** (always requires provider review)

---

## Validation Testing We Perform

### Test 1: CMS Guideline Alignment
- Review official CMS E/M examples
- Verify our logic produces same recommendations
- Document discrepancies and adjust logic

### Test 2: Edge Case Testing
- Borderline MDM levels (is it moderate or high?)
- Missing elements (what happens with incomplete documentation?)
- Conflicting ICD codes (does our conflict detection work?)

### Test 3: Consistency Testing
- Same note processed multiple times → same results every time
- No random variation (100% deterministic)

### Test 4: Real-World Validation (User Feedback)
- Track provider override rates
- Analyze rejected recommendations
- Improve logic based on patterns

---

## How This Protects Practices

###1. Audit Defense
**Auditor**: "Why did you bill 99214?"  
**Provider**: "BillSaver identified moderate complexity based on: [evidence locations]. I reviewed and agreed."

Our transparent reasoning = your audit defense.

### 2. Risk Mitigation
- Conservative recommendations minimize overcoding risk
- Confidence scores let providers assess recommendation strength
- Provider override preserves clinical judgment

### 3. Documentation Improvement
- Gaps identified help providers strengthen notes
- Better documentation = better patient care + defensible coding
- Educational value beyond billing optimization

---

## Continuous Improvement

We continuously improve our logic through:
1. **CMS guideline updates**: Track changes and update rules
2. **User feedback**: Analyze override patterns
3. **Edge case discovery**: Document unusual scenarios
4. **Specialty-specific refinement**: Cardiology,primary care, etc.

---

## Positioning for Clinical Managers

### When asked: "How accurate is BillSaver?"

**Answer:**  
"BillSaver applies CMS E/M guidelines deterministically with 100% consistency. We don't claim to match expert coders perfectly—instead, we provide transparent, conservative recommendations with confidence scores. Think of it as a 'second pair of eyes' that never misses documentation opportunities, combined with a CDI assistant that helps providers strengthen their notes."

### When asked: "Have you validated this with certified coders?"

**Answer:**  
"We validate against official CMS guidelines and examples. Our approach is conservative and transparent—we show you exactly why we recommend each code and how confident we are. Many practices actually prefer this transparency over 'black box' AI systems, because it gives providers the information they need to make informed decisions and defend their billing in audits."

---

## References

- [CMS 2021 E/M Documentation Guidelines](https://www.cms.gov/outreach-and-education/medicare-learning-network-mln/mlnproducts/evaluation-management-services)
- [AMA CPT E/M Guidelines](https://www.ama-assn.org/practice-management/cpt/evaluation-and-management-em-office-or-other-outpatient-99202-99215)
- [AAPC Coding Standards](https://www.aapc.com/)

---

**Last Updated**: January 2026
