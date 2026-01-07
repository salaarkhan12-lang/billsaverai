// AI-Powered Smart Template Generator
// Generates missing documentation based on gap analysis with ML enhancement

import { templateSuggester, type TemplateSuggestion } from './ml-models';

export interface TemplateContext {
  gapTitle: string;
  gapCategory: string;
  gapDescription: string;
  existingText?: string;
  mlSuggestions?: TemplateSuggestion[];
}

export async function generateSmartTemplate(context: TemplateContext): Promise<string> {
  const { gapTitle, gapCategory, gapDescription, existingText, mlSuggestions } = context;

  // Use ML suggestions if available
  if (mlSuggestions && mlSuggestions.length > 0) {
    const topSuggestion = mlSuggestions[0];
    // Enhance the template with ML context
    return generateMLEnhancedTemplate(gapTitle, gapCategory, gapDescription, topSuggestion);
  }

  // Fallback to rule-based templates
  return generateRuleBasedTemplate(gapTitle, gapCategory, gapDescription);
}

function generateMLEnhancedTemplate(
  gapTitle: string,
  gapCategory: string,
  gapDescription: string,
  mlSuggestion: TemplateSuggestion
): string {
  // Base template from ML suggestion
  let template = `🤖 AI-ENHANCED TEMPLATE (${Math.round(mlSuggestion.relevanceScore * 100)}% confidence)

${gapTitle}

${gapDescription}

${mlSuggestion.context}

`;

  // Add ML-specific enhancements
  template += `
💡 AI INSIGHTS:
• This gap was identified using advanced pattern recognition
• Based on analysis of thousands of medical documents
• Addresses common compliance and reimbursement issues

🎯 RECOMMENDED IMPROVEMENTS:
• Include specific, measurable details
• Use standardized medical terminology
• Link treatments directly to diagnoses
• Document time spent when applicable

⚡ QUICK IMPLEMENTATION:
Copy and customize this template for immediate use in your EHR system.
`;

  return template;
}

function generateRuleBasedTemplate(gapTitle: string, gapCategory: string, gapDescription: string): string {

  // Template library based on common documentation gaps
  const templates: Record<string, string> = {
    // Chief Complaint Templates
    "Missing Chief Complaint": `CHIEF COMPLAINT: "[Patient's primary concern in their own words]"

EXAMPLES:
• "I've had chest pain for 3 days"
• "My blood sugar has been running high"
• "I'm here for my diabetes follow-up"
• "I need a refill on my blood pressure medication"

DOCUMENTATION TIP: Use the patient's exact words when possible. This should be brief (1-2 sentences) and clearly state why the patient is seeking care today.`,

    // HPI Templates
    "Incomplete History of Present Illness": `HISTORY OF PRESENT ILLNESS:
The patient is a [age]-year-old [gender] who presents with [chief complaint].

ONSET: Symptoms began [timeframe] ago
LOCATION: [Specific location of symptoms]
DURATION: [How long symptoms last]
CHARACTER: [Quality/nature of symptoms]
AGGRAVATING FACTORS: Symptoms worsen with [factors]
RELIEVING FACTORS: Symptoms improve with [factors]
TIMING: [Pattern - constant, intermittent, etc.]
SEVERITY: [Scale 1-10 or mild/moderate/severe]

ASSOCIATED SYMPTOMS: [Related symptoms]
PERTINENT NEGATIVES: Denies [relevant negative symptoms]

PREVIOUS TREATMENT: [Prior interventions and response]`,

    // Physical Exam Templates
    "Incomplete Physical Examination": `PHYSICAL EXAMINATION:

VITAL SIGNS:
- Blood Pressure: [value] mmHg
- Heart Rate: [value] bpm
- Respiratory Rate: [value] breaths/min
- Temperature: [value]°F
- O2 Saturation: [value]% on room air
- Weight: [value] lbs | BMI: [value]

GENERAL: Alert, oriented x3, in no acute distress

CARDIOVASCULAR: Regular rate and rhythm, no murmurs/rubs/gallops

RESPIRATORY: Clear to auscultation bilaterally, no wheezes/rales/rhonchi

ABDOMEN: Soft, non-tender, non-distended, normal bowel sounds

EXTREMITIES: No edema, cyanosis, or clubbing

NEUROLOGICAL: Cranial nerves II-XII intact, strength 5/5 all extremities

SKIN: Warm, dry, intact, no rashes or lesions`,

    // Assessment & Plan Templates
    "Missing Assessment and Plan": `ASSESSMENT & PLAN:

1. [Primary Diagnosis] (ICD-10: [code])
   - Clinical reasoning: [Why this diagnosis based on findings]
   - Severity: [Mild/Moderate/Severe]
   - Treatment plan:
     * [Medication/intervention with dosage]
     * [Additional interventions]
   - Patient education provided regarding [topic]
   - Follow-up: [Timeframe and conditions]

2. [Secondary Diagnosis] (ICD-10: [code])
   - [Similar structure as above]

RISK ASSESSMENT: [Complications discussed, risk stratification]
SHARED DECISION MAKING: Discussed risks, benefits, and alternatives with patient. Patient verbalized understanding and agreement with plan.`,

    // MDM Templates
    "Insufficient Medical Decision Making": `MEDICAL DECISION MAKING (MDM):

1. NUMBER AND COMPLEXITY OF PROBLEMS ADDRESSED:
   • [Problem 1]: [Acute/Chronic] [Stable/Worsening/Improving]
     - Severity: [Self-limited/Low/Moderate/High]
     - Complexity: [Straightforward/Low/Moderate/High]
   • [Problem 2]: [Details]
   • [Problem 3]: [Details]
   
   Total problems addressed: [X]
   Highest complexity level: [Straightforward/Low/Moderate/High]

2. AMOUNT AND COMPLEXITY OF DATA REVIEWED:
   
   Category 1 - Tests/Documents:
   • Reviewed [lab name] results from [date]: [key findings]
   • Reviewed [imaging study] from [date]: [key findings]
   • Reviewed outside records from [provider/facility]
   
   Category 2 - Independent Interpretation:
   • Independently interpreted [test/image]: [findings and clinical significance]
   
   Category 3 - Discussion:
   • Discussed case with [Dr. Name, specialty] regarding [topic]
   • Obtained additional history from [family member/caregiver]
   
   Data points reviewed: [X] (Minimal: 0-1, Limited: 2, Moderate: 3, Extensive: 4+)

3. RISK OF COMPLICATIONS AND/OR MORBIDITY OR MORTALITY:

   Risk Level: [Minimal/Low/Moderate/High]
   
   Risk Factors Considered:
   • Presenting problem risk: [Level and rationale]
   • Diagnostic procedure risk: [Procedures ordered and associated risks]
   • Treatment risk: [Medications/interventions and potential complications]
   
   Differential Diagnoses Considered:
   1. [Most likely diagnosis] - [reasoning]
   2. [Alternative diagnosis] - [why considered/ruled out]
   3. [Alternative diagnosis] - [why considered/ruled out]
   
   Risk Discussion with Patient:
   • Discussed potential complications: [specific risks]
   • Reviewed warning signs: [red flags to watch for]
   • Established follow-up plan for risk mitigation

4. MDM COMPLEXITY DETERMINATION:
   
   Based on 2024 E/M Guidelines:
   • Problems: [Straightforward/Low/Moderate/High]
   • Data: [Minimal/Limited/Moderate/Extensive]
   • Risk: [Minimal/Low/Moderate/High]
   
   Overall MDM Complexity: [STRAIGHTFORWARD/LOW/MODERATE/HIGH]
   (Determined by 2 of 3 elements meeting or exceeding the level)
   
   Supports E/M Level: [99212/99213/99214/99215]

5. TIME SPENT ON MDM (if time-based coding):
   Total time: [X] minutes on [date]
   Time spent on MDM activities: [X] minutes
   (Includes data review, risk assessment, treatment planning, documentation)`,

    // Review of Systems Templates
    "Missing Review of Systems": `REVIEW OF SYSTEMS:

CONSTITUTIONAL: Denies fever, chills, night sweats, fatigue, weight changes
EYES: Denies vision changes, eye pain, discharge
EARS/NOSE/THROAT: Denies hearing loss, tinnitus, sore throat, nasal congestion
CARDIOVASCULAR: Denies chest pain, palpitations, edema
RESPIRATORY: Denies shortness of breath, cough, wheezing
GASTROINTESTINAL: Denies nausea, vomiting, diarrhea, constipation, abdominal pain
GENITOURINARY: Denies dysuria, frequency, urgency, hematuria
MUSCULOSKELETAL: Denies joint pain, swelling, stiffness, back pain
SKIN: Denies rashes, lesions, changes in moles
NEUROLOGICAL: Denies headache, dizziness, weakness, numbness, seizures
PSYCHIATRIC: Denies depression, anxiety, sleep disturbances
ENDOCRINE: Denies polyuria, polydipsia, heat/cold intolerance
HEMATOLOGIC: Denies easy bruising, bleeding
ALLERGIC/IMMUNOLOGIC: Denies allergic symptoms, recurrent infections

All other systems reviewed and negative except as noted in HPI.`,

    // Past Medical History Templates
    "Incomplete Past Medical History": `PAST MEDICAL HISTORY:
1. [Condition] - diagnosed [year], currently [status]
2. [Condition] - [details]

PAST SURGICAL HISTORY:
1. [Procedure] - [year] - [indication]
2. [Procedure] - [year] - [indication]

MEDICATIONS:
1. [Medication] [dose] [route] [frequency] - for [indication]
2. [Medication] [dose] [route] [frequency] - for [indication]

ALLERGIES: [Medication/substance] - [reaction type]
OR: No known drug allergies (NKDA)

SOCIAL HISTORY:
- Tobacco: [Never/Former/Current] - [pack-year history if applicable]
- Alcohol: [Frequency and amount]
- Recreational drugs: [Details or denies]
- Occupation: [Job]
- Living situation: [Details]
- Exercise: [Frequency and type]

FAMILY HISTORY:
- [Relation]: [Condition] - [age of onset]
- [Relation]: [Condition] - [age of onset]
- Denies family history of [relevant conditions]`,

    // Time Documentation Templates
    "Missing Time Documentation": `TIME DOCUMENTATION:

TOTAL TIME: [X] minutes spent on [DATE]

TIME BREAKDOWN:
- Face-to-face patient encounter: [X] minutes
- Review of medical records/test results: [X] minutes
- Independent interpretation of tests: [X] minutes
- Discussion with other healthcare professionals: [X] minutes
- Counseling and patient education: [X] minutes
- Care coordination activities: [X] minutes

MEDICAL DECISION MAKING TIME: [X] minutes
(Time spent on data review, risk assessment, and treatment planning)

COUNSELING/COORDINATION NOTE:
[If >50% of time spent on counseling/coordination, document:]
More than 50% of the total visit time ([X] of [X] minutes) was spent on:
• Counseling regarding [specific topics - diagnosis, prognosis, treatment options]
• Coordination of care with [specialists/services]
• Patient education about [specific conditions/medications/lifestyle modifications]

PROLONGED SERVICES (if applicable):
[If time exceeds typical time for E/M level by >15 minutes:]
Total time of [X] minutes exceeds typical time for [CPT code] by [X] minutes.
Additional time was medically necessary for [reason].

TIME-BASED CODING JUSTIFICATION:
This encounter qualifies for time-based coding due to the extensive counseling and coordination of care required for this complex patient.`,

    // HCC/MEAT Templates
    "Missing HCC Documentation (MEAT Criteria)": `[CONDITION NAME] - ACTIVE CHRONIC CONDITION

MONITORING:
- Current status: [Stable/Worsening/Improving]
- Recent labs/tests: [Results and interpretation]
- Symptoms: [Current symptom status]
- Vital signs: [Relevant findings]

EVALUATION:
- Physical exam findings: [Specific to condition]
- Assessment of disease progression: [Details]
- Complications: [Present/Absent]
- Impact on daily activities: [Details]

ASSESSMENT:
- [Condition] (ICD-10: [code]) - [Severity/Stage]
- Clinical reasoning: [Why this assessment]
- Risk stratification: [Level and rationale]

TREATMENT:
- Current medications: [List with dosages]
- Medication adherence: [Status]
- Lifestyle modifications: [Details]
- Referrals: [If applicable]
- Patient education: [Topics covered]
- Follow-up plan: [Timeframe and monitoring]

PLAN MODIFICATIONS: [Any changes to treatment and rationale]`,

    // Chronic Condition Management
    "Inadequate Chronic Condition Documentation": `CHRONIC CONDITION MANAGEMENT: [Condition Name]

CURRENT STATUS:
- Disease control: [Well-controlled/Partially controlled/Uncontrolled]
- Complications: [Present/Absent - specify]
- Functional impact: [Effect on daily activities]

MONITORING PARAMETERS:
- [Lab/test]: [Value] (Goal: [target])
- [Vital sign]: [Value] (Goal: [target])
- Last specialist visit: [Date and findings]

TREATMENT ADHERENCE:
- Medication compliance: [Status]
- Lifestyle modifications: [Adherence level]
- Barriers to care: [Identified barriers]

ADJUSTMENTS TO PLAN:
- [Specific changes made and rationale]
- Patient counseled on [topics]
- Goals of care discussed and documented

FOLLOW-UP:
- Next visit: [Timeframe]
- Monitoring: [What will be checked]
- Red flags discussed: [Warning signs to watch for]`,
  };

  // Match template based on gap title with fuzzy matching
  const lowerTitle = gapTitle.toLowerCase();
  
  // Exact match first
  for (const [key, template] of Object.entries(templates)) {
    if (lowerTitle === key.toLowerCase()) {
      return template;
    }
  }
  
  // Partial match with keywords
  const keywords: Record<string, string[]> = {
    "Missing Time Documentation": ["time", "duration", "minutes", "prolonged"],
    "Insufficient Medical Decision Making": ["mdm", "decision making", "complexity", "data review"],
    "Missing Chief Complaint": ["chief complaint", "cc", "reason for visit"],
    "Incomplete History of Present Illness": ["hpi", "history of present", "present illness"],
    "Incomplete Physical Examination": ["physical exam", "examination", "pe", "vital signs"],
    "Missing Assessment and Plan": ["assessment", "plan", "a&p", "a/p"],
    "Missing Review of Systems": ["ros", "review of systems"],
    "Incomplete Past Medical History": ["pmh", "past medical", "medical history", "surgical history"],
    "Missing HCC Documentation (MEAT Criteria)": ["hcc", "meat", "chronic condition", "risk adjustment"],
    "Inadequate Chronic Condition Documentation": ["chronic", "diabetes", "hypertension", "monitoring"],
  };
  
  for (const [templateKey, keywordList] of Object.entries(keywords)) {
    if (keywordList.some(keyword => lowerTitle.includes(keyword))) {
      return templates[templateKey] || "";
    }
  }
  
  // Fallback to partial match
  for (const [key, template] of Object.entries(templates)) {
    if (lowerTitle.includes(key.toLowerCase()) || 
        key.toLowerCase().includes(lowerTitle)) {
      return template;
    }
  }

  // Default template based on category with enhanced guidance
  if (gapCategory === 'critical') {
    return `⚠️ CRITICAL DOCUMENTATION ELEMENT: ${gapTitle}

This element is ESSENTIAL for proper billing, compliance, and risk management.

📋 WHAT TO DOCUMENT:

${gapDescription}

✅ REQUIRED ELEMENTS:

1. SPECIFIC DETAILS:
   • [Provide measurable, objective information]
   • [Include relevant dates, times, or quantities]
   • [Document specific findings or observations]

2. CLINICAL REASONING:
   • Why this is clinically significant
   • How it impacts patient care
   • What alternatives were considered

3. MEDICAL DECISION MAKING:
   • Risk assessment performed
   • Data reviewed to support this decision
   • Complexity of problem addressed

4. PATIENT INVOLVEMENT:
   • What was discussed with patient/family
   • Patient's understanding and agreement
   • Shared decision-making process

5. FOLLOW-UP PLAN:
   • Specific monitoring parameters
   • Timeline for reassessment
   • Conditions requiring earlier follow-up

💡 BILLING IMPACT:
Missing this documentation may result in claim denial, downcoding, or audit risk.

📝 DOCUMENTATION TIP:
Be specific, use measurable terms, and clearly link your clinical reasoning to your treatment decisions.`;
  }

  // Generic template with smart suggestions
  return `📝 DOCUMENTATION ENHANCEMENT: ${gapTitle}

${gapDescription}

To improve documentation quality and ensure proper reimbursement:

1. CURRENT CLINICAL FINDINGS:
   • Document objective, measurable findings
   • Include relevant vital signs or test results
   • Note pertinent positive and negative findings
   • Example: "Blood pressure 145/92, up from 130/85 last visit"

2. CLINICAL ASSESSMENT:
   • State your medical assessment clearly
   • Link findings to diagnosis
   • Document severity/stability
   • Example: "Hypertension, uncontrolled, requiring medication adjustment"

3. TREATMENT PLAN:
   • Specify interventions with details
   • Include medication names, doses, frequencies
   • Document non-pharmacologic interventions
   • Example: "Increase lisinopril from 10mg to 20mg daily"

4. PATIENT EDUCATION & COUNSELING:
   • Document what was explained to patient
   • Note patient's understanding
   • Record any concerns addressed
   • Example: "Discussed importance of daily BP monitoring and dietary sodium restriction"

5. FOLLOW-UP & MONITORING:
   • Specify timeframe for next visit
   • List parameters to monitor
   • Document red flags discussed
   • Example: "Return in 2 weeks for BP recheck. Call if BP >160/100 or symptoms of dizziness"

💰 REVENUE IMPACT:
Proper documentation of this element supports appropriate E/M level coding and reduces audit risk.

⏱️ TIME-SAVING TIP:
Use templates in your EHR, but customize with patient-specific details for each encounter.`;
}

// Generate multiple templates for batch processing
export async function generateBatchTemplates(
  gaps: Array<{ title: string; category: string; description: string }>,
  documentText?: string
): Promise<Map<string, string>> {
  const templates = new Map<string, string>();

  // Get ML suggestions for the entire document if provided
  let mlSuggestions: TemplateSuggestion[] = [];
  if (documentText) {
    try {
      mlSuggestions = await templateSuggester.suggestTemplates(documentText, []);
    } catch (error) {
      console.warn('ML template suggestions failed:', error);
    }
  }

  for (const gap of gaps) {
    const template = await generateSmartTemplate({
      gapTitle: gap.title,
      gapCategory: gap.category,
      gapDescription: gap.description,
      mlSuggestions: mlSuggestions.filter(s => s.templateId.includes(gap.title.toLowerCase())),
    });
    templates.set(gap.title, template);
  }

  return templates;
}
