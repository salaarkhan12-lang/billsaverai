/**
 * Demo medical documentation samples for BillSaver
 * These are embedded as data to be dynamically generated into PDFs
 */

export const DEMO_MEDICAL_NOTES = [
    {
        id: 1,
        title: "Demo Note 1 - Moderate Quality",
        filename: "medical-note-diabetes.pdf",
        content: `PATIENT NAME: Johnson, Robert M.
DATE OF SERVICE: 01/15/2024
PROVIDER: Dr. Sarah Chen, MD
VISIT TYPE: Office Visit - Follow-up

CHIEF COMPLAINT:
Patient presents for diabetes management.

HISTORY OF PRESENT ILLNESS:
68 y/o male with history of Type 2 Diabetes Mellitus. Patient reports blood sugars have been running high lately, ranging from 180-220 mg/dL. He has been compliant with medications. No symptoms of hypoglycemia. Denies polyuria or polydipsia.

PAST MEDICAL HISTORY:
- Type 2 Diabetes Mellitus (since 2015)
- Hypertension
- Hyperlipidemia  
- Benign Prostatic Hyperplasia

MEDICATIONS:
- Metformin 1000mg BID
- Lisinopril 20mg daily
- Atorvastatin 40mg daily
- Tamsulosin 0.4mg daily

ALLERGIES: NKDA

SOCIAL HISTORY:
Non-smoker. Occasional alcohol use (1-2 drinks per week). Lives with spouse. Retired teacher.

FAMILY HISTORY:
Father - Type 2 DM, CAD. Mother - HTN, stroke at age 75.

REVIEW OF SYSTEMS:
General: Denies fever, chills, weight changes
Cardiovascular: Denies chest pain, palpitations
Respiratory: Denies SOB, cough
Endocrine: As per HPI

PHYSICAL EXAMINATION:
Vital Signs: BP 142/88, HR 78, RR 16, Temp 98.6°F, Weight 195 lbs
General: Alert and oriented x3, no acute distress
HEENT: Normocephalic, atraumatic
Neck: No JVD, no thyromegaly
Cardiovascular: RRR, no murmurs
Lungs: CTA bilaterally
Abdomen: Soft, non-tender
Extremities: No edema, pedal pulses intact

ASSESSMENT:
1. Type 2 Diabetes Mellitus - uncontrolled (HbA1c elevated at last check)
2. Hypertension - controlled
3. Hyperlipidemia - on statin therapy

PLAN:
- Increase Metformin to 1000mg TID
- Continue current BP and lipid medications
- Order HbA1c, lipid panel, CMP
- Diabetic retinopathy screening recommended
- Follow up in 3 months
- Patient education provided regarding diet and exercise

Total time: 25 minutes`
    },
    {
        id: 2,
        title: "Demo Note 2 - Fair Quality",
        filename: "medical-note-back-pain.pdf",
        content: `PATIENT NAME: Williams, Jennifer L.
DATE OF SERVICE: 01/18/2024
PROVIDER: Dr. Michael Park, MD
VISIT TYPE: New Patient Consultation

CHIEF COMPLAINT:
Chronic back pain

HISTORY OF PRESENT ILLNESS:
45 y/o female presents with lower back pain for past 6 months. Pain is described as dull, aching, worse with prolonged sitting. Radiates down left leg occasionally. Has tried OTC ibuprofen with minimal relief. No history of trauma. Pain affects daily activities and sleep.

PAST MEDICAL HISTORY:
- Hypothyroidism
- Anxiety disorder

MEDICATIONS:
- Levothyroxine 100mcg daily
- Sertraline 50mg daily

ALLERGIES: Penicillin (rash)

REVIEW OF SYSTEMS:
Musculoskeletal: As per HPI
Neurological: Denies numbness, weakness
All other systems reviewed and negative

PHYSICAL EXAMINATION:
Vital Signs: BP 128/82, HR 72, RR 14
General: Well-appearing female in no distress
Back: Tenderness over L4-L5 region, limited ROM with forward flexion
Neurological: Motor 5/5 all extremities, sensation intact, negative straight leg raise

ASSESSMENT:
1. Chronic low back pain, likely musculoskeletal
2. Hypothyroidism - stable
3. Anxiety disorder - controlled

PLAN:
- Start physical therapy referral
- Prescribe cyclobenzaprine 10mg at bedtime PRN
- X-ray lumbar spine
- Follow up in 4 weeks
- Discussed proper body mechanics

Time spent: 20 minutes, more than half counseling and coordination of care.`
    },
    {
        id: 3,
        title: "Demo Note 3 - Poor Quality",
        filename: "medical-note-hypertension.pdf",
        content: `PATIENT NAME: Martinez, Carlos
DATE OF SERVICE: 01/20/2024
PROVIDER: Dr. Lisa Thompson, MD
VISIT TYPE: Office Visit

Patient here today.

Blood pressure high. Discussed medications.

EXAMINATION:
BP 156/94
Heart: Normal
Lungs: Clear

ASSESSMENT:
Hypertension

PLAN:
Increase lisinopril
Recheck BP in 2 weeks
Labs ordered`
    }
];

/**
 * Converts plain text medical note to a simple PDF blob
 * Uses a minimal PDF structure that can be parsed by pdf.js
 */
export function textToPdfBlob(text: string): Blob {
    // Create a very simple PDF with the text content
    // This is a minimal valid PDF structure
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Courier
>>
>>
>>
>>
endobj
4 0 obj
<<
/Length ${text.length * 2}
>>
stream
BT
/F1 10 Tf
50 750 Td
15 TL
${text.split('\n').map(line => `(${line.replace(/[()\\]/g, '\\$&')}) Tj T*`).join('\n')}
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000309 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
${400 + text.length * 2}
%%EOF`;

    return new Blob([pdfContent], { type: 'application/pdf' });
}

/**
 * Get a random demo medical note
 */
export function getRandomDemoNote() {
    const randomIndex = Math.floor(Math.random() * DEMO_MEDICAL_NOTES.length);
    const note = DEMO_MEDICAL_NOTES[randomIndex];

    const pdfBlob = textToPdfBlob(note.content);
    const file = new File([pdfBlob], note.filename, { type: 'application/pdf' });

    return {
        file,
        filename: note.filename,
        title: note.title
    };
}
