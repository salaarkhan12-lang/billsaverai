# Sample Medical Note for Testing

Since PDF generation requires special tools, here's a sample medical note text that you can copy into a text file, convert to PDF (using Word, Google Docs, or any PDF converter), and use to test the BillSaver application.

---

## Sample Medical Note - Good Documentation

**Patient Name:** John Doe
**Date of Service:** January 2, 2025
**Provider:** Dr. Jane Smith, MD

### Chief Complaint
Patient presents for follow-up of diabetes mellitus type 2 and hypertension.

### History of Present Illness
Patient reports good control of blood sugars over the past 3 months. Location: No specific pain. Quality: Reports feeling generally well. Severity: Mild fatigue noted (3/10). Duration: Fatigue has been present for 2 weeks. Timing: Mostly in afternoons. Context: Associated with increased work stress. Modifying factors: Better with rest. Associated symptoms: Denies chest pain, shortness of breath, palpitations.

### Review of Systems
- Constitutional: Denies fever, chills, unintentional weight loss
- Eyes: Denies vision changes, eye pain
- ENT: Denies hearing loss, sore throat
- Cardiovascular: Denies chest pain, palpitations, edema
- Respiratory: Denies cough, shortness of breath, wheezing
- Gastrointestinal: Denies nausea, vomiting, diarrhea, constipation, abdominal pain
- Genitourinary: Denies dysuria, frequency, urgency
- Musculoskeletal: Reports mild back pain, improved with exercise
- Skin: Denies rash, lesions
- Neurological: Denies headache, dizziness, numbness, weakness
- Psychiatric: Mild stress, denies depression
- Endocrine: As per HPI
- Hematologic: Denies easy bruising or bleeding
- Allergic/Immunologic: No new allergies

### Vital Signs
- BP: 132/78 mmHg
- Pulse: 76 bpm, regular
- Temperature: 98.4°F
- Respiratory Rate: 16/min
- O2 Saturation: 98% on room air
- BMI: 31.2 (Height: 5'9", Weight: 211 lbs)

### Physical Examination
- General: Well-developed, well-nourished, no acute distress, alert and oriented x3
- HEENT: Pupils equal, round, reactive to light. Oropharynx clear, no erythema
- Neck: Supple, no thyromegaly, no lymphadenopathy
- Cardiovascular: Regular rate and rhythm, S1 S2 normal, no murmurs
- Respiratory: Clear to auscultation bilaterally, no wheezes, rales, or rhonchi
- Abdomen: Soft, non-tender, non-distended, normal bowel sounds
- Extremities: No edema, pulses 2+ bilaterally
- Skin: Warm, dry, intact, no rash or lesions
- Neurological: Cranial nerves II-XII intact, motor strength 5/5 all extremities

### Laboratory Results Reviewed
- A1C: 7.2% (previous 7.8%) - improved
- Fasting glucose: 142 mg/dL
- Creatinine: 1.0 mg/dL (eGFR >60)
- Lipid panel: Total cholesterol 198, LDL 112, HDL 45, Triglycerides 205

### Assessment
1. **Diabetes mellitus type 2, with diabetic chronic kidney disease** - Controlled, A1c improved
2. **Essential hypertension, controlled** - Blood pressure at goal
3. **Obesity** - BMI 31.2
4. **Hyperlipidemia** - LDL at goal, triglycerides elevated

### Plan

**Diabetes (Type 2, controlled):**
- Continue metformin 1000mg twice daily (Treated)
- A1C reviewed, showing improvement (Evaluated)
- Discussed importance of diet and exercise (Addressed)
- Will monitor A1C in 3 months (Monitored)
- Patient educated on hypoglycemia symptoms

**Hypertension (controlled):**
- Continue lisinopril 10mg daily for hypertension (Treated)
- Blood pressure monitored today, at goal (Monitored)
- Discussed sodium restriction (Addressed)

**Obesity:**
- Discussed weight loss strategies (Addressed)
- Referred to nutritionist for medical nutrition therapy (Treated)
- Goal: lose 5-10% body weight over 6 months

**Hyperlipidemia:**
- Continue atorvastatin 20mg daily for cholesterol management (Treated)
- Reviewed lipid panel results (Evaluated)
- Discussed cardiovascular risk (Addressed)

**Follow-up:**
- Return in 3 months for diabetes follow-up
- Recheck A1C, lipids, comprehensive metabolic panel
- Continue current medications
- Patient understands plan and agrees

**Total Time:** 35 minutes spent on this encounter including review of labs, examination, counseling on diet and exercise, and care coordination with nutritionist.

---

## Sample Medical Note - Poor Documentation (For Comparison)

**Patient:** Jane Smith
**Date:** 1/2/25

Diabetes follow-up. Blood sugar okay. Patient feels fine.

Exam: Vitals stable. Looks good.

Keep taking medications. Come back in 3 months.

---

## Instructions for Testing

1. Copy either sample note above
2. Paste into a word processor (Microsoft Word, Google Docs, etc.)
3. Save/Export as PDF
4. Upload to BillSaver at http://localhost:3000
5. Review the analysis results

The "good documentation" note should score well (80-90+) with minimal gaps.
The "poor documentation" note should score poorly (30-40) with many critical gaps identified.
