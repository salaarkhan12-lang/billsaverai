// Demo data for investor presentations
// Realistic sample medical documentation with gaps

export const DEMO_MEDICAL_NOTE = `PATIENT ENCOUNTER NOTE

Date: 01/03/2026
Patient: Demo Patient (DOB: 05/15/1965)

CHIEF COMPLAINT:
Patient presents for diabetes follow-up.

HISTORY OF PRESENT ILLNESS:
Patient reports blood sugars have been running high lately. States compliance with medications but admits dietary indiscretion over holidays.

PHYSICAL EXAMINATION:
BP: 145/92 mmHg
HR: 78 bpm
Weight: 210 lbs
BMI: 31.2

General: Alert and oriented
Cardiovascular: Regular rate and rhythm
Respiratory: Clear to auscultation

ASSESSMENT:
1. Type 2 Diabetes Mellitus - uncontrolled
2. Hypertension - elevated today

PLAN:
- Increase Metformin to 1000mg BID
- Continue Lisinopril 20mg daily
- Dietary counseling provided
- Follow up in 3 months

Time spent: 25 minutes`;

export const DEMO_ANALYSIS_RESULT = {
  overallScore: 62,
  documentationLevel: "Fair" as const,
  totalPotentialRevenueLoss: "$450-750",
  suggestedEMLevel: "99214",
  currentEMLevel: "99213",
  potentialUpcodeOpportunity: true,
  mdmComplexity: "Moderate" as const,
  timeDocumented: true,
  meatCriteriaMet: false,
  gaps: [
    {
      id: "demo-gap-1",
      title: "Insufficient Medical Decision Making (MDM)",
      category: "critical" as const,
      description: "The note lacks detailed MDM documentation including complexity of problems addressed, amount of data reviewed, and risk assessment. This is essential for supporting higher-level E/M codes.",
      impact: "May result in downcoding from 99214 to 99213, losing $50-75 per encounter. Annual impact: $2,000-3,000 for this patient alone.",
      recommendation: "Document: (1) Number and complexity of problems, (2) Amount/complexity of data reviewed, (3) Risk of complications. Include specific details about lab review, differential diagnoses considered, and risk discussion with patient.",
      potentialRevenueLoss: "$200-300",
      cptCodes: ["99214", "99215"],
      icdCodes: ["E11.65", "I10"],
    },
    {
      id: "demo-gap-2",
      title: "Missing HCC Documentation (MEAT Criteria)",
      category: "critical" as const,
      description: "Chronic conditions (Diabetes, Hypertension) are mentioned but lack MEAT criteria documentation (Monitoring, Evaluation, Assessment, Treatment). This impacts risk adjustment and quality metrics.",
      impact: "Failure to capture HCC codes can result in $3,000-5,000 annual revenue loss per patient in value-based contracts. Also affects quality scores and star ratings.",
      recommendation: "For each chronic condition, document: Current status/monitoring (recent A1C, BP trends), Evaluation (exam findings specific to condition), Assessment (severity, control level), Treatment (current medications, adherence, plan modifications).",
      potentialRevenueLoss: "$150-250",
      cptCodes: ["99214"],
      icdCodes: ["E11.65", "E11.9", "I10"],
    },
    {
      id: "demo-gap-3",
      title: "Incomplete Review of Systems",
      category: "major" as const,
      description: "Only cardiovascular and respiratory systems documented. A complete ROS requires documentation of at least 10 systems for comprehensive E/M levels.",
      impact: "Incomplete ROS may not support 99214/99215 level coding. Could result in downcoding and lost revenue of $30-50 per visit.",
      recommendation: "Document review of: Constitutional, Eyes, ENT, Cardiovascular, Respiratory, GI, GU, Musculoskeletal, Skin, Neurological, Psychiatric, Endocrine, Hematologic, Allergic/Immunologic systems. Use 'all other systems reviewed and negative' for efficiency.",
      potentialRevenueLoss: "$50-100",
      cptCodes: ["99214", "99215"],
      icdCodes: [],
    },
    {
      id: "demo-gap-4",
      title: "Missing Time Documentation",
      category: "moderate" as const,
      description: "Time is mentioned (25 minutes) but lacks breakdown of counseling/coordination time. If >50% of time was spent on counseling, time-based coding could support higher E/M level.",
      impact: "Missing detailed time documentation prevents use of time-based coding, which could support 99215 level for this encounter.",
      recommendation: "Document: Total face-to-face time, time spent on counseling/coordination, specific topics discussed. If counseling >50% of visit, document: 'More than half of the 25-minute visit was spent counseling patient regarding diabetes management, dietary modifications, and medication adherence.'",
      potentialRevenueLoss: "$50-100",
      cptCodes: ["99215"],
      icdCodes: [],
    },
  ],
  strengths: [
    "Chief complaint clearly documented",
    "Vital signs recorded",
    "Assessment includes specific diagnoses",
    "Treatment plan outlined",
  ],
  recommendations: [
    "Add comprehensive MDM documentation with data review and risk assessment",
    "Document MEAT criteria for all chronic conditions",
    "Complete full 14-point review of systems",
    "Add detailed time documentation if counseling was significant",
  ],
};
