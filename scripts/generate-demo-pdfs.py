"""
Generate sample medical documentation PDFs for BillSaver demo mode.
Creates 3 PDF files with varying documentation quality.
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_LEFT, TA_CENTER
import os

# Medical note contents
MEDICAL_NOTE_1 = """
<para><b>PATIENT NAME:</b> Johnson, Robert M.</para>
<para><b>DATE OF SERVICE:</b> 01/15/2024</para>
<para><b>PROVIDER:</b> Dr. Sarah Chen, MD</para>
<para><b>VISIT TYPE:</b> Office Visit - Follow-up</para>
<para><b>_______________________________________________________________________________</b></para>

<para><b>CHIEF COMPLAINT:</b></para>
<para>Patient presents for diabetes management.</para>

<para><b>HISTORY OF PRESENT ILLNESS:</b></para>
<para>68 y/o male with history of Type 2 Diabetes Mellitus. Patient reports blood sugars have been running high lately, ranging from 180-220 mg/dL. He has been compliant with medications. No symptoms of hypoglycemia. Denies polyuria or polydipsia.</para>

<para><b>PAST MEDICAL HISTORY:</b></para>
<para>- Type 2 Diabetes Mellitus (since 2015)</para>
<para>- Hypertension</para>
<para>- Hyperlipidemia</para>
<para>- Benign Prostatic Hyperplasia</para>

<para><b>MEDICATIONS:</b></para>
<para>- Metformin 1000mg BID</para>
<para>- Lisinopril 20mg daily</para>
<para>- Atorvastatin 40mg daily</para>
<para>- Tamsulosin 0.4mg daily</para>

<para><b>ALLERGIES:</b> NKDA</para>

<para><b>SOCIAL HISTORY:</b></para>
<para>Non-smoker. Occasional alcohol use (1-2 drinks per week). Lives with spouse. Retired teacher.</para>

<para><b>FAMILY HISTORY:</b></para>
<para>Father - Type 2 DM, CAD. Mother - HTN, stroke at age 75.</para>

<para><b>REVIEW OF SYSTEMS:</b></para>
<para>General: Denies fever, chills, weight changes</para>
<para>Cardiovascular: Denies chest pain, palpitations</para>
<para>Respiratory: Denies SOB, cough</para>
<para>Endocrine: As per HPI</para>

<para><b>PHYSICAL EXAMINATION:</b></para>
<para><b>Vital Signs:</b> BP 142/88, HR 78, RR 16, Temp 98.6°F, Weight 195 lbs</para>
<para>General: Alert and oriented x3, no acute distress</para>
<para>HEENT: Normocephalic, atraumatic</para>
<para>Neck: No JVD, no thyromegaly</para>
<para>Cardiovascular: RRR, no murmurs</para>
<para>Lungs: CTA bilaterally</para>
<para>Abdomen: Soft, non-tender</para>
<para>Extremities: No edema, pedal pulses intact</para>

<para><b>ASSESSMENT:</b></para>
<para>1. Type 2 Diabetes Mellitus - uncontrolled (HbA1c elevated at last check)</para>
<para>2. Hypertension - controlled</para>
<para>3. Hyperlipidemia - on statin therapy</para>

<para><b>PLAN:</b></para>
<para>- Increase Metformin to 1000mg TID</para>
<para>- Continue current BP and lipid medications</para>
<para>- Order HbA1c, lipid panel, CMP</para>
<para>- Diabetic retinopathy screening recommended</para>
<para>- Follow up in 3 months</para>
<para>- Patient education provided regarding diet and exercise</para>

<para>Total time: 25 minutes</para>
"""

MEDICAL_NOTE_2 = """
<para><b>PATIENT NAME:</b> Williams, Jennifer L.</para>
<para><b>DATE OF SERVICE:</b> 01/18/2024</para>
<para><b>PROVIDER:</b> Dr. Michael Park, MD</para>
<para><b>VISIT TYPE:</b> New Patient Consultation</para>
<para><b>_______________________________________________________________________________</b></para>

<para><b>CHIEF COMPLAINT:</b></para>
<para>Chronic back pain</para>

<para><b>HISTORY OF PRESENT ILLNESS:</b></para>
<para>45 y/o female presents with lower back pain for past 6 months. Pain is described as dull, aching, worse with prolonged sitting. Radiates down left leg occasionally. Has tried OTC ibuprofen with minimal relief. No history of trauma. Pain affects daily activities and sleep.</para>

<para><b>PAST MEDICAL HISTORY:</b></para>
<para>- Hypothyroidism</para>
<para>- Anxiety disorder</para>

<para><b>MEDICATIONS:</b></para>
<para>- Levothyroxine 100mcg daily</para>
<para>- Sertraline 50mg daily</para>

<para><b>ALLERGIES:</b> Penicillin (rash)</para>

<para><b>REVIEW OF SYSTEMS:</b></para>
<para>Musculoskeletal: As per HPI</para>
<para>Neurological: Denies numbness, weakness</para>
<para>All other systems reviewed and negative</para>

<para><b>PHYSICAL EXAMINATION:</b></para>
<para><b>Vital Signs:</b> BP 128/82, HR 72, RR 14</para>
<para>General: Well-appearing female in no distress</para>
<para>Back: Tenderness over L4-L5 region, limited ROM with forward flexion</para>
<para>Neurological: Motor 5/5 all extremities, sensation intact, negative straight leg raise</para>

<para><b>ASSESSMENT:</b></para>
<para>1. Chronic low back pain, likely musculoskeletal</para>
<para>2. Hypothyroidism - stable</para>
<para>3. Anxiety disorder - controlled</para>

<para><b>PLAN:</b></para>
<para>- Start physical therapy referral</para>
<para>- Prescribe cyclobenzaprine 10mg at bedtime PRN</para>
<para>- X-ray lumbar spine</para>
<para>- Follow up in 4 weeks</para>
<para>- Discussed proper body mechanics</para>

<para>Time spent: 20 minutes, more than half counseling and coordination of care.</para>
"""

MEDICAL_NOTE_3 = """
<para><b>PATIENT NAME:</b> Martinez, Carlos</para>
<para><b>DATE OF SERVICE:</b> 01/20/2024</para>
<para><b>PROVIDER:</b> Dr. Lisa Thompson, MD</para>
<para><b>VISIT TYPE:</b> Office Visit</para>
<para><b>_______________________________________________________________________________</b></para>

<para>Patient here today.</para>

<para>Blood pressure high. Discussed medications.</para>

<para><b>EXAMINATION:</b></para>
<para>BP 156/94</para>
<para>Heart: Normal</para>
<para>Lungs: Clear</para>

<para><b>ASSESSMENT:</b></para>
<para>Hypertension</para>

<para><b>PLAN:</b></para>
<para>Increase lisinopril</para>
<para>Recheck BP in 2 weeks</para>
<para>Labs ordered</para>
"""

def create_pdf(content, filename):
    """Create a PDF from HTML-like content"""
    output_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'demo-notes', filename)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    doc = SimpleDocTemplate(output_path, pagesize=letter,
                           rightMargin=72, leftMargin=72,
                           topMargin=72, bottomMargin=18)
    
    Story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    styles.add(ParagraphStyle(name='CustomBody', 
                             parent=styles['BodyText'],
                             fontSize=10,
                             leading=14,
                             spaceBefore=6))
    
    # Parse content and create paragraphs
    for line in content.strip().split('\n'):
        line = line.strip()
        if line:
            p = Paragraph(line, styles['CustomBody'])
            Story.append(p)
    
    doc.build(Story)
    print(f"Created: {filename}")

if __name__ == '__main__':
    create_pdf(MEDICAL_NOTE_1, 'medical-note-1.pdf')
    create_pdf(MEDICAL_NOTE_2, 'medical-note-2.pdf')
    create_pdf(MEDICAL_NOTE_3, 'medical-note-3.pdf')
    print("All demo PDFs created successfully!")
