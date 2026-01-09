// Comprehensive Medical Billing Documentation Rules Engine
// Based on 2024-2025 E/M Coding Guidelines, HCC Requirements, and MEAT Criteria
// Enhanced with TensorFlow.js ML models for Phase 1
// Revenue calculations powered by commercial CPT pricing system

import { qualityPredictor, gapDetector, cptPredictor, initializeMLModels } from './ml-models';
import type { QualityPrediction, GapPrediction, CPTCodePrediction } from './ml-models';
import { calculateRevenue, toLegacyRevenueString, calculateTotalRevenue } from './revenue-calculator';
import type { RevenueCalculation } from './types/revenue';

export interface GapLocation {
  page: number;
  position: number; // Character position in the full text
  textSnippet: string; // Context around the gap
  section?: string; // Medical section (HPI, Assessment, etc.)
  x?: number; // PDF coordinate X
  y?: number; // PDF coordinate Y
}

export interface DocumentationGap {
  id: string;
  category: 'critical' | 'major' | 'moderate' | 'minor';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  potentialRevenueLoss: string;  // LEGACY: Kept for backward compatibility
  revenueImpact?: RevenueCalculation;  // NEW: Detailed revenue breakdown
  cptCodes?: string[];
  icdCodes?: string[];
  mlConfidence?: number; // ML confidence score for this gap
  isMLDetected?: boolean; // Whether this gap was detected by ML
  location?: GapLocation; // Location information in the PDF
}

export interface AnalysisResult {
  overallScore: number;
  documentationLevel: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
  gaps: DocumentationGap[];
  strengths: string[];
  suggestedEMLevel: string;
  currentEMLevel: string;
  potentialUpcodeOpportunity: boolean;
  totalPotentialRevenueLoss: string;
  mdmComplexity: 'Straightforward' | 'Low' | 'Moderate' | 'High';
  timeDocumented: boolean;
  meatCriteriaMet: boolean;
  documentText?: string; // NEW: Store document text for ICD extraction
  // ML-enhanced fields
  mlQualityScore?: number;
  mlConfidence?: number;
  suggestedCPTCodes?: CPTCodePrediction[];
  mlDetectedGaps?: GapPrediction[];
  dataSecurity?: {
    isClean: boolean;
    phiTampered: boolean;
    redactedItems: {
      names: number;
      dates: number;
      identifiers: number;
      locations: number;
    }
  };
}

// E/M Level Requirements based on MDM (2024-2025 Guidelines)
// Note: EM_LEVELS defined for future use in E/M level calculations
const EM_LEVELS = {
  '99211': { name: 'Level 1', mdm: 'N/A', minTime: 0, description: 'Minimal problem' },
  '99212': { name: 'Level 2', mdm: 'Straightforward', minTime: 10, description: 'Self-limited problem' },
  '99213': { name: 'Level 3', mdm: 'Low', minTime: 20, description: 'Low complexity' },
  '99214': { name: 'Level 4', mdm: 'Moderate', minTime: 30, description: 'Moderate complexity' },
  '99215': { name: 'Level 5', mdm: 'High', minTime: 40, description: 'High complexity' },
};

// Documentation elements to check
const DOCUMENTATION_CHECKS = {
  // Chief Complaint
  chiefComplaint: {
    patterns: [
      /chief complaint/i,
      /cc:/i,
      /reason for visit/i,
      /presenting complaint/i,
      /patient presents with/i,
      /here for/i,
      /comes in for/i,
    ],
    required: true,
    category: 'critical' as const,
  },

  // History of Present Illness (HPI)
  hpiLocation: {
    patterns: [/location/i, /located/i, /site/i, /area/i, /region/i],
    element: 'HPI - Location',
  },
  hpiQuality: {
    patterns: [/quality/i, /character/i, /sharp/i, /dull/i, /aching/i, /burning/i, /throbbing/i],
    element: 'HPI - Quality',
  },
  hpiSeverity: {
    patterns: [/severity/i, /\d+\/10/i, /pain scale/i, /mild/i, /moderate/i, /severe/i, /intensity/i],
    element: 'HPI - Severity',
  },
  hpiDuration: {
    patterns: [/duration/i, /\d+\s*(day|week|month|year|hour)/i, /since/i, /started/i, /began/i, /onset/i],
    element: 'HPI - Duration',
  },
  hpiTiming: {
    patterns: [/timing/i, /constant/i, /intermittent/i, /occasional/i, /frequency/i, /when/i],
    element: 'HPI - Timing',
  },
  hpiContext: {
    patterns: [/context/i, /associated with/i, /occurs when/i, /triggered by/i, /after/i, /before/i],
    element: 'HPI - Context',
  },
  hpiModifying: {
    patterns: [/modifying/i, /better/i, /worse/i, /relieved/i, /aggravated/i, /improves/i, /exacerbates/i],
    element: 'HPI - Modifying Factors',
  },
  hpiAssociated: {
    patterns: [/associated/i, /accompanied/i, /along with/i, /also has/i, /denies/i],
    element: 'HPI - Associated Signs/Symptoms',
  },

  // Review of Systems (ROS)
  rosConstitutional: {
    patterns: [/constitutional/i, /fever/i, /chills/i, /fatigue/i, /weight (loss|gain)/i, /malaise/i],
    system: 'Constitutional',
  },
  rosEyes: {
    patterns: [/eyes?/i, /vision/i, /blurr/i, /diplopia/i, /eye pain/i],
    system: 'Eyes',
  },
  rosENT: {
    patterns: [/ent/i, /ear/i, /nose/i, /throat/i, /hearing/i, /sinus/i, /nasal/i],
    system: 'ENT',
  },
  rosCardiovascular: {
    patterns: [/cardiovascular/i, /chest pain/i, /palpitation/i, /edema/i, /dyspnea on exertion/i, /orthopnea/i],
    system: 'Cardiovascular',
  },
  rosRespiratory: {
    patterns: [/respiratory/i, /cough/i, /shortness of breath/i, /sob/i, /wheezing/i, /dyspnea/i],
    system: 'Respiratory',
  },
  rosGI: {
    patterns: [/gastrointestinal/i, /gi/i, /nausea/i, /vomiting/i, /diarrhea/i, /constipation/i, /abdominal/i],
    system: 'Gastrointestinal',
  },
  rosGU: {
    patterns: [/genitourinary/i, /gu/i, /urinary/i, /dysuria/i, /frequency/i, /urgency/i, /hematuria/i],
    system: 'Genitourinary',
  },
  rosMusculoskeletal: {
    patterns: [/musculoskeletal/i, /msk/i, /joint/i, /muscle/i, /back pain/i, /arthralgia/i, /myalgia/i],
    system: 'Musculoskeletal',
  },
  rosSkin: {
    patterns: [/skin/i, /integumentary/i, /rash/i, /lesion/i, /itching/i, /pruritus/i],
    system: 'Skin',
  },
  rosNeurological: {
    patterns: [/neurological/i, /neuro/i, /headache/i, /dizziness/i, /numbness/i, /tingling/i, /weakness/i, /seizure/i],
    system: 'Neurological',
  },
  rosPsychiatric: {
    patterns: [/psychiatric/i, /psych/i, /depression/i, /anxiety/i, /mood/i, /sleep/i, /insomnia/i],
    system: 'Psychiatric',
  },
  rosEndocrine: {
    patterns: [/endocrine/i, /thyroid/i, /diabetes/i, /polyuria/i, /polydipsia/i, /heat intolerance/i, /cold intolerance/i],
    system: 'Endocrine',
  },
  rosHematologic: {
    patterns: [/hematologic/i, /bleeding/i, /bruising/i, /anemia/i, /lymph node/i],
    system: 'Hematologic',
  },
  rosAllergic: {
    patterns: [/allergic/i, /immunologic/i, /allergy/i, /allergies/i, /hives/i, /anaphylaxis/i],
    system: 'Allergic/Immunologic',
  },

  // Physical Exam Elements
  peVitals: {
    patterns: [/vital/i, /bp/i, /blood pressure/i, /pulse/i, /heart rate/i, /temperature/i, /temp/i, /respiratory rate/i, /rr/i, /oxygen/i, /spo2/i, /o2 sat/i, /bmi/i, /weight/i, /height/i],
    exam: 'Vital Signs',
  },
  peGeneral: {
    patterns: [/general appearance/i, /well-developed/i, /well-nourished/i, /no acute distress/i, /nad/i, /alert/i, /oriented/i, /appears/i],
    exam: 'General',
  },
  peHEENT: {
    patterns: [/heent/i, /head/i, /eyes/i, /ears/i, /nose/i, /throat/i, /pupils/i, /perrla/i, /tympanic/i, /oropharynx/i, /mucosa/i],
    exam: 'HEENT',
  },
  peNeck: {
    patterns: [/neck/i, /thyroid/i, /lymphadenopathy/i, /supple/i, /jvd/i, /jugular/i, /carotid/i],
    exam: 'Neck',
  },
  peCardiac: {
    patterns: [/cardiac/i, /heart/i, /cardiovascular/i, /s1/i, /s2/i, /murmur/i, /rhythm/i, /regular rate/i, /rrr/i],
    exam: 'Cardiovascular',
  },
  peLungs: {
    patterns: [/lung/i, /pulmonary/i, /respiratory/i, /breath sounds/i, /clear to auscultation/i, /cta/i, /wheezes/i, /rales/i, /rhonchi/i, /crackles/i],
    exam: 'Respiratory',
  },
  peAbdomen: {
    patterns: [/abdomen/i, /abdominal/i, /bowel sounds/i, /soft/i, /non-tender/i, /distended/i, /hepatomegaly/i, /splenomegaly/i, /guarding/i, /rebound/i],
    exam: 'Abdomen',
  },
  peExtremities: {
    patterns: [/extremit/i, /edema/i, /pulses/i, /cyanosis/i, /clubbing/i, /range of motion/i, /rom/i],
    exam: 'Extremities',
  },
  peSkin: {
    patterns: [/skin/i, /integument/i, /rash/i, /lesion/i, /warm/i, /dry/i, /intact/i, /turgor/i],
    exam: 'Skin',
  },
  peNeuro: {
    patterns: [/neuro/i, /neurological/i, /cranial nerves/i, /cn/i, /motor/i, /sensory/i, /reflexes/i, /gait/i, /coordination/i, /strength/i],
    exam: 'Neurological',
  },
  pePsych: {
    patterns: [/psych/i, /psychiatric/i, /mental status/i, /mood/i, /affect/i, /judgment/i, /insight/i, /oriented/i],
    exam: 'Psychiatric',
  },

  // Assessment & Plan Elements
  assessment: {
    patterns: [/assessment/i, /diagnosis/i, /diagnoses/i, /impression/i, /dx/i, /problem list/i],
    required: true,
    category: 'critical' as const,
  },
  plan: {
    patterns: [/plan/i, /treatment/i, /management/i, /recommendation/i, /orders/i, /prescribed/i, /will/i],
    required: true,
    category: 'critical' as const,
  },

  // MEAT Criteria for HCC
  monitored: {
    patterns: [/monitor/i, /follow.?up/i, /recheck/i, /surveillance/i, /watch/i, /observe/i, /tracking/i],
    meat: 'Monitored',
  },
  evaluated: {
    patterns: [/evaluat/i, /assess/i, /examin/i, /review/i, /check/i, /test/i, /lab/i, /imaging/i, /x-ray/i, /ct/i, /mri/i, /ultrasound/i],
    meat: 'Evaluated',
  },
  addressed: {
    patterns: [/address/i, /discuss/i, /counsel/i, /educat/i, /explain/i, /advise/i, /recommend/i],
    meat: 'Addressed',
  },
  treated: {
    patterns: [/treat/i, /prescri/i, /medicat/i, /therap/i, /procedure/i, /inject/i, /refer/i, /order/i, /start/i, /continu/i, /adjust/i, /increas/i, /decreas/i, /discontinu/i],
    meat: 'Treated',
  },

  // Time Documentation
  timeDocumentation: {
    patterns: [/\d+\s*min/i, /time spent/i, /total time/i, /face.?to.?face/i, /counseling/i, /coordination of care/i],
    element: 'Time Documentation',
  },

  // Medical Decision Making Elements
  mdmDiagnoses: {
    patterns: [/differential/i, /rule out/i, /r\/o/i, /possible/i, /probable/i, /suspected/i, /working diagnosis/i],
    mdm: 'Number of Diagnoses',
  },
  mdmData: {
    patterns: [/lab/i, /test/i, /imaging/i, /result/i, /reviewed/i, /obtained/i, /ordered/i, /ekg/i, /ecg/i, /x-ray/i, /ct/i, /mri/i, /ultrasound/i],
    mdm: 'Data Reviewed',
  },
  mdmRisk: {
    patterns: [/risk/i, /complication/i, /morbidity/i, /mortality/i, /prognosis/i, /urgent/i, /emergent/i, /hospitali/i, /surgery/i, /procedure/i],
    mdm: 'Risk Assessment',
  },

  // Diagnosis Specificity
  diagnosisSpecificity: {
    patterns: [/type\s*[12]/i, /stage/i, /grade/i, /acute/i, /chronic/i, /controlled/i, /uncontrolled/i, /with complications/i, /without complications/i, /left/i, /right/i, /bilateral/i, /initial/i, /subsequent/i],
    element: 'Diagnosis Specificity',
  },

  // Treatment Linkage
  treatmentLinkage: {
    patterns: [/for\s+(the|this|her|his)/i, /to treat/i, /for treatment of/i, /due to/i, /secondary to/i, /related to/i, /because of/i, /continue\s+\w+\s+for/i],
    element: 'Treatment-Diagnosis Linkage',
  },
};

// Common chronic conditions that require annual documentation
const CHRONIC_CONDITIONS = [
  { pattern: /diabetes/i, name: 'Diabetes', hcc: true },
  { pattern: /hypertension|htn|high blood pressure/i, name: 'Hypertension', hcc: false },
  { pattern: /heart failure|chf|hfref|hfpef/i, name: 'Heart Failure', hcc: true },
  { pattern: /copd|chronic obstructive/i, name: 'COPD', hcc: true },
  { pattern: /asthma/i, name: 'Asthma', hcc: false },
  { pattern: /ckd|chronic kidney|renal/i, name: 'Chronic Kidney Disease', hcc: true },
  { pattern: /afib|atrial fibrillation/i, name: 'Atrial Fibrillation', hcc: true },
  { pattern: /cad|coronary artery/i, name: 'Coronary Artery Disease', hcc: true },
  { pattern: /depression|major depressive/i, name: 'Depression', hcc: true },
  { pattern: /anxiety/i, name: 'Anxiety', hcc: false },
  { pattern: /hypothyroid/i, name: 'Hypothyroidism', hcc: false },
  { pattern: /hyperlipidemia|cholesterol/i, name: 'Hyperlipidemia', hcc: false },
  { pattern: /obesity|bmi\s*(>|greater)/i, name: 'Obesity', hcc: true },
  { pattern: /stroke|cva|cerebrovascular/i, name: 'Stroke/CVA', hcc: true },
  { pattern: /cancer|malignant|carcinoma|lymphoma|leukemia/i, name: 'Cancer', hcc: true },
  { pattern: /dementia|alzheimer/i, name: 'Dementia', hcc: true },
  { pattern: /parkinson/i, name: 'Parkinson\'s Disease', hcc: true },
  { pattern: /rheumatoid arthritis|ra\b/i, name: 'Rheumatoid Arthritis', hcc: true },
  { pattern: /lupus|sle\b/i, name: 'Lupus', hcc: true },
  { pattern: /hiv|aids/i, name: 'HIV/AIDS', hcc: true },
  { pattern: /hepatitis/i, name: 'Hepatitis', hcc: true },
  { pattern: /cirrhosis/i, name: 'Cirrhosis', hcc: true },
];

import type { PDFParseResult } from './blackbox_pdf-parser';

// Helper function to find location information for a text match
function findGapLocation(text: string, matchIndex: number, parseResult: PDFParseResult): GapLocation | undefined {
  if (parseResult.usedOCR || parseResult.textItems.length === 0) {
    // For OCR or when no position data, provide basic location info
    const page = Math.floor(matchIndex / (text.length / parseResult.pageCount)) + 1;
    const snippet = text.slice(Math.max(0, matchIndex - 50), matchIndex + 50).trim();
    return {
      page: Math.min(page, parseResult.pageCount),
      position: matchIndex,
      textSnippet: snippet,
    };
  }

  // Find the closest text item to the match position
  let closestItem: any = null;
  let minDistance = Infinity;
  let currentPos = 0;

  for (const item of parseResult.textItems) {
    const itemStart = currentPos;
    const itemEnd = currentPos + item.text.length;

    if (matchIndex >= itemStart && matchIndex <= itemEnd) {
      // Match is within this text item
      closestItem = item;
      break;
    }

    const distance = Math.min(Math.abs(matchIndex - itemStart), Math.abs(matchIndex - itemEnd));
    if (distance < minDistance) {
      minDistance = distance;
      closestItem = item;
    }

    currentPos += item.text.length + 1; // +1 for space
  }

  if (closestItem) {
    const snippet = text.slice(Math.max(0, matchIndex - 50), matchIndex + 50).trim();
    return {
      page: closestItem.page,
      position: matchIndex,
      textSnippet: snippet,
      x: closestItem.x,
      y: closestItem.y,
    };
  }

  return undefined;
}

import { DataMoatService } from './data-moat';

// Analysis options (for payer selection)
export interface AnalysisOptions {
  payerId?: string;  // Payer ID (default: 'bcbs-national')
  visitsPerYear?: number;  // Estimated visits/year (default: 52)
}

export async function analyzeDocument(
  parseResult: PDFParseResult,
  options?: AnalysisOptions
): Promise<AnalysisResult> {
  // Extract options with defaults
  const payerId = options?.payerId || 'bcbs-national';
  const visitsPerYear = options?.visitsPerYear || 52;
  // THE DATA MOAT: Sanitize text before ANY processing
  const rawText = parseResult.text;
  const sanitizationResult = DataMoatService.sanitizeClinicalText(rawText);
  const text = sanitizationResult.cleanText; // Analysis now runs on CLEAN text only

  console.log("Data Moat Active:", sanitizationResult.stats);

  const gaps: DocumentationGap[] = [];
  const strengths: string[] = [];

  // Initialize ML models (async)
  try {
    await initializeMLModels();
  } catch (error) {
    console.warn('ML models failed to initialize:', error);
  }

  // Get ML predictions (Running on CLEAN text)
  let mlQualityPrediction: QualityPrediction | null = null;
  let mlGapPredictions: GapPrediction[] = [];
  let mlCPTPredictions: CPTCodePrediction[] = [];

  try {
    [mlQualityPrediction, mlGapPredictions, mlCPTPredictions] = await Promise.all([
      qualityPredictor.predict(text),
      gapDetector.predictGaps(text),
      cptPredictor.predictCodes(text),
    ]);

    console.log('ML predictions completed:', {
      qualityPrediction: mlQualityPrediction,
      gapPredictionsCount: mlGapPredictions.length,
      cptPredictionsCount: mlCPTPredictions.length,
      cptPredictions: mlCPTPredictions,
    });
  } catch (error) {
    console.warn('ML predictions failed:', error);
  }

  // Track what's found
  const found = {
    chiefComplaint: false,
    hpiElements: 0,
    rosCount: 0,
    examElements: 0,
    assessment: false,
    plan: false,
    meatCriteria: 0,
    timeDocumented: false,
    mdmElements: 0,
    diagnosisSpecificity: false,
    treatmentLinkage: false,
    chronicConditions: [] as string[],
    hccConditions: [] as string[],
  };

  // const textLower = text.toLowerCase(); // Not used in current implementation

  // Check Chief Complaint
  let ccMatchIndex: number | null = null;
  for (const pattern of DOCUMENTATION_CHECKS.chiefComplaint.patterns) {
    const match = text.match(pattern);
    if (match && match.index !== undefined) {
      found.chiefComplaint = true;
      ccMatchIndex = match.index;
      break;
    }
  }

  if (!found.chiefComplaint) {
    gaps.push({
      id: 'cc-missing',
      category: 'critical',
      title: 'Chief Complaint Not Documented',
      description: 'No clear chief complaint or reason for visit was identified in the documentation.',
      impact: 'Claims may be denied without a documented reason for the encounter.',
      recommendation: 'Add a clear chief complaint statement at the beginning of the note (e.g., "CC: Follow-up for diabetes management" or "Patient presents with...").',
      potentialRevenueLoss: '$50-$200/visit (potential claim denial)',
      location: findGapLocation(text, 0, parseResult), // Default to beginning if not found
    });
  } else {
    strengths.push('Chief complaint clearly documented');
  }

  // Check HPI Elements (need 4+ for extended HPI)
  const hpiChecks = ['hpiLocation', 'hpiQuality', 'hpiSeverity', 'hpiDuration', 'hpiTiming', 'hpiContext', 'hpiModifying', 'hpiAssociated'] as const;
  const foundHpiElements: string[] = [];

  for (const check of hpiChecks) {
    const checkData = DOCUMENTATION_CHECKS[check];
    for (const pattern of checkData.patterns) {
      if (pattern.test(text)) {
        found.hpiElements++;
        foundHpiElements.push(checkData.element);
        break;
      }
    }
  }

  if (found.hpiElements < 4) {
    const missingHpi = hpiChecks
      .filter(check => !foundHpiElements.includes(DOCUMENTATION_CHECKS[check].element))
      .map(check => DOCUMENTATION_CHECKS[check].element.replace('HPI - ', ''));

    // Calculate revenue impact: 99213 -> 99214 upgrade potential
    const revenueCalc = calculateRevenue({
      currentCPT: '99213',
      potentialCPT: '99214',
      payerId,
      visitsPerYear,
      confidence: found.hpiElements >= 2 ? 0.80 : 0.65,
    });

    gaps.push({
      id: 'hpi-incomplete',
      category: found.hpiElements < 2 ? 'critical' : 'major',
      title: `Incomplete History of Present Illness (${found.hpiElements}/8 elements)`,
      description: `Only ${found.hpiElements} HPI elements documented. Missing: ${missingHpi.slice(0, 4).join(', ')}${missingHpi.length > 4 ? '...' : ''}.`,
      impact: 'Insufficient HPI documentation may result in downcoding from Level 4/5 to Level 2/3.',
      recommendation: 'Document at least 4 HPI elements for extended HPI. Consider adding: location, quality, severity, duration, timing, context, modifying factors, and associated symptoms.',
      potentialRevenueLoss: toLegacyRevenueString(revenueCalc),
      revenueImpact: revenueCalc,
    });
  } else {
    strengths.push(`Extended HPI documented (${found.hpiElements} elements)`);
  }

  // Check Review of Systems
  const rosChecks = ['rosConstitutional', 'rosEyes', 'rosENT', 'rosCardiovascular', 'rosRespiratory', 'rosGI', 'rosGU', 'rosMusculoskeletal', 'rosSkin', 'rosNeurological', 'rosPsychiatric', 'rosEndocrine', 'rosHematologic', 'rosAllergic'] as const;
  const foundRosSystems: string[] = [];

  for (const check of rosChecks) {
    const checkData = DOCUMENTATION_CHECKS[check];
    for (const pattern of checkData.patterns) {
      if (pattern.test(text)) {
        found.rosCount++;
        foundRosSystems.push(checkData.system);
        break;
      }
    }
  }

  if (found.rosCount < 10) {
    gaps.push({
      id: 'ros-incomplete',
      category: found.rosCount < 2 ? 'major' : 'moderate',
      title: `Limited Review of Systems (${found.rosCount}/14 systems)`,
      description: `Only ${found.rosCount} organ systems reviewed. Complete ROS requires 10+ systems for comprehensive documentation.`,
      impact: 'While ROS doesn\'t directly determine E/M level under 2024 guidelines, complete ROS supports medical necessity and reduces audit risk.',
      recommendation: 'Document review of at least 10 organ systems, including pertinent positives and negatives.',
      potentialRevenueLoss: 'Audit risk - potential recoupment',
    });
  } else {
    strengths.push(`Comprehensive ROS documented (${found.rosCount} systems)`);
  }

  // Check Physical Exam
  const examChecks = ['peVitals', 'peGeneral', 'peHEENT', 'peNeck', 'peCardiac', 'peLungs', 'peAbdomen', 'peExtremities', 'peSkin', 'peNeuro', 'pePsych'] as const;
  const foundExamElements: string[] = [];

  for (const check of examChecks) {
    const checkData = DOCUMENTATION_CHECKS[check];
    for (const pattern of checkData.patterns) {
      if (pattern.test(text)) {
        found.examElements++;
        foundExamElements.push(checkData.exam);
        break;
      }
    }
  }

  if (found.examElements < 6) {
    gaps.push({
      id: 'exam-limited',
      category: found.examElements < 3 ? 'major' : 'moderate',
      title: `Limited Physical Examination (${found.examElements}/11 areas)`,
      description: `Only ${found.examElements} body areas/organ systems examined. Found: ${foundExamElements.join(', ') || 'None documented'}.`,
      impact: 'While exam doesn\'t determine E/M level under 2024 MDM guidelines, thorough exam supports medical necessity.',
      recommendation: 'Document examination findings for all relevant body areas. Include at minimum: vitals, general appearance, and systems relevant to chief complaint.',
      potentialRevenueLoss: 'Audit risk - supports medical necessity',
    });
  } else {
    strengths.push(`Comprehensive physical exam (${found.examElements} areas)`);
  }

  // Check Assessment
  let assessmentMatchIndex: number | null = null;
  for (const pattern of DOCUMENTATION_CHECKS.assessment.patterns) {
    const match = text.match(pattern);
    if (match && match.index !== undefined) {
      found.assessment = true;
      assessmentMatchIndex = match.index;
      break;
    }
  }

  if (!found.assessment) {
    gaps.push({
      id: 'assessment-missing',
      category: 'critical',
      title: 'Assessment/Diagnosis Section Missing',
      description: 'No clear assessment or diagnosis section identified.',
      impact: 'Claims require documented diagnoses. Missing assessment is a critical documentation deficiency.',
      recommendation: 'Add a clear Assessment section with all diagnoses addressed during the visit, including ICD-10 codes.',
      potentialRevenueLoss: 'Claim denial risk',
      location: findGapLocation(text, text.length * 0.7, parseResult), // Likely toward the end
    });
  } else {
    strengths.push('Assessment/Diagnosis documented');
  }

  // Check Plan
  let planMatchIndex: number | null = null;
  for (const pattern of DOCUMENTATION_CHECKS.plan.patterns) {
    const match = text.match(pattern);
    if (match && match.index !== undefined) {
      found.plan = true;
      planMatchIndex = match.index;
      break;
    }
  }

  if (!found.plan) {
    gaps.push({
      id: 'plan-missing',
      category: 'critical',
      title: 'Treatment Plan Missing',
      description: 'No clear treatment plan or management section identified.',
      impact: 'Documentation must show what was done for the patient. Missing plan undermines medical necessity.',
      recommendation: 'Add a Plan section detailing: medications prescribed/continued, tests ordered, referrals made, patient education provided, and follow-up instructions.',
      potentialRevenueLoss: 'Claim denial risk',
      location: findGapLocation(text, text.length * 0.8, parseResult), // Likely toward the end
    });
  } else {
    strengths.push('Treatment plan documented');
  }

  // Check MEAT Criteria
  const meatChecks = ['monitored', 'evaluated', 'addressed', 'treated'] as const;
  const foundMeat: string[] = [];

  for (const check of meatChecks) {
    const checkData = DOCUMENTATION_CHECKS[check];
    for (const pattern of checkData.patterns) {
      if (pattern.test(text)) {
        found.meatCriteria++;
        foundMeat.push(checkData.meat);
        break;
      }
    }
  }

  // Check for chronic conditions
  for (const condition of CHRONIC_CONDITIONS) {
    if (condition.pattern.test(text)) {
      found.chronicConditions.push(condition.name);
      if (condition.hcc) {
        found.hccConditions.push(condition.name);
      }
    }
  }

  // If HCC conditions found, check MEAT compliance
  if (found.hccConditions.length > 0 && found.meatCriteria === 0) {
    // HCC revenue loss calculation (annualized, not per-visit)
    // Each HCC condition worth $500-2000 in RAF score annually
    const estimatedHCCLoss = found.hccConditions.length * 1000; // Conservative $1000/HCC

    gaps.push({
      id: 'meat-missing',
      category: 'critical',
      title: 'MEAT Criteria Not Met for HCC Conditions',
      description: `HCC conditions identified (${found.hccConditions.join(', ')}) but no MEAT documentation found.`,
      impact: 'HCC diagnoses require MEAT documentation for risk adjustment. Missing MEAT = no RAF score credit.',
      recommendation: 'For each chronic condition, document that it was Monitored, Evaluated, Assessed/Addressed, or Treated. Example: "Diabetes - A1c reviewed (Evaluated), continue metformin (Treated), discussed diet (Addressed)".',
      potentialRevenueLoss: `$${estimatedHCCLoss.toLocaleString()}+ annually (${found.hccConditions.length} HCC conditions)`,
      // Note: No revenueImpact for HCC gaps - different calculation model (annual RAF vs per-visit CPT)
    });
  } else if (found.hccConditions.length > 0) {
    strengths.push(`MEAT criteria documented for HCC conditions (${foundMeat.join(', ')})`);
  }

  // Check Time Documentation
  for (const pattern of DOCUMENTATION_CHECKS.timeDocumentation.patterns) {
    if (pattern.test(text)) {
      found.timeDocumented = true;
      break;
    }
  }

  if (!found.timeDocumented) {
    // Calculate revenue impact: Potential 99213 -> 99214 if time justifies
    const revenueCalc = calculateRevenue({
      currentCPT: '99213',
      potentialCPT: '99214',
      payerId,
      visitsPerYear,
      confidence: 0.50,  // Lower confidence - time may or may not support upgrade
    });

    gaps.push({
      id: 'time-missing',
      category: 'moderate',
      title: 'Time Not Documented',
      description: 'No documentation of time spent on the encounter.',
      impact: 'Time-based billing option unavailable. May miss opportunity for higher E/M level if time exceeds MDM requirements.',
      recommendation: 'Document total time spent on the encounter, including: reviewing records, examining patient, counseling, care coordination, and documentation. Example: "Total time: 35 minutes".',
      potentialRevenueLoss: toLegacyRevenueString(revenueCalc),
      revenueImpact: revenueCalc,
    });
  } else {
    strengths.push('Time documentation present');
  }

  // Check MDM Elements
  const mdmChecks = ['mdmDiagnoses', 'mdmData', 'mdmRisk'] as const;
  for (const check of mdmChecks) {
    const checkData = DOCUMENTATION_CHECKS[check];
    for (const pattern of checkData.patterns) {
      if (pattern.test(text)) {
        found.mdmElements++;
        break;
      }
    }
  }

  // Check Diagnosis Specificity
  for (const pattern of DOCUMENTATION_CHECKS.diagnosisSpecificity.patterns) {
    if (pattern.test(text)) {
      found.diagnosisSpecificity = true;
      break;
    }
  }

  if (!found.diagnosisSpecificity && found.chronicConditions.length > 0) {
    gaps.push({
      id: 'specificity-missing',
      category: 'major',
      title: 'Diagnosis Specificity Lacking',
      description: 'Diagnoses may lack required specificity (type, laterality, stage, controlled/uncontrolled status).',
      impact: 'Unspecified diagnosis codes result in lower reimbursement and failed HCC capture.',
      recommendation: 'Specify: Type 1 vs Type 2, controlled vs uncontrolled, with/without complications, laterality (left/right/bilateral), acute vs chronic, stage/grade where applicable.',
      potentialRevenueLoss: '$100-$500+/HCC annually',
      icdCodes: ['Use specific codes, avoid .9 unspecified codes'],
    });
  } else if (found.diagnosisSpecificity) {
    strengths.push('Diagnosis specificity documented');
  }

  // Check Treatment-Diagnosis Linkage
  for (const pattern of DOCUMENTATION_CHECKS.treatmentLinkage.patterns) {
    if (pattern.test(text)) {
      found.treatmentLinkage = true;
      break;
    }
  }

  if (!found.treatmentLinkage && found.plan) {
    gaps.push({
      id: 'linkage-missing',
      category: 'moderate',
      title: 'Treatment-Diagnosis Linkage Unclear',
      description: 'Treatments/medications not explicitly linked to diagnoses.',
      impact: 'Auditors may question medical necessity if treatment rationale is unclear.',
      recommendation: 'Link each treatment to its indication. Example: "Continue lisinopril 10mg daily for hypertension" instead of just "Continue lisinopril".',
      potentialRevenueLoss: 'Audit risk',
    });
  } else if (found.treatmentLinkage) {
    strengths.push('Treatment-diagnosis linkage documented');
  }

  // Integrate ML-detected gaps
  mlGapPredictions.forEach(mlGap => {
    // Check if this ML gap is already detected by rules
    const existingGap = gaps.find(g => g.title.toLowerCase().includes(mlGap.gapType.toLowerCase()));

    if (!existingGap) {
      // Add new ML-detected gap
      const gapCategory = mlGap.severity === 'high' ? 'critical' :
        mlGap.severity === 'medium' ? 'major' : 'moderate';

      gaps.push({
        id: `ml_${mlGap.gapType}_${Date.now()}`,
        category: gapCategory as 'critical' | 'major' | 'moderate' | 'minor',
        title: mlGap.gapType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: `ML analysis detected potential issue: ${mlGap.gapType}`,
        impact: 'ML-enhanced gap detection for improved documentation quality',
        recommendation: mlGap.suggestedFix,
        potentialRevenueLoss: '$50-$200/visit (estimated)',
        mlConfidence: mlGap.probability,
        isMLDetected: true,
      });
    } else {
      // Enhance existing gap with ML confidence
      existingGap.mlConfidence = mlGap.probability;
      existingGap.isMLDetected = true;
    }
  });

  // Determine MDM Complexity
  let mdmComplexity: AnalysisResult['mdmComplexity'] = 'Straightforward';

  // Check for complexity indicators
  const hasMultipleProblems = found.chronicConditions.length >= 2 || /multiple|several|numerous/i.test(text);
  const hasNewProblem = /new (diagnosis|problem|condition)|newly diagnosed/i.test(text);
  const hasAcuteIllness = /acute|exacerbation|worsening|unstable/i.test(text);
  const hasChronicIllness = found.chronicConditions.length > 0;
  const hasPrescription = /prescri|rx|medication|drug/i.test(text);
  const hasLabsOrdering = /order|lab|test|imaging|refer/i.test(text);
  const hasHighRisk = /emergency|hospital|surgery|cancer|malignant|life.?threatening/i.test(text);

  if (hasHighRisk || (hasAcuteIllness && hasChronicIllness && hasMultipleProblems)) {
    mdmComplexity = 'High';
  } else if ((hasChronicIllness && hasAcuteIllness) || (hasNewProblem && hasPrescription) || hasMultipleProblems) {
    mdmComplexity = 'Moderate';
  } else if (hasChronicIllness || hasNewProblem || (hasPrescription && hasLabsOrdering)) {
    mdmComplexity = 'Low';
  }

  // Determine suggested E/M level based on MDM
  let suggestedEMLevel = '99213';
  let currentEMLevel = '99212';

  switch (mdmComplexity) {
    case 'High':
      suggestedEMLevel = '99215';
      currentEMLevel = gaps.length > 3 ? '99213' : '99214';
      break;
    case 'Moderate':
      suggestedEMLevel = '99214';
      currentEMLevel = gaps.length > 2 ? '99212' : '99213';
      break;
    case 'Low':
      suggestedEMLevel = '99213';
      currentEMLevel = gaps.length > 2 ? '99212' : '99213';
      break;
    default:
      suggestedEMLevel = '99212';
      currentEMLevel = '99212';
  }

  // Calculate overall score (hybrid rule-based + ML)
  let score = 100;

  // Rule-based scoring
  for (const gap of gaps) {
    if (!gap.isMLDetected) { // Only count rule-based gaps for base score
      switch (gap.category) {
        case 'critical':
          score -= 20;
          break;
        case 'major':
          score -= 12;
          break;
        case 'moderate':
          score -= 7;
          break;
        case 'minor':
          score -= 3;
          break;
      }
    }
  }

  // ML-enhanced scoring
  if (mlQualityPrediction) {
    // Blend ML prediction with rule-based score (weighted average)
    const mlWeight = 0.3; // 30% weight to ML prediction
    const ruleWeight = 0.7; // 70% weight to rule-based score
    const blendedScore = (mlQualityPrediction.score * mlWeight) + (score * ruleWeight);
    score = Math.max(0, Math.min(100, blendedScore));
  }

  score = Math.max(0, Math.min(100, score));

  // Determine documentation level
  let documentationLevel: AnalysisResult['documentationLevel'];
  if (score >= 90) documentationLevel = 'Excellent';
  else if (score >= 75) documentationLevel = 'Good';
  else if (score >= 60) documentationLevel = 'Fair';
  else if (score >= 40) documentationLevel = 'Poor';
  else documentationLevel = 'Critical';

  // Calculate potential revenue loss
  // NEW: Use precise CPT-based calculations from revenueImpact
  const gapsWithRevenue = gaps.filter(g => g.revenueImpact);

  let totalPerVisitLoss = 0;
  let totalAnnualLoss = 0;

  if (gapsWithRevenue.length > 0) {
    const revenueTotal = calculateTotalRevenue(gapsWithRevenue.map(g => g.revenueImpact!));
    totalPerVisitLoss = revenueTotal.perVisit;
    totalAnnualLoss = revenueTotal.annualized;
  }

  // LEGACY: Fallback calculation for gaps without precise revenue data
  const gapsWithoutRevenue = gaps.filter(g => !g.revenueImpact);
  const criticalGaps = gapsWithoutRevenue.filter(g => g.category === 'critical').length;
  const majorGaps = gapsWithoutRevenue.filter(g => g.category === 'major').length;
  const legacyLoss = criticalGaps * 150 + majorGaps * 60 + (gapsWithoutRevenue.length - criticalGaps - majorGaps) * 25;

  // Add HCC loss if applicable (not per-visit, so add to legacy)
  if (found.hccConditions.length > 0 && found.meatCriteria === 0) {
    const hccLoss = found.hccConditions.length * 1000;
    totalAnnualLoss += hccLoss;
  }

  // Combine totals
  const combinedTotal = totalAnnualLoss + legacyLoss;

  return {
    overallScore: score,
    documentationLevel,
    gaps,
    strengths,
    suggestedEMLevel,
    currentEMLevel,
    potentialUpcodeOpportunity: suggestedEMLevel !== currentEMLevel,
    totalPotentialRevenueLoss: `$${Math.round(combinedTotal).toLocaleString()}+`,
    mdmComplexity,
    timeDocumented: found.timeDocumented,
    meatCriteriaMet: found.meatCriteria > 0,
    documentText: text, // NEW: Include document text for ICD extraction
    // ML-enhanced fields
    mlQualityScore: mlQualityPrediction?.score,
    mlConfidence: mlQualityPrediction?.confidence,
    suggestedCPTCodes: mlCPTPredictions,
    mlDetectedGaps: mlGapPredictions,
    dataSecurity: {
      isClean: !sanitizationResult.phiDetected,
      phiTampered: sanitizationResult.phiDetected,
      redactedItems: {
        names: sanitizationResult.stats.namesRemoved,
        dates: sanitizationResult.stats.datesRemoved,
        identifiers: sanitizationResult.stats.identifiersRemoved,
        locations: sanitizationResult.stats.locationsRemoved
      }
    }
  };
}
